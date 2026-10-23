import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCHEMA = (ROOT / "schema" / "001_initial.sql").read_text()
SCHEMA_ARTIFACT = (ROOT / "schema.md").read_text()
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


def test_schema_artifact_lists_every_sql_table():
    sql_tables = set(re.findall(r"CREATE TABLE (\w+)", SCHEMA))
    documented_tables = set(
        re.findall(r"^## Table: `([a-z_]+)`$", SCHEMA_ARTIFACT, re.MULTILINE)
    )
    assert documented_tables == sql_tables


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


def test_account_and_roster_contract_are_persistent_and_named():
    assert "first_name varchar(80)" in SCHEMA
    assert '"first_name": "Taylor"' in API_CONTRACT
    assert "Every joined player is returned" in API_CONTRACT


def test_predictions_are_final_and_unlock_only_aggregate_stats():
    assert "submitted_at timestamptz" in SCHEMA
    assert "prediction_already_final" in API_CONTRACT
    assert "/polls/{poll_id}/prediction-stats" in API_CONTRACT
    assert "choices are never exposed" in API_CONTRACT


def test_game_password_is_host_chosen_and_eight_characters():
    assert "join_code citext NOT NULL UNIQUE" in SCHEMA
    assert "host-chosen, eight-character game password" in API_CONTRACT

