/*
  # Additional Tables for Dynamic Content

  1. New Tables
    - `notifications`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `title` (text)
      - `message` (text)
      - `type` (text)
      - `read` (boolean)
      - `created_at` (timestamp)
    
    - `blog_posts`
      - `id` (uuid, primary key)
      - `title` (text)
      - `excerpt` (text)
      - `content` (text)
      - `image_url` (text)
      - `author_id` (uuid, references profiles)
      - `category` (text)
      - `read_time` (text)
      - `featured` (boolean)
      - `published` (boolean)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `team_activity`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references profiles)
      - `action` (text)
      - `target` (text)
      - `project_id` (uuid, references projects, optional)
      - `task_id` (uuid, references tasks, optional)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add appropriate policies for each table
*/

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create blog_posts table
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  excerpt text NOT NULL,
  content text NOT NULL,
  image_url text,
  author_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  category text NOT NULL,
  read_time text DEFAULT '5 min read',
  featured boolean DEFAULT false,
  published boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create team_activity table
CREATE TABLE IF NOT EXISTS team_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action text NOT NULL,
  target text NOT NULL,
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  task_id uuid REFERENCES tasks(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_activity ENABLE ROW LEVEL SECURITY;

-- Notifications policies
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Blog posts policies (public read, authenticated write)
CREATE POLICY "Anyone can read published blog posts"
  ON blog_posts
  FOR SELECT
  TO authenticated
  USING (published = true);

CREATE POLICY "Authors can manage their blog posts"
  ON blog_posts
  FOR ALL
  TO authenticated
  USING (auth.uid() = author_id);

-- Team activity policies
CREATE POLICY "Users can read activity from their projects"
  ON team_activity
  FOR SELECT
  TO authenticated
  USING (
    project_id IN (
      SELECT project_id FROM project_members 
      WHERE user_id = auth.uid()
    )
    OR auth.uid() = user_id
  );

CREATE POLICY "Users can create activity records"
  ON team_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_id ON blog_posts(author_id);
CREATE INDEX IF NOT EXISTS idx_blog_posts_published ON blog_posts(published);
CREATE INDEX IF NOT EXISTS idx_blog_posts_featured ON blog_posts(featured);
CREATE INDEX IF NOT EXISTS idx_team_activity_user_id ON team_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_team_activity_project_id ON team_activity(project_id);

-- Add updated_at trigger for blog_posts
CREATE TRIGGER update_blog_posts_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample notifications
INSERT INTO notifications (user_id, title, message, type, read) 
SELECT 
  id,
  'Welcome to TaskFlow!',
  'Thanks for joining TaskFlow. Start by creating your first project.',
  'info',
  false
FROM profiles
ON CONFLICT DO NOTHING;

-- Insert sample blog posts
INSERT INTO blog_posts (title, excerpt, content, author_id, category, featured) 
SELECT 
  'Getting Started with TaskFlow',
  'Learn how to set up your first project and start managing tasks effectively.',
  'TaskFlow is designed to help teams collaborate more effectively. In this guide, we''ll walk you through setting up your first project...',
  id,
  'Getting Started',
  true
FROM profiles
LIMIT 1
ON CONFLICT DO NOTHING;