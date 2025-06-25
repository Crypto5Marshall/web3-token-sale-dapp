const { ethers } = require("hardhat");

async function main() {
    const [deployer] = await ethers.getSigners();
    console.log("Testing with account:", deployer.address);

    // Contract addresses
    const tokenSaleAddress = "0xbc485534dab82189644377E2C6a0331EaD288812";
    const usdtAddress = "0x973104fAa7F2B11787557e85953ECA6B4e262328";
    const mockErc20Address = "0x28e24aD822d811cB2af812f23DA2E92dBf8Bc290";

    // Contract ABIs
    const TokenSaleABI = [
        "function buy(uint256 usdtAmount) external",
        "function withdrawUSDT() external",
        "function getClaimInfo(address user) external view returns (uint256 claimable, uint256 timeRemaining)",
        "function claim() external"
    ];
    const ERC20ABI = [
        "function approve(address spender, uint256 amount) external returns (bool)",
        "function balanceOf(address account) external view returns (uint256)",
        "function transfer(address to, uint256 amount) external returns (bool)"
    ];

    // Contract instances
    const tokenSale = new ethers.Contract(tokenSaleAddress, TokenSaleABI, deployer);
    const usdt = new ethers.Contract(usdtAddress, ERC20ABI, deployer);
    const mockErc20 = new ethers.Contract(mockErc20Address, ERC20ABI, deployer);

    console.log("\nInitial Balances:");
    console.log("----------------");
    const initialUsdtBalance = await usdt.balanceOf(deployer.address);
    const initialContractUsdt = await usdt.balanceOf(tokenSaleAddress);
    console.log("Your USDT Balance:", ethers.utils.formatUnits(initialUsdtBalance, 6));
    console.log("Contract USDT Balance:", ethers.utils.formatUnits(initialContractUsdt, 6));

    try {
        // 1. Approve USDT
        console.log("\nApproving USDT...");
        const amount = ethers.utils.parseUnits("100", 6); // 100 USDT
        const approveTx = await usdt.approve(tokenSaleAddress, amount);
        await approveTx.wait();
        console.log("USDT Approved!");

        // 2. Buy Tokens
        console.log("\nBuying Tokens...");
        const buyTx = await tokenSale.buy(amount);
        await buyTx.wait();
        console.log("Tokens Purchased!");

        // 3. Check balances after purchase
        console.log("\nBalances After Purchase:");
        console.log("----------------------");
        const afterUsdtBalance = await usdt.balanceOf(deployer.address);
        const afterContractUsdt = await usdt.balanceOf(tokenSaleAddress);
        console.log("Your USDT Balance:", ethers.utils.formatUnits(afterUsdtBalance, 6));
        console.log("Contract USDT Balance:", ethers.utils.formatUnits(afterContractUsdt, 6));

        // 4. Check claim info
        console.log("\nChecking Claim Info:");
        console.log("-----------------");
        const [claimable, timeRemaining] = await tokenSale.getClaimInfo(deployer.address);
        console.log("Claimable Amount:", ethers.utils.formatEther(claimable));
        console.log("Time Remaining:", timeRemaining.toString(), "seconds");

        // 5. Withdraw USDT from contract
        console.log("\nWithdrawing USDT from contract...");
        const withdrawTx = await tokenSale.withdrawUSDT();
        await withdrawTx.wait();
        console.log("USDT Withdrawn!");

        // 6. Final balances
        console.log("\nFinal Balances:");
        console.log("---------------");
        const finalUsdtBalance = await usdt.balanceOf(deployer.address);
        const finalContractUsdt = await usdt.balanceOf(tokenSaleAddress);
        console.log("Your USDT Balance:", ethers.utils.formatUnits(finalUsdtBalance, 6));
        console.log("Contract USDT Balance:", ethers.utils.formatUnits(finalContractUsdt, 6));

    } catch (error) {
        console.error("\nError:", error.message);
        if (error.data) {
            console.error("Error data:", error.data);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch(error => {
        console.error(error);
        process.exit(1);
    });
