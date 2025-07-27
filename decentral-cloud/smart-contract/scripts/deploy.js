const hre = require("hardhat");

async function main() {
  const Storage = await hre.ethers.getContractFactory("Storage");
  const storage = await Storage.deploy();

  

  console.log("Storage deployed to:", storage.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
