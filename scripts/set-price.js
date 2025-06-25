const hre = require("hardhat");
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Setting price with the account:", deployer.address);

  const TokenSaleLocked = await ethers.getContractFactory("TokenSaleLocked");
  const tokenSale = TokenSaleLocked.attach("0xbc485534dab82189644377E2C6a0331EaD288812");

  // Example: Set price to 0.05 USDT (50000 with 6 decimals)
  const newPrice = 50000; // Change this value to set different price
  const tx = await tokenSale.setPrice(newPrice);
  await tx.wait();

  console.log("Price set successfully to:", newPrice);
  console.log("In USDT terms:", newPrice / 1000000);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
