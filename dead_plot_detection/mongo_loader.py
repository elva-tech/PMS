"""Load plot + interested-buyer data from MongoDB (PMS integration)."""

from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
from pymongo import MongoClient

load_dotenv()


def _mongo_client():
    url = os.getenv("MONGODB_URL")
    if not url:
        raise RuntimeError("MONGODB_URL is required for Mongo data loading")
    return MongoClient(url)


def _iso_date(value) -> str:
    if not value:
        return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    if isinstance(value, datetime):
        dt = value.astimezone(timezone.utc) if value.tzinfo else value.replace(tzinfo=timezone.utc)
        return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
    return str(value)


def _map_plot_type(plot_type: str) -> str:
    v = (plot_type or "middle").strip().lower()
    return "corner" if v == "corner" else "normal"


def _road_facing(plot_type: str, road_width) -> bool:
    v = (plot_type or "").strip().lower()
    if v in ("road-facing", "corner"):
        return True
    try:
        return float(road_width or 0) >= 40
    except (TypeError, ValueError):
        return False


def _contact_stats(
    db, project_id: str, *, plot_number_to_id: dict[int, str]
) -> dict[str, dict]:
    """plot ObjectId string -> {count, last_interaction_date}."""
    stats: dict[str, dict] = {}

    def _bump(plot_key: str, created) -> None:
        if not plot_key:
            return
        if plot_key not in stats:
            stats[plot_key] = {"count": 0, "last": None}
        stats[plot_key]["count"] += 1
        if created and (stats[plot_key]["last"] is None or created > stats[plot_key]["last"]):
            stats[plot_key]["last"] = created

    cursor = db.contacts.find(
        {"projectId": project_id},
        {"plotid": 1, "plotnumber": 1, "createdAt": 1},
    )
    for doc in cursor:
        created = doc.get("createdAt")
        pid = str(doc.get("plotid") or "").strip()
        if pid:
            _bump(pid, created)
            continue
        try:
            pnum = int(doc.get("plotnumber"))
        except (TypeError, ValueError):
            pnum = None
        if pnum is not None and pnum in plot_number_to_id:
            _bump(plot_number_to_id[pnum], created)

    for pid, row in stats.items():
        row["last_interaction_date"] = _iso_date(row.pop("last")) if row.get("last") else None
    return stats


def _project_layout_name(db, project_id: str) -> str:
    candidates = [project_id]
    try:
        candidates.append(int(project_id))
    except (TypeError, ValueError):
        pass
    try:
        from bson import ObjectId

        candidates.append(ObjectId(project_id))
    except Exception:
        pass

    for key in candidates:
        proj = db.projects.find_one({"_id": key}, {"name": 1, "title": 1})
        if proj:
            return str(proj.get("name") or proj.get("title") or project_id)
    return str(project_id)


def plot_doc_to_record(plot: dict, *, layout: str, contact_stats: dict, sold_count: int) -> dict:
    plot_oid = str(plot.get("_id", ""))
    contacts = contact_stats.get(plot_oid, {})
    plot_type = plot.get("plotType") or "middle"

    return {
        "plot_id": plot_oid,
        "plot_number": plot.get("plotnumber"),
        "layout": layout,
        "plot_area": float(plot.get("plotsize") or 0),
        "plot_type": _map_plot_type(plot_type),
        "road_facing": _road_facing(plot_type, plot.get("roadWidthFt")),
        "price": float(plot.get("plotprice") or 0),
        "status": plot.get("plotstatus") or "Available",
        "listed_date": _iso_date(plot.get("createdAt")),
        "interested_buyers": int(contacts.get("count") or 0),
        "last_interaction_date": contacts.get("last_interaction_date"),
        "nearby_sold_count": sold_count,
        "layout_median_price_per_sqft": None,
        "_source": "mongo",
    }


def load_project_plots(project_id: str) -> list[dict]:
    client = _mongo_client()
    db = client.get_default_database()
    layout = _project_layout_name(db, project_id)
    all_plots = list(db.plots.find({"projectid": project_id}))
    plot_number_to_id = {
        int(p.get("plotnumber")): str(p.get("_id"))
        for p in all_plots
        if p.get("plotnumber") is not None and p.get("_id") is not None
    }
    contact_stats = _contact_stats(db, project_id, plot_number_to_id=plot_number_to_id)
    sold_count = sum(1 for p in all_plots if p.get("plotstatus") == "Sold")

    records = []
    for plot in all_plots:
        size = float(plot.get("plotsize") or 0)
        price = float(plot.get("plotprice") or 0)
        if size <= 0 or price <= 0:
            continue
        records.append(
            plot_doc_to_record(
                plot,
                layout=layout,
                contact_stats=contact_stats,
                sold_count=sold_count,
            )
        )
    client.close()
    return records


def load_all_training_plots() -> list[dict]:
    client = _mongo_client()
    db = client.get_default_database()
    records = []
    project_ids = db.plots.distinct("projectid")
    for project_id in project_ids:
        if not project_id:
            continue
        try:
            records.extend(load_project_plots(str(project_id)))
        except Exception:
            continue
    client.close()
    return records
