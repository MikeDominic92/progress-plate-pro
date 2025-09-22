-- Create admin user account
-- First, create the auth user with temporary email format
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  recovery_sent_at,
  last_sign_in_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'admin@temp.local',
  crypt('password', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}',
  '{"username":"admin"}',
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
);

-- Get the created user ID and insert admin role
WITH new_admin AS (
  SELECT id FROM auth.users WHERE email = 'admin@temp.local'
)
INSERT INTO public.user_roles (user_id, username, role)
SELECT id, 'admin', 'admin' FROM new_admin;