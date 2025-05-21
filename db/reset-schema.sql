-- Reset DB script that drops and recreates all schema objects

-- Drop existing tables with CASCADE to ensure dependent objects are dropped
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS todos CASCADE;

-- Drop the membership enum type
DROP TYPE IF EXISTS membership CASCADE;

-- Recreate the membership enum type
CREATE TYPE membership AS ENUM ('free', 'pro');

-- Create the profiles table
CREATE TABLE profiles (
  user_id TEXT PRIMARY KEY NOT NULL,
  membership membership NOT NULL DEFAULT 'free',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create the todos table
CREATE TABLE todos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

