import { Contract, rpc as SorobanRpc, TransactionBuilder, Networks, nativeToScVal, scValToNative, Address } from "@stellar/stellar-sdk";
import { kit } from "./stellar";

const rpcServer = new SorobanRpc.Server("https://soroban-testnet.stellar.org");
export const CONTRACT_ADDRESS = "CCJYU62FU5HJVGQ6D3JB6M6FRAWBVR52T22WJGW3VJUZ6A7QB6JGHPV7";

export const initContract = () => {
    return new Contract(CONTRACT_ADDRESS);
};

export const logPayment = async (sender, category, amount, note) => {
    const sourceAccount = await rpcServer.getAccount(sender);
    
    // Contract call args
    const senderVal = nativeToScVal(sender, { type: 'address' });
    const categoryVal = nativeToScVal(category, { type: 'symbol' });
    const amountVal = nativeToScVal(BigInt(Math.floor(Number(amount) * 10000000)), { type: 'i128' }); // store as stroops
    // Ensure note is valid symbol (alphanumeric and underscore only, max 32 chars)
    const cleanNote = note.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 32) || "none";
    const noteVal = nativeToScVal(cleanNote, { type: 'symbol' });

    const contract = initContract();
    
    let transaction = new TransactionBuilder(sourceAccount, {
        fee: "10000", // slightly higher fee for state changes
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("log_payment", senderVal, categoryVal, amountVal, noteVal))
    .setTimeout(180)
    .build();

    const preparedTransaction = await rpcServer.prepareTransaction(transaction);
    
    const signedXdr = await kit.signTransaction(preparedTransaction.toXDR(), { networkPassphrase: Networks.TESTNET });
    let txToSubmit;
    if (typeof signedXdr === 'string') {
        txToSubmit = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
    } else {
        txToSubmit = TransactionBuilder.fromXDR(signedXdr.signedTxXdr || signedXdr.xdr, Networks.TESTNET);
    }
    
    const response = await rpcServer.sendTransaction(txToSubmit);
    if (response.status === "ERROR") {
        throw new Error(response.errorResultXdr || "Transaction failed");
    }

    let txResponse = await rpcServer.getTransaction(response.hash);
    while (txResponse.status === "NOT_FOUND") {
        await new Promise(resolve => setTimeout(resolve, 2000));
        txResponse = await rpcServer.getTransaction(response.hash);
    }
    
    if (txResponse.status === "FAILED") {
        throw new Error("Contract call failed on network");
    }

    return response;
};

export const getPaymentLog = async (address) => {
    const senderVal = nativeToScVal(address, { type: 'address' });
    const contract = initContract();
    
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const account = new SorobanRpc.Account(source, "0");
    const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("get_payment_log", senderVal))
    .setTimeout(30)
    .build();
    
    const res = await rpcServer.simulateTransaction(transaction);
    if (res.error) {
        throw new Error(res.error);
    }
    if (!res.results || res.results.length === 0) {
        return [];
    }
    const resultVal = res.results[0].retval;
    return scValToNative(resultVal);
};

export const getTotalByCategory = async (address, category) => {
    const senderVal = nativeToScVal(address, { type: 'address' });
    const categoryVal = nativeToScVal(category, { type: 'symbol' });
    const contract = initContract();
    
    const source = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";
    const account = new SorobanRpc.Account(source, "0");
    const transaction = new TransactionBuilder(account, {
        fee: "100",
        networkPassphrase: Networks.TESTNET,
    })
    .addOperation(contract.call("get_total_by_category", senderVal, categoryVal))
    .setTimeout(30)
    .build();
    
    const res = await rpcServer.simulateTransaction(transaction);
    if (res.error) {
        throw new Error(res.error);
    }
    if (!res.results || res.results.length === 0) {
        return 0;
    }
    const resultVal = res.results[0].retval;
    return scValToNative(resultVal);
};
