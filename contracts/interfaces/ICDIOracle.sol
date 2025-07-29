// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/**
 * @title ICDIOracle
 * @dev Interface for CDI (Certificado de Depósito Interbancário) Oracle
 * 
 * CDI is a Brazilian benchmark interest rate used in fixed-income
 * financial products. This oracle provides the current CDI rate.
 */
interface ICDIOracle {
    
    /**
     * @dev Get the current CDI rate
     * @return cdiRate Current CDI rate in basis points (e.g., 1000 = 10%)
     */
    function getCDI() external view returns (uint256);
    
    /**
     * @dev Get the last update time of CDI rate
     * @return timestamp Last update timestamp
     */
    function getLastUpdateTime() external view returns (uint256);
    
    /**
     * @dev Get CDI rate with additional metadata
     * @return cdiRate Current CDI rate in basis points
     * @return lastUpdate Last update timestamp
     * @return isValid Whether the rate is valid (not stale)
     */
    function getCDIWithMetadata() external view returns (
        uint256 cdiRate,
        uint256 lastUpdate,
        bool isValid
    );
    
    /**
     * @dev Check if the oracle is functioning properly
     * @return isHealthy Whether the oracle is healthy
     */
    function isHealthy() external view returns (bool);
} 