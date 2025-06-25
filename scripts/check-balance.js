const { ethers } = require("hardhat");

async function main() {
    // Connect to Sepolia
    const provider = new ethers.providers.JsonRpcProvider("https://eth-sepolia.public.blastapi.io");
    
    // Contract addresses
    const tokenSaleAddress = "0xbc485534dab82189644377E2C6a0331EaD288812";
    const usdtAddress = "0x973104fAa7F2B11787557e85953ECA6B4e262328";
    
    // Contract interface
    const ERC20ABI = ["function balanceOf(address account) external view returns (uint256)"];
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, provider);
    
    // Get USDT balance
    const balance = await usdt.balanceOf(tokenSaleAddress);
    console.log("\nContract USDT Balance:");
    console.log("--------------------");
    console.log("Address:", tokenSaleAddress);
    console.log("Balance:", ethers.utils.formatUnits(balance, 6), "USDT");
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
