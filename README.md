# 🌱 Vestali

> **Good ideas grow together.**

Vestali is a lightweight, transparent, and secure crowdfunding decentralized application (dApp) built on **BOT Chain Bohr Testnet**. It enables creators to raise capital for projects in native BOT tokens with automated milestone accounting, safe creator withdrawals upon goal completion, and guaranteed 100% contributor refunds if a campaign expires without reaching its target.

---

## 📌 Deployed Contract Details

* **Network Name:** BOT Chain Bohr Testnet
* **Chain ID:** `968` (`0x3c8`)
* **RPC Endpoint:** `https://rpc.bohr.life`
* **Currency Symbol:** `BOT`
* **Testnet Faucet:** [https://faucet.botchain.ai/basic](https://faucet.botchain.ai/basic)
* **Contract Address:** [`0x7c41CCE8C914312d53f4dC6D0c5b371625D12D22`](https://explorer.bohr.life)

---

## ✨ Features

1. **MetaMask Integration & Automatic Network Switching:**
   * One-click wallet connection.
   * Prompts to switch to Bohr Testnet (Chain ID `968`) or automatically registers the network in MetaMask if not already added.
2. **Campaign Discovery & Filtering:**
   * Browse all campaigns in real time via Bohr Testnet RPC.
   * View title, description, creator address, target goal, total raised, progress percentage, and time remaining.
   * Filter by status (*Active*, *Successful*, *Failed*) and personal activity (*Created by Me*, *My Contributions*).
   * Search campaigns by keyword.
3. **Campaign Creation:**
   * Any wallet can launch a crowdfunding campaign with a title, description, funding goal (in BOT), and future deadline.
4. **Native BOT Contributions:**
   * Contributors fund projects directly using native BOT.
   * Built-in safeguards reject zero-value contributions, contributions after deadline, and contributions exceeding the remaining goal.
5. **Safe Creator Withdrawals:**
   * When a campaign reaches 100% of its goal, the creator can withdraw all collected funds.
   * Protected by Checks-Effects-Interactions and OpenZeppelin `ReentrancyGuard`.
6. **Guaranteed Refunds for Failed Campaigns:**
   * If a campaign deadline passes without reaching the goal, each contributor can claim their exact contribution back.
   * Once refunded, accounting is zeroed out to prevent duplicate refunds.
7. **Real-time Transaction Feedback:**
   * Shows pending status with transaction hashes, success confirmations, and friendly error handling.
   * Automatically refreshes campaign milestones and user balances upon confirmation.

---

## 📁 Project Structure

```text
vestali/
├── contracts/
│   ├── Vestali.sol                # Core crowdfunding smart contract
│   └── test/
│       └── ReentrancyAttacker.sol # Security test contract for reentrancy verification
├── frontend/                      # Minimal React + Vite frontend
│   ├── src/
│   │   ├── components/            # UI components (Navbar, Hero, Cards, Modal, Footer)
│   │   ├── contracts/             # Contract ABI (from Hardhat artifacts) and Bohr network config
│   │   ├── utils/                 # Formatting utilities
│   │   ├── App.jsx                # Main application state and Web3 integration
│   │   ├── main.jsx               # Application entry point
│   │   └── index.css              # Custom responsive stylesheet
│   ├── index.html                 # HTML shell with Vestali branding
│   ├── vite.config.js             # Vite configuration
│   └── package.json               # Frontend dependencies
├── scripts/
│   └── deploy.js                  # Hardhat deployment script for Bohr Testnet
├── test/
│   └── Vestali.test.js            # Comprehensive Hardhat test suite (23 tests)
├── hardhat.config.js              # Hardhat configuration (Solidity 0.8.28 + Bohr Testnet)
├── package.json                   # Root workspace scripts and tooling
└── README.md                      # Project documentation
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
* **Node.js** v18+ (tested on Node v24)
* **MetaMask** browser extension installed
* Testnet BOT funded to your wallet via the [Bohr Testnet Faucet](https://faucet.botchain.ai/basic)

### 2. Installation

Clone or open the repository directory:

```bash
cd vestali
```

Install root dependencies (Hardhat & tooling):
```bash
npm install
```

Install frontend dependencies:
```bash
cd frontend
npm install
cd ..
```

---

## 🌐 Running the Frontend

To start the local development server:

```bash
npm run dev
```

Or from the `frontend` folder:
```bash
cd frontend
npm run dev
```

Open your browser at:
```text
http://localhost:5173
```

### Frontend Environment Configuration (Optional)
The frontend is pre-configured with defaults for the deployed contract. If you wish to override them, edit `frontend/.env`:

```env
VITE_VESTALI_CONTRACT_ADDRESS=0x7c41CCE8C914312d53f4dC6D0c5b371625D12D22
VITE_BOHR_RPC_URL=https://rpc.bohr.life
VITE_BOHR_CHAIN_ID=968
```

---

## 🛠️ Building for Production

To build the optimized static production bundle:

```bash
npm run build
```

To preview the built bundle locally:
```bash
npm run preview
```

---

## ☁️ Deploying to Vercel

### Option 1: One-Click Root Deployment (Recommended)
Vestali includes a root `vercel.json` pre-configured to build the frontend.
1. Connect your GitHub repository to [Vercel](https://vercel.com).
2. Leave **Root Directory** as `./` (default).
3. Click **Deploy**.

### Option 2: Set Root Directory to `frontend`
If you prefer building directly from the frontend directory:
1. In Vercel Project Settings, set **Root Directory** to `frontend`.
2. Framework Preset will automatically detect **Vite**.
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. Click **Deploy**.

---

## 🧪 Testing the Smart Contract

Run the automated test suite covering all 12 security and functional scenarios:

```bash
npm test
```

All 23 unit tests run locally against the Hardhat EVM network.
