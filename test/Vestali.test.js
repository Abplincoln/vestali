const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("Vestali Crowdfunding Contract", function () {
  let Vestali;
  let vestali;
  let owner;
  let creator;
  let contributor1;
  let contributor2;
  let attackerWallet;

  const ONE_DAY = 24 * 60 * 60;
  const GOAL = ethers.parseEther("5"); // 5 BOT

  beforeEach(async function () {
    [owner, creator, contributor1, contributor2, attackerWallet] =
      await ethers.getSigners();

    Vestali = await ethers.getContractFactory("Vestali");
    vestali = await Vestali.deploy();
    await vestali.waitForDeployment();
  });

  describe("1. Campaign Creation with Valid Details", function () {
    it("should create a campaign with valid details and emit CampaignCreated event", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;

      const tx = await vestali
        .connect(creator)
        .createCampaign("Solar Water Purifier", "Clean water using solar power", GOAL, deadline);

      await expect(tx)
        .to.emit(vestali, "CampaignCreated")
        .withArgs(1, creator.address, "Solar Water Purifier", "Clean water using solar power", GOAL, deadline);

      expect(await vestali.campaignCount()).to.equal(1);

      const campaign = await vestali.getCampaign(1);
      expect(campaign.id).to.equal(1);
      expect(campaign.creator).to.equal(creator.address);
      expect(campaign.title).to.equal("Solar Water Purifier");
      expect(campaign.description).to.equal("Clean water using solar power");
      expect(campaign.goal).to.equal(GOAL);
      expect(campaign.deadline).to.equal(deadline);
      expect(campaign.totalRaised).to.equal(0);
      expect(campaign.claimed).to.equal(false);

      // Status 0 corresponds to CampaignStatus.Active
      expect(await vestali.getCampaignStatus(1)).to.equal(0);
    });

    it("should assign sequential unique IDs to campaigns", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;

      await vestali.connect(creator).createCampaign("Campaign 1", "Desc 1", GOAL, deadline);
      await vestali.connect(contributor1).createCampaign("Campaign 2", "Desc 2", GOAL, deadline);

      expect(await vestali.campaignCount()).to.equal(2);
      const c1 = await vestali.getCampaign(1);
      const c2 = await vestali.getCampaign(2);
      expect(c1.id).to.equal(1);
      expect(c2.id).to.equal(2);
      expect(c1.creator).to.equal(creator.address);
      expect(c2.creator).to.equal(contributor1.address);
    });
  });

  describe("2. Rejection of Invalid Campaign Details", function () {
    it("should reject campaign creation with an empty title", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;

      await expect(
        vestali.connect(creator).createCampaign("", "Some Description", GOAL, deadline)
      ).to.be.revertedWith("Title cannot be empty");
    });

    it("should reject campaign creation with an empty description", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;

      await expect(
        vestali.connect(creator).createCampaign("Valid Title", "", GOAL, deadline)
      ).to.be.revertedWith("Description cannot be empty");
    });

    it("should reject campaign creation with zero funding goal", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;

      await expect(
        vestali.connect(creator).createCampaign("Valid Title", "Valid Description", 0, deadline)
      ).to.be.revertedWith("Goal must be greater than zero");
    });

    it("should reject campaign creation with a past or current deadline", async function () {
      const latestTime = await time.latest();

      await expect(
        vestali.connect(creator).createCampaign("Valid Title", "Valid Description", GOAL, latestTime)
      ).to.be.revertedWith("Deadline must be in the future");

      await expect(
        vestali.connect(creator).createCampaign("Valid Title", "Valid Description", GOAL, latestTime - 100)
      ).to.be.revertedWith("Deadline must be in the future");
    });
  });

  describe("3. Successful Contributions", function () {
    let campaignId;
    let deadline;

    beforeEach(async function () {
      const latestTime = await time.latest();
      deadline = latestTime + ONE_DAY;
      await vestali.connect(creator).createCampaign("Project Alpha", "Description", GOAL, deadline);
      campaignId = 1;
    });

    it("should accept contributions and update total raised and contributor accounting", async function () {
      const contributionAmount1 = ethers.parseEther("2");
      const contributionAmount2 = ethers.parseEther("1.5");

      await expect(
        vestali.connect(contributor1).contribute(campaignId, { value: contributionAmount1 })
      )
        .to.emit(vestali, "ContributionReceived")
        .withArgs(campaignId, contributor1.address, contributionAmount1);

      await expect(
        vestali.connect(contributor2).contribute(campaignId, { value: contributionAmount2 })
      )
        .to.emit(vestali, "ContributionReceived")
        .withArgs(campaignId, contributor2.address, contributionAmount2);

      const campaign = await vestali.getCampaign(campaignId);
      expect(campaign.totalRaised).to.equal(ethers.parseEther("3.5"));

      expect(await vestali.contributions(campaignId, contributor1.address)).to.equal(contributionAmount1);
      expect(await vestali.contributions(campaignId, contributor2.address)).to.equal(contributionAmount2);
    });

    it("should accumulate multiple contributions from the same contributor", async function () {
      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("1") });
      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("2") });

      expect(await vestali.contributions(campaignId, contributor1.address)).to.equal(ethers.parseEther("3"));
      const campaign = await vestali.getCampaign(campaignId);
      expect(campaign.totalRaised).to.equal(ethers.parseEther("3"));
    });
  });

  describe("4. Rejection of Zero-Value Contributions", function () {
    it("should reject contribution with zero value", async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Project Alpha", "Desc", GOAL, latestTime + ONE_DAY);

      await expect(
        vestali.connect(contributor1).contribute(1, { value: 0 })
      ).to.be.revertedWith("Contribution must be greater than zero");
    });
  });

  describe("5. Rejection of Contributions Exceeding Remaining Goal", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Project Alpha", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;
    });

    it("should reject contribution that exceeds initial funding goal", async function () {
      const excessiveAmount = ethers.parseEther("5.1");
      await expect(
        vestali.connect(contributor1).contribute(campaignId, { value: excessiveAmount })
      ).to.be.revertedWith("Contribution exceeds remaining goal");
    });

    it("should reject contribution that exceeds remaining unpaid goal", async function () {
      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("4") });

      // Only 1 BOT remaining; trying to send 1.1 BOT
      await expect(
        vestali.connect(contributor2).contribute(campaignId, { value: ethers.parseEther("1.1") })
      ).to.be.revertedWith("Contribution exceeds remaining goal");
    });

    it("should reject contributions once goal is exactly reached", async function () {
      await vestali.connect(contributor1).contribute(campaignId, { value: GOAL });

      // Goal is reached; status is now Successful (1)
      expect(await vestali.getCampaignStatus(campaignId)).to.equal(1);

      await expect(
        vestali.connect(contributor2).contribute(campaignId, { value: ethers.parseEther("0.1") })
      ).to.be.revertedWith("Funding goal already reached");
    });
  });

  describe("6. Rejection of Contributions After Deadline", function () {
    it("should reject contributions once deadline has passed", async function () {
      const latestTime = await time.latest();
      const deadline = latestTime + ONE_DAY;
      await vestali.connect(creator).createCampaign("Project Alpha", "Desc", GOAL, deadline);

      // Fast forward past deadline
      await time.increase(ONE_DAY + 1);

      await expect(
        vestali.connect(contributor1).contribute(1, { value: ethers.parseEther("1") })
      ).to.be.revertedWith("Campaign deadline has passed");
    });
  });

  describe("7. Successful Withdrawal by Creator", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Solar Project", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;

      // Fully fund the campaign
      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("3") });
      await vestali.connect(contributor2).contribute(campaignId, { value: ethers.parseEther("2") });
    });

    it("should allow creator to withdraw funds and emit FundsWithdrawn", async function () {
      const balanceBefore = await ethers.provider.getBalance(creator.address);

      const tx = await vestali.connect(creator).withdrawFunds(campaignId);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(vestali, "FundsWithdrawn")
        .withArgs(campaignId, creator.address, GOAL);

      const balanceAfter = await ethers.provider.getBalance(creator.address);
      expect(balanceAfter).to.equal(balanceBefore + GOAL - gasSpent);

      const campaign = await vestali.getCampaign(campaignId);
      expect(campaign.claimed).to.equal(true);
      expect(await ethers.provider.getBalance(await vestali.getAddress())).to.equal(0);
    });

    it("should reject double withdrawal by creator", async function () {
      await vestali.connect(creator).withdrawFunds(campaignId);

      await expect(
        vestali.connect(creator).withdrawFunds(campaignId)
      ).to.be.revertedWith("Funds already withdrawn");
    });
  });

  describe("8. Rejection of Withdrawals by Non-Creators and Premature Withdrawals", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Solar Project", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;
    });

    it("should reject withdrawal if funding goal is not reached", async function () {
      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("2") });

      await expect(
        vestali.connect(creator).withdrawFunds(campaignId)
      ).to.be.revertedWith("Funding goal not reached");
    });

    it("should reject withdrawal attempted by a non-creator", async function () {
      await vestali.connect(contributor1).contribute(campaignId, { value: GOAL });

      await expect(
        vestali.connect(contributor1).withdrawFunds(campaignId)
      ).to.be.revertedWith("Only creator can withdraw");

      await expect(
        vestali.connect(owner).withdrawFunds(campaignId)
      ).to.be.revertedWith("Only creator can withdraw");
    });
  });

  describe("9. Refunds for Failed Campaigns", function () {
    let campaignId;
    const contributionAmount = ethers.parseEther("2");

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Unfunded Project", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;

      // Partially fund campaign
      await vestali.connect(contributor1).contribute(campaignId, { value: contributionAmount });
    });

    it("should allow contributor to claim refund after deadline passes and emit RefundClaimed", async function () {
      // Advance time past deadline
      await time.increase(ONE_DAY + 1);

      // Status should now be Failed (2)
      expect(await vestali.getCampaignStatus(campaignId)).to.equal(2);

      const balanceBefore = await ethers.provider.getBalance(contributor1.address);
      const tx = await vestali.connect(contributor1).claimRefund(campaignId);
      const receipt = await tx.wait();
      const gasSpent = receipt.gasUsed * receipt.gasPrice;

      await expect(tx)
        .to.emit(vestali, "RefundClaimed")
        .withArgs(campaignId, contributor1.address, contributionAmount);

      const balanceAfter = await ethers.provider.getBalance(contributor1.address);
      expect(balanceAfter).to.equal(balanceBefore + contributionAmount - gasSpent);

      // Contributor accounting should be reset to 0
      expect(await vestali.contributions(campaignId, contributor1.address)).to.equal(0);
    });

    it("should reject refund if campaign has not ended yet", async function () {
      await expect(
        vestali.connect(contributor1).claimRefund(campaignId)
      ).to.be.revertedWith("Campaign has not ended yet");
    });
  });

  describe("10. Rejection of Duplicate Refunds and Non-Contributors", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Unfunded Project", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;

      await vestali.connect(contributor1).contribute(campaignId, { value: ethers.parseEther("2") });
      await time.increase(ONE_DAY + 1);
    });

    it("should reject duplicate refund claims", async function () {
      await vestali.connect(contributor1).claimRefund(campaignId);

      await expect(
        vestali.connect(contributor1).claimRefund(campaignId)
      ).to.be.revertedWith("No contribution to refund");
    });

    it("should reject refund claim from a wallet that did not contribute", async function () {
      await expect(
        vestali.connect(contributor2).claimRefund(campaignId)
      ).to.be.revertedWith("No contribution to refund");
    });
  });

  describe("11. Rejection of Refunds for Successful Campaigns", function () {
    let campaignId;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Successful Project", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;

      // Fully fund
      await vestali.connect(contributor1).contribute(campaignId, { value: GOAL });
    });

    it("should reject refunds even after deadline if campaign reached goal", async function () {
      await time.increase(ONE_DAY + 1);

      await expect(
        vestali.connect(contributor1).claimRefund(campaignId)
      ).to.be.revertedWith("Cannot refund successful campaign");
    });
  });

  describe("12. Protection Against Reentrancy", function () {
    let campaignId;
    let attackerContract;

    beforeEach(async function () {
      const latestTime = await time.latest();
      await vestali.connect(creator).createCampaign("Attacked Campaign", "Desc", GOAL, latestTime + ONE_DAY);
      campaignId = 1;

      const AttackerFactory = await ethers.getContractFactory("ReentrancyAttacker");
      attackerContract = await AttackerFactory.connect(attackerWallet).deploy(
        await vestali.getAddress()
      );
      await attackerContract.waitForDeployment();

      // Attacker contributes 1 BOT
      await attackerContract
        .connect(attackerWallet)
        .contributeTo(campaignId, { value: ethers.parseEther("1") });

      // Honest contributor contributes 1 BOT
      await vestali
        .connect(contributor1)
        .contribute(campaignId, { value: ethers.parseEther("1") });
    });

    it("should prevent reentrant refund attempts via ReentrancyGuard and CEI", async function () {
      // Campaign raised 2 BOT out of 5 BOT. Move past deadline so it fails.
      await time.increase(ONE_DAY + 1);

      // The attacker attempts to re-enter claimRefund from its receive() function.
      // With ReentrancyGuard, the nested call fails or the whole transaction reverts.
      await expect(
        attackerContract.connect(attackerWallet).attackRefund(campaignId)
      ).to.be.reverted;

      // Honest contributor's funds are safe and can still be refunded
      expect(await vestali.contributions(campaignId, contributor1.address)).to.equal(
        ethers.parseEther("1")
      );
    });
  });
});
