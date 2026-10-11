import React from "react";
import { formatBOT } from "../utils/formatters";

export default function Hero({ campaigns, onOpenCreateModal, onConnect, account }) {
  const totalCampaigns = campaigns.length;
  const activeCount = campaigns.filter((c) => c.status === 0).length;
  const successfulCount = campaigns.filter((c) => c.status === 1).length;

  const totalRaisedWei = campaigns.reduce(
    (acc, c) => acc + (c.totalRaisedWei || 0n),
    0n
  );

  return (
    <section className="hero-section">
      <div className="hero-content">
        <div className="hero-badge">
          <span className="badge-pulse"></span>
          <span>BOT Chain Bohr Testnet (Chain ID: 968)</span>
        </div>

        <h1 className="hero-heading">
          Good ideas <span className="text-gradient">grow together.</span>
        </h1>

        <p className="hero-description">
          Vestali is a transparent, trustless crowdfunding platform built on
          BOT Chain Bohr Testnet. Support community initiatives with native BOT,
          track funding milestones in real time, and enjoy safe refunds if a
          campaign falls short of its goal.
        </p>

        <div className="hero-actions">
          <button
            type="button"
            className="btn btn-primary btn-lg"
            onClick={account ? onOpenCreateModal : onConnect}
          >
            {account ? "Start a Campaign" : "Connect & Start Campaign"}
          </button>
          <a
            href="https://faucet.botchain.ai/basic"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
          >
            Get Testnet BOT ↗
          </a>
        </div>
      </div>

      <div className="hero-stats-card">
        <div className="stat-item">
          <div className="stat-value">{totalCampaigns}</div>
          <div className="stat-label">Total Campaigns</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">{formatBOT(totalRaisedWei)}</div>
          <div className="stat-label">Total Raised (BOT)</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">{activeCount}</div>
          <div className="stat-label">Active Projects</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-value">{successfulCount}</div>
          <div className="stat-label">Successful Projects</div>
        </div>
      </div>
    </section>
  );
}
