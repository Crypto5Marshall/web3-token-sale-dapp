const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy TokenSaleLocked contract
  console.log("\nDeploying TokenSaleLocked...");
  const TokenSaleLocked = await ethers.getContractFactory("TokenSaleLocked");
  const tokenSaleLocked = await TokenSaleLocked.deploy();

  await tokenSaleLocked.deployed();
  console.log("TokenSaleLocked deployed to:", tokenSaleLocked.address);

  // Verify the contract on Etherscan
  console.log("\nVerifying contract on Etherscan...");
  try {
    await hre.run("verify:verify", {
      address: tokenSaleLocked.address,
      constructorArguments: [],
    });
    console.log("Contract verified successfully");
  } catch (error) {
    console.error("Error verifying contract:", error);
  }

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("TokenSaleLocked:", tokenSaleLocked.address);
  console.log("\nContract Owner:", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
