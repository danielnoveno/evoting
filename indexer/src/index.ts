import { ponder } from "@/generated";
import { supabase } from "./supabase";

/**
 * Helper untuk mapping status Enum Solidity ke Enum Supabase
 */
const mapProposalStatus = (status: number) => {
  const statuses = ['submitted', 'approved', 'rejected', 'deployed'];
  return statuses[status] || 'submitted';
};

ponder.on("VoteChainRegistry:ProposalSubmitted", async ({ event, context }) => {
  const { Proposal } = context.db;
  const { proposalId, proposer, candidateCount } = event.args;

  // 1. Update Ponder Internal DB
  await Proposal.create({
    id: proposalId.toString(),
    data: {
      proposer,
      candidateCount: Number(candidateCount),
      status: 0, // Submitted
      submittedAt: Number(event.block.timestamp),
    },
  });

  // 2. Sync ke Supabase app.proposal_drafts
  // Kita cari berdasarkan tx_hash karena onchain_proposal_id baru diketahui sekarang
  const { error } = await supabase
    .schema('app')
    .from('proposal_drafts')
    .update({
      onchain_proposal_id: Number(proposalId),
      status: 'submitted',
      updated_at: new Date(Number(event.block.timestamp) * 1000).toISOString(),
    })
    .eq('proposal_tx_hash', event.transaction.hash);

  if (error) console.error(`❌ Error syncing ProposalSubmitted: ${error.message}`);
});

ponder.on("VoteChainRegistry:ProposalReviewed", async ({ event, context }) => {
  const { Proposal } = context.db;
  const { proposalId, decision, reviewer } = event.args;

  await Proposal.update({
    id: proposalId.toString(),
    data: {
      status: decision,
      reviewer: reviewer,
      reviewedAt: Number(event.block.timestamp),
    },
  });

  const { error } = await supabase
    .schema('app')
    .from('proposal_drafts')
    .update({
      status: mapProposalStatus(decision),
      review_tx_hash: event.transaction.hash,
      updated_at: new Date(Number(event.block.timestamp) * 1000).toISOString(),
    })
    .eq('onchain_proposal_id', Number(proposalId));

  if (error) console.error(`❌ Error syncing ProposalReviewed: ${error.message}`);
});

ponder.on("VoteChainRegistry:ElectionSpaceCreated", async ({ event, context }) => {
  const { Election } = context.db;
  const { spaceId, space, proposalId, owner, candidateCount } = event.args;

  await Election.create({
    id: space,
    data: {
      spaceId: spaceId,
      proposalId: proposalId,
      proposer: owner,
      candidateCount: Number(candidateCount),
      status: 0, 
      createdAt: Number(event.block.timestamp),
    },
  });

  // Update proposal_drafts status to deployed
  await supabase
    .schema('app')
    .from('proposal_drafts')
    .update({
      status: 'deployed',
      deployed_space_address: space,
      deployed_space_id: Number(spaceId),
      deployment_tx_hash: event.transaction.hash,
    })
    .eq('onchain_proposal_id', Number(proposalId));

  // Insert ke space_registry_map
  const { error } = await supabase
    .schema('app')
    .from('space_registry_map')
    .upsert({
      onchain_proposal_id: Number(proposalId),
      space_id: Number(spaceId),
      space_address: space,
      registry_address: event.log.address,
      owner_wallet: owner,
      deployment_tx_hash: event.transaction.hash,
    }, { onConflict: 'onchain_proposal_id' });

  if (error) console.error(`❌ Error syncing ElectionSpaceCreated: ${error.message}`);
});

// Audit Log Sync
ponder.on("ElectionSpace:VoteCommitted", async ({ event, context }) => {
  const { Vote } = context.db;
  await Vote.create({
    id: event.transaction.hash,
    data: {
      voter: event.args.voter,
      electionId: event.log.address,
      commitment: event.args.commitment,
      type: "COMMIT",
      timestamp: Number(event.block.timestamp),
    },
  });

  await supabase
    .schema('app')
    .from('tx_audit_log')
    .insert({
      wallet_address: event.args.voter,
      action_type: 'commit_vote',
      tx_hash: event.transaction.hash,
      block_number: Number(event.block.number),
      status: 'confirmed',
      metadata: { commitment: event.args.commitment, space: event.log.address }
    });
});

ponder.on("ElectionSpace:VoteRevealed", async ({ event, context }) => {
  const { Vote } = context.db;
  const { voter, candidateId, salt } = event.args;

  await Vote.create({
    id: event.transaction.hash,
    data: {
      voter,
      electionId: event.log.address,
      candidateId: Number(candidateId),
      salt,
      type: "REVEAL",
      timestamp: Number(event.block.timestamp),
    },
  });

  await supabase
    .schema('app')
    .from('tx_audit_log')
    .insert({
      wallet_address: voter,
      action_type: 'reveal_vote',
      tx_hash: event.transaction.hash,
      block_number: Number(event.block.number),
      status: 'confirmed',
      metadata: { candidateId: Number(candidateId), space: event.log.address }
    });
});
