"""Business thresholds (PRD §5) — tune via env without code changes."""

import os

RULES_VERSION = "1.0.0"

SLOW_DAYS = int(os.getenv("DEAD_PLOT_SLOW_DAYS", "60"))
DEAD_DAYS = int(os.getenv("DEAD_PLOT_DEAD_DAYS", "120"))
LOW_INTERESTED_THRESHOLD = int(os.getenv("DEAD_PLOT_LOW_INTERESTED", "2"))
HIGH_INTEREST_NO_SALE = int(os.getenv("DEAD_PLOT_HIGH_INTEREST", "5"))
HIGH_INTEREST_MIN_DAYS = int(os.getenv("DEAD_PLOT_HIGH_INTEREST_DAYS", "45"))
OVERPRICE_PCT = float(os.getenv("DEAD_PLOT_OVERPRICE_PCT", "10"))
STALE_INTERACTION_DAYS = int(os.getenv("DEAD_PLOT_STALE_INTERACTION_DAYS", "30"))
NEW_LISTING_GRACE_DAYS = int(os.getenv("DEAD_PLOT_NEW_LISTING_GRACE_DAYS", "30"))

MODEL_DIR_NAME = "models"
DEFAULT_MODEL_PATH = "models/dead_plot_classifier.joblib"
DEFAULT_TRAINING_CSV = "data/dead_plot_training.csv"
DEFAULT_SEED_CSV = "data/dead_plot_training.csv"
