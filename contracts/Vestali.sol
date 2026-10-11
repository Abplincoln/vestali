// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title Vestali
 * @notice Simple crowdfunding platform on BOT Chain Bohr Testnet.
 * Tagline: Good ideas grow together.
 */
contract Vestali is ReentrancyGuard {
    enum CampaignStatus {
        Active,
        Successful,
        Failed
    }

    struct Campaign {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;
        uint256 deadline;
        uint256 totalRaised;
        bool claimed;
    }

    uint256 public campaignCount;
    mapping(uint256 => Campaign) public campaigns;
    mapping(uint256 => mapping(address => uint256)) public contributions;

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        string description,
        uint256 goal,
        uint256 deadline
    );

    event ContributionReceived(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    event FundsWithdrawn(
        uint256 indexed campaignId,
        address indexed creator,
        uint256 amount
    );

    event RefundClaimed(
        uint256 indexed campaignId,
        address indexed contributor,
        uint256 amount
    );

    /**
     * @notice Creates a new crowdfunding campaign.
     * @param _title Title of the campaign.
     * @param _description Detailed description of the campaign.
     * @param _goal Funding goal in wei (native BOT).
     * @param _deadline Unix timestamp in seconds when the campaign ends.
     * @return campaignId The unique ID of the created campaign.
     */
    function createCampaign(
        string memory _title,
        string memory _description,
        uint256 _goal,
        uint256 _deadline
    ) external returns (uint256) {
        require(bytes(_title).length > 0, "Title cannot be empty");
        require(bytes(_description).length > 0, "Description cannot be empty");
        require(_goal > 0, "Goal must be greater than zero");
        require(_deadline > block.timestamp, "Deadline must be in the future");

        campaignCount++;
        uint256 campaignId = campaignCount;

        campaigns[campaignId] = Campaign({
            id: campaignId,
            creator: msg.sender,
            title: _title,
            description: _description,
            goal: _goal,
            deadline: _deadline,
            totalRaised: 0,
            claimed: false
        });

        emit CampaignCreated(
            campaignId,
            msg.sender,
            _title,
            _description,
            _goal,
            _deadline
        );

        return campaignId;
    }

    /**
     * @notice Contribute native BOT to a campaign.
     * @param _campaignId The ID of the campaign to contribute to.
     */
    function contribute(uint256 _campaignId) external payable nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(msg.value > 0, "Contribution must be greater than zero");
        require(block.timestamp <= campaign.deadline, "Campaign deadline has passed");
        require(campaign.totalRaised < campaign.goal, "Funding goal already reached");
        require(
            campaign.totalRaised + msg.value <= campaign.goal,
            "Contribution exceeds remaining goal"
        );

        campaign.totalRaised += msg.value;
        contributions[_campaignId][msg.sender] += msg.value;

        emit ContributionReceived(_campaignId, msg.sender, msg.value);
    }

    /**
     * @notice Allows campaign creator to withdraw funds once the goal is reached.
     * @param _campaignId The ID of the campaign.
     */
    function withdrawFunds(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(msg.sender == campaign.creator, "Only creator can withdraw");
        require(campaign.totalRaised >= campaign.goal, "Funding goal not reached");
        require(!campaign.claimed, "Funds already withdrawn");

        // Checks-Effects-Interactions: state updated before transfer
        campaign.claimed = true;
        uint256 amount = campaign.totalRaised;

        (bool success, ) = payable(campaign.creator).call{value: amount}("");
        require(success, "Withdrawal transfer failed");

        emit FundsWithdrawn(_campaignId, campaign.creator, amount);
    }

    /**
     * @notice Allows contributors to claim a refund if the campaign failed.
     * @param _campaignId The ID of the campaign.
     */
    function claimRefund(uint256 _campaignId) external nonReentrant {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        require(campaign.totalRaised < campaign.goal, "Cannot refund successful campaign");
        require(block.timestamp > campaign.deadline, "Campaign has not ended yet");

        uint256 contributedAmount = contributions[_campaignId][msg.sender];
        require(contributedAmount > 0, "No contribution to refund");

        // Checks-Effects-Interactions: state updated before transfer
        contributions[_campaignId][msg.sender] = 0;

        (bool success, ) = payable(msg.sender).call{value: contributedAmount}("");
        require(success, "Refund transfer failed");

        emit RefundClaimed(_campaignId, msg.sender, contributedAmount);
    }

    /**
     * @notice Returns the current computed status of a campaign.
     * @param _campaignId The ID of the campaign.
     */
    function getCampaignStatus(uint256 _campaignId) public view returns (CampaignStatus) {
        Campaign storage campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");

        if (campaign.totalRaised >= campaign.goal) {
            return CampaignStatus.Successful;
        } else if (block.timestamp <= campaign.deadline) {
            return CampaignStatus.Active;
        } else {
            return CampaignStatus.Failed;
        }
    }

    /**
     * @notice Returns the campaign details.
     * @param _campaignId The ID of the campaign.
     */
    function getCampaign(uint256 _campaignId)
        external
        view
        returns (Campaign memory)
    {
        Campaign memory campaign = campaigns[_campaignId];
        require(campaign.creator != address(0), "Campaign does not exist");
        return campaign;
    }
}
