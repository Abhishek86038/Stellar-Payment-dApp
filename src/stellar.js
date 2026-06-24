import { Server } from "@stellar/stellar-sdk/horizon";
import { Networks, TransactionBuilder, Operation, Asset, Keypair } from "@stellar/stellar-sdk";
import { StellarWalletsKit } from "@creit.tech/stellar-wallets-kit/sdk";
import { Networks as WalletNetworks } from "@creit.tech/stellar-wallets-kit/types";
import { defaultModules } from "@creit.tech/stellar-wallets-kit/modules/utils";

// Initialize the kit globally
StellarWalletsKit.init({
  modules: defaultModules(),
  network: WalletNetworks.TESTNET
});

export const kit = StellarWalletsKit;

const serverUrl = window.location.origin + "/horizon-api";
const server = new Server(serverUrl, { allowHttp: true });

export const connectWallet = async () => {
  try {
    const { address } = await kit.authModal();
    if (!address) throw new Error("Wallet not found / not installed");
    return address;
  } catch (err) {
    if ((err.message && err.message.includes("decline")) || (err.message && err.message.includes("reject")) || (err.message && err.message.includes("cancel"))) {
      throw new Error("User rejected the connection");
    }
    throw new Error(err.message || "Wallet not found / not installed");
  }
};

export const getBalance = async (publicKey) => {
  try {
    const account = await server.loadAccount(publicKey);
    const balance = account.balances.find((b) => b.asset_type === "native");
    return balance ? balance.balance : "0";
  } catch(e) {
    console.error("Error fetching balance:", e);
    // Return error message to display on UI instead of silently failing to 0
    if (e.response && e.response.status === 404) {
      return "0 (Fund on Testnet)";
    }
    return "Error: " + (e.message || "Network issue");
  }
};

export const sendPayment = async (destination, amount, publicKey) => {
  const sourceAccount = await server.loadAccount(publicKey);
  const fee = await server.fetchBaseFee();

  const balance = await getBalance(publicKey);
  if (parseFloat(balance) < parseFloat(amount)) {
      throw new Error("Insufficient balance before sending transaction");
  }

  const transaction = new TransactionBuilder(sourceAccount, {
    fee,
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(
      Operation.payment({
        destination,
        asset: Asset.native(),
        amount: amount.toString(),
      })
    )
    .setTimeout(180)
    .build();

  const { signedTxXdr } = await kit.signTransaction(transaction.toXDR(), { 
      networkPassphrase: Networks.TESTNET,
      address: publicKey
  });
  
  const txToSubmit = TransactionBuilder.fromXDR(signedTxXdr, Networks.TESTNET);
  const response = await server.submitTransaction(txToSubmit);
  
  return response;
};
