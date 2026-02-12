-- Create role_permissions table
CREATE TABLE IF NOT EXISTS public.role_permissions (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    role text NOT NULL,
    permission text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(role, permission)
);

-- Enable RLS
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Admin can do everything
CREATE POLICY "Admin can manager permissions" ON public.role_permissions
    FOR ALL
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE role = 'admin'
        )
    );

-- Authenticated users can read permissions (to check their own access)
CREATE POLICY "Authenticated can view permissions" ON public.role_permissions
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Seed Data (Initial Permissions)

-- 1. Admin (Full Access - though code logic might bypass check for admin, explicit permissions create clarity)
INSERT INTO public.role_permissions (role, permission) VALUES
('admin', 'dashboard.view'),
('admin', 'site.edit'),
('admin', 'messages.view'),
('admin', 'classes.manage'),
('admin', 'subjects.manage'),
('admin', 'schedule.view'),
('admin', 'notices.manage'),
('admin', 'whatsapp.send'),
('admin', 'students.view'),
('admin', 'enrollments.view'),
('admin', 'teachers.view'),
('admin', 'attendance.manage'),
('admin', 'grades.manage'),
('admin', 'materials.manage'),
('admin', 'financial.view'),
('admin', 'users.manage'),
('admin', 'settings.manage'),
('admin', 'permissions.manage'),
('admin', 'help.view'),

-- 2. Secretary (High Access, no settings/users)
('secretary', 'dashboard.view'),
('secretary', 'messages.view'),
('secretary', 'classes.manage'),
('secretary', 'subjects.manage'),
('secretary', 'schedule.view'),
('secretary', 'notices.manage'),
('secretary', 'whatsapp.send'),
('secretary', 'students.view'),
('secretary', 'enrollments.view'),
('secretary', 'teachers.view'),
('secretary', 'attendance.manage'),
('secretary', 'grades.manage'),
('secretary', 'materials.manage'),
('secretary', 'financial.view'),
('secretary', 'help.view'),

-- 3. Treasurer (Finance Focus)
('treasurer', 'dashboard.view'),
('treasurer', 'students.view'),      -- Need to see students to check payments
('treasurer', 'enrollments.view'),   -- Need to see pending enrollments for payment checks
('treasurer', 'financial.view'),
('treasurer', 'help.view'),

-- 4. Teacher (Academic Focus)
('teacher', 'dashboard.view'),
('teacher', 'classes.manage'),       -- View classes
('teacher', 'schedule.view'),
('teacher', 'notices.manage'),       -- View notices
('teacher', 'students.view'),        -- View students in their class
('teacher', 'attendance.manage'),    -- Take attendance
('teacher', 'grades.manage'),        -- Post grades
('teacher', 'materials.manage'),     -- Post materials
('teacher', 'help.view')
ON CONFLICT (role, permission) DO NOTHING;
