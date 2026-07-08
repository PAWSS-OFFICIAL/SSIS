-- ==========================================
-- JAIN LMS - Startup Features Database Schema
-- All new tables for gamification, analytics, ExamOS, etc.
-- ==========================================

-- ==========================================
-- GAMIFICATION TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(255),
    criteria_type VARCHAR(100), -- attendance_streak, grade_improvement, quiz_master, etc.
    criteria_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS user_badges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    badge_id INT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_badge (user_id, badge_id)
);

CREATE TABLE IF NOT EXISTS gamification_points (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    points INT NOT NULL DEFAULT 0,
    reason VARCHAR(255),
    awarded_by INT,
    awarded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (awarded_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS user_streaks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    streak_type VARCHAR(100) NOT NULL, -- daily_login, attendance_streak, etc.
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_streak (user_id, streak_type)
);

CREATE TABLE IF NOT EXISTS challenges (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    challenge_type VARCHAR(100), -- quiz_competition, attendance_challenge, etc.
    start_date DATE,
    end_date DATE,
    reward_points INT DEFAULT 100,
    target_criteria JSON,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS challenge_participants (
    id INT AUTO_INCREMENT PRIMARY KEY,
    challenge_id INT NOT NULL,
    user_id INT NOT NULL,
    progress INT DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMP,
    FOREIGN KEY (challenge_id) REFERENCES challenges(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_participant (challenge_id, user_id)
);

-- ==========================================
-- EXAMOS TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS exam_schedules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    course_id INT,
    exam_date DATE,
    start_time TIME,
    end_time TIME,
    exam_type VARCHAR(100), -- midterm, final, quiz
    max_marks INT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS hall_tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ticket_id VARCHAR(50) UNIQUE NOT NULL,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active', -- active, used, cancelled
    FOREIGN KEY (exam_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_ticket (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS exam_halls (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    building VARCHAR(255),
    capacity INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_seating (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    hall_id INT,
    seat_number VARCHAR(50),
    FOREIGN KEY (exam_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (hall_id) REFERENCES exam_halls(id) ON DELETE SET NULL,
    UNIQUE KEY unique_seating (exam_id, student_id)
);

CREATE TABLE IF NOT EXISTS proctoring_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    student_id INT NOT NULL,
    event_type VARCHAR(100),
    event_data JSON,
    severity VARCHAR(50) DEFAULT 'low', -- low, medium, high
    logged_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (exam_id) REFERENCES exam_schedules(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ==========================================
-- INDUSTRY BRIDGE TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS job_postings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_name VARCHAR(255) NOT NULL,
    job_title VARCHAR(255) NOT NULL,
    description TEXT,
    requirements JSON,
    department VARCHAR(100),
    min_cgpa DECIMAL(3,2) DEFAULT 6.0,
    package_lpa DECIMAL(5,2),
    last_date DATE,
    posted_by INT,
    posted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS job_applications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    job_id INT NOT NULL,
    student_id INT NOT NULL,
    resume_url VARCHAR(500),
    applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'pending', -- pending, shortlisted, rejected, selected
    FOREIGN KEY (job_id) REFERENCES job_postings(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, student_id)
);

-- ==========================================
-- NO-CODE CUSTOMIZATION TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS custom_fields (
    id INT AUTO_INCREMENT PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL, -- user, course, assignment, etc.
    field_name VARCHAR(100) NOT NULL,
    field_type VARCHAR(50), -- text, number, date, boolean, select
    label VARCHAR(255),
    required BOOLEAN DEFAULT FALSE,
    options JSON,
    default_value VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS theme_config (
    id INT AUTO_INCREMENT PRIMARY KEY,
    university_name VARCHAR(255) DEFAULT 'JAIN University',
    primary_color VARCHAR(50) DEFAULT '#3b82f6',
    secondary_color VARCHAR(50) DEFAULT '#10b981',
    logo_url VARCHAR(500),
    favicon_url VARCHAR(500),
    custom_css TEXT,
    updated_by INT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- CHATBOT TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS chatbot_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_message TEXT,
    bot_response TEXT,
    context JSON,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ==========================================
-- ACCESSIBILITY TABLES
-- ==========================================

CREATE TABLE IF NOT EXISTS accessibility_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    screen_reader_enabled BOOLEAN DEFAULT FALSE,
    high_contrast_mode BOOLEAN DEFAULT FALSE,
    large_text_mode BOOLEAN DEFAULT FALSE,
    reduced_motion BOOLEAN DEFAULT FALSE,
    color_blind_mode VARCHAR(50), -- protanopia, deuteranopia, tritanopia
    keyboard_navigation_only BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_accessibility (user_id)
);

-- ==========================================
-- USER PREFERENCES TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS user_preferences (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    dark_mode BOOLEAN DEFAULT FALSE,
    low_bandwidth_mode BOOLEAN DEFAULT FALSE,
    preferred_language VARCHAR(10) DEFAULT 'en',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_prefs (user_id)
);

-- ==========================================
-- ADD NEW COLUMNS TO EXISTING TABLES
-- ==========================================

-- Add parent_id to users table for Parent Connect
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_id INT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(10) DEFAULT 'en';

-- Add parent-specific fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS linked_student_id INT NULL;
ALTER TABLE users ADD FOREIGN KEY IF NOT EXISTS (linked_student_id) REFERENCES users(id) ON DELETE SET NULL;

-- ==========================================
-- INSERT DEFAULT DATA
-- ==========================================

-- Insert default badges
INSERT INTO badges (name, description, icon, criteria_type, criteria_value) VALUES
('Attendance Champion', 'Maintain 30-day attendance streak', '🏆', 'attendance_streak', 30),
('Grade Improver', 'Improve grades by 20% in a month', '📈', 'grade_improvement', 20),
('Quiz Master', 'Score 100% in 5 quizzes', '🎯', 'quiz_master', 5),
('Early Bird', 'Login before 8 AM for 10 days', '🌅', 'early_login', 10),
('Assignment Star', 'Submit 10 assignments on time', '⭐', 'assignment_completion', 10),
('Helpful Peer', 'Help 5 classmates with their doubts', '🤝', 'peer_help', 5)
ON DUPLICATE KEY UPDATE name=name;

-- Insert default exam halls
INSERT INTO exam_halls (name, building, capacity) VALUES
('Hall A - Block 1', 'Main Building', 100),
('Hall B - Block 1', 'Main Building', 100),
('Hall C - Block 2', 'Science Block', 80),
('Hall D - Block 2', 'Science Block', 80),
('Computer Lab 1', 'IT Block', 60),
('Computer Lab 2', 'IT Block', 60)
ON DUPLICATE KEY UPDATE name=name;

-- Insert default theme
INSERT INTO theme_config (university_name, primary_color, secondary_color) VALUES
('JAIN University', '#3b82f6', '#10b981')
ON DUPLICATE KEY UPDATE id=id;

-- ==========================================
-- CREATE INDEXES FOR PERFORMANCE
-- ==========================================

CREATE INDEX IF NOT EXISTS idx_gamification_points_user ON gamification_points(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_proctoring_logs_exam ON proctoring_logs(exam_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_job ON job_applications(job_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_student ON job_applications(student_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_exam ON hall_tickets(exam_id);
CREATE INDEX IF NOT EXISTS idx_hall_tickets_student ON hall_tickets(student_id);
CREATE INDEX IF NOT EXISTS idx_chatbot_logs_user ON chatbot_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_challenge ON challenge_participants(challenge_id);

-- ==========================================
-- MISSING TABLES (required by server.py queries)
-- ==========================================

-- Course enrollments - links students to courses
CREATE TABLE IF NOT EXISTS course_enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    student_id INT NOT NULL,
    enrolled_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'active',
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_enrollment (course_id, student_id)
);

-- Course content for low-bandwidth endpoint
CREATE TABLE IF NOT EXISTS course_content (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(100),  -- video, document, link, etc.
    content_url VARCHAR(500),
    content_text TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Webhooks table - replaces in-memory storage
CREATE TABLE IF NOT EXISTS webhooks (
    id VARCHAR(36) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    events JSON NOT NULL,
    secret VARCHAR(255),
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Auto-enroll students in courses matching their department/year
-- (Trigger to auto-create enrollment when student is added)
CREATE INDEX IF NOT EXISTS idx_course_enrollments_student ON course_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_course_content_course ON course_content(course_id);