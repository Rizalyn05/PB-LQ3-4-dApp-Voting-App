CampusVoting - Online Voting System

Project Description

CampusVoting is a decentralized online voting system designed to provide students with a convenient
and transparent way to participate in campus elections.

The system uses blockchain technology to record votes and manage election activities securely.

Features

Voter Features

- Connect MetaMask wallet.
- Register as a voter.
- Check voter authorization status.
- View election candidates.
- Cast one vote only.
- View election results after voting ends.

Electoral Admin Features

- Connect using the contract owner's MetaMask wallet.
- Add election candidates.
- Authorize voter wallet addresses.
- Start the election.
- End the election.
- View voting results.

Technologies Used

- Solidity
- Remix IDE
- Ethereum Sepolia Test Network
- MetaMask
- HTML
- CSS
- JavaScript
- Ethers.js
- Browser LocalStorage

Project Folder Structure

campus-voting-dapp/
├── contracts/
│ └── CampusVoting.sol
├── frontend/
│ ├── index.html
│ ├── style.css
│ ├── app.js
│ └── abi.json
├── docs/
│ ├── deployed-contract-address.txt
│ └── screenshots/
└── README.md

How to Run the Project

1. Install MetaMask in your browser.
2. Switch MetaMask to the Sepolia Test Network.
3. Make sure your wallet has Sepolia test ETH for transaction fees.
4. Open the project in Visual Studio Code.
5. Open the frontend folder.
6. Run "index.html" using Live Server.
7. Connect your MetaMask wallet.
8. Use the appropriate wallet account to access the voter or admin features.

Smart Contract

The CampusVoting smart contract is written in Solidity and deployed on the Ethereum Sepolia Test Network.

Network: Sepolia Test Network

Contract Address: See "docs/deployed-contract-address.txt".

Storage

- Voter registration requests are stored using browser LocalStorage.
- Voter authorization is recorded on the blockchain.
- Candidate information and votes are stored on the blockchain.
- Election status and results are retrieved from the blockchain.

Project Documentation

Screenshots of the voter interface, admin dashboard, and election processes are available in the "docs/screenshots/" folder.

Developers

Developed by: GoDaddy

Members:

Domitita, Rizalyn
Gacusana, John Mark
Pajarillo, May Flor
Palacio, Pauleen Joyce
