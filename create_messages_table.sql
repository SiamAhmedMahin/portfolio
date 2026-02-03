-- Create a table for storing contact messages
create table public.messages (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone not null default now(),
  name text not null,
  email text not null,
  message text not null,
  constraint messages_pkey primary key (id)
);

-- Turn on RLS
alter table public.messages enable row level security;

-- Allow anyone to INSERT messages (anon key)
create policy "Enable insert for all users" on "public"."messages" as PERMISSIVE for INSERT to public using (true);

-- Allow only authenticated users (admins) to SELECT/VIEW messages working on dashboard
create policy "Enable select for authenticated users only" on "public"."messages" as PERMISSIVE for SELECT to authenticated using (true);
