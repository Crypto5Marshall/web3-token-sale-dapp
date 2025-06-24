const { expect } = require("chai");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
const keccak256 = require('keccak256');

describe("TokenSale", function () {
  let TokenSale;
  let tokenSale;
  let MockUSDT;
  let usdt;
  let MockToken;
  let saleToken;
  let owner;
  let buyer;
  let claimer;
  let merkleTree;
  let merkleRoot;

  const TOKEN_PRICE = ethers.utils.parseUnits("0.02", 6); // 0.02 USDT
  const HARD_CAP = ethers.utils.parseEther("1000000"); // 1 million tokens
  const PER_WALLET_LIMIT = ethers.utils.parseEther("10000"); // 10k tokens
  
  beforeEach(async function () {
    // Get signers
    [owner, buyer, claimer] = await ethers.getSigners();

    // Deploy mock USDT
    MockUSDT = await ethers.getContractFactory("MockERC20");
    usdt = await MockUSDT.deploy("Mock USDT", "USDT", 6);
    await usdt.deployed();

    // Deploy mock sale token
    MockToken = await ethers.getContractFactory("MockERC20");
    saleToken = await MockToken.deploy("Sale Token", "TKN", 18);
    await saleToken.deployed();

    // Create merkle tree for claims
    const claimers = [
      {
        address: claimer.address,
        amount: ethers.utils.parseEther("1000")
      }
    ];

    // Create merkle tree
    const leafNodes = claimers.map(c => 
      ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [c.address, c.amount]
      )
    );
    merkleTree = new MerkleTree(leafNodes, keccak256, { sortPairs: true });
    merkleRoot = merkleTree.getHexRoot();

    // Get latest block timestamp
    const latestBlock = await ethers.provider.getBlock('latest');
    const startTime = latestBlock.timestamp + 3600; // Start in 1 hour
    const endTime = startTime + (7 * 24 * 3600); // Run for 1 week

    TokenSale = await ethers.getContractFactory("TokenSale");
    tokenSale = await TokenSale.deploy(
      usdt.address,
      saleToken.address,
      TOKEN_PRICE,
      HARD_CAP,
      PER_WALLET_LIMIT,
      startTime,
      endTime
    );
    await tokenSale.deployed();

    // Transfer tokens to contracts
    await saleToken.transfer(tokenSale.address, HARD_CAP);
    await usdt.transfer(buyer.address, ethers.utils.parseUnits("1000", 6));
  });

  describe("Deployment", function () {
    it("Should set the correct token addresses", async function () {
      expect(await tokenSale.usdt()).to.equal(usdt.address);
      expect(await tokenSale.saleToken()).to.equal(saleToken.address);
    });

    it("Should set the correct token price", async function () {
      expect(await tokenSale.tokenPrice()).to.equal(TOKEN_PRICE);
    });

    it("Should set the correct hard cap", async function () {
      expect(await tokenSale.hardCap()).to.equal(HARD_CAP);
    });

    it("Should set the correct per-wallet limit", async function () {
      expect(await tokenSale.perWalletLimit()).to.equal(PER_WALLET_LIMIT);
    });
  });

  describe("Token Purchase", function () {
    beforeEach(async function () {
      // Get current timestamp
      const latestBlock = await ethers.provider.getBlock('latest');
      const currentTime = latestBlock.timestamp;
      
      // Set time to sale start
      const timeToIncrease = (await tokenSale.saleStartTime()).sub(currentTime).add(1);
      await network.provider.send("evm_increaseTime", [timeToIncrease.toNumber()]);
      await network.provider.send("evm_mine");

      // Approve USDT
      await usdt.connect(buyer).approve(
        tokenSale.address,
        ethers.utils.parseUnits("1000", 6)
      );
    });

    it("Should allow token purchase", async function () {
      const usdtAmount = ethers.utils.parseUnits("1", 6); // 1 USDT
      const expectedTokens = ethers.utils.parseEther("50"); // 50 tokens (at 0.02 USDT per token)

      await expect(tokenSale.connect(buyer).buy(usdtAmount))
        .to.emit(tokenSale, "TokensPurchased")
        .withArgs(buyer.address, usdtAmount, expectedTokens);

      expect(await saleToken.balanceOf(buyer.address)).to.equal(expectedTokens);
    });

    it("Should enforce per-wallet limit", async function () {
      const usdtAmount = ethers.utils.parseUnits("1000", 6); // Try to buy too many tokens

      await expect(
        tokenSale.connect(buyer).buy(usdtAmount)
      ).to.be.revertedWith("Would exceed wallet limit");
    });

    it("Should enforce hard cap", async function () {
      // Try to buy more than hard cap
      const usdtAmount = ethers.utils.parseUnits("25000", 6); // Would exceed hard cap

      await expect(
        tokenSale.connect(buyer).buy(usdtAmount)
      ).to.be.revertedWith("Would exceed hard cap");
    });
  });

  describe("Token Claiming", function () {
    beforeEach(async function () {
      // Set merkle root
      await tokenSale.updateMerkleRoot(merkleRoot);
      
      // Transfer tokens to contract for claims
      await saleToken.transfer(tokenSale.address, ethers.utils.parseEther("10000"));
    });

    it("Should allow eligible users to claim", async function () {
      const claimAmount = ethers.utils.parseEther("1000");
      const leaf = ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [claimer.address, claimAmount]
      );
      const proof = merkleTree.getHexProof(leaf);

      await expect(tokenSale.connect(claimer).claim(proof, claimAmount))
        .to.emit(tokenSale, "TokensClaimed")
        .withArgs(claimer.address, claimAmount);

      expect(await saleToken.balanceOf(claimer.address)).to.equal(claimAmount);
    });

    it("Should prevent double claiming", async function () {
      const claimAmount = ethers.utils.parseEther("1000");
      const leaf = ethers.utils.solidityKeccak256(
        ["address", "uint256"],
        [claimer.address, claimAmount]
      );
      const proof = merkleTree.getHexProof(leaf);

      await tokenSale.connect(claimer).claim(proof, claimAmount);

      await expect(
        tokenSale.connect(claimer).claim(proof, claimAmount)
      ).to.be.revertedWith("Already claimed");
    });

    it("Should prevent claiming with invalid proof", async function () {
      const claimAmount = ethers.utils.parseEther("1000");
      const invalidProof = [ethers.utils.randomBytes(32)];

      await expect(
        tokenSale.connect(claimer).claim(invalidProof, claimAmount)
      ).to.be.revertedWith("Invalid proof");
    });
  });

  describe("Admin Functions", function () {
    it("Should allow owner to update price", async function () {
      const newPrice = ethers.utils.parseUnits("0.03", 6);
      await expect(tokenSale.setPrice(newPrice))
        .to.emit(tokenSale, "PriceUpdated")
        .withArgs(newPrice);

      expect(await tokenSale.tokenPrice()).to.equal(newPrice);
    });

    it("Should allow owner to update merkle root", async function () {
      const newRoot = "0x" + Buffer.from(ethers.utils.randomBytes(32)).toString('hex');
      await expect(tokenSale.updateMerkleRoot(newRoot))
        .to.emit(tokenSale, "MerkleRootUpdated")
        .withArgs(newRoot);

      expect(await tokenSale.merkleRoot()).to.equal(newRoot);
    });

    it("Should allow owner to withdraw USDT", async function () {
      // Get current timestamp and set time to sale start
      const latestBlock = await ethers.provider.getBlock('latest');
      const currentTime = latestBlock.timestamp;
      const timeToIncrease = (await tokenSale.saleStartTime()).sub(currentTime).add(1);
      await network.provider.send("evm_increaseTime", [timeToIncrease.toNumber()]);
      await network.provider.send("evm_mine");

      // Make a purchase
      const purchaseAmount = ethers.utils.parseUnits("1", 6); // 1 USDT
      await usdt.connect(buyer).approve(tokenSale.address, purchaseAmount);
      await tokenSale.connect(buyer).buy(purchaseAmount);

      // Check initial balances
      const contractInitialBalance = await usdt.balanceOf(tokenSale.address);
      const ownerInitialBalance = await usdt.balanceOf(owner.address);

      // Withdraw and verify
      await tokenSale.withdrawUSDT();
      
      // Contract balance should be 0
      expect(await usdt.balanceOf(tokenSale.address)).to.equal(0);
      
      // Owner should receive the contract's balance
      const ownerFinalBalance = await usdt.balanceOf(owner.address);
      expect(ownerFinalBalance.sub(ownerInitialBalance)).to.equal(contractInitialBalance);
    });

    it("Should prevent non-owners from calling admin functions", async function () {
      await expect(
        tokenSale.connect(buyer).setPrice(ethers.utils.parseUnits("0.03", 6))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        tokenSale.connect(buyer).updateMerkleRoot(ethers.utils.randomBytes(32))
      ).to.be.revertedWith("Ownable: caller is not the owner");

      await expect(
        tokenSale.connect(buyer).withdrawUSDT()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
});
