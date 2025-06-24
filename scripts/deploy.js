const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying contracts with the account:", deployer.address);

  // Deploy mock USDT for local testing
  console.log("Deploying Mock USDT...");
  const MockUSDT = await ethers.getContractFactory("MockERC20");
  const mockUsdt = await MockUSDT.deploy("Mock USDT", "USDT", 6);
  await mockUsdt.deployed();
  console.log("Mock USDT deployed to:", mockUsdt.address);

  // Mint some USDT for testing
  const usdtAmount = ethers.utils.parseUnits("1000000", 6); // 1 million USDT
  await mockUsdt.mint(deployer.address, usdtAmount);
  console.log("Minted", ethers.utils.formatUnits(usdtAmount, 6), "USDT to", deployer.address);

  const SALE_TOKEN_ADDRESS = "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512"; // Mock token address
  const TOKEN_PRICE = ethers.utils.parseUnits("0.02", 6); // 0.02 USDT per token (USDT has 6 decimals)
  const HARD_CAP = ethers.utils.parseEther("1000000"); // 1 million tokens
  const PER_WALLET_LIMIT = ethers.utils.parseEther("10000"); // 10k tokens per wallet
  const SALE_START_TIME = Math.floor(Date.now() / 1000) + 3600; // Start in 1 hour
  const SALE_END_TIME = SALE_START_TIME + (7 * 24 * 3600); // Run for 1 week

  // Deploy TokenSale contract
  console.log("\nDeploying TokenSale...");
  const TokenSale = await ethers.getContractFactory("TokenSale");
  const tokenSale = await TokenSale.deploy(
    mockUsdt.address,
    SALE_TOKEN_ADDRESS,
    TOKEN_PRICE,
    HARD_CAP,
    PER_WALLET_LIMIT,
    SALE_START_TIME,
    SALE_END_TIME
  );

  await tokenSale.deployed();
  console.log("TokenSale deployed to:", tokenSale.address);

  // Approve TokenSale contract to spend tokens
  const saleToken = await ethers.getContractAt("MockERC20", SALE_TOKEN_ADDRESS);
  await saleToken.approve(tokenSale.address, HARD_CAP);
  console.log("Approved TokenSale to spend", ethers.utils.formatEther(HARD_CAP), "tokens");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("Mock USDT:", mockUsdt.address);
  console.log("Sale Token:", SALE_TOKEN_ADDRESS);
  console.log("TokenSale:", tokenSale.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
