import React from "react";
import {
  VESTALI_CONTRACT_ADDRESS,
  BOHR_CHAIN_ID_DECIMAL,
  BOHR_RPC_URL,
  IS_MAINNET,
  NETWORK_EXPLORER_URL,
  BOTCHAIN_WEBSITE_URL,
} from "../contracts/config";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          {/* Vestali Brand with Dedicated Logo */}
          <div className="footer-brand">
            <img
              src="/vestali-logo.svg"
              alt="Vestali Logo"
              className="brand-logo-img"
              width="40"
              height="40"
            />
            <div>
              <div className="footer-brand-title">Vestali</div>
              <div className="footer-tagline">Good ideas grow together.</div>
            </div>
          </div>

          {/* Prominent Official BOT Chain Showcase */}
          <div className="footer-botchain-showcase">
            <div className="footer-botchain-meta">
              <span className="footer-botchain-sub">Ecosystem Network</span>
              <span className="footer-botchain-tagline">Built on &amp; Powered by</span>
            </div>
            <a
              href={BOTCHAIN_WEBSITE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-botchain-badge-link"
              title="Visit official BOT Chain Website"
            >
              <img
                src="/botchain-logo.svg"
                alt="BOT Chain Logo"
                className="footer-botchain-logo-img"
                height="28"
              />
              <span className="footer-botchain-brand-text">BOT Chain</span>
            </a>
          </div>

          {/* Official Ecosystem & Explorer Links */}
          <div className="footer-links-container">
            <div className="footer-links-label">BOT Chain Resources</div>
            <div className="footer-links">
              <a
                href="https://botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                BOT Chain Official Website ↗
              </a>
              <a
                href="https://scan.botchain.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                BOT Chain Mainnet Explorer ↗
              </a>
              <a
                href="https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-link"
              >
                BOT Chain Developer Docs ↗
              </a>
              {!IS_MAINNET && (
                <a
                  href="https://faucet.botchain.ai/basic"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-link"
                >
                  Testnet Faucet ↗
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="footer-divider"></div>

        <div className="footer-bottom">
          <div className="footer-contract-info">
            <span>
              <strong>Contract:</strong>{" "}
              {VESTALI_CONTRACT_ADDRESS ? (
                <a
                  href={`${NETWORK_EXPLORER_URL}/address/${VESTALI_CONTRACT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "inherit", textDecoration: "underline" }}
                >
                  <code>{VESTALI_CONTRACT_ADDRESS}</code> ↗
                </a>
              ) : (
                <code>Not configured</code>
              )}
            </span>
            <span><strong>Network:</strong> BOT Chain (Chain ID {BOHR_CHAIN_ID_DECIMAL})</span>
            <span><strong>RPC:</strong> {BOHR_RPC_URL}</span>
          </div>
          <div className="footer-copyright">
            Vestali &copy; {new Date().getFullYear()} — Built on <strong>BOT Chain</strong>. An independent community crowdfunding platform.
          </div>
        </div>
      </div>
    </footer>
  );
}
