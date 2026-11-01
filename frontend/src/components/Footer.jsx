import React from "react";
import {
  VESTALI_CONTRACT_ADDRESS,
  BOHR_CHAIN_ID_DECIMAL,
  BOHR_RPC_URL,
  IS_MAINNET,
  NETWORK_NAME,
  NETWORK_EXPLORER_URL,
} from "../contracts/config";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-top">
          <div className="footer-brand">
            <div className="brand-logo-icon">🌱</div>
            <div>
              <div className="footer-brand-title">Vestali</div>
              <div className="footer-tagline">Good ideas grow together.</div>
            </div>
          </div>

          <div className="footer-links">
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
            <a
              href={NETWORK_EXPLORER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              Explorer ↗
            </a>
            <a
              href="https://dev-docs.botchain.ai/docs/Developers/json-rpc-endpoint/"
              target="_blank"
              rel="noopener noreferrer"
              className="footer-link"
            >
              BOT Chain Docs ↗
            </a>
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
            <span><strong>Chain ID:</strong> {BOHR_CHAIN_ID_DECIMAL}</span>
            <span><strong>RPC:</strong> {BOHR_RPC_URL}</span>
          </div>
          <div className="footer-copyright">
            Vestali &copy; {new Date().getFullYear()} — Built on {NETWORK_NAME}
          </div>
        </div>
      </div>
    </footer>
  );
}
