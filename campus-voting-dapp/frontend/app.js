const contractAddress = "0x78786Fc48Da501816cC445d86bBf094CEE4352d5"; //Deployed contract address on Sepolia Test Network

const contractABI = [
  "function addCandidate(string name, string position)",
  "function authorizeVoter(address voter)",
  "function startElection()",
  "function endElection()",
  "function vote(uint256 candidateId)",
  "function getCandidate(uint256 candidateId) view returns (tuple(uint256 id, string name, string position, uint256 voteCount, bool exists))", //view function to get candidate details by ID
  "function getCandidateCount() view returns (uint256)",
  "function getTotalVotes() view returns (uint256)",
  "function getElectionStatus() view returns (bool)",
  "function authorizedVoters(address) view returns (bool)", //view function to check if a voter is authorized
  "function hasVoted(address) view returns (bool)", //view function to check if a voter has already voted
  "function owner() view returns (address)", //view function to get the owner of the contract
];

let provider;
let signer;
let contract;
let userAccount;
let isAdmin = false;
let isAuthorized = false;
let alreadyVoted = false;

const connectButton = document.getElementById("connectButton");
const walletStatus = document.getElementById("walletStatus");
const electionStatus = document.getElementById("electionStatus");
const totalVotes = document.getElementById("totalVotes");
const candidateList = document.getElementById("candidateList");
const SEPOLIA_CHAIN_ID = 11155111;

connectButton.addEventListener("click", connectWallet);
document
  .getElementById("addCandidateButton")
  .addEventListener("click", addCandidate);
document
  .getElementById("authorizeVoterButton")
  .addEventListener("click", authorizeVoter);
document
  .getElementById("startElectionButton")
  .addEventListener("click", startElection);
document
  .getElementById("endElectionButton")
  .addEventListener("click", endElection);
document
  .getElementById("registerVoterButton")
  .addEventListener("click", registerVoter);

async function connectWallet() {
  // Function to connect to MetaMask wallet
  if (!window.ethereum) {
    walletStatus.innerText = "Please install MetaMask.";
    return;
  }

  provider = new ethers.providers.Web3Provider(window.ethereum);
  await provider.send("eth_requestAccounts", []);

  signer = provider.getSigner();

  const correctNetwork = await checkNetwork(); // Check if the user is connected to the Sepolia Test Network

  if (!correctNetwork) {
    return;
  }

  userAccount = await signer.getAddress();

  contract = new ethers.Contract(contractAddress, contractABI, signer);

  walletStatus.innerText =
    "Connected: " + userAccount.slice(0, 6) + "..." + userAccount.slice(-4);

  await checkAdmin(); // Check if the connected user is the admin
  updateAdminControls(); // Update the visibility of admin controls based on the user's role
  displayPendingVoters(); // Display the list of pending voter requests for the admin
  await checkVoterStatus(); // Check if the connected user is authorized to vote and if they have already voted
  displayRegistrationStatus(); // Display the registration status of the connected user
  await loadElectionData(); // Load the election data (candidates, votes, etc.) and update the UI
}

async function checkAdmin() {
  // Function to check if the connected user is the admin
  const adminAddress = await contract.owner();

  isAdmin = adminAddress.toLowerCase() === userAccount.toLowerCase();

  if (isAdmin) {
    console.log("Logged in as Electoral Admin");
  } else {
    console.log("Logged in as Voter");
  }
}

function updateAdminControls() {
  //get both dashboards
  const adminDashboard = document.getElementById("adminDashboard");
  const voterDashboard = document.getElementById("voterDashboard");

  // Display the correct dashboard based on the connected wallet
  if (isAdmin) {
    adminDashboard.style.display = "block";
    voterDashboard.style.display = "none";

    console.log("Admin Dashboard displayed.");
  } else {
    adminDashboard.style.display = "none";
    voterDashboard.style.display = "block";

    console.log("Voter Dashboard displayed.");
  }

  // show or hide individual admin buttons
  const adminButtons = [
    "addCandidateButton",
    "authorizeVoterButton",
    "startElectionButton",
    "endElectionButton",
  ];

  adminButtons.forEach((id) => {
    const button = document.getElementById(id);

    if (button) {
      button.hidden = !isAdmin;
    }
  });
}

async function checkVoterStatus() {
  // Function to check if the connected user is authorized to vote and if they have already voted
  if (!contract || !userAccount) return;

  isAuthorized = await contract.authorizedVoters(userAccount);
  alreadyVoted = await contract.hasVoted(userAccount);

  if (!isAuthorized) {
    console.log("User is not authorized to vote.");
  } else if (alreadyVoted) {
    console.log("User has already voted.");
  } else {
    console.log("User is authorized to vote.");
  }
}

async function registerVoter() {
  // Function to register a voter by submitting their name and wallet address to local storage

  if (!userAccount) {
    alert("Please connect your MetaMask wallet first.");
    return;
  }

  const name = document.getElementById("voterName").value.trim();

  if (name === "") {
    alert("Please enter your name.");
    return;
  }

  const requests = JSON.parse(localStorage.getItem("voterRequests") || "[]");

  const existingVoter = requests.find(
    (voter) => voter.wallet.toLowerCase() === userAccount.toLowerCase(),
  );

  if (existingVoter) {
    alert("You have already submitted a registration request.");
    return;
  }

  requests.push({
    name: name,
    wallet: userAccount,
    status: "Pending",
  });

  localStorage.setItem("voterRequests", JSON.stringify(requests));
  displayRegistrationStatus(); // Update the registration status display
  displayPendingVoters(); // Update the pending voters list for the admin

  alert("Registration submitted successfully!");
}

function displayRegistrationStatus() {
  // Function to display the registration status of the connected user
  if (!userAccount) return;

  const requests = JSON.parse(localStorage.getItem("voterRequests") || "[]");

  const voter = requests.find(
    (item) => item.wallet.toLowerCase() === userAccount.toLowerCase(),
  );

  const statusElement = document.getElementById("registrationStatus");

  if (!statusElement) return;

  if (!voter) {
    statusElement.innerText = "You are not registered yet.";
  } else if (voter.status === "Authorized") {
    statusElement.innerText =
      "You are authorized to vote. User can vote when election opens.";
  } else {
    statusElement.innerText =
      "Registration submitted successfully. Waiting for admin approval.";
  }
}

async function checkNetwork() {
  // Function to check if the user is connected to the Sepolia Test Network
  const network = await provider.getNetwork();

  if (network.chainId !== SEPOLIA_CHAIN_ID) {
    alert("Please connect to the Sepolia Test Network in MetaMask.");

    return false;
  }

  return true;
}

async function addCandidate() {
  // Function to add a candidate to the election
  if (!isAdmin || !contract) {
    alert("Only the Election Admin can add candidates.");
    return;
  }
  const name = document.getElementById("candidateName").value.trim();
  const position = document.getElementById("candidatePosition").value.trim();

  if (name === "" || position === "") {
    alert("Please fill in all fields.");
    return;
  }

  try {
    const tx = await contract.addCandidate(name, position);
    await tx.wait();
    alert("Candidate added successfully.");
    await loadElectionData(); // Refresh the election data after adding a candidate
  } catch (error) {
    alert("Only the election admin can add candidates.");
  }
}

async function authorizeVoter() {
  if (!isAdmin || !contract) {
    alert("Only the Election Admin can authorize voters.");
    return;
  }

  const voterAddress = document.getElementById("voterAddress").value.trim();

  if (!ethers.utils.isAddress(voterAddress)) {
    alert("Please enter a valid Ethereum wallet address.");
    return;
  }

  try {
    const requests = JSON.parse(localStorage.getItem("voterRequests") || "[]");

    //Check the voter's current blockchain authorization status
    const alreadyAuthorized = await contract.authorizedVoters(voterAddress);

    if (!alreadyAuthorized) {
      const tx = await contract.authorizeVoter(voterAddress);
      alert(
        "Please confirm the transaction in MetaMask to authorize the voter.",
      );
      await tx.wait();
    }

    // Update the matching registration in local storage to "Authorized"
    const updatedRequests = requests.map((voter) => {
      if (voter.wallet.toLowerCase() === voterAddress.toLowerCase()) {
        return { ...voter, status: "Authorized" };
      }
      return voter;
    });

    localStorage.setItem("voterRequests", JSON.stringify(updatedRequests));
    alert("Voter authorized successfully.");

    document.getElementById("voterAddress").value = ""; // Clear the input field
    displayPendingVoters(); // Refresh the pending voters list
  } catch (error) {
    console.error("Authorization error:", error);
    alert(
      error.reason ||
        error.data?.message ||
        error.message ||
        "Authorization failed. Please check your admin wallet and MetaMask transaction.",
    );
  }
}

async function startElection() {
  // Function to start the election
  try {
    const tx = await contract.startElection();
    await tx.wait();
    alert("Election started.");
    await loadElectionData(); // Refresh the election data after starting the election
  } catch (error) {
    alert("Could not start election.");
  }
}

async function endElection() {
  // Function to end the election
  try {
    const tx = await contract.endElection();
    await tx.wait();
    alert("Election ended.");
    await loadElectionData(); // Refresh the election data after ending the election
  } catch (error) {
    alert("Could not end election.");
  }
}

async function vote(candidateId) {
  // Function to cast a vote for a candidate
  try {
    console.log("Testing vote for candidate ID:", candidateId);
    await contract.callStatic.vote(candidateId);
    console.log("Vote simulation successful");
    const tx = await contract.vote(candidateId);

    await tx.wait();
    alert("Your vote was submitted successfully.");
    await checkVoterStatus(); // Update voter status after voting
    await loadElectionData(); // Refresh election data after voting
  } catch (error) {
    console.error(error);
    alert(
      "Voting failed. You may not be authorized or may have already voted.",
    );
  }
}

async function loadElectionData() {
  // Function to load the election data (candidates, votes, etc.) and update the UI
  if (!contract) return;

  const isOpen = await contract.getElectionStatus();
  const count = (await contract.getCandidateCount()).toNumber();
  const votes = await contract.getTotalVotes();

  electionStatus.innerText = isOpen ? "Election is OPEN" : "Election is CLOSED";

  totalVotes.innerText = "Total votes: " + votes.toString();

  candidateList.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const candidate = await contract.getCandidate(i);

    const div = document.createElement("div");
    div.className = "candidate";
    div.innerHTML = `
      <strong>${candidate.name}</strong><br />
      Position: ${candidate.position}<br />
      Votes: ${candidate.voteCount}<br />
    `;

    if (isOpen && isAuthorized && !alreadyVoted && !isAdmin) {
      const voteButton = document.createElement("button");
      voteButton.innerText = "Vote";
      voteButton.addEventListener("click", () => vote(candidate.id));
      div.appendChild(voteButton);
    }

    candidateList.appendChild(div);
  }

  await displayElectionResults(); // Update the election results after loading candidates
}

async function displayElectionResults() {
  const resultsList = document.getElementById("resultsList");

  if (!resultsList || !contract) return;

  const isOpen = await contract.getElectionStatus();

  resultsList.innerHTML = "";

  if (isOpen) {
    resultsList.innerText =
      "Results will be available after the election ends.";
    return;
  }

  const count = (await contract.getCandidateCount()).toNumber();
  const candidates = [];

  for (let i = 1; i <= count; i++) {
    const candidate = await contract.getCandidate(i);
    candidates.push(candidate);
  }

  candidates.sort((a, b) => b.voteCount.toNumber() - a.voteCount.toNumber());

  candidates.forEach((candidate, index) => {
    const result = document.createElement("p");

    result.innerText = `${index + 1}. ${candidate.name} - ${candidate.voteCount.toString()} votes`;

    resultsList.appendChild(result);
  });
}

function displayPendingVoters() {
  const list = document.getElementById("pendingVotersList");

  if (!list || !isAdmin) return;

  list.innerHTML = ""; // Clear the list before displaying

  const requests = JSON.parse(localStorage.getItem("voterRequests") || "[]");

  const pendingVoters = requests.filter((voter) => voter.status === "Pending");

  if (pendingVoters.length === 0) {
    list.innerText = "No pending voter requests.";
    return;
  }

  pendingVoters.forEach((voter) => {
    const div = document.createElement("div");
    div.className = "pending-voter";
    const name = document.createElement("p");
    name.textContent = "Name: " + voter.name;
    const wallet = document.createElement("p");
    wallet.textContent = "Wallet: " + voter.wallet;
    const status = document.createElement("p");
    div.appendChild(name);
    div.appendChild(wallet);
    div.appendChild(status);
    list.appendChild(div);
  });
}

if (window.ethereum) {
  // Check if MetaMask is installed
  window.ethereum.on("accountsChanged", function (accounts) {
    if (accounts.length === 0) {
      walletStatus.innerText = "Wallet disconnected.";
      contract = null;
      signer = null;
      userAccount = null;

      isAdmin = false;
      isAuthorized = false;
      alreadyVoted = false;
      updateAdminControls();
    } else {
      connectWallet();
    }
  });

  window.ethereum.on("chainChanged", function () {
    alert("Network changed. Please reconnect to Sepolia.");
    window.location.reload();
  });
}

setInterval(async function () {
  if (!contract) return;

  try {
    await checkAdmin();
    await checkVoterStatus();

    updateAdminControls();
    displayRegistrationStatus();
    displayPendingVoters();

    await loadElectionData();
  } catch (error) {
    console.error("Error refreshing election data:", error);
  }
}, 10000); // Refresh every 10 seconds
