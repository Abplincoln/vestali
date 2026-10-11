import { ethers } from "ethers";

const KNOWN_REVERT_REASONS = [
  "Campaign does not exist",
  "Contribution must be greater than zero",
  "Campaign deadline has passed",
  "Funding goal already reached",
  "Contribution exceeds remaining goal",
  "Only creator can withdraw",
  "Funding goal not reached",
  "Funds already withdrawn",
  "Cannot refund successful campaign",
  "Campaign has not ended yet",
  "No contribution to refund",
  "Withdrawal transfer failed",
  "Refund transfer failed",
  "ReentrancyGuardReentrantCall",
];

function decodeRevertData(hexData) {
  if (typeof hexData !== "string") return null;
  try {
    // 0x08c379a0: Error(string) selector
    const errorSelector = "08c379a0";
    const idx = hexData.indexOf(errorSelector);
    if (idx !== -1) {
      const dataToDecode = "0x" + hexData.substring(idx + 8);
      const decoded = ethers.AbiCoder.defaultAbiCoder().decode(["string"], dataToDecode);
      if (decoded && decoded[0]) return decoded[0];
    }
  } catch {
    // ignore
  }
  return null;
}

export function parseContractError(err) {
  if (!err) return "Transaction failed.";

  // 1. User rejection
  if (
    err.code === 4001 ||
    err.code === "ACTION_REJECTED" ||
    err?.info?.error?.code === 4001 ||
    err?.error?.code === 4001
  ) {
    return "Transaction was cancelled by user.";
  }

  const messageStr = ((err.message || "") + " " + (err.shortMessage || "")).toLowerCase();
  if (
    messageStr.includes("user rejected") ||
    messageStr.includes("user denied") ||
    messageStr.includes("rejected transaction")
  ) {
    return "Transaction was cancelled by user.";
  }

  // 2. Insufficient funds
  if (
    messageStr.includes("insufficient funds") ||
    err.code === "INSUFFICIENT_FUNDS"
  ) {
    return "Insufficient BOT in your wallet to cover the transaction value and network gas fees.";
  }

  // 3. Explicit Ethers reason
  if (err.reason && typeof err.reason === "string") {
    return err.reason;
  }

  // 4. Try decoding hex revert data in various error fields
  const candidateHexes = [
    err.data,
    err?.info?.error?.data,
    err?.error?.data,
    err?.info?.payload?.params,
  ];
  for (const item of candidateHexes) {
    if (typeof item === "string") {
      const decoded = decodeRevertData(item);
      if (decoded) return decoded;
    } else if (typeof item === "object" && item !== null) {
      if (typeof item.data === "string") {
        const decoded = decodeRevertData(item.data);
        if (decoded) return decoded;
      }
      if (typeof item.message === "string") {
        for (const known of KNOWN_REVERT_REASONS) {
          if (item.message.includes(known)) return known;
        }
      }
    }
  }

  // 5. Search for known contract revert strings across serialized error
  let serialized = "";
  try {
    serialized = JSON.stringify(err);
  } catch {
    serialized = String(err);
  }

  for (const known of KNOWN_REVERT_REASONS) {
    if (serialized.includes(known)) {
      return known;
    }
  }

  // 6. Look for execution reverted pattern
  const revertMatch = serialized.match(/execution reverted:? ([^"\\,]+)/i);
  if (revertMatch && revertMatch[1]) {
    return revertMatch[1].trim();
  }

  // 7. Check nested RPC error messages if not generic Internal JSON-RPC error
  const nestedMsg =
    err?.info?.error?.message ||
    err?.error?.message ||
    err?.data?.message;

  if (nestedMsg && !nestedMsg.includes("Internal JSON-RPC error")) {
    return nestedMsg;
  }

  // 8. Handle generic "Internal JSON-RPC error" (-32603)
  if (
    messageStr.includes("internal json-rpc error") ||
    err.code === -32603 ||
    err?.info?.error?.code === -32603
  ) {
    return "Internal JSON-RPC error from Bohr node. This typically indicates the transaction would revert on-chain (e.g. contribution exceeds remaining goal or deadline passed) or gas estimation failed.";
  }

  // 9. Short message or trimmed message
  if (err.shortMessage) return err.shortMessage;
  if (err.message) {
    return err.message.length > 140 ? err.message.substring(0, 140) + "..." : err.message;
  }

  return "Transaction failed. Please check your wallet and try again.";
}
