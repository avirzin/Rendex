// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "./interfaces/ICDIOracle.sol";

/**
 * @title CDIOracle
 * @dev Oracle implementation for CDI (Certificado de Depósito Interbancário) rates
 * 
 * This oracle stores CDI rates and provides them to the RendexToken contract.
 * Rates are updated by authorized updaters (admin or automated systems).
 */
contract CDIOracle is ICDIOracle, Ownable, Pausable {
    
    // CDI rate data
    uint256 public currentCDI;
    uint256 public lastUpdateTime;
    
    // Configuration
    uint256 public constant MAX_CDI_RATE = 5000; // 50% max rate
    uint256 public constant MIN_CDI_RATE = 0;    // 0% min rate
    uint256 public constant STALE_THRESHOLD = 7 days; // 7 days max staleness
    
    // Authorized updaters
    mapping(address => bool) public authorizedUpdaters;
    
    // Events
    event CDIUpdated(
        uint256 indexed oldRate,
        uint256 indexed newRate,
        uint256 timestamp,
        address indexed updater
    );
    
    event UpdaterAuthorized(address indexed updater, bool authorized);
    
    // Modifiers
    modifier onlyAuthorizedUpdater() {
        require(
            msg.sender == owner() || authorizedUpdaters[msg.sender],
            "CDIOracle: caller is not authorized updater"
        );
        _;
    }
    
    modifier validCDIRate(uint256 _rate) {
        require(_rate >= MIN_CDI_RATE && _rate <= MAX_CDI_RATE, "CDIOracle: invalid CDI rate");
        _;
    }
    
    /**
     * @dev Constructor
     * @param _initialCDI Initial CDI rate in basis points (e.g., 1000 = 10%)
     * @param initialOwner The initial owner address
     */
    constructor(uint256 _initialCDI, address initialOwner) Ownable(initialOwner) validCDIRate(_initialCDI) {
        currentCDI = _initialCDI;
        lastUpdateTime = block.timestamp;
    }
    
    /**
     * @dev Get the current CDI rate
     * @return Current CDI rate in basis points
     */
    function getCDI() external view override returns (uint256) {
        return currentCDI;
    }
    
    /**
     * @dev Get the last update time
     * @return Last update timestamp
     */
    function getLastUpdateTime() external view override returns (uint256) {
        return lastUpdateTime;
    }
    
    /**
     * @dev Get CDI rate with metadata
     * @return cdiRate Current CDI rate
     * @return lastUpdate Last update timestamp
     * @return isValid Whether the rate is valid (not stale)
     */
    function getCDIWithMetadata() external view override returns (
        uint256 cdiRate,
        uint256 lastUpdate,
        bool isValid
    ) {
        cdiRate = currentCDI;
        lastUpdate = lastUpdateTime;
        isValid = !isStale();
    }
    
    /**
     * @dev Check if the oracle is healthy
     * @return Whether the oracle is functioning properly
     */
    function isHealthy() external view override returns (bool) {
        return !paused() && !isStale();
    }
    
    /**
     * @dev Update CDI rate
     * @param _newCDI New CDI rate in basis points
     */
    function updateCDI(uint256 _newCDI) external onlyAuthorizedUpdater validCDIRate(_newCDI) {
        uint256 oldCDI = currentCDI;
        currentCDI = _newCDI;
        lastUpdateTime = block.timestamp;
        
        emit CDIUpdated(oldCDI, _newCDI, block.timestamp, msg.sender);
    }
    
    /**
     * @dev Authorize or revoke updater permissions
     * @param _updater Address to authorize/revoke
     * @param _authorized Whether to authorize or revoke
     */
    function setAuthorizedUpdater(address _updater, bool _authorized) external onlyOwner {
        require(_updater != address(0), "CDIOracle: invalid updater address");
        authorizedUpdaters[_updater] = _authorized;
        emit UpdaterAuthorized(_updater, _authorized);
    }
    
    /**
     * @dev Check if CDI rate is stale
     * @return Whether the rate is stale (older than threshold)
     */
    function isStale() public view returns (bool) {
        return block.timestamp > lastUpdateTime + STALE_THRESHOLD;
    }
    
    /**
     * @dev Get time until rate becomes stale
     * @return Seconds until rate becomes stale (0 if already stale)
     */
    function getTimeUntilStale() external view returns (uint256) {
        if (isStale()) {
            return 0;
        }
        return lastUpdateTime + STALE_THRESHOLD - block.timestamp;
    }
    
    /**
     * @dev Pause oracle (emergency only)
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause oracle
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    /**
     * @dev Get oracle statistics
     * @return _currentCDI Current CDI rate
     * @return _lastUpdate Last update time
     * @return _isStale Whether rate is stale
     * @return _isPaused Whether oracle is paused
     * @return _timeUntilStale Time until stale (0 if already stale)
     */
    function getOracleStats() external view returns (
        uint256 _currentCDI,
        uint256 _lastUpdate,
        bool _isStale,
        bool _isPaused,
        uint256 _timeUntilStale
    ) {
        _currentCDI = currentCDI;
        _lastUpdate = lastUpdateTime;
        _isStale = isStale();
        _isPaused = paused();
        _timeUntilStale = this.getTimeUntilStale();
    }
    
    /**
     * @dev Emergency function to update CDI if oracle is stale
     * Only callable by owner
     */
    function emergencyUpdateCDI(uint256 _newCDI) external onlyOwner validCDIRate(_newCDI) {
        require(isStale(), "CDIOracle: rate not stale, use regular update");
        
        uint256 oldCDI = currentCDI;
        currentCDI = _newCDI;
        lastUpdateTime = block.timestamp;
        
        emit CDIUpdated(oldCDI, _newCDI, block.timestamp, msg.sender);
    }
} 