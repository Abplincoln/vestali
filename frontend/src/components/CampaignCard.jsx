import React, { useState } from "react";
import { ethers } from "ethers";
import {
  shortenAddress,
  formatBOT,
  formatTimeRemaining,
  formatDate,
} from "../utils/formatters";
import { BOHR_CHAIN_ID_DECIMAL } from "../contracts/config";

export default function CampaignCard({
  campaign,
  account,
  chainId,
  onContribute,
  onWithdraw,
  onClaimRefund,
  onConnect,
  onSwitchNetwork,
  isPending,
}) {
  const [contributionAmount, setContributionAmount] = useState("");
  const isCorrectNetwork = Number(chainId) === BOHR_CHAIN_ID_DECIMAL;

  const isCreator =
    account && campaign.creator && account.toLowerCase() === campaign.creator.toLowerCase();

  const timeInfo = formatTimeRemaining(campaign.deadline);

  // Status computation
  // 0: Active, 1: Successful, 2: Failed
  let statusBadge = { label: "Active", className: "badge-active" };
  if (campaign.status === 1) {
    statusBadge = {
      label: campaign.claimed ? "Completed & Withdrawn" : "Goal Reached",
      className: "badge-successful",
    };
  } else if (campaign.status === 2) {
    statusBadge = { label: "Failed", className: "badge-failed" };
  }

  // Progress percentage
  const progressPercent = Math.min(
    Math.round(
      campaign.goalWei > 0n
        ? Number((campaign.totalRaisedWei * 10000n) / campaign.goalWei) / 100
        : 0
    ),
    100
  );

  const remainingWei =
    campaign.goalWei > campaign.totalRaisedWei
      ? campaign.goalWei - campaign.totalRaisedWei
      : 0n;

  const handleQuickContribute = (amountStr) => {
    try {
      const parsedWei = ethers.parseEther(amountStr);
      if (remainingWei > 0n && parsedWei > remainingWei) {
        setContributionAmount(ethers.formatEther(remainingWei));
      } else {
        setContributionAmount(amountStr);
      }
    } catch {
      setContributionAmount(amountStr);
    }
  };

  const handleMaxContribute = () => {
    try {
      setContributionAmount(ethers.formatEther(remainingWei));
    } catch {
      // ignore
    }
  };

  const submitContribution = (e) => {
    e.preventDefault();
    if (!contributionAmount || parseFloat(contributionAmount) <= 0) return;
    try {
      const parsedWei = ethers.parseEther(contributionAmount);
      if (remainingWei > 0n && parsedWei > remainingWei) {
        alert(
          `Contribution cannot exceed the remaining goal of ${formatBOT(
            remainingWei
          )} BOT.`
        );
        return;
      }
    } catch {
      // App.jsx pre-flight will catch format errors
    }
    onContribute(campaign.id, contributionAmount);
    setContributionAmount("");
  };

  return (
    <div className={`campaign-card status-${campaign.status}`}>
      {/* Card Header */}
      <div className="card-header">
        <span className="campaign-id">#{campaign.id}</span>
        <span className={`status-badge ${statusBadge.className}`}>
          {statusBadge.label}
        </span>
      </div>

      {/* Title & Description */}
      <h3 className="campaign-title">{campaign.title}</h3>
      <p className="campaign-desc">{campaign.description}</p>

      {/* Creator Info */}
      <div className="campaign-meta">
        <span className="meta-label">Creator:</span>
        <span className="creator-address" title={campaign.creator}>
          {shortenAddress(campaign.creator)}
        </span>
        {isCreator && <span className="you-pill">You</span>}
      </div>

      {/* Progress Bar & Amounts */}
      <div className="funding-progress-section">
        <div className="funding-amounts">
          <div>
            <span className="amount-raised">
              {formatBOT(campaign.totalRaisedWei)} BOT
            </span>
            <span className="amount-goal"> / {formatBOT(campaign.goalWei)} BOT</span>
          </div>
          <span className="progress-percentage">{progressPercent}%</span>
        </div>

        <div className="progress-bar-bg">
          <div
            className={`progress-bar-fill progress-bar-${campaign.status}`}
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>

        <div className="progress-subtext">
          {campaign.status === 0 && (
            <span>Remaining: {formatBOT(remainingWei)} BOT</span>
          )}
          <span className="deadline-text" title={formatDate(campaign.deadline)}>
            🕒 {timeInfo.text}
          </span>
        </div>
      </div>

      {/* User Contribution Info */}
      {campaign.userContributionWei > 0n && (
        <div className="user-contribution-banner">
          <span className="contribution-icon">🤝</span>
          <span>
            Your contribution: <strong>{formatBOT(campaign.userContributionWei)} BOT</strong>
          </span>
        </div>
      )}

      {/* Interactive Actions */}
      <div className="card-actions">
        {/* CASE 1: ACTIVE CAMPAIGN */}
        {campaign.status === 0 && (
          <>
            {!account ? (
              <button
                type="button"
                className="btn btn-primary btn-block"
                onClick={onConnect}
              >
                Connect Wallet to Contribute
              </button>
            ) : !isCorrectNetwork ? (
              <button
                type="button"
                className="btn btn-warning btn-block"
                onClick={onSwitchNetwork}
              >
                Switch to Bohr Testnet
              </button>
            ) : (
              <form onSubmit={submitContribution} className="contribute-form">
                <div className="quick-amount-buttons">
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickContribute("0.1")}
                  >
                    0.1 BOT
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickContribute("0.5")}
                  >
                    0.5 BOT
                  </button>
                  <button
                    type="button"
                    className="quick-btn"
                    onClick={() => handleQuickContribute("1.0")}
                  >
                    1.0 BOT
                  </button>
                  <button
                    type="button"
                    className="quick-btn quick-btn-max"
                    onClick={handleMaxContribute}
                  >
                    Max
                  </button>
                </div>

                <div className="input-group">
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    max={remainingWei > 0n ? ethers.formatEther(remainingWei) : undefined}
                    placeholder="Amount in BOT"
                    value={contributionAmount}
                    onChange={(e) => setContributionAmount(e.target.value)}
                    className="form-control"
                    disabled={isPending}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={
                      isPending ||
                      !contributionAmount ||
                      parseFloat(contributionAmount) <= 0
                    }
                  >
                    {isPending ? "Pending..." : "Contribute"}
                  </button>
                </div>
              </form>
            )}
          </>
        )}

        {/* CASE 2: SUCCESSFUL CAMPAIGN */}
        {campaign.status === 1 && (
          <div className="action-resolved-container">
            {isCreator ? (
              campaign.claimed ? (
                <div className="alert-box alert-success">
                  ✓ Funds of {formatBOT(campaign.totalRaisedWei)} BOT have been
                  successfully withdrawn to your wallet.
                </div>
              ) : (
                <button
                  type="button"
                  className="btn btn-success btn-block"
                  onClick={() => onWithdraw(campaign.id)}
                  disabled={isPending || !isCorrectNetwork}
                >
                  {isPending
                    ? "Processing..."
                    : `Withdraw ${formatBOT(campaign.totalRaisedWei)} BOT`}
                </button>
              )
            ) : (
              <div className="alert-box alert-info">
                🎉 Campaign reached 100% funding goal!{" "}
                {campaign.claimed
                  ? "Creator has withdrawn the funds."
                  : "Creator can now withdraw the raised funds."}
              </div>
            )}
          </div>
        )}

        {/* CASE 3: FAILED CAMPAIGN */}
        {campaign.status === 2 && (
          <div className="action-resolved-container">
            {campaign.userContributionWei > 0n ? (
              <button
                type="button"
                className="btn btn-warning btn-block"
                onClick={() => onClaimRefund(campaign.id)}
                disabled={isPending || !isCorrectNetwork}
              >
                {isPending
                  ? "Processing..."
                  : `Claim Full Refund (${formatBOT(
                      campaign.userContributionWei
                    )} BOT)`}
              </button>
            ) : (
              <div className="alert-box alert-neutral">
                Campaign deadline passed without reaching goal.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
