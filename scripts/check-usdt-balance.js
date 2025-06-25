const { ethers } = require("hardhat");

async function main() {
    // Contract addresses
    const tokenSaleAddress = "0xbc485534dab82189644377E2C6a0331EaD288812";
    const usdtAddress = "0x973104fAa7F2B11787557e85953ECA6B4e262328";

    // Contract ABIs
    const TokenSaleABI = [
        "function totalTokensSold() external view returns (uint256)"
    ];
    const ERC20ABI = [
        "function balanceOf(address account) external view returns (uint256)",
        "function decimals() external view returns (uint8)"
    ];

    const [deployer] = await ethers.getSigners();
    console.log("Checking balances with account:", deployer.address);

    // Contract instances
    const tokenSale = new ethers.Contract(tokenSaleAddress, TokenSaleABI, deployer);
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, deployer);

    // Get USDT decimals
    const decimals = await usdt.decimals();
    console.log("\nUSDT Decimals:", decimals);

    // Get contract USDT balance
    const balance = await usdt.balanceOf(tokenSaleAddress);
    console.log("\nContract USDT Balance:");
    console.log("Raw:", balance.toString());
    console.log("Formatted:", ethers.utils.formatUnits(balance, decimals));

    // Get total tokens sold
    const totalSold = await tokenSale.totalTokensSold();
    console.log("\nTotal Tokens Sold:", ethers.utils.formatEther(totalSold));

    // Calculate expected USDT amount (tokens sold * 0.02)
    const expectedUsdt = totalSold.mul(20000).div(ethers.constants.WeiPerEther);
    console.log("\nExpected USDT Balance (based on tokens sold):");
    console.log("Raw:", expectedUsdt.toString());
    console.log("Formatted:", ethers.utils.formatUnits(expectedUsdt, decimals));

    // Check if balances match
    if (balance.eq(expectedUsdt)) {
        console.log("\n✅ USDT balance matches expected amount");
    } else {
        console.log("\n❌ USDT balance mismatch!");
        const diff = balance.sub(expectedUsdt);
        console.log("Difference:", ethers.utils.formatUnits(diff.abs(), decimals), "USDT");
        console.log(diff.gt(0) ? "(excess in contract)" : "(shortfall in contract)");
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
