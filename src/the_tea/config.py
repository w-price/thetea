"""Application configuration."""

import os


class Config:
    """Configuration shared by all environments."""

    SECRET_KEY = os.environ.get("SECRET_KEY", "development-only-change-me")
    DATABASE_URL = os.environ.get("DATABASE_URL", "")

