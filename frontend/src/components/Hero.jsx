import React from "react";
import { formatBOT } from "../utils/formatters";
import {
  NETWORK_NAME,
  BOHR_CHAIN_ID_DECIMAL,
  IS_MAINNET,
  NETWORK_EXPLORER_URL,
  BOTCHAIN_WEBSITE_URL,
} from "../contracts/config";

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
          <img
            src="/botchain-icon.svg"
            alt="BOT Chain Logo"
            className="hero-badge-logo"
            width="18"
            height="18"
          />
          <span className="badge-pulse"></span>
          <span>
            Built on <strong>BOT Chain</strong> ({IS_MAINNET ? "Mainnet" : "Bohr Testnet"} &bull; Chain ID: {BOHR_CHAIN_ID_DECIMAL})
          </span>
        </div>

        <h1 className="hero-heading">
          Good ideas <span className="text-gradient">grow together.</span>
        </h1>

        <p className="hero-description">
          Vestali is a transparent, trustless crowdfunding platform built on{" "}
          <strong className="text-highlight">BOT Chain</strong>. Support community initiatives with native BOT, track
          funding milestones in real time, and enjoy safe refunds if a campaign
          falls short of its goal.
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
            href={NETWORK_EXPLORER_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
          >
            BOT Chain Explorer ↗
          </a>
          <a
            href={BOTCHAIN_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-lg"
          >
            botchain.ai ↗
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
