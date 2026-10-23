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
{"email": "player@example.com", "display_name": "Taylor", "password": "..."}
```

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
  "exact_points": 3,
  "group_points": 1,
  "incorrect_points": 0
}
```

Join body: `{"join_code": "TEA4ABCD"}`.

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
| `PUT` | `/polls/{poll_id}/prediction` | Create or replace caller's prediction |
| `GET` | `/games/{game_id}/predictions/me` | Caller’s selections and scoring state |

Prediction body: `{"answer_option_id": "uuid"}`. `PUT` is idempotent and is
accepted only while the game is open and the caller is an active member.

Other players' choices are not exposed before results publish.

## Spill the Tea

| Method | Path | Purpose |
| --- | --- | --- |
| `POST` | `/polls/{poll_id}/result` | Publish the actual option and score predictions |

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

## Leaderboard polling

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/games/{game_id}/leaderboard` | Current ranked active members |

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
      "display_name": "Taylor",
      "points": 7,
      "scored_predictions": 3,
      "is_current_user": true
    }
  ]
}
```

The mobile client polls every 3 seconds while a game is revealing, pauses when
the page is hidden, and performs one immediate refresh on visibility/focus. The
endpoint may later honor `If-Modified-Since` or ETags without changing its body.

