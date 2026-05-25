import { createConfig } from "@ponder/core";
import { http } from "viem";

import { VoteChainRegistryAbi } from "./abis/VoteChainRegistryAbi";
import { ElectionSpaceAbi } from "./abis/ElectionSpaceAbi";

export default createConfig({
  networks: {
    baseSepolia: {
      chainId: 84532,
      transport: http(process.env.PONDER_RPC_URL_84532),
    },
  },
  contracts: {
    VoteChainRegistry: {
      network: "baseSepolia",
      abi: VoteChainRegistryAbi,
      address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
      startBlock: 19480000, // Example start block
    },
    ElectionSpace: {
      network: "baseSepolia",
      abi: ElectionSpaceAbi,
      factory: {
        address: process.env.NEXT_PUBLIC_REGISTRY_ADDRESS as `0x${string}`,
        event: VoteChainRegistryAbi.find((x) => x.name === "ElectionSpaceCreated"),
        parameter: "spaceAddress",
      },
      startBlock: 19480000,
    },
  },
});
