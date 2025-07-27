const ethers = require('ethers');

const wallet = ethers.Wallet.createRandom();

console.log("New Wallet Generated:");
console.log("  Address: ", wallet.address);
console.log("  Private Key: ", wallet.privateKey);
console.log("\nIMPORTANT: Save your private key securely! Do NOT share it with anyone unless you understand the risks.");
console.log("This private key controls the funds in this address.");