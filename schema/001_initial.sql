BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS citext;

CREATE TABLE users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email citext NOT NULL UNIQUE,
    first_name varchar(80) NOT NULL CHECK (length(btrim(first_name)) BETWEEN 1 AND 80),
    password_hash text NOT NULL,
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE games (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    host_user_id uuid NOT NULL REFERENCES users(id),
    title varchar(120) NOT NULL CHECK (length(btrim(title)) BETWEEN 1 AND 120),
    description text,
    join_code citext NOT NULL UNIQUE CHECK (join_code ~ '^[A-Z0-9]{8}$'),
    status varchar(16) NOT NULL DEFAULT 'draft'
        CHECK (status IN ('draft', 'open', 'locked', 'revealing', 'completed')),
    exact_points smallint NOT NULL DEFAULT 3 CHECK (exact_points >= 0),
    group_points smallint NOT NULL DEFAULT 1 CHECK (group_points >= 0),
    incorrect_points smallint NOT NULL DEFAULT 0 CHECK (incorrect_points >= 0),
    locked_at timestamptz,
    completed_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CHECK (exact_points >= group_points AND group_points >= incorrect_points),
    CHECK (status IN ('draft', 'open') OR locked_at IS NOT NULL),
    CHECK (status <> 'completed' OR completed_at IS NOT NULL)
);

CREATE TABLE game_players (
    game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users(id),
    role varchar(12) NOT NULL DEFAULT 'player' CHECK (role IN ('host', 'player')),
    status varchar(12) NOT NULL DEFAULT 'joined' CHECK (status IN ('joined', 'left', 'removed')),
    joined_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (game_id, user_id)
);

CREATE UNIQUE INDEX game_players_one_host_per_game
    ON game_players (game_id) WHERE role = 'host';

CREATE INDEX game_players_user_id_idx ON game_players (user_id);

CREATE TABLE polls (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
    prompt varchar(280) NOT NULL CHECK (length(btrim(prompt)) BETWEEN 1 AND 280),
    position integer NOT NULL CHECK (position > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (game_id, position),
    UNIQUE (id, game_id)
);

CREATE INDEX polls_game_id_idx ON polls (game_id);

CREATE TABLE answer_options (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
    option_key varchar(64) NOT NULL CHECK (option_key ~ '^[a-z][a-z0-9_]{0,63}$'),
    label varchar(120) NOT NULL CHECK (length(btrim(label)) BETWEEN 1 AND 120),
    scoring_group_key varchar(64) NOT NULL
        CHECK (scoring_group_key ~ '^[a-z][a-z0-9_]{0,63}$'),
    position integer NOT NULL CHECK (position > 0),
    created_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (poll_id, option_key),
    UNIQUE (poll_id, position),
    UNIQUE (id, poll_id)
);

CREATE INDEX answer_options_poll_id_idx ON answer_options (poll_id);

CREATE TABLE predictions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    poll_id uuid NOT NULL,
    user_id uuid NOT NULL REFERENCES users(id),
    answer_option_id uuid NOT NULL,
    awarded_points smallint CHECK (awarded_points >= 0),
    predicted_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (poll_id, user_id),
    FOREIGN KEY (answer_option_id, poll_id)
        REFERENCES answer_options(id, poll_id) ON DELETE RESTRICT
);

CREATE INDEX predictions_user_id_idx ON predictions (user_id);
CREATE INDEX predictions_poll_id_idx ON predictions (poll_id);

CREATE TABLE poll_results (
    poll_id uuid PRIMARY KEY REFERENCES polls(id) ON DELETE CASCADE,
    answer_option_id uuid NOT NULL,
    published_by_user_id uuid NOT NULL REFERENCES users(id),
    published_at timestamptz NOT NULL DEFAULT now(),
    FOREIGN KEY (answer_option_id, poll_id)
        REFERENCES answer_options(id, poll_id) ON DELETE RESTRICT
);

COMMIT;

