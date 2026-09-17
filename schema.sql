-- Run this once in your Supabase project's SQL editor (Supabase dashboard -> SQL Editor -> New query).

create extension if not exists pgcrypto;

create table if not exists clients (
  id text primary key,                     -- slug generated from business name
  business_name text not null,
  passcode_hash text not null,
  owner_email text default '',
  owner_phone text default '',
  plan text not null default 'free' check (plan in ('free','premium')),
  languages text[] not null default array['English'],
  ai_form_enabled boolean not null default true,
  auto_reply_enabled boolean not null default false,
  lead_gen_enabled boolean not null default false,
  custom_form_enabled boolean not null default false,
  custom_form_category text default '',
  created_at timestamptz not null default now()
);

create table if not exists outlets (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  name text not null,
  address text default '',
  google_review_link text default '',
  keywords text default '',
  connected boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  rating int not null check (rating between 1 and 5),
  type text not null check (type in ('positive','negative')),
  comment text default '',
  review_text text default '',
  phone text default '',
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  client_id text not null references clients(id) on delete cascade,
  outlet_id uuid not null references outlets(id) on delete cascade,
  phone text not null,
  rating int,
  created_at timestamptz not null default now()
);

-- Row-level security is ON with NO policies, meaning the anon/public key can't
-- read or write anything. Every request from the app goes through Next.js API
-- routes using the service role key, which bypasses RLS. This keeps business
-- data safe even if your anon key is ever exposed in the browser.
alter table clients enable row level security;
alter table outlets enable row level security;
alter table reviews enable row level security;
alter table leads enable row level security;
