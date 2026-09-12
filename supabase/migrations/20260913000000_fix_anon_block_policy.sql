-- Apply this once only to a project that already ran the core Storyloom schema.
-- It lets anonymous visitors evaluate the safe-story policy. Row Level Security
-- still returns no block rows to anonymous visitors.

grant select on public.user_blocks to anon;
