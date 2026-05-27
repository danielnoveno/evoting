import { createConfig } from "@ponder/core";
import { http } from "viem";
import type { AbiEvent } from "viem";

import { VoteChainRegistryAbi } from "./abis/VoteChainRegistryAbi";
import { ElectionSpaceAbi } from "./abis/ElectionSpaceAbi";

const registryAddress = (process.env.NEXT_PUBLIC_REGISTRY_ADDRESS ??
  "0xa91568d64d24d42Ec1Cd10C20B2F9D8d341250D0") as `0x${string}`;
const startBlock = Number(process.env.PONDER_START_BLOCK ?? 19480000);
const maxRequestsPerSecond = Number(process.env.PONDER_MAX_REQUESTS_PER_SECOND ?? 3);
const pollingInterval = Number(process.env.PONDER_POLLING_INTERVAL_MS ?? 5_000);
const electionSpaceCreatedEvent = VoteChainRegistryAbi.find(
  (item) => item.type === "event" && item.name === "ElectionSpaceCreated",
) as AbiEvent;

export default createConfig({
  networks: {
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
      maxRequestsPerSecond,
      pollingInterval,
    },
  },
  contracts: {
    VoteChainRegistry: {
      network: "baseSepolia",
      abi: VoteChainRegistryAbi,
      address: registryAddress,
      startBlock,
    },
    ElectionSpace: {
      network: "baseSepolia",
      abi: ElectionSpaceAbi,
      factory: {
        address: registryAddress,
        event: electionSpaceCreatedEvent,
        parameter: "space",
      },
      startBlock,
    },
  },
});
