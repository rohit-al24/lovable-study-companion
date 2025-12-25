-- Migration: Create profiles and courses tables for Lovable Study Companion

-- Users table is managed by Supabase Auth

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  email text unique,
  name text,
  college text,
  degree text,
  semester text,
  study_hours integer,
  study_style text[],
  sundays_free boolean,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

create table if not exists courses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  name text,
  units integer,
  completed integer,
  progress integer,
  nextTopic text,
  color text,
  totalHours integer,
  hoursCompleted integer,
  exams jsonb,
  notes text[],
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- If you already have a table with the wrong column name, run this to fix it:
-- ALTER TABLE courses RENAME COLUMN hourscompled TO hoursCompleted;

-- If the column was missing entirely, add it:
ALTER TABLE courses ADD COLUMN IF NOT EXISTS hoursCompleted integer;

-- If the nextTopic column was missing entirely, add it:
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "nextTopic" text;

-- If the totalHours column was missing entirely, add it:
ALTER TABLE courses ADD COLUMN IF NOT EXISTS "totalHours" integer;

-- Notes table for storing extracted PDF text
create table if not exists notes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  course_name text,
  filename text,
  text text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Add a separate `note_text` column to avoid using the reserved word `text` as a column name
ALTER TABLE notes ADD COLUMN IF NOT EXISTS note_text text;
-- Copy any existing values from `text` into `note_text` if `note_text` is empty
UPDATE notes SET note_text = text WHERE note_text IS NULL AND text IS NOT NULL;