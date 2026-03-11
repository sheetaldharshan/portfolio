create table if not exists assistant_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  role text not null default 'operator' check (role in ('operator', 'visitor')),
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

alter table assistant_push_subscriptions enable row level security;

drop policy if exists "assistant_push_subscriptions_public_insert" on assistant_push_subscriptions;
create policy "assistant_push_subscriptions_public_insert"
  on assistant_push_subscriptions for insert
  with check (true);

drop policy if exists "assistant_push_subscriptions_public_delete" on assistant_push_subscriptions;
create policy "assistant_push_subscriptions_public_delete"
  on assistant_push_subscriptions for delete
  using (true);

drop policy if exists "assistant_push_subscriptions_public_select" on assistant_push_subscriptions;
create policy "assistant_push_subscriptions_public_select"
  on assistant_push_subscriptions for select
  using (true);
