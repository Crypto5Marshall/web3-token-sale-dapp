const { ethers } = require("hardhat");

async function main() {
    console.log("Testing Token Sale Decimal Handling (v3)\n");

    // Test cases with 18 decimal precision
    const testCases = [
        { usdt: "0.02", expected: "1" },    // 0.02 USDT = 1 token
        { usdt: "0.2", expected: "10" },     // 0.2 USDT = 10 tokens
        { usdt: "2", expected: "100" },      // 2 USDT = 100 tokens
        { usdt: "20", expected: "1000" },    // 20 USDT = 1000 tokens
        { usdt: "200", expected: "10000" }   // 200 USDT = 10000 tokens (max)
    ];

    console.log("Test Cases (using 18 decimals for USDT):");
    console.log("----------------------------------------");
    for (const test of testCases) {
        // Convert USDT amount to wei (18 decimals)
        const usdtAmountBN = ethers.utils.parseUnits(test.usdt, 18);
        
        // Calculate tokens: (USDT amount * 10^18) / token price
        const tokenAmountBN = usdtAmountBN.mul(ethers.constants.WeiPerEther).div(ethers.BigNumber.from(20000));
        
        console.log(`\nInput USDT: ${test.usdt}`);
        console.log(`USDT Amount (18 decimals): ${usdtAmountBN.toString()}`);
        console.log(`Expected Tokens: ${test.expected}`);
        console.log(`Calculated Tokens: ${ethers.utils.formatEther(tokenAmountBN)}`);
    }

    // Test contract interaction
    const [deployer] = await ethers.getSigners();
    console.log("\nTesting Contract Interaction:");
    console.log("----------------------------");

    // Contract addresses
    const tokenSaleAddress = "0xbc485534dab82189644377E2C6a0331EaD288812";
    const usdtAddress = "0x973104fAa7F2B11787557e85953ECA6B4e262328";

    // Contract ABIs
    const TokenSaleABI = [
        "function buy(uint256 usdtAmount) external",
        "function tokenPrice() external view returns (uint256)",
        "function totalTokensSold() external view returns (uint256)",
        "function hardCap() external view returns (uint256)"
    ];
    const ERC20ABI = [
        "function decimals() external view returns (uint8)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)"
    ];

    // Contract instances
    const tokenSale = new ethers.Contract(tokenSaleAddress, TokenSaleABI, deployer);
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, deployer);

    // Get contract state
    const [totalSold, hardCap, tokenPrice] = await Promise.all([
        tokenSale.totalTokensSold(),
        tokenSale.hardCap(),
        tokenSale.tokenPrice()
    ]);

    console.log("\nContract State:");
    console.log(`Total Tokens Sold: ${ethers.utils.formatEther(totalSold)}`);
    console.log(`Hard Cap: ${ethers.utils.formatEther(hardCap)}`);
    console.log(`Token Price: ${tokenPrice.toString()} (${ethers.utils.formatUnits(tokenPrice, 6)} USDT)`);

    // Test a small purchase (0.02 USDT = 1 token)
    const testAmount = "0.02";
    console.log(`\nTesting purchase of ${testAmount} USDT:`);
    const purchaseAmount = ethers.utils.parseUnits(testAmount, 18);
    console.log(`Purchase amount (18 decimals): ${purchaseAmount.toString()}`);

    try {
        // Check USDT balance
        const usdtBalance = await usdt.balanceOf(deployer.address);
        console.log(`USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 18)}`);

        // Approve USDT
        console.log("Approving USDT...");
        const approveTx = await usdt.approve(tokenSaleAddress, purchaseAmount);
        await approveTx.wait();
        console.log("USDT approved");

        // Buy tokens
        console.log("Buying tokens...");
        const buyTx = await tokenSale.buy(purchaseAmount);
        await buyTx.wait();
        console.log("Purchase successful");

        // Check new total sold
        const newTotalSold = await tokenSale.totalTokensSold();
        console.log(`New Total Tokens Sold: ${ethers.utils.formatEther(newTotalSold)}`);

        // Check contract USDT balance
        const contractBalance = await usdt.balanceOf(tokenSaleAddress);
        console.log(`Contract USDT Balance: ${ethers.utils.formatUnits(contractBalance, 18)}`);
    } catch (error) {
        console.error("Error:", error.message);
        if (error.error) {
            console.error("Revert reason:", error.error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
