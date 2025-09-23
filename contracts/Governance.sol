// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./DemCoin.sol";
import "./WisdomCoin.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title Governance
 * @dev The central nervous system of the DemCoin Protocol. This contract orchestrates
 * the Proof of Democratic Work process, manages rewards, and interfaces with the Wisdom Bank.
 * It is the owner of both the DemCoin and WisdomCoin contracts.
 */
contract Governance is Ownable {

    // --- State Variables ---

    DemCoin public demCoin;
    WisdomCoin public wisdomCoin;

    // A simple structure to hold information about a civic proposal
    struct Proposal {
        uint256 id;
        string description;
        bool isOpen;
        uint256 deadline;
        address creator;
        uint256 contributionCount;
    }

    // A mapping to store all proposals
    mapping(uint256 => Proposal) public proposals;
    uint256 public nextProposalId;

    // Track contributions: proposalId => citizen => hasContributed
    mapping(uint256 => mapping(address => bool)) public hasContributed;
    
    // Track all contributors for a proposal: proposalId => array of contributors
    mapping(uint256 => address[]) public proposalContributors;
    
    // Wisdom Bank staking: citizen => staked amount
    mapping(address => uint256) public stakedBalance;
    uint256 public totalStaked;

    // --- Events ---
    event ProposalCreated(uint256 indexed proposalId, string description, address indexed creator);
    event ContributionSubmitted(uint256 indexed proposalId, address indexed citizen, string contributionHash);
    event RewardsDistributed(uint256 indexed proposalId, uint256 totalDemCoinsDistributed, uint256 wisdomCoinsAwarded);
    event ProposalClosed(uint256 indexed proposalId);
    event FundsStaked(address indexed citizen, uint256 amount);
    event FundsUnstaked(address indexed citizen, uint256 amount);

    // --- Constructor ---

    /**
     * @dev The constructor sets the addresses of the token contracts.
     * These are immutable and set only once at deployment.
     */
    constructor(address _demCoinAddress, address _wisdomCoinAddress) {
        demCoin = DemCoin(_demCoinAddress);
        wisdomCoin = WisdomCoin(_wisdomCoinAddress);
    }

    // --- Core Governance Functions ---

    /**
     * @dev Allows any citizen to create a new proposal for deliberation.
     */
    function createProposal(string memory _description) public {
        require(bytes(_description).length > 0, "Governance: description cannot be empty");
        require(bytes(_description).length <= 1000, "Governance: description too long");
        
        nextProposalId++;
        uint256 newProposalId = nextProposalId;
        
        proposals[newProposalId] = Proposal({
            id: newProposalId,
            description: _description,
            isOpen: true,
            deadline: block.timestamp + 7 days, // 7-day deliberation period
            creator: msg.sender,
            contributionCount: 0
        });
        
        emit ProposalCreated(newProposalId, _description, msg.sender);
    }

    /**
     * @dev Allows a citizen to submit a contribution to an open proposal.
     * In a real implementation, the contribution content would be stored off-chain (e.g., on IPFS)
     * and its hash would be recorded here.
     */
    function submitContribution(uint256 _proposalId, string memory _contributionHash) public {
        require(_proposalId > 0 && _proposalId <= nextProposalId, "Governance: invalid proposal ID");
        require(proposals[_proposalId].isOpen, "Governance: proposal is closed");
        require(block.timestamp < proposals[_proposalId].deadline, "Governance: proposal deadline has passed");
        require(!hasContributed[_proposalId][msg.sender], "Governance: citizen has already contributed");
        require(bytes(_contributionHash).length > 0, "Governance: contribution hash cannot be empty");
        
        // Record the contribution
        hasContributed[_proposalId][msg.sender] = true;
        proposalContributors[_proposalId].push(msg.sender);
        proposals[_proposalId].contributionCount++;
        
        emit ContributionSubmitted(_proposalId, msg.sender, _contributionHash);
    }

    /**
     * @dev This is the crucial function where the CAI's assessment is brought on-chain.
     * Can only be called by a trusted "Oracle" or the contract owner.
     * It will distribute DemCoin and WisdomCoin rewards based on the quality of contributions.
     */
    function distributeRewards(
        uint256 _proposalId,
        address[] memory _citizens,
        uint256[] memory _demCoinRewards,
        address[] memory _wisdomContributors
    ) public onlyOwner {
        require(_proposalId > 0 && _proposalId <= nextProposalId, "Governance: invalid proposal ID");
        require(proposals[_proposalId].isOpen, "Governance: proposal already closed");
        require(_citizens.length == _demCoinRewards.length, "Governance: arrays length mismatch");
        require(_citizens.length > 0, "Governance: no citizens to reward");
        
        uint256 totalDemCoinsDistributed = 0;
        uint256 wisdomCoinsAwarded = 0;

        // Distribute DemCoin rewards
        for (uint256 i = 0; i < _citizens.length; i++) {
            require(_citizens[i] != address(0), "Governance: invalid citizen address");
            require(_demCoinRewards[i] > 0, "Governance: reward must be greater than 0");
            require(hasContributed[_proposalId][_citizens[i]], "Governance: citizen did not contribute");
            
            demCoin.mint(_citizens[i], _demCoinRewards[i]);
            totalDemCoinsDistributed += _demCoinRewards[i];
        }

        // Award WisdomCoins to high-quality contributors
        for (uint256 j = 0; j < _wisdomContributors.length; j++) {
            require(_wisdomContributors[j] != address(0), "Governance: invalid wisdom contributor address");
            require(hasContributed[_proposalId][_wisdomContributors[j]], "Governance: wisdom contributor did not contribute");
            
            // Only award if citizen doesn't already have a WisdomCoin
            if (!wisdomCoin.hasWisdomCoin(_wisdomContributors[j])) {
                wisdomCoin.awardWisdomCoin(_wisdomContributors[j]);
                wisdomCoinsAwarded++;
            }
        }

        // Close the proposal
        proposals[_proposalId].isOpen = false;
        
        emit RewardsDistributed(_proposalId, totalDemCoinsDistributed, wisdomCoinsAwarded);
        emit ProposalClosed(_proposalId);
    }

    /**
     * @dev Manually close a proposal (e.g., if no quality contributions received)
     */
    function closeProposal(uint256 _proposalId) public onlyOwner {
        require(_proposalId > 0 && _proposalId <= nextProposalId, "Governance: invalid proposal ID");
        require(proposals[_proposalId].isOpen, "Governance: proposal already closed");
        
        proposals[_proposalId].isOpen = false;
        emit ProposalClosed(_proposalId);
    }

    // --- Wisdom Bank Integration (Future Skeleton) ---

    /**
     * @dev Allows citizens to stake DemCoins in the Wisdom Bank.
     */
    function stakeInWisdomBank(uint256 amount) public {
        require(amount > 0, "Governance: stake amount must be greater than 0");
        require(demCoin.balanceOf(msg.sender) >= amount, "Governance: insufficient DemCoin balance");
        
        // Transfer DemCoins from user to this contract
        demCoin.transferFrom(msg.sender, address(this), amount);
        
        // Update staking records
        stakedBalance[msg.sender] += amount;
        totalStaked += amount;
        
        emit FundsStaked(msg.sender, amount);
    }

    /**
     * @dev Allows citizens to unstake their DemCoins from the Wisdom Bank.
     */
    function unstakeFromWisdomBank(uint256 amount) public {
        require(amount > 0, "Governance: unstake amount must be greater than 0");
        require(stakedBalance[msg.sender] >= amount, "Governance: insufficient staked balance");
        
        // Update staking records
        stakedBalance[msg.sender] -= amount;
        totalStaked -= amount;
        
        // Transfer DemCoins back to user
        demCoin.transfer(msg.sender, amount);
        
        emit FundsUnstaked(msg.sender, amount);
    }

    // --- View Functions ---

    /**
     * @dev Get the list of contributors for a specific proposal
     */
    function getProposalContributors(uint256 _proposalId) public view returns (address[] memory) {
        require(_proposalId > 0 && _proposalId <= nextProposalId, "Governance: invalid proposal ID");
        return proposalContributors[_proposalId];
    }

    /**
     * @dev Check if a citizen has contributed to a specific proposal
     */
    function checkHasContributed(uint256 _proposalId, address _citizen) public view returns (bool) {
        return hasContributed[_proposalId][_citizen];
    }

    /**
     * @dev Get proposal details
     */
    function getProposal(uint256 _proposalId) public view returns (
        uint256 id,
        string memory description,
        bool isOpen,
        uint256 deadline,
        address creator,
        uint256 contributionCount
    ) {
        require(_proposalId > 0 && _proposalId <= nextProposalId, "Governance: invalid proposal ID");
        Proposal memory proposal = proposals[_proposalId];
        return (
            proposal.id,
            proposal.description,
            proposal.isOpen,
            proposal.deadline,
            proposal.creator,
            proposal.contributionCount
        );
    }

    // --- Emergency Functions ---

    /**
     * @dev Emergency function to recover ERC20 tokens sent to contract by mistake
     */
    function recoverTokens(address tokenAddress, uint256 amount) public onlyOwner {
        require(tokenAddress != address(demCoin), "Governance: cannot recover DemCoin");
        IERC20(tokenAddress).transfer(owner(), amount);
    }
}
