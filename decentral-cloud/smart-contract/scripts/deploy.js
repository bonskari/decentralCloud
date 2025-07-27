const hre = require("hardhat");
const fs = require("fs");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  const Storage = await hre.ethers.getContractFactory("Storage");
  const storage = await Storage.connect(deployer).deploy();

  console.log("Storage deployed to:", storage.target);

  // Save the contract address to a file
  const contractAddress = storage.target;
  const data = JSON.stringify({ contractAddress }, null, 2);
  fs.writeFileSync("./contract-address.json", data);
  console.log("Contract address saved to contract-address.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
