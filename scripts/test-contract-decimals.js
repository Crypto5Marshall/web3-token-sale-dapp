const { ethers } = require("hardhat");

async function main() {
    console.log("Testing Contract Decimal Handling\n");

    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Contract addresses
    const tokenSaleAddress = "0xbc485534dab82189644377E2C6a0331EaD288812";
    const usdtAddress = "0x973104fAa7F2B11787557e85953ECA6B4e262328";

    // Contract ABIs
    const TokenSaleABI = [
        "function buy(uint256 usdtAmount) external",
        "function tokenPrice() external view returns (uint256)",
        "function totalTokensSold() external view returns (uint256)",
        "function hardCap() external view returns (uint256)",
        "function purchasedAmounts(address) external view returns (uint256)"
    ];
    const ERC20ABI = [
        "function decimals() external view returns (uint8)",
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function allowance(address owner, address spender) external view returns (uint256)"
    ];

    // Contract instances
    const tokenSale = new ethers.Contract(tokenSaleAddress, TokenSaleABI, deployer);
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, deployer);

    // Get contract state
    const [totalSold, hardCap, tokenPrice, usdtDecimals] = await Promise.all([
        tokenSale.totalTokensSold(),
        tokenSale.hardCap(),
        tokenSale.tokenPrice(),
        usdt.decimals()
    ]);

    console.log("\nContract State:");
    console.log(`USDT Decimals: ${usdtDecimals}`);
    console.log(`Total Tokens Sold: ${ethers.utils.formatEther(totalSold)}`);
    console.log(`Hard Cap: ${ethers.utils.formatEther(hardCap)}`);
    console.log(`Token Price: ${tokenPrice.toString()} (${ethers.utils.formatUnits(tokenPrice, 6)} USDT)`);

    // Test cases
    const testCases = [
        { usdt: "0.02", tokens: "1" },    // 0.02 USDT = 1 token
        { usdt: "0.2", tokens: "10" },     // 0.2 USDT = 10 tokens
        { usdt: "2", tokens: "100" },      // 2 USDT = 100 tokens
        { usdt: "20", tokens: "1000" }     // 20 USDT = 1000 tokens
    ];

    console.log("\nTest Cases:");
    console.log("----------------------------------------");
    for (const test of testCases) {
        // Convert amounts
        const usdtAmount = ethers.utils.parseUnits(test.usdt, 6); // USDT uses 6 decimals
        const expectedTokens = ethers.utils.parseEther(test.tokens); // Tokens use 18 decimals
        
        // Calculate expected token amount from contract formula
        const calculatedTokens = usdtAmount.mul(ethers.constants.WeiPerEther).div(tokenPrice);
        
        console.log(`\nTest Case: ${test.usdt} USDT should buy ${test.tokens} tokens`);
        console.log(`USDT Amount (6 decimals): ${usdtAmount.toString()}`);
        console.log(`Expected Tokens (18 decimals): ${expectedTokens.toString()}`);
        console.log(`Calculated Tokens (18 decimals): ${calculatedTokens.toString()}`);
        console.log(`Matches: ${expectedTokens.eq(calculatedTokens) ? 'Yes ✓' : 'No ✗'}`);
    }

    // Test actual purchase
    const testAmount = "0.02"; // Buy 1 token
    console.log("\nTesting actual purchase of 1 token:");
    const purchaseAmount = ethers.utils.parseUnits(testAmount, 6); // 20000 (0.02 USDT in 6 decimals)
    
    try {
        // Check USDT balance
        const usdtBalance = await usdt.balanceOf(deployer.address);
        console.log(`\nInitial USDT Balance: ${ethers.utils.formatUnits(usdtBalance, 6)}`);

        // Check current purchased amount
        const currentPurchased = await tokenSale.purchasedAmounts(deployer.address);
        console.log(`Current Purchased Amount: ${ethers.utils.formatEther(currentPurchased)}`);

        // Check current allowance
        const currentAllowance = await usdt.allowance(deployer.address, tokenSaleAddress);
        console.log(`Current USDT Allowance: ${ethers.utils.formatUnits(currentAllowance, 6)}`);

        // Approve USDT if needed
        if (currentAllowance.lt(purchaseAmount)) {
            console.log("\nApproving USDT...");
            const approveTx = await usdt.approve(tokenSaleAddress, purchaseAmount);
            await approveTx.wait();
            console.log("USDT approved");
        }

        // Buy tokens
        console.log("\nBuying tokens...");
        const buyTx = await tokenSale.buy(purchaseAmount);
        const receipt = await buyTx.wait();
        console.log("Purchase successful");

        // Check new balances
        const newUsdtBalance = await usdt.balanceOf(deployer.address);
        const newPurchased = await tokenSale.purchasedAmounts(deployer.address);
        
        console.log("\nResults:");
        console.log(`USDT Spent: ${ethers.utils.formatUnits(usdtBalance.sub(newUsdtBalance), 6)}`);
        console.log(`Tokens Received: ${ethers.utils.formatEther(newPurchased.sub(currentPurchased))}`);
    } catch (error) {
        console.error("\nError:", error.message);
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
