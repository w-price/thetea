from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LANDING_PAGE = (ROOT / "index.html").read_text()
FRONTEND_JS = (ROOT / "static" / "app.js").read_text()


def test_landing_page_exposes_primary_paths():
    assert "Host a game" in LANDING_PAGE
    assert 'id="join-form"' in LANDING_PAGE
    assert 'data-open-auth="login"' in LANDING_PAGE


def test_registration_collects_returning_account_fields():
    for field in ('name="first_name"', 'name="email"', 'name="password"'):
        assert field in LANDING_PAGE
    assert 'autocomplete="new-password"' in LANDING_PAGE
    assert 'autocomplete="current-password"' in LANDING_PAGE


def test_join_code_is_normalized_for_preview():
    assert '.toUpperCase().replace(/[^A-Z0-9]/g, "")' in FRONTEND_JS
