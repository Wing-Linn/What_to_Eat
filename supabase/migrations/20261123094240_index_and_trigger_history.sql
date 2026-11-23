/*
# Speed up history lookups and add auto-update trigger for actually_eaten

1. Purpose
- Index history by created_at for the "latest 200 draws" query.
- Index favorites by food_id for delete-by-food-id.
- Auto-maintain a boolean flag: when a history row's rating is set to 'dislike',
  actually_eaten stays in sync so the UI can filter eaten/disliked rows cheaply.

2. Modified Tables
- `history`: new index idx_history_created_at on created_at DESC.
- `favorites`: new index idx_favorites_food_id on food_id.
- `history`: new trigger trg_history_rating to keep actually_eaten coherent.

3. Security
- None changed. RLS and grants remain as before.
*/
CREATE INDEX IF NOT EXISTS idx_history_created_at ON history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_favorites_food_id ON favorites (food_id);

CREATE OR REPLACE FUNCTION sync_history_eaten()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.rating = 'like' AND NEW.actually_eaten IS NULL THEN
    NEW.actually_eaten := true;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_history_rating ON history;
CREATE TRIGGER trg_history_rating
BEFORE UPDATE ON history
FOR EACH ROW
EXECUTE FUNCTION sync_history_eaten();