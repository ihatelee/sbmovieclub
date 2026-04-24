# Fix: Infinite recursion in `profiles` RLS policy

The current `public.profiles` table has an RLS policy that causes
`infinite recursion detected in policy for relation "profiles"` on every
`select` (this is currently breaking the AuthContext profile fetch and the
new Admin → Members tab).

The recursion happens when a profiles policy queries profiles itself, e.g.
`(select is_admin from profiles where id = auth.uid())`. The fix is to move
that lookup into a `SECURITY DEFINER` function — it runs with the function
owner's rights and bypasses RLS, so it never re-enters the policy evaluator.

**Run this SQL in the Supabase SQL editor (or via your migration tool):**

```sql
-- 1. SECURITY DEFINER admin check (bypasses RLS — no recursion).
create or replace function public.is_admin(_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select is_admin from public.profiles where id = _user_id),
    false
  );
$$;

-- 2. Drop any existing (recursive) policies on profiles.
do $$
declare pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'profiles'
  loop
    execute format('drop policy if exists %I on public.profiles', pol.policyname);
  end loop;
end $$;

alter table public.profiles enable row level security;

-- 3. Non-recursive policies.
create policy "Users can read their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Admins can read all profiles"
  on public.profiles for select
  using (public.is_admin(auth.uid()));

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins can update any profile"
  on public.profiles for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));
```

Until this runs, the Members tab will show an empty list (the query errors
out) and the auth profile fetch will keep failing in the console.
