const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy MockERC20 for testing
  const MockToken = await hre.ethers.getContractFactory("MockERC20");
  const mockToken = await MockToken.deploy("Sale Token", "TKN", 18);
  await mockToken.deployed();
  
  console.log("MockToken deployed to:", mockToken.address);

  // Mint some tokens for testing
  const mintAmount = hre.ethers.utils.parseEther("2000000"); // 2 million tokens
  await mockToken.mint(deployer.address, mintAmount);
  console.log("Minted", hre.ethers.utils.formatEther(mintAmount), "tokens to", deployer.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
