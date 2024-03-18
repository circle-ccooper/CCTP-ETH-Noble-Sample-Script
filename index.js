require("dotenv").config();
const { ethers } = require('ethers');
const { bech32 } = require('bech32');

const tokenMessengerAbi = require('./abis/TokenMessenger.json');
const usdcAbi = require('./abis/Usdc.json');

const waitForTransaction = async(provider, txHash) => {
    let transactionReceipt = await provider.getTransactionReceipt(txHash);
    while (transactionReceipt != null && transactionReceipt.status === 0) {
        transactionReceipt = await provider.getTransactionReceipt(txHash);
        await new Promise(r => setTimeout(r, 4000));
    }
    return transactionReceipt;
}

const main = async () => {
    const provider = new ethers.JsonRpcProvider(process.env.ETH_TESTNET_RPC);

    // Add ETH private key used for signing transactions
    const signer = new ethers.Wallet(process.env.ETH_PRIVATE_KEY, provider);

    // Testnet Contract Addresses
    const ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS = "0x9f3B8679c73C2Fef8b59B4f3444d4e156fb70AA5";
    const USDC_ETH_CONTRACT_ADDRESS = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238";

    // initialize contracts using address and ABI
    const ethTokenMessengerContract = new ethers.Contract(ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS, tokenMessengerAbi, signer);
    const usdcEthContract = new ethers.Contract(USDC_ETH_CONTRACT_ADDRESS, usdcAbi, signer);

    // Noble destination address
    const nobleAddress = "noble143u4n8mxxdtehg2qcjncur6h32k2c4x7lfszr7"
    const mintRecipient = bech32.fromWords(bech32.decode(nobleAddress).words)

    // Amount that will be transferred
    const amount = 2000000;

    const mintRecipientBytes = new Uint8Array(32);
    mintRecipientBytes.set(mintRecipient, 32 - mintRecipient.length);
    const mintRecipientHex = ethers.hexlify(mintRecipientBytes);

    // STEP 1: Approve TokenMessenger contract to withdraw from our active eth address
    const approveTx = await usdcEthContract.approve(ETH_TOKEN_MESSENGER_CONTRACT_ADDRESS, amount);
    await approveTx.wait();
    console.log("Approval transaction hash:", approveTx.hash);

    // STEP 2: Burn USDC
    const burnTx = await ethTokenMessengerContract.depositForBurn(amount, 4, mintRecipientHex, USDC_ETH_CONTRACT_ADDRESS);
    await burnTx.wait();
    console.log("Burn transaction hash:", burnTx.hash);
    console.log("Minting on Noble to https://www.mintscan.io/noble-testnet/account/" + nobleAddress);
};

main();
