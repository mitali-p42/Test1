-- ./db/init.sql
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT users_id_email_unique UNIQUE (id, email)
);

CREATE TABLE IF NOT EXISTS interview_profiles (
  interview_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  role TEXT,
  interview_type TEXT,
  years_of_experience NUMERIC(3,1),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_interview_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_interview_profiles_user_id ON interview_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_profiles_email ON interview_profiles(email);

INSERT INTO users (id, email, password_hash)
VALUES (gen_random_uuid(), 'a@gmail.com', crypt('12345678', gen_salt('bf')))
RETURNING id;

-- 2) Create matching interview profile (only if not already present)
WITH u AS (
  SELECT id FROM users WHERE email = 'a@gmail.com' LIMIT 1
)
INSERT INTO interview_profiles (user_id, email, years_of_experience, role, interview_type)
SELECT u.id, 'a@gmail.com', 4.0, 'product manager', 'technical'
FROM u
WHERE NOT EXISTS (
  SELECT 1 FROM interview_profiles ip WHERE ip.user_id = u.id
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  role TEXT NOT NULL,
  interview_type TEXT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending',
  current_question_index INT DEFAULT 0,
  total_questions INT DEFAULT 5,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_session_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS interview_qa (
  qa_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL,
  question_number INT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT,
  transcript TEXT,
  evaluation JSONB,
  duration_seconds INT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT fk_qa_session
    FOREIGN KEY (session_id) REFERENCES interview_sessions (session_id) ON DELETE CASCADE,
  UNIQUE(session_id, question_number)
);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_status ON interview_sessions(status);
CREATE INDEX IF NOT EXISTS idx_interview_qa_session_id ON interview_qa(session_id);
-- -- Seed user (bcrypt('password'))
-- INSERT INTO users (email, password_hash)
-- VALUES ('a@gmail.com', '$2b$10$KIX/1u9KX9H2u5x3bQ8yEetm2q9c8yS0q1m3cUoC2Tqk7Vz3m7m6S')
-- ON CONFLICT (email) DO NOTHING;

-- -- Seed one interview profile (no ON CONFLICT needed)
-- INSERT INTO interview_profiles (user_id, email, role, interview_type, years_of_experience)
-- SELECT u.id, u.email, 'product manager', 'technical', 4.0
-- FROM users u
-- WHERE u.email = 'a@gmail.com';
