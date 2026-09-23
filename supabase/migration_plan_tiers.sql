-- Run this ONCE in your Supabase SQL Editor to upgrade your live database
-- to support the new plan tiers. Safe to run even with existing data.

-- Move any existing "premium" businesses to "lifetime" so they don't lose
-- access when the old value stops being valid.
update clients set plan = 'lifetime' where plan = 'premium';

-- Replace the old free/premium check with the new set of plans.
alter table clients drop constraint if exists clients_plan_check;
alter table clients add constraint clients_plan_check
  check (plan in ('free','monthly','quarterly','yearly','lifetime'));

-- New column to track when a timed plan expires (NULL for free/lifetime).
alter table clients add column if not exists plan_expires_at timestamptz;
