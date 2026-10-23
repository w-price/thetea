# The Tea

The Tea is a mobile-first social prediction party game. A host creates a game,
adds polls and answer options, invites players, locks predictions, and publishes
real outcomes with **Spill the Tea**. Players score points and see a live
leaderboard.

This first checkpoint intentionally contains only the repository foundation,
PostgreSQL schema, and proposed HTTP API contract. It does not yet implement the
frontend or Flask routes.

## Product rules captured here

- Users have accounts and may host or join many games.
- Each game contains ordered polls with two or more answer options.
- Players review and submit one complete final ballot; submitted votes cannot be
  changed.
- After voting, players can see aggregate prediction stats while the actual
  outcome remains hidden.
- A host publishes one actual option per poll via **Spill the Tea**.
- Exact match: 3 points.
- Wrong exact answer in the same scoring group: 1 point.
- All other answers: 0 points.
- A leaderboard is read by periodic client polling in the MVP.

The data model is theme-neutral. The initial three outcomes are represented as
configuration, not database enums:

| Option key | Label | Scoring group |
| --- | --- | --- |
| `married` | Married | `married` |
| `together_not_married` | Together, not married | `no_marriage` |
| `broken_up` | Broken up | `no_marriage` |

## Repository map

```text
docs/                 Product and engineering decisions
schema/               Versioned PostgreSQL DDL
src/the_tea/           Flask application package (foundation only)
tests/                 Contract and schema checks
```

## Local validation

```bash
python -m pip install -e '.[dev]'
pytest
ruff check .
```

The schema uses PostgreSQL features and should ultimately be exercised against
the same major PostgreSQL version used by Render. The current fast test suite
checks the schema and contract as source artifacts without requiring a running
database.

## Review checkpoint

Before frontend or backend implementation, review:

1. [Human-readable schema artifact](schema.md)
2. [Schema decisions](docs/schema.md)
3. [API contracts](docs/api-contracts.md)
4. [Initial migration](schema/001_initial.sql)

`schema.md` and the executable migrations are updated together in every schema
change.

