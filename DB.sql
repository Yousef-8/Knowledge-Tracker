create table if not exists users(
	id serial primary key,
	email text unique,
	password_hash text,
	username text,
	google_id text,
	created_at timestamp default now()
);

create table if not exists topics (
	id serial primary key, 
	user_id integer references users(id) on delete cascade,
	title text not null,
	slug text not null,
	description text,
	created_at timestamp default now()
);

create table if not exists resources(
	id serial primary key,
	topic_id integer references topics(id) on delete cascade,
	source text,
	title text,
	url text,
	snippet text,
	extra JSONB,
	created_at timestamp default now()
	
);

create table if not exists study_logs(
	id serial primary key,
	user_id integer references users(id) on delete cascade,
	topic_id integer references topics(id) on delete set null,
	duration_in_minutes integer,
	notes text,
	created_at timestamp default now()

);


CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
);

CREATE TABLE study_log_resources (
  id SERIAL PRIMARY KEY,
  study_log_id INT REFERENCES study_logs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  snippet TEXT,
  source TEXT,
  url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);


CREATE TABLE IF NOT EXISTS "session" (
  "sid" varchar NOT NULL COLLATE "default",
  "sess" json NOT NULL,
  "expire" timestamp(6) NOT NULL
)

WITH (OIDS=FALSE);

ALTER TABLE "session" ADD CONSTRAINT "session_pkey" PRIMARY KEY ("sid");