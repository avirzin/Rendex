// Example usage of Alchemy SDK in your web3 project
import { Alchemy, Network } from 'alchemy-sdk';

// Configure Alchemy SDK
const settings = {
  apiKey: process.env.ALCHEMY_API_KEY, // Your Alchemy API key
  network: Network.ETH_MAINNET, // or Network.ETH_SEPOLIA for testnet
};

const alchemy = new Alchemy(settings);

// Example: Get the latest block number
async function getLatestBlock() {
  const latestBlock = await alchemy.core.getBlockNumber();
  console.log("Latest block number:", latestBlock);
  return latestBlock;
}

// Example: Get token balances for an address
async function getTokenBalances(address) {
  const balances = await alchemy.core.getTokenBalances(address);
  console.log("Token balances:", balances);
  return balances;
}

// Example: Get NFT metadata
async function getNFTMetadata(contractAddress, tokenId) {
  const metadata = await alchemy.nft.getNftMetadata(
    contractAddress,
    tokenId
  );
  console.log("NFT metadata:", metadata);
  return metadata;
}

// Example: Get gas price
async function getGasPrice() {
  const gasPrice = await alchemy.core.getGasPrice();
  console.log("Current gas price:", gasPrice.toString());
  return gasPrice;
}

export { alchemy, getLatestBlock, getTokenBalances, getNFTMetadata, getGasPrice }; 