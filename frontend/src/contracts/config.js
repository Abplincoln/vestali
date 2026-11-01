import VestaliABI from "./VestaliABI.json";

// BOT Chain Mainnet Configuration
export const MAINNET_CHAIN_ID_DECIMAL = 677;
export const MAINNET_RPC_URL = "https://rpc.botchain.ai";
export const MAINNET_EXPLORER_URL = "https://scan.botchain.ai";
export const MAINNET_CONTRACT_ADDRESS = "0x2848880b86b43A159c9Ed11202E6925Cc267e85D";

// BOT Chain Bohr Testnet Configuration (Preserved)
export const TESTNET_CHAIN_ID_DECIMAL = 968;
export const TESTNET_RPC_URL = "https://rpc.bohr.life";
export const TESTNET_EXPLORER_URL = "https://explorer.bohr.life";
export const TESTNET_CONTRACT_ADDRESS = "0x7c41CCE8C914312d53f4dC6D0c5b371625D12D22";

// Active network chain ID: defaults to BOT Chain Mainnet (677) unless overridden by env
export const BOHR_CHAIN_ID_DECIMAL = Number(
  import.meta.env.VITE_BOHR_CHAIN_ID || MAINNET_CHAIN_ID_DECIMAL
);

export const IS_MAINNET = BOHR_CHAIN_ID_DECIMAL === MAINNET_CHAIN_ID_DECIMAL;

export const BOHR_CHAIN_ID_HEX = `0x${BOHR_CHAIN_ID_DECIMAL.toString(16)}`;

export const BOHR_RPC_URL =
  import.meta.env.VITE_BOHR_RPC_URL ||
  (IS_MAINNET ? MAINNET_RPC_URL : TESTNET_RPC_URL);

export const NETWORK_NAME = IS_MAINNET
  ? "BOT Chain Mainnet"
  : "BOT Chain Bohr Testnet";

export const NETWORK_SHORT_NAME = IS_MAINNET ? "BOT Mainnet" : "Bohr Testnet";

export const NETWORK_EXPLORER_URL = IS_MAINNET
  ? MAINNET_EXPLORER_URL
  : TESTNET_EXPLORER_URL;

// Contract Address Handling:
// Strictly prevents accidental cross-network fallback.
// On Mainnet (Chain ID 677), NEVER use the Testnet contract address even if mistakenly set in env.
// On Testnet (Chain ID 968), NEVER use the Mainnet contract address even if mistakenly set in env.
const configuredAddress = import.meta.env.VITE_VESTALI_CONTRACT_ADDRESS
  ? import.meta.env.VITE_VESTALI_CONTRACT_ADDRESS.trim()
  : "";

export const VESTALI_CONTRACT_ADDRESS = (() => {
  if (IS_MAINNET) {
    if (
      configuredAddress &&
      configuredAddress.toLowerCase() !== TESTNET_CONTRACT_ADDRESS.toLowerCase()
    ) {
      return configuredAddress;
    }
    return MAINNET_CONTRACT_ADDRESS;
  } else {
    if (
      configuredAddress &&
      configuredAddress.toLowerCase() !== MAINNET_CONTRACT_ADDRESS.toLowerCase()
    ) {
      return configuredAddress;
    }
    return TESTNET_CONTRACT_ADDRESS;
  }
})();

export const BOHR_NETWORK_PARAMS = {
  chainId: BOHR_CHAIN_ID_HEX,
  chainName: NETWORK_NAME,
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: [BOHR_RPC_URL],
  blockExplorerUrls: [NETWORK_EXPLORER_URL],
};

export { VestaliABI };
