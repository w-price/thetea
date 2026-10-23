from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = (ROOT / "schema" / "001_initial.sql").read_text()
API_CONTRACT = (ROOT / "docs" / "api-contracts.md").read_text()


def test_schema_contains_expected_core_tables():
    for table in (
        "users",
        "games",
        "game_players",
        "polls",
        "answer_options",
        "predictions",
        "poll_results",
    ):
        assert f"CREATE TABLE {table}" in SCHEMA


def test_option_belongs_to_prediction_poll():
    assert "FOREIGN KEY (answer_option_id, poll_id)" in SCHEMA
    assert "REFERENCES answer_options(id, poll_id)" in SCHEMA


def test_scoring_is_group_based_not_theme_specific():
    assert "scoring_group_key" in SCHEMA
    assert "no_marriage" not in SCHEMA
    assert "Love Is Blind" not in SCHEMA


def test_one_prediction_and_result_per_poll():
    assert "UNIQUE (poll_id, user_id)" in SCHEMA
    assert "poll_id uuid PRIMARY KEY REFERENCES polls(id)" in SCHEMA


def test_contract_includes_core_player_and_host_actions():
    for path in (
        "/games/join",
        "/polls/{poll_id}/prediction",
        "/polls/{poll_id}/result",
        "/games/{game_id}/leaderboard",
    ):
        assert path in API_CONTRACT

