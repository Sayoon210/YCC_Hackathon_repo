create table public.system_logs (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.users(id) not null,
  action_type text not null,
  details text,
  related_task_id bigint references public.tasks(id)
);

-- Enable RLS
alter table public.system_logs enable row level security;

-- Allow read access to authenticated users
create policy "Allow read access to authenticated users"
on public.system_logs for select
to authenticated
using (true);

-- Allow insert access to authenticated users (for server actions)
create policy "Allow insert access to authenticated users"
on public.system_logs for insert
to authenticated
with check (true);
