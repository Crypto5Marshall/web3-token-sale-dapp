const { ethers } = require("hardhat");

async function main() {
    console.log("Testing Token Sale Decimal Handling\n");

    // Test cases
    const testCases = [
        "0.02",    // 1 token
        "0.2",     // 10 tokens
        "2",       // 100 tokens
        "20",      // 1000 tokens
        "200"      // 10000 tokens (max)
    ];

    console.log("Test Cases:");
    console.log("-----------");
    for (const usdtAmount of testCases) {
        // Convert to BigNumber with 18 decimals for precise calculation
        const usdtAmountBN = ethers.utils.parseUnits(usdtAmount, 18);
        const tokenPriceBN = ethers.utils.parseUnits("0.02", 18);
        
        // Calculate tokens: USDT amount / token price
        const tokenAmountBN = usdtAmountBN.mul(ethers.constants.WeiPerEther).div(tokenPriceBN);
        
        console.log(`\nUSDT Amount: ${usdtAmount}`);
        console.log(`USDT Amount (wei): ${usdtAmountBN.toString()}`);
        console.log(`Token Amount: ${ethers.utils.formatEther(tokenAmountBN)}`);
        console.log(`Token Amount (wei): ${tokenAmountBN.toString()}`);
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
        "function tokenPrice() external view returns (uint256)"
    ];
    const ERC20ABI = [
        "function decimals() external view returns (uint8)",
        "function approve(address spender, uint256 amount) external returns (bool)"
    ];

    // Contract instances
    const tokenSale = new ethers.Contract(tokenSaleAddress, TokenSaleABI, deployer);
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, deployer);

    // Get USDT decimals
    const usdtDecimals = await usdt.decimals();
    console.log(`USDT Decimals: ${usdtDecimals}`);

    // Get token price
    const tokenPrice = await tokenSale.tokenPrice();
    console.log(`Token Price (wei): ${tokenPrice.toString()}`);
    console.log(`Token Price (formatted): ${ethers.utils.formatUnits(tokenPrice, usdtDecimals)} USDT`);

    // Test a small purchase (0.02 USDT = 1 token)
    const testAmount = "0.02";
    console.log(`\nTesting purchase of ${testAmount} USDT:`);
    const purchaseAmount = ethers.utils.parseUnits(testAmount, usdtDecimals);
    console.log(`Purchase amount (wei): ${purchaseAmount.toString()}`);

    try {
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
    } catch (error) {
        console.error("Error:", error.message);
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
