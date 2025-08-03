// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ICDIOracle.sol";

/**
 * @title RendexToken
 * @dev Rebasing ERC-20 token that simulates yield based on CDI rates
 * 
 * Features:
 * - Daily rebases based on CDI rate (120% of CDI)
 * - Oracle-fed CDI values
 * - Admin-controlled rebase function
 * - Pausable for emergency situations
 * 
 * CDI (Certificado de Depósito Interbancário) is a Brazilian benchmark
 * interest rate used in fixed-income financial products.
 */
contract RendexToken is ERC20, Ownable, ReentrancyGuard, Pausable {
    
    // CDI Oracle interface
    ICDIOracle public cdiOracle;
    
    // Rebase tracking
    uint256 public lastRebaseTime;
    uint256 public rebaseCount;
    uint256 public constant REBASE_INTERVAL = 1 days;
    uint256 public constant CDI_MULTIPLIER = 120; // 120% of CDI
    uint256 public constant MULTIPLIER_DENOMINATOR = 100;
    
    // Rebase state
    uint256 public totalShares;
    uint256 public sharesPerToken;
    uint256 public constant INITIAL_SHARES_PER_TOKEN = 1e18;
    
    // Events
    event RebaseExecuted(
        uint256 indexed rebaseCount,
        uint256 cdiRate,
        uint256 rebaseRate,
        uint256 newSharesPerToken,
        uint256 timestamp
    );
    
    event CDIOracleUpdated(address indexed oldOracle, address indexed newOracle);
    
    // Modifiers
    modifier onlyRebaser() {
        require(msg.sender == owner() || msg.sender == address(cdiOracle), "RendexToken: caller is not the rebaser");
        _;
    }
    
    modifier rebaseReady() {
        require(block.timestamp >= lastRebaseTime + REBASE_INTERVAL, "RendexToken: rebase not ready");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _name Token name
     * @param _symbol Token symbol
     * @param _cdiOracle Address of CDI oracle
     * @param _initialSupply Initial token supply
     * @param initialOwner The initial owner address
     */
    constructor(
        string memory _name,
        string memory _symbol,
        address _cdiOracle,
        uint256 _initialSupply,
        address initialOwner
    ) ERC20(_name, _symbol) Ownable(initialOwner) {
        require(_cdiOracle != address(0), "RendexToken: invalid oracle address");
        cdiOracle = ICDIOracle(_cdiOracle);
        lastRebaseTime = block.timestamp;
        sharesPerToken = INITIAL_SHARES_PER_TOKEN;
        if (_initialSupply > 0) {
            _mint(initialOwner, _initialSupply);
        }
    }
    
    /**
     * @dev Get current CDI rate from oracle
     * @return Current CDI rate (in basis points, e.g., 1000 = 10%)
     */
    function getCurrentCDI() public view returns (uint256) {
        return cdiOracle.getCDI();
    }
    
    /**
     * @dev Calculate rebase rate based on CDI
     * @return rebaseRate in basis points (e.g., 1200 = 12% for 120% of 10% CDI)
     */
    function calculateRebaseRate() public view returns (uint256) {
        uint256 cdiRate = getCurrentCDI();
        return (cdiRate * CDI_MULTIPLIER) / MULTIPLIER_DENOMINATOR;
    }
    
    /**
     * @dev Execute daily rebase
     * Can be called by owner or oracle
     */
    function rebase() external onlyRebaser rebaseReady nonReentrant {
        uint256 cdiRate = getCurrentCDI();
        uint256 rebaseRate = calculateRebaseRate();
        
        // Calculate new shares per token
        // Formula: new_shares = old_shares * (1 + rebase_rate)
        uint256 newSharesPerToken = sharesPerToken + 
            (sharesPerToken * rebaseRate) / 10000;
        
        sharesPerToken = newSharesPerToken;
        lastRebaseTime = block.timestamp;
        rebaseCount++;
        
        emit RebaseExecuted(
            rebaseCount,
            cdiRate,
            rebaseRate,
            newSharesPerToken,
            block.timestamp
        );
    }
    
    /**
     * @dev Override balanceOf to account for rebasing
     */
    function balanceOf(address account) public view override returns (uint256) {
        uint256 shares = super.balanceOf(account);
        return (shares * sharesPerToken) / INITIAL_SHARES_PER_TOKEN;
    }
    
    /**
     * @dev Override totalSupply to account for rebasing
     */
    function totalSupply() public view override returns (uint256) {
        uint256 shares = super.totalSupply();
        return (shares * sharesPerToken) / INITIAL_SHARES_PER_TOKEN;
    }
    
    /**
     * @dev Get shares for a given token amount
     */
    function sharesOf(address account) public view returns (uint256) {
        return super.balanceOf(account);
    }
    
    /**
     * @dev Get tokens for a given share amount
     */
    function tokensForShares(uint256 shares) public view returns (uint256) {
        return (shares * sharesPerToken) / INITIAL_SHARES_PER_TOKEN;
    }
    
    /**
     * @dev Get shares for a given token amount
     */
    function sharesForTokens(uint256 tokens) public view returns (uint256) {
        return (tokens * INITIAL_SHARES_PER_TOKEN) / sharesPerToken;
    }
    
    /**
     * @dev Update CDI oracle address
     */
    function updateCDIOracle(address _newOracle) external onlyOwner {
        require(_newOracle != address(0), "RendexToken: invalid oracle address");
        address oldOracle = address(cdiOracle);
        cdiOracle = ICDIOracle(_newOracle);
        emit CDIOracleUpdated(oldOracle, _newOracle);
    }
    
    /**
     * @dev Pause token transfers (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause token transfers
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // Replace _beforeTokenTransfer with _update for OpenZeppelin v5
    function _update(address from, address to, uint256 value) internal override whenNotPaused {
        super._update(from, to, value);
    }
    
    /**
     * @dev Get next rebase time
     */
    function getNextRebaseTime() public view returns (uint256) {
        return lastRebaseTime + REBASE_INTERVAL;
    }
    
    /**
     * @dev Check if rebase is ready
     */
    function isRebaseReady() public view returns (bool) {
        return block.timestamp >= lastRebaseTime + REBASE_INTERVAL;
    }
    
    /**
     * @dev Get rebase statistics
     */
    function getRebaseStats() external view returns (
        uint256 _lastRebaseTime,
        uint256 _nextRebaseTime,
        uint256 _rebaseCount,
        uint256 _currentCDI,
        uint256 _rebaseRate,
        bool _isReady
    ) {
        return (
            lastRebaseTime,
            getNextRebaseTime(),
            rebaseCount,
            getCurrentCDI(),
            calculateRebaseRate(),
            isRebaseReady()
        );
    }
} 