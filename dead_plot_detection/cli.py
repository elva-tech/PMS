"""Terminal CLI — same output as API (JSON)."""

import argparse
import json
from pathlib import Path

from predict_core import analyze_csv, analyze_plot, load_csv_records, summarize_results
from train import train_and_save


def _print_summary_block(summary: dict, plots: list, *, show_lists: bool = True):
    out = {"summary": summary}
    if show_lists:
        out["deadPlots"] = [p for p in plots if p["classification"] == "Dead"][:30]
        out["slowPlots"] = [p for p in plots if p["classification"] == "Slow"][:15]
    return out


def main():
    parser = argparse.ArgumentParser(
        description="Dead plot detection CLI",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python cli.py analyze-csv --plot-id SYN-Layout_C-0001
  python cli.py analyze-csv --classification Dead
  python cli.py analyze --json "{\\"plot_id\\":\\"P1\\",...}"
        """,
    )
    sub = parser.add_subparsers(dest="cmd", required=True)

    sub.add_parser("train", help="Train classifier from CSV")

    p_csv = sub.add_parser("analyze-csv", help="Analyze CSV (inventory only by default)")
    p_csv.add_argument("--csv", type=Path, default=Path("data/dead_plot_training.csv"))
    p_csv.add_argument(
        "--plot-id",
        type=str,
        help="Analyze one plot by plot_id from the CSV",
    )
    p_csv.add_argument(
        "--classification",
        choices=("Dead", "Slow", "Active"),
        help="Filter batch output to one class",
    )
    p_csv.add_argument(
        "--include-sold",
        action="store_true",
        help="Include Sold rows in batch (default: skip sold)",
    )
    p_csv.add_argument(
        "--full",
        action="store_true",
        help="Include all plot JSON in output (default: summary only)",
    )

    p_one = sub.add_parser("analyze", help="Analyze one plot (pass fields as JSON)")
    p_one.add_argument("--json", type=str, required=True, help="Plot fields as JSON")

    args = parser.parse_args()

    if args.cmd == "train":
        print(json.dumps(train_and_save(), indent=2))
        return

    if args.cmd == "analyze":
        print(json.dumps(analyze_plot(json.loads(args.json)), indent=2))
        return

    if args.cmd == "analyze-csv":
        all_rows = load_csv_records(args.csv)
        sold_count = sum(
            1 for r in all_rows if str(r.get("status", "")).strip() == "Sold"
        )

        if args.plot_id:
            results = analyze_csv(args.csv, plot_id=args.plot_id, inventory_only=False)
            print(json.dumps({"plot": results[0]}, indent=2))
            return

        results = analyze_csv(
            args.csv,
            inventory_only=not args.include_sold,
        )
        if args.classification:
            results = [r for r in results if r["classification"] == args.classification]

        summary = summarize_results(results, include_sold_skipped=sold_count)
        payload = _print_summary_block(summary, results, show_lists=not args.full)
        if args.full:
            payload["plots"] = results
        print(json.dumps(payload, indent=2))


if __name__ == "__main__":
    main()
