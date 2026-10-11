import React, { useState, useEffect, useCallback } from "react";
import { ethers } from "ethers";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import CampaignCard from "./components/CampaignCard";
import CreateCampaignModal from "./components/CreateCampaignModal";
import Notification from "./components/Notification";
import Footer from "./components/Footer";
import {
  VESTALI_CONTRACT_ADDRESS,
  VestaliABI,
  BOHR_CHAIN_ID_DECIMAL,
  BOHR_CHAIN_ID_HEX,
  BOHR_RPC_URL,
  BOHR_NETWORK_PARAMS,
} from "./contracts/config";
import { parseContractError } from "./utils/errors";
import { formatBOT } from "./utils/formatters";

export default function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState(null);
  const [chainId, setChainId] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  const [campaigns, setCampaigns] = useState([]);
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [actionPending, setActionPending] = useState(false);
  const [notification, setNotification] = useState(null);

  // Parse revert or web3 error message
  const parseErrorMessage = (err) => {
    return parseContractError(err);
  };

  // Switch to Bohr Testnet
  const handleSwitchNetwork = async () => {
    if (!window.ethereum) {
      alert("MetaMask is not installed. Please install MetaMask to use Vestali.");
      return;
    }
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: BOHR_CHAIN_ID_HEX }],
      });
    } catch (switchError) {
      if (switchError.code === 4902 || switchError?.data?.originalError?.code === 4902) {
        try {
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [BOHR_NETWORK_PARAMS],
          });
        } catch (addError) {
          setNotification({
            type: "error",
            message: `Could not add Bohr Testnet: ${addError.message}`,
          });
        }
      } else {
        setNotification({
          type: "error",
          message: `Network switch failed: ${switchError.message}`,
        });
      }
    }
  };

  // Connect MetaMask
  const handleConnect = async () => {
    if (!window.ethereum) {
      setNotification({
        type: "error",
        message: "MetaMask is not detected. Please install the MetaMask browser extension.",
      });
      return;
    }
    try {
      setIsConnecting(true);
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });
      if (accounts && accounts.length > 0) {
        setAccount(accounts[0]);
        const currentChainHex = await window.ethereum.request({ method: "eth_chainId" });
        setChainId(parseInt(currentChainHex, 16));
      }
    } catch (err) {
      setNotification({
        type: "error",
        message: parseErrorMessage(err),
      });
    } finally {
      setIsConnecting(false);
    }
  };

  // Update user balance
  const loadUserBalance = useCallback(async () => {
    if (!account) {
      setBalance(null);
      return;
    }
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const bal = await provider.getBalance(account);
      setBalance(bal);
    } catch (err) {
      console.warn("Failed to fetch account balance:", err);
    }
  }, [account]);

  // Load campaigns from contract
  const loadCampaigns = useCallback(async () => {
    try {
      setIsLoadingCampaigns(true);

      // Prefer BrowserProvider if connected; otherwise fallback to public RPC provider
      let provider;
      if (window.ethereum && account) {
        provider = new ethers.BrowserProvider(window.ethereum);
      } else {
        provider = new ethers.JsonRpcProvider(BOHR_RPC_URL);
      }

      const contract = new ethers.Contract(VESTALI_CONTRACT_ADDRESS, VestaliABI, provider);
      const count = await contract.campaignCount();
      const total = Number(count);

      const items = [];
      for (let i = total; i >= 1; i--) {
        try {
          const c = await contract.getCampaign(i);
          const status = await contract.getCampaignStatus(i);

          let userContr = 0n;
          if (account) {
            try {
              userContr = await contract.contributions(i, account);
            } catch (contrErr) {
              console.warn(`Could not fetch contribution for #${i}:`, contrErr);
            }
          }

          items.push({
            id: Number(c.id),
            creator: c.creator,
            title: c.title,
            description: c.description,
            goalWei: c.goal,
            deadline: Number(c.deadline),
            totalRaisedWei: c.totalRaised,
            claimed: c.claimed,
            status: Number(status),
            userContributionWei: userContr,
          });
        } catch (itemErr) {
          console.error(`Failed to load campaign #${i}:`, itemErr);
        }
      }

      setCampaigns(items);
    } catch (err) {
      console.error("Failed to load campaigns:", err);
      setNotification({
        type: "error",
        message: `Failed to load campaigns: ${parseErrorMessage(err)}`,
      });
    } finally {
      setIsLoadingCampaigns(false);
    }
  }, [account]);

  // Listen for MetaMask events
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts) => {
      if (accounts.length > 0) {
        setAccount(accounts[0]);
      } else {
        setAccount(null);
        setBalance(null);
      }
    };

    const handleChainChanged = (chainHex) => {
      setChainId(parseInt(chainHex, 16));
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);
    window.ethereum.on("chainChanged", handleChainChanged);

    // Initial check if already connected
    window.ethereum
      .request({ method: "eth_accounts" })
      .then((accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        }
      })
      .catch(console.warn);

    window.ethereum
      .request({ method: "eth_chainId" })
      .then((hex) => setChainId(parseInt(hex, 16)))
      .catch(console.warn);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged);
        window.ethereum.removeListener("chainChanged", handleChainChanged);
      }
    };
  }, []);

  // Refresh balance & campaigns on account/chain changes
  useEffect(() => {
    loadUserBalance();
  }, [loadUserBalance]);

  useEffect(() => {
    loadCampaigns();
  }, [loadCampaigns]);

  // Action: Create Campaign
  const handleCreateCampaign = async ({ title, description, goal, deadline }) => {
    if (!account) {
      await handleConnect();
      return;
    }
    if (Number(chainId) !== BOHR_CHAIN_ID_DECIMAL) {
      await handleSwitchNetwork();
      return;
    }

    try {
      setActionPending(true);
      setNotification({
        type: "pending",
        message: "Initiating campaign creation in MetaMask...",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VESTALI_CONTRACT_ADDRESS, VestaliABI, signer);

      const goalWei = ethers.parseEther(goal);
      const tx = await contract.createCampaign(title, description, goalWei, deadline);

      setNotification({
        type: "pending",
        message: "Waiting for block confirmation on Bohr Testnet...",
        hash: tx.hash,
      });

      await tx.wait();

      setNotification({
        type: "success",
        message: `Campaign "${title}" successfully launched on-chain!`,
        hash: tx.hash,
      });

      setIsCreateModalOpen(false);
      await loadCampaigns();
      await loadUserBalance();
    } catch (err) {
      console.error("Create campaign failed:", err);
      setNotification({
        type: "error",
        message: parseErrorMessage(err),
      });
    } finally {
      setActionPending(false);
    }
  };

  // Action: Contribute
  const handleContribute = async (campaignId, amountInBot) => {
    if (!account) {
      await handleConnect();
      return;
    }
    if (Number(chainId) !== BOHR_CHAIN_ID_DECIMAL) {
      await handleSwitchNetwork();
      return;
    }

    // 1. Input validation
    if (!amountInBot || parseFloat(amountInBot) <= 0) {
      setNotification({
        type: "error",
        message: "Please enter a contribution amount greater than 0 BOT.",
      });
      return;
    }

    let amountWei;
    try {
      amountWei = ethers.parseEther(amountInBot);
    } catch {
      setNotification({
        type: "error",
        message: "Invalid contribution amount format.",
      });
      return;
    }

    if (amountWei <= 0n) {
      setNotification({
        type: "error",
        message: "Contribution must be greater than zero.",
      });
      return;
    }

    try {
      setActionPending(true);
      setNotification({
        type: "pending",
        message: "Verifying campaign status and wallet balance...",
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VESTALI_CONTRACT_ADDRESS, VestaliABI, signer);

      // 2. Pre-flight check: Wallet balance
      const currentBalance = await provider.getBalance(account);
      if (currentBalance < amountWei) {
        setNotification({
          type: "error",
          message: `Insufficient balance. Your wallet has ${formatBOT(currentBalance)} BOT, but attempted to contribute ${amountInBot} BOT.`,
        });
        setActionPending(false);
        return;
      }

      // Check balance covers amount + estimated gas
      const feeData = await provider.getFeeData();
      const gasPrice = feeData.gasPrice || 1000000000n; // 1 gwei fallback
      const estimatedGasCost = gasPrice * 150000n;
      if (currentBalance < amountWei + estimatedGasCost) {
        setNotification({
          type: "error",
          message: "Insufficient balance to cover both contribution and gas fees. Please leave at least 0.001 BOT for gas.",
        });
        setActionPending(false);
        return;
      }

      // 3. Pre-flight check: Fresh on-chain campaign state
      const freshCampaign = await contract.getCampaign(campaignId);
      const freshStatus = await contract.getCampaignStatus(campaignId);

      if (freshCampaign.creator === ethers.ZeroAddress) {
        setNotification({
          type: "error",
          message: "Campaign does not exist.",
        });
        setActionPending(false);
        return;
      }

      // Check status (0 = Active, 1 = Successful, 2 = Failed)
      if (Number(freshStatus) === 1 || freshCampaign.totalRaised >= freshCampaign.goal) {
        setNotification({
          type: "error",
          message: "Funding goal already reached. This campaign cannot accept further contributions.",
        });
        setActionPending(false);
        await loadCampaigns();
        return;
      }

      if (Number(freshStatus) === 2) {
        setNotification({
          type: "error",
          message: "Campaign deadline has passed. Contributions are closed.",
        });
        setActionPending(false);
        await loadCampaigns();
        return;
      }

      // Check block timestamp against campaign deadline
      const latestBlock = await provider.getBlock("latest");
      const currentBlockTime = latestBlock ? latestBlock.timestamp : Math.floor(Date.now() / 1000);
      if (currentBlockTime > Number(freshCampaign.deadline)) {
        setNotification({
          type: "error",
          message: "Campaign deadline has passed. Contributions can no longer be accepted.",
        });
        setActionPending(false);
        await loadCampaigns();
        return;
      }

      // Check remaining goal
      const remainingGoalWei = freshCampaign.goal - freshCampaign.totalRaised;
      if (amountWei > remainingGoalWei) {
        const remainingBot = ethers.formatEther(remainingGoalWei);
        setNotification({
          type: "error",
          message: `Contribution exceeds remaining goal. Maximum allowable contribution is ${remainingBot} BOT.`,
        });
        setActionPending(false);
        await loadCampaigns();
        return;
      }

      // 4. Pre-flight simulation via staticCall to catch reverts before MetaMask opens
      try {
        await contract.contribute.staticCall(campaignId, { value: amountWei });
      } catch (simErr) {
        console.warn("Simulation failed:", simErr);
        const reason = parseContractError(simErr);
        setNotification({
          type: "error",
          message: `Contribution rejected: ${reason}`,
        });
        setActionPending(false);
        return;
      }

      // 5. Gas estimation with safety margin and safe fallback
      let gasLimit;
      try {
        const estimated = await contract.contribute.estimateGas(campaignId, { value: amountWei });
        gasLimit = (estimated * 130n) / 100n; // 30% safety buffer
      } catch (estErr) {
        console.warn("Gas estimation failed on node, using safe fallback limit:", estErr);
        gasLimit = 200000n; // standard safe fallback for native payable call
      }

      // 6. Broadcast transaction to MetaMask
      setNotification({
        type: "pending",
        message: `Please confirm contribution of ${amountInBot} BOT in MetaMask...`,
      });

      const tx = await contract.contribute(campaignId, {
        value: amountWei,
        gasLimit,
      });

      setNotification({
        type: "pending",
        message: "Transaction broadcast. Confirming on Bohr Testnet...",
        hash: tx.hash,
      });

      await tx.wait();

      setNotification({
        type: "success",
        message: `Successfully contributed ${amountInBot} BOT to Campaign #${campaignId}!`,
        hash: tx.hash,
      });

      await loadCampaigns();
      await loadUserBalance();
    } catch (err) {
      console.error("Contribution failed:", err);
      setNotification({
        type: "error",
        message: parseContractError(err),
      });
    } finally {
      setActionPending(false);
    }
  };

  // Action: Withdraw
  const handleWithdraw = async (campaignId) => {
    if (!account) {
      await handleConnect();
      return;
    }
    if (Number(chainId) !== BOHR_CHAIN_ID_DECIMAL) {
      await handleSwitchNetwork();
      return;
    }

    try {
      setActionPending(true);
      setNotification({
        type: "pending",
        message: `Verifying withdrawal eligibility for Campaign #${campaignId}...`,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VESTALI_CONTRACT_ADDRESS, VestaliABI, signer);

      // Pre-flight simulation
      try {
        await contract.withdrawFunds.staticCall(campaignId);
      } catch (simErr) {
        console.warn("Withdraw simulation failed:", simErr);
        setNotification({
          type: "error",
          message: `Withdrawal rejected: ${parseContractError(simErr)}`,
        });
        setActionPending(false);
        return;
      }

      setNotification({
        type: "pending",
        message: `Confirming withdrawal for Campaign #${campaignId} in MetaMask...`,
      });

      let gasLimit;
      try {
        const estimated = await contract.withdrawFunds.estimateGas(campaignId);
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 150000n;
      }

      const tx = await contract.withdrawFunds(campaignId, { gasLimit });

      setNotification({
        type: "pending",
        message: "Processing withdrawal on-chain...",
        hash: tx.hash,
      });

      await tx.wait();

      setNotification({
        type: "success",
        message: `Successfully withdrawn funds for Campaign #${campaignId}!`,
        hash: tx.hash,
      });

      await loadCampaigns();
      await loadUserBalance();
    } catch (err) {
      console.error("Withdrawal failed:", err);
      setNotification({
        type: "error",
        message: parseContractError(err),
      });
    } finally {
      setActionPending(false);
    }
  };

  // Action: Claim Refund
  const handleClaimRefund = async (campaignId) => {
    if (!account) {
      await handleConnect();
      return;
    }
    if (Number(chainId) !== BOHR_CHAIN_ID_DECIMAL) {
      await handleSwitchNetwork();
      return;
    }

    try {
      setActionPending(true);
      setNotification({
        type: "pending",
        message: `Verifying refund eligibility for Campaign #${campaignId}...`,
      });

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(VESTALI_CONTRACT_ADDRESS, VestaliABI, signer);

      // Pre-flight simulation
      try {
        await contract.claimRefund.staticCall(campaignId);
      } catch (simErr) {
        console.warn("Refund simulation failed:", simErr);
        setNotification({
          type: "error",
          message: `Refund rejected: ${parseContractError(simErr)}`,
        });
        setActionPending(false);
        return;
      }

      setNotification({
        type: "pending",
        message: `Confirming refund claim for Campaign #${campaignId} in MetaMask...`,
      });

      let gasLimit;
      try {
        const estimated = await contract.claimRefund.estimateGas(campaignId);
        gasLimit = (estimated * 130n) / 100n;
      } catch {
        gasLimit = 150000n;
      }

      const tx = await contract.claimRefund(campaignId, { gasLimit });

      setNotification({
        type: "pending",
        message: "Processing refund on Bohr Testnet...",
        hash: tx.hash,
      });

      await tx.wait();

      setNotification({
        type: "success",
        message: `Full refund for Campaign #${campaignId} returned to your wallet!`,
        hash: tx.hash,
      });

      await loadCampaigns();
      await loadUserBalance();
    } catch (err) {
      console.error("Refund failed:", err);
      setNotification({
        type: "error",
        message: parseErrorMessage(err),
      });
    } finally {
      setActionPending(false);
    }
  };

  // Filtering campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesTitle = c.title.toLowerCase().includes(q);
      const matchesDesc = c.description.toLowerCase().includes(q);
      if (!matchesTitle && !matchesDesc) return false;
    }

    // Status / User tab filter
    if (filter === "active") return c.status === 0;
    if (filter === "successful") return c.status === 1;
    if (filter === "failed") return c.status === 2;
    if (filter === "mine") {
      return account && c.creator.toLowerCase() === account.toLowerCase();
    }
    if (filter === "contributed") {
      return account && c.userContributionWei > 0n;
    }
    return true;
  });

  return (
    <div className="app-root">
      {/* Toast Notification */}
      <Notification
        notification={notification}
        onDismiss={() => setNotification(null)}
      />

      {/* Navbar */}
      <Navbar
        account={account}
        balance={balance}
        chainId={chainId}
        isConnecting={isConnecting}
        onConnect={handleConnect}
        onSwitchNetwork={handleSwitchNetwork}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Content */}
      <main className="main-content">
        <Hero
          campaigns={campaigns}
          onOpenCreateModal={() => setIsCreateModalOpen(true)}
          onConnect={handleConnect}
          account={account}
        />

        {/* Campaign Explorer Section */}
        <section className="explorer-section">
          <div className="explorer-header">
            <div>
              <h2 className="section-title">Explore Campaigns</h2>
              <p className="section-subtitle">
                Support meaningful causes and ground-breaking Web3 projects.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={loadCampaigns}
              disabled={isLoadingCampaigns}
            >
              {isLoadingCampaigns ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>

          {/* Filter & Search Bar */}
          <div className="filter-bar">
            <div className="filter-tabs">
              <button
                type="button"
                className={`tab-btn ${filter === "all" ? "tab-active" : ""}`}
                onClick={() => setFilter("all")}
              >
                All ({campaigns.length})
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === "active" ? "tab-active" : ""}`}
                onClick={() => setFilter("active")}
              >
                Active ({campaigns.filter((c) => c.status === 0).length})
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === "successful" ? "tab-active" : ""}`}
                onClick={() => setFilter("successful")}
              >
                Successful ({campaigns.filter((c) => c.status === 1).length})
              </button>
              <button
                type="button"
                className={`tab-btn ${filter === "failed" ? "tab-active" : ""}`}
                onClick={() => setFilter("failed")}
              >
                Failed ({campaigns.filter((c) => c.status === 2).length})
              </button>
              {account && (
                <>
                  <button
                    type="button"
                    className={`tab-btn ${filter === "mine" ? "tab-active" : ""}`}
                    onClick={() => setFilter("mine")}
                  >
                    Created by Me
                  </button>
                  <button
                    type="button"
                    className={`tab-btn ${filter === "contributed" ? "tab-active" : ""}`}
                    onClick={() => setFilter("contributed")}
                  >
                    My Contributions
                  </button>
                </>
              )}
            </div>

            <div className="search-wrap">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear"
                  onClick={() => setSearchQuery("")}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Campaign List / Loading / Empty */}
          {isLoadingCampaigns && campaigns.length === 0 ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Fetching campaigns from Bohr Testnet...</p>
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🌱</div>
              <h3>No campaigns found</h3>
              <p>
                {searchQuery || filter !== "all"
                  ? "Try clearing your search query or switching filters."
                  : "Be the first creator to launch a crowdfunding campaign on Bohr Testnet!"}
              </p>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => setIsCreateModalOpen(true)}
              >
                + Create First Campaign
              </button>
            </div>
          ) : (
            <div className="campaigns-grid">
              {filteredCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  account={account}
                  chainId={chainId}
                  onContribute={handleContribute}
                  onWithdraw={handleWithdraw}
                  onClaimRefund={handleClaimRefund}
                  onConnect={handleConnect}
                  onSwitchNetwork={handleSwitchNetwork}
                  isPending={actionPending}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Modal: Create Campaign */}
      <CreateCampaignModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateCampaign}
        isPending={actionPending}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
