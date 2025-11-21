-- Migration: Create achievement_reviews table for peer evaluation
-- This enables team members to evaluate completed tasks

-- Create achievement_reviews table
create table public.achievement_reviews (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Relationships
  task_id bigint references public.tasks(id) on delete cascade not null,
  reviewer_id uuid references public.users(id) on delete cascade not null,
  
  -- Score (0, 2, 3, 5)
  score integer not null check (score in (0, 2, 3, 5)),
  
  -- Constraint: One review per user per task
  unique(task_id, reviewer_id)
);

-- Enable RLS
alter table public.achievement_reviews enable row level security;

-- Policy: Anyone can read reviews (to calculate scores/show counts)
create policy "Anyone can read achievement_reviews"
on public.achievement_reviews
for select
to authenticated
using (true);

-- Policy: Users can create their own reviews
create policy "Users can create achievement_reviews"
on public.achievement_reviews
for insert
to authenticated
with check (
  auth.uid() = reviewer_id
  -- Additional logic (not assignee, task has activities) is handled in Server Action
  -- But we can add basic check here if needed, though complex joins in RLS can be slow
);

-- Index for performance
create index achievement_reviews_task_id_idx on public.achievement_reviews(task_id);
create index achievement_reviews_reviewer_id_idx on public.achievement_reviews(reviewer_id);

-- Comment
comment on table public.achievement_reviews is 'Stores peer evaluations for completed tasks. Scores: 0, 2, 3, 5.';
