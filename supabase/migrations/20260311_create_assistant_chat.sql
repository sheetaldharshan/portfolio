create table if not exists assistant_conversations (
  id uuid primary key default gen_random_uuid(),
  visitor_session_id text not null,
  visitor_name text,
  visitor_email text,
  status text not null default 'ai_active' check (status in ('ai_active', 'human_takeover', 'resolved')),
  unread_for_operator integer not null default 0,
  unread_for_visitor integer not null default 0,
  last_message_at timestamp with time zone not null default timezone('utc'::text, now()),
  created_at timestamp with time zone not null default timezone('utc'::text, now()),
  updated_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_assistant_conversations_visitor_session
  on assistant_conversations(visitor_session_id);

create index if not exists idx_assistant_conversations_last_message_at
  on assistant_conversations(last_message_at desc);

create table if not exists assistant_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references assistant_conversations(id) on delete cascade,
  sender_role text not null check (sender_role in ('visitor', 'assistant', 'operator')),
  sender_label text not null,
  content text not null,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone not null default timezone('utc'::text, now())
);

create index if not exists idx_assistant_messages_conversation_created_at
  on assistant_messages(conversation_id, created_at asc);

create or replace function update_assistant_conversations_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assistant_conversations_updated_at on assistant_conversations;
create trigger trg_assistant_conversations_updated_at
before update on assistant_conversations
for each row
execute function update_assistant_conversations_updated_at();

alter table assistant_conversations enable row level security;
alter table assistant_messages enable row level security;

drop policy if exists "assistant_conversations_public_read" on assistant_conversations;
create policy "assistant_conversations_public_read"
  on assistant_conversations for select
  using (true);

drop policy if exists "assistant_conversations_public_insert" on assistant_conversations;
create policy "assistant_conversations_public_insert"
  on assistant_conversations for insert
  with check (true);

drop policy if exists "assistant_conversations_public_update" on assistant_conversations;
create policy "assistant_conversations_public_update"
  on assistant_conversations for update
  using (true)
  with check (true);

drop policy if exists "assistant_messages_public_read" on assistant_messages;
create policy "assistant_messages_public_read"
  on assistant_messages for select
  using (true);

drop policy if exists "assistant_messages_public_insert" on assistant_messages;
create policy "assistant_messages_public_insert"
  on assistant_messages for insert
  with check (true);

drop policy if exists "assistant_messages_public_update" on assistant_messages;
create policy "assistant_messages_public_update"
  on assistant_messages for update
  using (true)
  with check (true);
