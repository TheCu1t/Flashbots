# Flashbots
This script sends a transaction to a target wallet and then uses the target wallet to send USDT to a recipient address. The funding wallet covers the gas fees for both transactions. The script uses the FlashbotsBundleProvider to send the transactions in a single bundle, ensuring that they are included in the same block.
