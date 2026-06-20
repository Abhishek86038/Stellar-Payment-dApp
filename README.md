# Stellar testnet Payment dApp

A fully functional web application that allows users to connect their Freighter wallet, view their Stellar Testnet XLM balance, and send XLM to other addresses on the Testnet. This app interacts directly with the Stellar Horizon Testnet via the official SDKs.

## Features
- **Wallet Connection**: Connects to the Freighter browser extension to securely access the user's Stellar public key.
- **Balance Display**: Fetches the actual XLM balance from the Horizon Testnet API.
- **Send Payments**: Allows users to transfer XLM by constructing, signing, and submitting transactions to the Testnet.

## Technologies Used
- React
- Vite
- `@stellar/stellar-sdk`
- `@stellar/freighter-api`

## Getting Started

Follow these steps to run the application locally:

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```

Open your browser to `http://localhost:5173` to view the application. 

### Usage Notes
- Ensure you have the [Freighter browser extension](https://www.freighter.app/) installed and configured.
- Make sure your Freighter wallet is set to **Testnet**.
- You can fund your Testnet account using the [Stellar Laboratory Friendbot](https://laboratory.stellar.org/#account-creator?network=test).

## Deployed Contract
- Contract Address: CCAPG2U42HTAHWLUY46I5J5ZQ7V6CKUC2NXZWNUXMBO7RAV3NNYPXJOA
- Network: Stellar Testnet

## Transaction Hash of Contract Call
- Hash: fbb36760ca3ef1b0f4904f52011e10719309bfdaebe6318091e1d62a8e2be795
- Verify on: https://stellar.expert/explorer/testnet/tx/fbb36760ca3ef1b0f4904f52011e10719309bfdaebe6318091e1d62a8e2be795

## Screenshots
### 1. Wallet Selection Modal
![alt text](image-4.png)

### 2. Wallet Connected State  
![alt text](image-5.png)

### 3. XLM Balance Displayed
![alt text](image-6.png)

### 4. Contract Set Value Success
![alt text](image-7.png)


### 5. Transaction Status (Pending/Success/Fail)
![alt text](image-8.png)

### 6. Error Handling (wallet not found / rejected / insufficient balance)
![alt text](image-9.png)
