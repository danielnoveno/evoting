import { createSchema } from "@ponder/core";

export default createSchema((p) => ({
  Proposal: p.createTable({
    id: p.string(),
    proposer: p.string(),
    title: p.string(),
    candidateCount: p.int(),
    status: p.int(),
    metadataURI: p.string(),
    submittedAt: p.int(),
    reviewedAt: p.int(),
    reviewer: p.string(),
  }),
  Election: p.createTable({
    id: p.string(), // spaceAddress
    spaceId: p.bigint(),
    proposalId: p.bigint(),
    proposer: p.string(),
    candidateCount: p.int(),
    status: p.int(),
    createdAt: p.int(),
  }),
  Vote: p.createTable({
    id: p.string(), // txHash
    voter: p.string(),
    electionId: p.string(), // spaceAddress
    commitment: p.string(),
    candidateId: p.int(),
    salt: p.string(),
    type: p.string(), // "COMMIT" | "REVEAL"
    timestamp: p.int(),
  }),
}));
