import { ethers } from "ethers";

export function shortenAddress(address) {
  if (!address) return "";
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
}

export function formatBOT(valueWei) {
  if (valueWei === undefined || valueWei === null) return "0";
  try {
    const formatted = ethers.formatEther(valueWei);
    // Trim trailing zeros after decimal point if unnecessary
    const parsed = parseFloat(formatted);
    if (parsed === 0) return "0";
    if (parsed < 0.0001) return "< 0.0001";
    return parsed.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: 4,
    });
  } catch (err) {
    return "0";
  }
}

export function formatTimeRemaining(deadlineTimestamp) {
  const now = Math.floor(Date.now() / 1000);
  const diff = Number(deadlineTimestamp) - now;

  if (diff <= 0) {
    return {
      isEnded: true,
      text: "Campaign ended",
      detailed: "Ended",
    };
  }

  const days = Math.floor(diff / (24 * 3600));
  const hours = Math.floor((diff % (24 * 3600)) / 3600);
  const minutes = Math.floor((diff % 3600) / 60);

  if (days > 0) {
    return {
      isEnded: false,
      text: `${days}d ${hours}h left`,
      detailed: `${days} days, ${hours} hours left`,
    };
  }

  if (hours > 0) {
    return {
      isEnded: false,
      text: `${hours}h ${minutes}m left`,
      detailed: `${hours} hours, ${minutes} minutes left`,
    };
  }

  return {
    isEnded: false,
    text: `${minutes}m left`,
    detailed: `${minutes} minutes left`,
  };
}

export function formatDate(timestamp) {
  const date = new Date(Number(timestamp) * 1000);
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
