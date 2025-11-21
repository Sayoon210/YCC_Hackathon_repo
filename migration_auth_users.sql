-- =====================================================
-- Migration: Convert users table to use Auth UUID
-- WARNING: This will drop existing users table data!
-- =====================================================

-- Step 1: Drop existing users table (CASCADE removes FK constraints)
DROP TABLE IF EXISTS users CASCADE;

-- Step 2: Create new users table with UUID PK linked to auth.users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Step 3: Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Create RLS policies
-- Allow users to read their own data
CREATE POLICY "Users can read own data" 
  ON users FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data" 
  ON users FOR UPDATE 
  USING (auth.uid() = id);

-- Step 5: Modify tasks table to use UUID for member_id
ALTER TABLE tasks 
  DROP COLUMN IF EXISTS member_id;

ALTER TABLE tasks 
  ADD COLUMN member_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- Step 6: Create trigger function to auto-insert into users table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', 'Anonymous')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 7: Create trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 8: Grant permissions
GRANT ALL ON users TO authenticated;
GRANT ALL ON users TO service_role;
