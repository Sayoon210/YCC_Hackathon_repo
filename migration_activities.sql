-- Migration: Create activities table for task progress reports
-- This enables assignees to submit reports with optional file attachments

-- Create activities table
create table public.activities (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Relationships
  task_id bigint references public.tasks(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  
  -- Report Data
  title text not null,
  content text not null,
  file_url text,
  sequence integer not null,
  
  -- Ensure unique sequence per task
  unique(task_id, sequence)
);

-- Enable RLS
alter table public.activities enable row level security;

-- Policy: Anyone can read activities
create policy "Anyone can read activities"
on public.activities
for select
to authenticated
using (true);

-- Policy: Only task assignees can create activities
create policy "Task assignees can create activities"
on public.activities
for insert
to authenticated
with check (
  exists (
    select 1 from public.tasks
    where tasks.id = task_id
    and tasks.member_id = auth.uid()
  )
);

-- Index for performance (frequent JOIN on task_id)
create index activities_task_id_idx on public.activities(task_id);
create index activities_sequence_idx on public.activities(task_id, sequence);

-- Comment
comment on table public.activities is 'Stores progress reports submitted by task assignees. Supports file attachments and sequential ordering.';
