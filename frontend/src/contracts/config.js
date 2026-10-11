import VestaliABI from "./VestaliABI.json";

export const VESTALI_CONTRACT_ADDRESS =
  import.meta.env.VITE_VESTALI_CONTRACT_ADDRESS ||
  "0x7c41CCE8C914312d53f4dC6D0c5b371625D12D22";

export const BOHR_CHAIN_ID_DECIMAL = Number(
  import.meta.env.VITE_BOHR_CHAIN_ID || 968
);

export const BOHR_CHAIN_ID_HEX = `0x${BOHR_CHAIN_ID_DECIMAL.toString(16)}`;

export const BOHR_RPC_URL =
  import.meta.env.VITE_BOHR_RPC_URL || "https://rpc.bohr.life";

export const BOHR_NETWORK_PARAMS = {
  chainId: BOHR_CHAIN_ID_HEX,
  chainName: "BOT Chain Bohr Testnet",
  nativeCurrency: {
    name: "BOT",
    symbol: "BOT",
    decimals: 18,
  },
  rpcUrls: [BOHR_RPC_URL],
  blockExplorerUrls: ["https://explorer.bohr.life"],
};

export { VestaliABI };
