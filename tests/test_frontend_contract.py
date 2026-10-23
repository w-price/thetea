from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LANDING_PAGE = (ROOT / "index.html").read_text()
FRONTEND_JS = (ROOT / "static" / "app.js").read_text()
HOST_BUILDER = (ROOT / "host.html").read_text()
HOST_JS = (ROOT / "static" / "host.js").read_text()


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


def test_host_builder_uses_approved_default_outcomes():
    for outcome in (
        "They get married.",
        "Someone says no at the altar.",
        "They break up before making it to the altar.",
    ):
        assert outcome in HOST_BUILDER


def test_host_builder_supports_ordering_and_draft_feedback():
    assert 'id="add-poll"' in HOST_BUILDER
    assert 'data-move="up"' in HOST_BUILDER
    assert "updatePollOrder" in HOST_JS
    assert "Draft saved" in HOST_JS


def test_host_chooses_an_eight_character_game_password():
    assert 'id="game-password"' in HOST_BUILDER
    assert 'minlength="8"' in HOST_BUILDER
    assert 'maxlength="8"' in HOST_BUILDER
    assert '.replace(/[^A-Z0-9]/g, "")' in HOST_JS
