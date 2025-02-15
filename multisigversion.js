const { ethers } = require("ethers");
const { FlashbotsBundleProvider } = require("@flashbots/ethers-provider-bundle");

const ALCHEMY_API_KEY = "your-alchemy-api-key";
const FLASHBOTS_RELAY_SIGNING_KEY = "your-flashbots-relay-signing-key";
const FUNDING_WALLET_PRIVATE_KEY = "funding-wallet-private-key";
const TARGET_WALLET_PRIVATE_KEY = "target-wallet-private-key";
const RECIPIENT_ADDRESS = "recipient-wallet-address";
const AMOUNT_IN_USDT = "amount-to-send-in-usdt";
const USDT_CONTRACT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // USDT contract address on Ethereum mainnet
const MULTISIG_WALLET_ADDRESS = "your-multisig-wallet-address"; // Multi-sig wallet address

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
    to: MULTISIG_WALLET_ADDRESS,
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