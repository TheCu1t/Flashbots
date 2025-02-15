const { ethers } = require("ethers");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

const ALCHEMY_API_KEY = "your-alchemy-api-key";
const FLASHBOTS_RELAY_SIGNING_KEY = "your-flashbots-relay-signing-key";
const FUNDING_WALLET_PRIVATE_KEY = "funding-wallet-private-key";
const TARGET_WALLET_PRIVATE_KEY = "target-wallet-private-key";
const RECIPIENT_ADDRESS = "recipient-wallet-address";
const AMOUNT_IN_USDT = "amount-to-send-in-usdt";
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT contract address on Ethereum mainnet

async function main() {
  const provider = new ethers.providers.AlchemyProvider("mainnet", ALCHEMY_API_KEY);
  const fundingWallet = new ethers.Wallet(FUNDING_WALLET_PRIVATE_KEY, provider);
  const targetWallet = new ethers.Wallet(TARGET_WALLET_PRIVATE_KEY, provider);

  let flashbotsProvider;
  try {
    flashbotsProvider = await FlashbotsBundleProvider.create(provider, fundingWallet);
  } catch (error) {
    console.error(`Failed to create Flashbots provider: ${error.message}`);
    return;
  }

  const gasPrice = await provider.getGasPrice();

  const fundingTransaction = {
    to: targetWallet.address,
    value: ethers.utils.parseEther("0.01"), // Amount to cover gas fees
    gasPrice: gasPrice,
    gasLimit: 21000,
  };

  const usdtContract = new ethers.Contract(USDT_CONTRACT_ADDRESS, [
    "function transfer(address to, uint256 value) public returns (bool)"
  ], targetWallet);

  const targetTransaction = await usdtContract.populateTransaction.transfer(
    RECIPIENT_ADDRESS,
    ethers.utils.parseUnits(AMOUNT_IN_USDT, 6) // USDT has 6 decimal places
  );

  targetTransaction.gasPrice = gasPrice;
  targetTransaction.gasLimit = 100000; // Adjust gas limit as needed
  targetTransaction.nonce = await targetWallet.getTransactionCount();

  const signedFundingTransaction = await fundingWallet.signTransaction(fundingTransaction);
  const signedTargetTransaction = await targetWallet.signTransaction(targetTransaction);

  const bundle = [
    {
      signedTransaction: signedFundingTransaction,
    },
    {
      signedTransaction: signedTargetTransaction,
    },
  ];

  const blockNumber = await provider.getBlockNumber();
  const targetBlockNumber = blockNumber + 1;

  const response = await flashbotsProvider.sendBundle(bundle, targetBlockNumber);

  if ("error" in response) {
    console.error(`Error: ${response.error.message}`);
  } else {
    console.log(`Bundle sent successfully: ${response.bundleHash}`);
    console.log(`Response details:`, response);
  }
}

main().catch(console.error);

// TheCu1t isHere this is a test of the flashbots bundle provider. 
// This script sends a transaction to a target wallet and then uses 
// the target wallet to send USDT to a recipient address. The funding 
// wallet covers the gas fees for both transactions. The script uses 
// the FlashbotsBundleProvider to send the transactions in a single 
// bundle, ensuring that they are included in the same block. The 
// script also handles errors and logs the response from the Flashbots provider.

// Note: This code is for educational purposes only. Always test on a testnet before deploying on mainnet.
// Ensure you have sufficient funds in the funding wallet to cover gas fees.
// Adjust the gas limit and other parameters as needed for your specific use case.
// Ensure you have the correct contract address and ABI for the USDT token.
// Replace placeholders with actual values before running the script.
// This script assumes you have the necessary permissions and legal rights to perform these transactions.
// Always follow best practices for security and privacy when handling private keys and sensitive information.
// Consider using environment variables or secure vaults to store sensitive information.
// Ensure you comply with all relevant laws and regulations when using Flashbots or any other service.
// This script does not include error handling for transaction failures or other potential issues.
// You may need to adjust the script for different Ethereum networks or tokens.
// Always keep your dependencies up to date to avoid security vulnerabilities.
// Consider adding logging and monitoring for production use.
// This script is provided as-is and without warranty of any kind.
// Use at your own risk.
