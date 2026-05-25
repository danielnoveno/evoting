import { createConfig } from "@ponder/core";
import { http } from "viem";

import { VoteChainRegistryAbi } from "./abis/VoteChainRegistryAbi";
import { ElectionSpaceAbi } from "./abis/ElectionSpaceAbi";

// Registry address from shared/addresses/base-sepolia.json
const REGISTRY_ADDRESS = "0xa91568d64d24d42Ec1Cd10C20B2F9D8d341250D0";

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
      address: REGISTRY_ADDRESS as `0x${string}`,
      startBlock: 21550000, 
    },
    ElectionSpace: {
      network: "baseSepolia",
      abi: ElectionSpaceAbi,
      factory: {
        address: REGISTRY_ADDRESS as `0x${string}`,
        event: VoteChainRegistryAbi.find((x) => x.name === "ElectionSpaceCreated"),
        parameter: "spaceAddress",
      },
      startBlock: 21550000,
    },
  },
});
