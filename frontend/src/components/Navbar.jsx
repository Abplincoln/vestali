import React from "react";
import { shortenAddress, formatBOT } from "../utils/formatters";
import { BOHR_CHAIN_ID_DECIMAL } from "../contracts/config";

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
        {/* Brand */}
        <div className="navbar-brand">
          <div className="brand-logo-icon">🌱</div>
          <div className="brand-text">
            <div className="brand-title">Vestali</div>
            <div className="brand-tagline">Good ideas grow together.</div>
          </div>
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
              <span className="network-dot"></span>
              <span className="network-name">
                {isCorrectNetwork ? "Bohr Testnet" : "Wrong Network"}
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
