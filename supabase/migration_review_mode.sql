-- Run this ONCE in your Supabase SQL Editor (SQL Editor -> New query -> paste -> Run).
-- Adds a per-business "review style" setting. Safe to run more than once.
--
--   own_words : the customer writes the review in their own words (default)
--   full      : the AI writes a ready-to-post review, like before
--
-- Every existing business starts on "own_words". A business can switch back to
-- "full" from its own dashboard (AI settings -> Review style).

alter table clients add column if not exists review_mode text not null default 'own_words';

alter table clients drop constraint if exists clients_review_mode_check;
alter table clients add constraint clients_review_mode_check check (review_mode in ('own_words', 'full'));
