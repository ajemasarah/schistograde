/*
  # Initial Schema Setup for User Profiles and Limits

  ## Query Description:
  Creates a profiles table to track user prompt counts and premium status. 
  Sets up triggers to automatically create a profile when a user signs up.
  Adds an RPC function to safely increment prompt counts.

  ## Metadata:
  - Schema-Category: "Structural"
  - Impact-Level: "High"
  - Requires-Backup: false
  - Reversible: true

  ## Structure Details:
  - Table: public.profiles
    - id (uuid, PK, refs auth.users)
    - email (text)
    - prompt_count (int)
    - is_premium (boolean)
    - subscription_plan (text)
  
  ## Security Implications:
  - RLS Enabled on profiles
*/

-- Create profiles table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  prompt_count integer default 0,
  is_premium boolean default false,
  subscription_plan text,
  updated_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- Enable RLS
alter table public.profiles enable row level security;

-- Policies
create policy "Users can view own profile" 
  on public.profiles for select 
  using (auth.uid() = id);

create policy "Users can update own profile" 
  on public.profiles for update 
  using (auth.uid() = id);

create policy "Users can insert own profile" 
  on public.profiles for insert 
  with check (auth.uid() = id);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, prompt_count, is_premium)
  values (new.id, new.email, 0, false);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- RPC to increment count safely
create or replace function increment_prompt_count()
returns void as $$
begin
  update public.profiles
  set prompt_count = prompt_count + 1
  where id = auth.uid();
end;
$$ language plpgsql security definer;
