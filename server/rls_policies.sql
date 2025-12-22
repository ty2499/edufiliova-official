-- Enable Row Level Security (RLS) for key tables
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for messages table
-- Students cannot read other students' messages
CREATE POLICY "students_own_messages" ON messages
    FOR ALL
    USING (
        sender_id = current_user_id() OR 
        receiver_id = current_user_id()
    );

-- Teachers can read messages from their assigned students
CREATE POLICY "teachers_assigned_messages" ON messages
    FOR ALL
    USING (
        -- Check if current user is a teacher and has access to sender/receiver
        EXISTS (
            SELECT 1 FROM profiles p1, teacher_student_assignments tsa
            WHERE p1.user_id = current_user_id()
            AND p1.role = 'teacher'
            AND (tsa.teacher_id = current_user_id() AND (tsa.student_id = sender_id OR tsa.student_id = receiver_id))
        )
        OR sender_id = current_user_id() 
        OR receiver_id = current_user_id()
    );

-- Admin can read everything
CREATE POLICY "admin_all_messages" ON messages
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for profiles table
-- Users can read their own profile
CREATE POLICY "users_own_profile" ON profiles
    FOR SELECT
    USING (user_id = current_user_id());

-- Users can update their own profile (except grade for non-premium users)
CREATE POLICY "users_update_own_profile" ON profiles
    FOR UPDATE
    USING (user_id = current_user_id())
    WITH CHECK (
        user_id = current_user_id() AND
        -- Only premium users can update grade
        (OLD.grade = NEW.grade OR plan IS NOT NULL AND plan != '')
    );

-- Admin can read all profiles
CREATE POLICY "admin_all_profiles" ON profiles
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id() 
            AND role = 'admin'
        )
    );

-- Teachers can read profiles of their assigned students
CREATE POLICY "teachers_assigned_profiles" ON profiles
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p1, teacher_student_assignments tsa
            WHERE p1.user_id = current_user_id()
            AND p1.role = 'teacher'
            AND tsa.teacher_id = current_user_id()
            AND tsa.student_id = profiles.user_id
        )
        OR user_id = current_user_id()
    );

-- Create RLS policies for lesson_progress table
-- Users can only access their own progress
CREATE POLICY "users_own_progress" ON lesson_progress
    FOR ALL
    USING (user_id = current_user_id());

-- Teachers can view progress of their assigned students
CREATE POLICY "teachers_assigned_progress" ON lesson_progress
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p, teacher_student_assignments tsa
            WHERE p.user_id = current_user_id()
            AND p.role = 'teacher'
            AND tsa.teacher_id = current_user_id()
            AND tsa.student_id = lesson_progress.user_id
        )
    );

-- Admin can access all progress
CREATE POLICY "admin_all_progress" ON lesson_progress
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for payments table
-- Users can only access their own payments
CREATE POLICY "users_own_payments" ON payments
    FOR ALL
    USING (user_id = current_user_id());

-- Admin can access all payments
CREATE POLICY "admin_all_payments" ON payments
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id() 
            AND role = 'admin'
        )
    );

-- Create RLS policies for community_posts table
-- Users can read all public posts but only edit their own
CREATE POLICY "public_community_posts" ON community_posts
    FOR SELECT
    USING (true); -- All users can read public posts

CREATE POLICY "users_own_community_posts" ON community_posts
    FOR INSERT, UPDATE, DELETE
    USING (author_id = current_user_id());

-- Admin can moderate all posts
CREATE POLICY "admin_moderate_posts" ON community_posts
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE user_id = current_user_id() 
            AND role = 'admin'
        )
    );

-- Helper function to get current user ID from session
-- This would be implemented based on your authentication system
CREATE OR REPLACE FUNCTION current_user_id() RETURNS uuid AS $$
BEGIN
    -- This should return the current authenticated user's ID
    -- Implementation depends on your auth system (JWT claims, session table, etc.)
    RETURN current_setting('auth.user_id', true)::uuid;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to set current user context (to be called from your app)
CREATE OR REPLACE FUNCTION set_current_user(user_uuid uuid) RETURNS void AS $$
BEGIN
    PERFORM set_config('auth.user_id', user_uuid::text, true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;