/*
# Create favorites and history tables for the food blindbox app

1. Purpose
- Persist the user's favorite foods and draw history across devices and reloads.
- The app has no sign-in, so this is intentionally a single-tenant, shared dataset.

2. New Tables
- `favorites`: one row per saved food.
  - `id` (uuid, primary key, default gen_random_uuid())
  - `food_id` (text, not null, the stable food id from the local food catalog, e.g. "f013")
  - `food` (jsonb, not null, full snapshot of the food item so it renders even if the catalog changes)
  - `created_at` (timestamptz, default now())
- `history`: one row per blindbox draw.
  - `id` (uuid, primary key, default gen_random_uuid())
  - `created_at` (timestamptz, default now())
  - `meal_time` (text, not null, which meal slot was selected)
  - `food_id` (text, not null)
  - `food_name` (text, not null)
  - `preference_snapshot` (jsonb, what preferences were active at draw time)
  - `accepted` (boolean, not null, default false — did the user say "today I'll eat this")
  - `actually_eaten` (boolean, nullable — confirmed later in history)
  - `rating` (text, nullable — 'like' | 'dislike' | 'neutral')
  - `dislike_reason` (text, nullable)

3. Security
- Enable RLS on both tables.
- This app has no accounts: policies allow anon + authenticated access to the shared dataset
  (documented intentional use of USING (true) / WITH CHECK (true) for a single-tenant public app).
- Grant SELECT/INSERT/UPDATE/DELETE on both tables to anon and authenticated.

4. Notes
- Uses IF NOT EXISTS / DROP POLICY IF EXISTS so the migration is idempotent and safe to re-run.
*/
CREATE TABLE IF NOT EXISTS favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  food_id text NOT NULL,
  food jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  meal_time text NOT NULL,
  food_id text NOT NULL,
  food_name text NOT NULL,
  preference_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  accepted boolean NOT NULL DEFAULT false,
  actually_eaten boolean,
  rating text,
  dislike_reason text
);

ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE history ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON history TO anon, authenticated;

DROP POLICY IF EXISTS "favorites_public_select" ON favorites;
CREATE POLICY "favorites_public_select" ON favorites
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "favorites_public_insert" ON favorites;
CREATE POLICY "favorites_public_insert" ON favorites
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "favorites_public_update" ON favorites;
CREATE POLICY "favorites_public_update" ON favorites
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "favorites_public_delete" ON favorites;
CREATE POLICY "favorites_public_delete" ON favorites
FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "history_public_select" ON history;
CREATE POLICY "history_public_select" ON history
FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "history_public_insert" ON history;
CREATE POLICY "history_public_insert" ON history
FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "history_public_update" ON history;
CREATE POLICY "history_public_update" ON history
FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "history_public_delete" ON history;
CREATE POLICY "history_public_delete" ON history
FOR DELETE TO anon, authenticated USING (true);