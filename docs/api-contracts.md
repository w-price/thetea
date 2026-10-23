# Proposed HTTP API contract

Prefix all JSON endpoints with `/api/v1`. Authentication uses a Flask-Login
session cookie. Mutating requests require CSRF protection. Times are ISO 8601
UTC strings and IDs are UUID strings.

This is a design contract for review, not an implemented router.

## Response conventions

Success responses use the natural resource shape. Errors have one stable shape:

```json
{
  "error": {
    "code": "predictions_locked",
    "message": "Predictions are locked for this game.",
    "fields": {}
  }
}
```

Expected status codes: `400` malformed request, `401` signed out, `403` not
allowed, `404` missing resource, `409` state conflict, and `422` field errors.

## Authentication

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/auth/register` | Create account and session |
| `POST` | `/auth/login` | Start session |
| `POST` | `/auth/logout` | End session |
| `GET` | `/me` | Current user summary |

Registration body:

```json
{"email": "player@example.com", "first_name": "Taylor", "password": "..."}
```

Login body: `{"email": "player@example.com", "password": "..."}`. Accounts
are persistent so players can return for later games. The password is never
returned or logged and is stored only as a modern password hash.

## Games and membership

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/games` | Create a draft game; caller becomes host/member |
| `GET` | `/games/{game_id}` | Game, membership, polls, and reveal state |
| `PATCH` | `/games/{game_id}` | Edit draft settings (host) |
| `POST` | `/games/{game_id}/open` | Open predictions (host) |
| `POST` | `/games/{game_id}/lock` | Lock all predictions (host) |
| `POST` | `/games/{game_id}/complete` | Complete game (host) |
| `POST` | `/games/join` | Join by code |

Create game body:

```json
{
  "title": "Season Finale Predictions",
  "description": "Pick each couple's outcome.",
  "join_code": "TEA4EVER",
  "exact_points": 3,
  "group_points": 1,
  "incorrect_points": 0
}
```

`join_code` is the host-chosen, eight-character game password. The service
uppercases it, accepts only letters and numbers, and returns `409 join_code_taken`
if another active game already uses it.

Join body: `{"join_code": "TEA4EVER"}`.

## Poll configuration

Draft-only host endpoints:

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/games/{game_id}/polls` | Create a poll with options |
| `PATCH` | `/polls/{poll_id}` | Edit prompt or ordering |
| `DELETE` | `/polls/{poll_id}` | Remove a draft poll |

Create poll body:

```json
{
  "prompt": "What will happen with Alex and Sam?",
  "position": 1,
  "options": [
    {"option_key": "married", "label": "Married", "scoring_group_key": "married", "position": 1},
    {"option_key": "together_not_married", "label": "Together, not married", "scoring_group_key": "no_marriage", "position": 2},
    {"option_key": "broken_up", "label": "Broken up", "scoring_group_key": "no_marriage", "position": 3}
  ]
}
```

## Predictions

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/games/{game_id}/ballot` | Submit caller's complete final ballot |
| `GET` | `/games/{game_id}/predictions/me` | Caller’s selections and scoring state |
| `GET` | `/polls/{poll_id}/prediction-stats` | Aggregate first reveal after voting |

Ballot body:

```json
{
  "predictions": [
    {"poll_id": "uuid", "answer_option_id": "uuid"},
    {"poll_id": "uuid", "answer_option_id": "uuid"}
  ]
}
```

Submission is accepted only while the game is open and the caller is an active
member. Every current poll must appear exactly once. The UI labels the action
**Submit final votes** and warns that the ballot cannot be changed. The ballot
and all prediction rows commit in one transaction. Retrying an identical ballot
returns the existing resource; submitting different answers returns
`409 ballot_already_final`.

Once the final vote commits, the response includes aggregate option totals and
percentages for the first reveal:

```json
{
  "ballot": {
    "id": "uuid",
    "game_id": "uuid",
    "submitted_at": "2026-10-23T20:10:00Z"
  },
  "group_stats": {
    "headline": "The tea is brewing!",
    "total_votes": 8,
    "options": [
      {"answer_option_id": "uuid", "votes": 5, "percentage": 62.5},
      {"answer_option_id": "uuid", "votes": 2, "percentage": 25.0},
      {"answer_option_id": "uuid", "votes": 1, "percentage": 12.5}
    ]
  }
}
```

The stats endpoint is available to the host and to members who already cast a
vote on that poll. It can update as more final votes arrive. Individual player
choices are never exposed by this endpoint. The second reveal remains the actual
outcome published through **Spill the Tea**.

## Spill the Tea

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/polls/{poll_id}/result` | Publish the actual option and score predictions |
| `GET` | `/polls/{poll_id}/result` | Published outcome and named prediction groups |

Body: `{"answer_option_id": "uuid"}`.

The operation requires the host and a locked or revealing game. In one database
transaction it:

1. creates the immutable result,
2. changes `locked` to `revealing` when necessary,
3. calculates and stores every prediction's awarded points,
4. commits before returning the updated poll and leaderboard revision.

Repeating the same request returns the existing result; choosing a different
answer returns `409 result_already_published`. Result correction is intentionally
absent from the MVP contract and will require an explicit audited design.

Before publication, the result endpoint returns `404` and named predictions stay
private. After publication, members receive the second-reveal payload:

```json
{
  "poll_id": "uuid",
  "actual_answer_option_id": "uuid",
  "published_at": "2026-10-23T21:05:00Z",
  "current_user_points": 3,
  "prediction_groups": [
    {
      "answer_option_id": "uuid",
      "is_actual": true,
      "players": [
        {"user_id": "uuid", "first_name": "Taylor", "awarded_points": 3}
      ]
    }
  ]
}
```

Names are revealed only for the published poll. Unrevealed polls continue to
expose aggregate statistics without associating players with their answers.

## Leaderboard polling

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/games/{game_id}/leaderboard` | Live roster and ranked active members |

Example response:

```json
{
  "game_id": "uuid",
  "revision": "2026-10-23T20:15:00.123456Z",
  "revealed_poll_count": 3,
  "total_poll_count": 8,
  "leaders": [
    {
      "rank": 1,
      "user_id": "uuid",
      "first_name": "Taylor",
      "points": 7,
      "scored_predictions": 3,
      "is_current_user": true
    }
  ]
}
```

Every joined player is returned, including players with zero points and players
who skipped a poll. Before the first reveal this response functions as the live
guest roster. The mobile client polls every 3 seconds while a game is open or
revealing, pauses when the page is hidden, and performs one immediate refresh on
visibility/focus. The endpoint may later honor `If-Modified-Since` or ETags
without changing its body.

