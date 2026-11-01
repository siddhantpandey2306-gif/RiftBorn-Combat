-- ============================================================================
-- RIFTBORN In-Game Feedback & Bug Reporting System
-- Supabase Table Definition & Row Level Security (RLS) Policies
-- ============================================================================

-- 1. Create game_feedback table with strict column types and constraints
CREATE TABLE IF NOT EXISTS public.game_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('bug', 'gameplay', 'performance', 'suggestion', 'other')),
  title TEXT NOT NULL CHECK (char_length(trim(title)) >= 3 AND char_length(title) <= 120),
  description TEXT NOT NULL CHECK (char_length(trim(description)) >= 10 AND char_length(description) <= 2000),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'resolved', 'closed', 'spam')),
  player_email TEXT CHECK (player_email IS NULL OR player_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  game_version TEXT CHECK (game_version IS NULL OR char_length(game_version) <= 32),
  page_name TEXT CHECK (page_name IS NULL OR char_length(page_name) <= 64),
  device_info TEXT CHECK (device_info IS NULL OR char_length(device_info) <= 500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Performance & Admin Query Indexes
CREATE INDEX IF NOT EXISTS idx_game_feedback_created_at ON public.game_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_feedback_status ON public.game_feedback (status);
CREATE INDEX IF NOT EXISTS idx_game_feedback_category ON public.game_feedback (category);
CREATE INDEX IF NOT EXISTS idx_game_feedback_priority ON public.game_feedback (priority);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.game_feedback ENABLE ROW LEVEL SECURITY;

-- 4. Revoke public privileges by default
REVOKE ALL ON public.game_feedback FROM PUBLIC;
REVOKE ALL ON public.game_feedback FROM anon;

-- Grant INSERT only to anonymous players
GRANT INSERT ON public.game_feedback TO anon;
GRANT ALL ON public.game_feedback TO service_role;

-- 5. Strict RLS Policies

-- Policy 1: Allow public/anonymous players to INSERT feedback
-- Ensures they can only set status = 'new' (or let it default)
DROP POLICY IF EXISTS "Public anonymous insert feedback" ON public.game_feedback;
CREATE POLICY "Public anonymous insert feedback"
  ON public.game_feedback
  FOR INSERT
  TO anon
  WITH CHECK (
    status = 'new'
  );

-- Policy 2: Strictly NO SELECT for anon (players cannot view submitted feedback)
-- By default with RLS enabled and no SELECT policy for anon, all SELECTs return empty or permission denied.

-- Policy 3: Service role (dashboard admins) has full access
DROP POLICY IF EXISTS "Service role full access" ON public.game_feedback;
CREATE POLICY "Service role full access"
  ON public.game_feedback
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
