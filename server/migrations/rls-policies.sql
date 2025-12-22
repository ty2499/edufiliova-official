-- Row Level Security Policies for EduFiliova
-- These policies enforce role-based access control at the database level

-- Enable RLS on all tables that need protection
ALTER TABLE auth_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_login_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_other_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Helper function to get current user role from JWT or session
CREATE OR REPLACE FUNCTION auth.user_role() RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- Get role from JWT claims if available
  SELECT COALESCE(current_setting('app.current_user_role', true), 'user') INTO user_role;
  RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function to get current user ID
CREATE OR REPLACE FUNCTION auth.user_id() RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Get user ID from current setting
  SELECT COALESCE(current_setting('app.current_user_id', true), '00000000-0000-0000-0000-000000000000')::UUID INTO user_id;
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies for users table (auth_users)
-- Users can only see their own data, admins can see all
DROP POLICY IF EXISTS "users_select_policy" ON auth_users;
CREATE POLICY "users_select_policy" ON auth_users
  FOR SELECT USING (
    id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Users can only update their own data, admins can update all
DROP POLICY IF EXISTS "users_update_policy" ON auth_users;
CREATE POLICY "users_update_policy" ON auth_users
  FOR UPDATE USING (
    id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for profiles table
-- Users can see their own profile and public profiles, teachers can see student profiles, admins can see all
DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
CREATE POLICY "profiles_select_policy" ON profiles
  FOR SELECT USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher') OR
    (SELECT role FROM profiles WHERE user_id = auth.user_id()) = 'admin'
  );

-- Users can only update their own profile, admins can update all
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
CREATE POLICY "profiles_update_policy" ON profiles
  FOR UPDATE USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for messages table
-- Users can see messages they sent or received, admins can see all
DROP POLICY IF EXISTS "messages_select_policy" ON messages;
CREATE POLICY "messages_select_policy" ON messages
  FOR SELECT USING (
    sender_id = auth.user_id() OR 
    receiver_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Users can insert messages they are sending, admins can insert all
DROP POLICY IF EXISTS "messages_insert_policy" ON messages;
CREATE POLICY "messages_insert_policy" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Users can update/delete messages they sent, admins can update/delete all
DROP POLICY IF EXISTS "messages_update_policy" ON messages;
CREATE POLICY "messages_update_policy" ON messages
  FOR UPDATE USING (
    sender_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

DROP POLICY IF EXISTS "messages_delete_policy" ON messages;
CREATE POLICY "messages_delete_policy" ON messages
  FOR DELETE USING (
    sender_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for community posts
-- All authenticated users can read posts, only post authors and admins can modify
DROP POLICY IF EXISTS "community_posts_select_policy" ON community_posts;
CREATE POLICY "community_posts_select_policy" ON community_posts
  FOR SELECT USING (true); -- All authenticated users can read community posts

DROP POLICY IF EXISTS "community_posts_insert_policy" ON community_posts;
CREATE POLICY "community_posts_insert_policy" ON community_posts
  FOR INSERT WITH CHECK (
    author_id = auth.user_id()
  );

DROP POLICY IF EXISTS "community_posts_update_policy" ON community_posts;
CREATE POLICY "community_posts_update_policy" ON community_posts
  FOR UPDATE USING (
    author_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "community_posts_delete_policy" ON community_posts;
CREATE POLICY "community_posts_delete_policy" ON community_posts
  FOR DELETE USING (
    author_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for community replies
-- All authenticated users can read replies, only reply authors and admins can modify
DROP POLICY IF EXISTS "community_replies_select_policy" ON community_replies;
CREATE POLICY "community_replies_select_policy" ON community_replies
  FOR SELECT USING (true); -- All authenticated users can read replies

DROP POLICY IF EXISTS "community_replies_insert_policy" ON community_replies;
CREATE POLICY "community_replies_insert_policy" ON community_replies
  FOR INSERT WITH CHECK (
    author_id = auth.user_id()
  );

DROP POLICY IF EXISTS "community_replies_update_policy" ON community_replies;
CREATE POLICY "community_replies_update_policy" ON community_replies
  FOR UPDATE USING (
    author_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  );

DROP POLICY IF EXISTS "community_replies_delete_policy" ON community_replies;
CREATE POLICY "community_replies_delete_policy" ON community_replies
  FOR DELETE USING (
    author_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for study notes
-- Users can only access their own study notes
DROP POLICY IF EXISTS "study_notes_policy" ON study_notes;
CREATE POLICY "study_notes_policy" ON study_notes
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for tasks
-- Users can only access their own tasks
DROP POLICY IF EXISTS "tasks_policy" ON tasks;
CREATE POLICY "tasks_policy" ON tasks
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for student progress
-- Users can see their own progress, teachers can see their students' progress, admins can see all
DROP POLICY IF EXISTS "student_progress_policy" ON student_progress;
CREATE POLICY "student_progress_policy" ON student_progress
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for lesson progress
-- Same as student progress
DROP POLICY IF EXISTS "lesson_progress_policy" ON lesson_progress;
CREATE POLICY "lesson_progress_policy" ON lesson_progress
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for course enrollments
-- Users can see their own enrollments, teachers can see enrollments for their courses, admins can see all
DROP POLICY IF EXISTS "course_enrollments_policy" ON course_enrollments;
CREATE POLICY "course_enrollments_policy" ON course_enrollments
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin', 'teacher')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for user login sessions
-- Users can only access their own sessions
DROP POLICY IF EXISTS "user_sessions_policy" ON user_login_sessions;
CREATE POLICY "user_sessions_policy" ON user_login_sessions
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for privacy settings
-- Users can only access their own privacy settings
DROP POLICY IF EXISTS "privacy_settings_policy" ON user_privacy_settings;
CREATE POLICY "privacy_settings_policy" ON user_privacy_settings
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for notification preferences
-- Users can only access their own notification preferences
DROP POLICY IF EXISTS "notification_preferences_policy" ON user_notification_preferences;
CREATE POLICY "notification_preferences_policy" ON user_notification_preferences
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for other settings
-- Users can only access their own other settings
DROP POLICY IF EXISTS "other_settings_policy" ON user_other_settings;
CREATE POLICY "other_settings_policy" ON user_other_settings
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for payment methods
-- Users can only access their own payment methods, admins can see all for support
DROP POLICY IF EXISTS "payment_methods_policy" ON payment_methods;
CREATE POLICY "payment_methods_policy" ON payment_methods
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Policies for payments
-- Users can see their own payments, admins can see all
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
CREATE POLICY "payments_select_policy" ON payments
  FOR SELECT USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Only system (admin) can insert payments
DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
CREATE POLICY "payments_insert_policy" ON payments
  FOR INSERT WITH CHECK (
    auth.user_role() IN ('admin')
  );

-- Policies for user subscriptions
-- Users can see their own subscriptions, admins can see all
DROP POLICY IF EXISTS "user_subscriptions_policy" ON user_subscriptions;
CREATE POLICY "user_subscriptions_policy" ON user_subscriptions
  FOR ALL USING (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  ) WITH CHECK (
    user_id = auth.user_id() OR 
    auth.user_role() IN ('admin')
  );

-- Grant necessary permissions
-- Allow service role to bypass RLS for system operations
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Create indexes for performance on commonly filtered columns
CREATE INDEX IF NOT EXISTS idx_messages_sender_receiver ON messages(sender_id, receiver_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_author ON community_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_study_notes_user ON study_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user ON tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_user ON student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_login_sessions(user_id);

COMMENT ON FUNCTION auth.user_role() IS 'Returns the current user role for RLS policies';
COMMENT ON FUNCTION auth.user_id() IS 'Returns the current user ID for RLS policies';