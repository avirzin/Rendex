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
     * @return cdiRate Current CDI rate in parts per million (ppm)
     */
    function getCDI() external view returns (uint256);
    
    /**
     * @dev Get the last update time of CDI rate
     * @return timestamp Last update timestamp
     */
    function getLastUpdateTime() external view returns (uint256);
    
    /**
     * @dev Get CDI rate with additional metadata
     * @return cdiRate Current CDI rate in parts per million (ppm)
     * @return lastUpdate Last update timestamp
     * @return isValid Whether the rate is valid (not stale)
     */
    function getCDIWithMetadata() external view returns (
        uint256 cdiRate,
        uint256 lastUpdate,
        bool isValid
    );

    /**
     * @dev Get CDI rate as percentage (for human readability)
     * @return CDI rate as percentage with 4 decimal places
     */
    function getCDIAsPercentage() external view returns (uint256);

    /**
     * @dev Get CDI rate in basis points (for compatibility)
     * @return CDI rate in basis points
     */
    function getCDIInBasisPoints() external view returns (uint256);
    
    /**
     * @dev Check if the oracle is functioning properly
     * @return isHealthy Whether the oracle is healthy
     */
    function isHealthy() external view returns (bool);
} 