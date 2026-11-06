import React from "react";
import { shortenAddress, formatBOT } from "../utils/formatters";
import {
  BOHR_CHAIN_ID_DECIMAL,
  NETWORK_SHORT_NAME,
  BOTCHAIN_WEBSITE_URL,
} from "../contracts/config";

export default function Navbar({
  account,
  balance,
  chainId,
  isConnecting,
  onConnect,
  onSwitchNetwork,
  onOpenCreateModal,
}) {
  const isCorrectNetwork = Number(chainId) === BOHR_CHAIN_ID_DECIMAL;

  return (
    <header className="navbar">
      <div className="navbar-container">
        {/* Brand with Vestali Logo and Built on BOT Chain Badge */}
        <div className="navbar-brand-group">
          <div className="navbar-brand">
            <img
              src="/vestali-logo.svg"
              alt="Vestali Logo"
              className="brand-logo-img"
              width="38"
              height="38"
            />
            <div className="brand-text">
              <div className="brand-title">Vestali</div>
              <div className="brand-tagline">Good ideas grow together.</div>
            </div>
          </div>

          <div className="navbar-ecosystem-divider" aria-hidden="true"></div>

          <a
            href={BOTCHAIN_WEBSITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="navbar-botchain-badge"
            title="Built on BOT Chain (Official Website)"
          >
            <span className="botchain-badge-pill">
              <span className="botchain-badge-sub">Built on</span>
              <img
                src="/botchain-icon.svg"
                alt="BOT Chain Logo"
                className="botchain-badge-icon"
                width="18"
                height="18"
              />
              <strong className="botchain-badge-name">BOT Chain</strong>
            </span>
          </a>
        </div>

        {/* Actions */}
        <div className="navbar-actions">
          {/* Network Indicator */}
          {account && (
            <div
              className={`network-badge ${
                isCorrectNetwork ? "network-badge-correct" : "network-badge-wrong"
              }`}
            >
              <img
                src="/botchain-icon.svg"
                alt="BOT Chain"
                className="network-badge-icon"
                width="14"
                height="14"
              />
              <span className="network-dot"></span>
              <span className="network-name">
                {isCorrectNetwork ? NETWORK_SHORT_NAME : "Wrong Network"}
              </span>
              {!isCorrectNetwork && (
                <button
                  type="button"
                  className="btn-switch-network"
                  onClick={onSwitchNetwork}
                >
                  Switch
                </button>
              )}
            </div>
          )}

          {/* Connect / Account Button */}
          {account ? (
            <div className="account-pill" title={account}>
              <span className="account-balance">{formatBOT(balance)} BOT</span>
              <span className="account-address">{shortenAddress(account)}</span>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-outline"
              onClick={onConnect}
              disabled={isConnecting}
            >
              {isConnecting ? "Connecting..." : "Connect MetaMask"}
            </button>
          )}

          {/* Create Campaign CTA */}
          <button
            type="button"
            className="btn btn-primary"
            onClick={onOpenCreateModal}
          >
            + Create Campaign
          </button>
        </div>
      </div>
    </header>
  );
}
