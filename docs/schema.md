# Database schema

The canonical table-by-table artifact is [`../schema.md`](../schema.md). This
document records the reasoning behind that schema. Both documents and the
executable migration must change together whenever the schema changes.

## Design goals

The schema keeps the game engine generic while allowing a theme to provide its
own labels, option keys, and scoring groups. Database identifiers are UUIDs so
objects can be created safely across environments. Timestamps use `timestamptz`
and are stored in UTC.

## Entity relationships

```text
users ──< games (host)
users >──< games through game_players
games ──< polls ──< answer_options
users ──< predictions >── answer_options
polls ──0..1 poll_results >── answer_options
```

## Core decisions

### Game lifecycle

`games.status` is one of:

- `draft`: host is configuring the game; players cannot predict.
- `open`: players may join and cast one final prediction per poll.
- `locked`: predictions are immutable; results are not yet being revealed.
- `revealing`: at least one result may be published and the leaderboard updates.
- `completed`: the host has finished the game.

The application performs lifecycle transitions. The database constrains the set
of valid states. `locked_at` records the effective lock for auditability.

### Generic scoring

Each answer option has an `option_key` and a `scoring_group_key`. Publishing a
result compares a prediction with the actual option:

1. same option ID -> `games.exact_points` (default 3)
2. different option ID, same scoring group -> `games.group_points` (default 1)
3. different scoring group -> `games.incorrect_points` (default 0)

The awarded value is written to `predictions.awarded_points` in the same
transaction that publishes the result. This makes leaderboard reads cheap and
preserves the score even if display labels later change. Game scoring values and
poll options must be treated as immutable after lock by the service layer.

The initial outcome configuration is:

```text
married               -> scoring group married
together_not_married  -> scoring group no_marriage
broken_up             -> scoring group no_marriage
```

No show-specific category appears in a database enum or column.

### Integrity boundaries

Composite foreign keys guarantee that a prediction or published result cannot
select an answer option belonging to a different poll. Unique constraints allow
one membership per user/game, one prediction per user/poll, one result per poll,
and stable ordering within a game or poll.

Authorization and lifecycle rules span multiple rows, so they remain service
transactions rather than fragile database triggers. Examples: only the host may
publish, a player must belong to the game, voting must be open, and an existing
prediction cannot be changed.

### Joining

Games expose a host-chosen, case-insensitive, eight-character `join_code` as the
player-facing **game password**. It accepts letters and numbers and is separate
from account passwords. Membership stores `joined`, `left`, or `removed` state
rather than deleting history. Hosts receive a membership row as part of game
creation.

## Leaderboard query

The MVP leaderboard includes every active member from the moment they join. Its
score is the sum of non-null `awarded_points`, defaulting to zero before any
result is revealed. The API also returns the number of predictions scored and
applies stable tie ordering: points descending, scored predictions descending,
join time ascending, user ID ascending. This endpoint doubles as the live player
roster so everyone can see who has arrived.

## Deferred deliberately

- Invitations, teams, chat, reactions, push notifications, and seasons
- Multiple scoring policies inside one game
- Per-poll locking and scheduled automatic reveals
- Event sourcing or a separate score ledger
- WebSockets; the MVP client polls a read endpoint

