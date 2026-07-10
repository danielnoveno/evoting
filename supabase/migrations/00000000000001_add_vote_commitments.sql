-- VoteChain: vote_commitments table for auto-reveal.
-- Stores salt + candidateId server-side after voter commits.
-- Auto-reveal relayer uses this to reveal on behalf of voter.

create table if not exists app.vote_commitments (
  id uuid primary key default gen_random_uuid(),
  election_id uuid not null references app.proposal_drafts(id) on delete cascade,
  space_address text not null,
  voter_address text not null,
  candidate_id integer not null,
  salt text not null,
  commitment_hash text not null,
  commit_tx_hash text,
  revealed boolean not null default false,
  reveal_tx_hash text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique(election_id, voter_address),
  constraint vc_commit_voter_hex check (voter_address ~ '^0x[a-fA-F0-9]{40}$'),
  constraint vc_commit_space_hex check (space_address ~ '^0x[a-fA-F0-9]{40}$')
);

alter table app.vote_commitments enable row level security;

-- Voter can insert their own commitment (after commit tx confirmed)
create policy "vote_commitments_insert_own"
on app.vote_commitments for insert
with check (
  exists (
    select 1 from app.app_profiles p
    where p.user_id = auth.uid()
      and lower(p.wallet_address) = lower(voter_address)
  )
);

-- Voter can read their own commitments
create policy "vote_commitments_select_own"
on app.vote_commitments for select
using (
  exists (
    select 1 from app.app_profiles p
    where p.user_id = auth.uid()
      and lower(p.wallet_address) = lower(voter_address)
  )
);

-- Admin/superadmin can read all commitments (for audit)
create policy "vote_commitments_select_admin"
on app.vote_commitments for select
using (app.has_role(array['admin'::app.app_role, 'super_admin'::app.app_role]));

-- Service role full access (for auto-reveal cron)
create policy "vote_commitments_service_role_all"
on app.vote_commitments for all
using (auth.role() = 'service_role');

create index if not exists idx_vote_commitments_election on app.vote_commitments(election_id);
create index if not exists idx_vote_commitments_revealed on app.vote_commitments(revealed) where not revealed;
