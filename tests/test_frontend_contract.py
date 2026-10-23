from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LANDING_PAGE = (ROOT / "index.html").read_text()
FRONTEND_JS = (ROOT / "static" / "app.js").read_text()
HOST_BUILDER = (ROOT / "host.html").read_text()
HOST_JS = (ROOT / "static" / "host.js").read_text()
PLAY_PAGE = (ROOT / "play.html").read_text()
PLAY_JS = (ROOT / "static" / "play.js").read_text()


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


def test_player_ballot_is_card_based_and_submitted_as_one_final_scorecard():
    assert 'id="vote-card"' in PLAY_PAGE
    assert "Review scorecard" in PLAY_JS
    assert "Submit final votes" in PLAY_JS
    assert "you won’t be able to change" in PLAY_PAGE


def test_post_vote_room_contains_social_feedback_loops():
    for phrase in ("Leaderboard", "My predictions", "Room activity", "The tea is brewing!"):
        assert phrase in PLAY_PAGE
    assert "Sasha joined the party" in PLAY_JS
    assert "The room just flipped" in PLAY_JS
