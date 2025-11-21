-- Migration: Create votes table for storing individual user votes
-- This replaces the direct total_score calculation with a proper relational design

-- Create votes table
create table public.votes (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Relationships
  task_id bigint references public.tasks(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- The Score (0-10)
  score numeric not null check (score >= 0 and score <= 10),
  
  -- Constraint: One vote per user per task
  unique (task_id, user_id)
);

-- Enable RLS
alter table public.votes enable row level security;

-- Policy: Users can read all votes (to see total scores)
create policy "Users can read all votes"
on public.votes
for select
to authenticated
using (true);

-- Policy: Users can insert/update their own votes
create policy "Users can manage their own votes"
on public.votes
for all
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Index for performance (frequent JOIN on task_id)
create index votes_task_id_idx on public.votes(task_id);
create index votes_user_id_idx on public.votes(user_id);

-- Comment
comment on table public.votes is 'Stores individual user votes for tasks. Ensures one vote per user per task.';
