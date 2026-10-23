"""The Tea Flask application package.

Routes and UI are intentionally deferred until the repository and schema review
checkpoint is approved.
"""

from flask import Flask

from .config import Config


def create_app(config_class: type[Config] = Config) -> Flask:
    """Create the Flask application shell."""
    app = Flask(__name__)
    app.config.from_object(config_class)
    return app

