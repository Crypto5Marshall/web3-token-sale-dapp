const { ethers } = require("hardhat");

async function main() {
    // Transaction details from Etherscan
    const usdtAmount = ethers.utils.parseUnits("100", 6); // 100 USDT with 6 decimals
    const tokenPrice = 20000; // Current price: 0.02 USDT

    // Contract calculation
    const tokenAmount = usdtAmount.mul(ethers.utils.parseEther("1")).div(tokenPrice);
    
    console.log("Input:");
    console.log("USDT Amount:", ethers.utils.formatUnits(usdtAmount, 6), "USDT");
    console.log("Token Price:", tokenPrice / 1000000, "USDT");
    
    console.log("\nCalculation:");
    console.log("Token Amount:", ethers.utils.formatEther(tokenAmount), "Tokens");
    
    // Verify reverse calculation
    const expectedUsdtAmount = tokenAmount.mul(tokenPrice).div(ethers.utils.parseEther("1"));
    console.log("\nVerification:");
    console.log("Expected USDT:", ethers.utils.formatUnits(expectedUsdtAmount, 6), "USDT");
    
    if (!expectedUsdtAmount.eq(usdtAmount)) {
        console.log("\nDiscrepancy detected!");
        console.log("Difference:", ethers.utils.formatUnits(usdtAmount.sub(expectedUsdtAmount), 6), "USDT");
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
