import { expect } from "chai";
import { ethers } from "hardhat";
import { RendexToken, CDIOracle } from "../typechain-types";
import { SignerWithAddress } from "@ethersproject/contracts";

describe("RendexToken", function () {
  let rendexToken: RendexToken;
  let cdiOracle: CDIOracle;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let unauthorized: SignerWithAddress;

  const INITIAL_CDI = 1000; // 10% in basis points
  const TOKEN_NAME = "Rendex Token";
  const TOKEN_SYMBOL = "RDX";
  const INITIAL_SUPPLY = ethers.parseEther("1000000"); // 1M tokens

  beforeEach(async function () {
    [owner, user1, user2, unauthorized] = await ethers.getSigners();

    // Deploy CDI Oracle
    const CDIOracle = await ethers.getContractFactory("CDIOracle");
    cdiOracle = await CDIOracle.deploy(INITIAL_CDI);

    // Deploy RendexToken directly
    const RendexToken = await ethers.getContractFactory("RendexToken");
    rendexToken = await RendexToken.deploy(
      TOKEN_NAME,
      TOKEN_SYMBOL,
      await cdiOracle.getAddress(),
      INITIAL_SUPPLY
    );
  });

  describe("Deployment", function () {
    it("Should deploy with correct initial values", async function () {
      expect(await rendexToken.name()).to.equal(TOKEN_NAME);
      expect(await rendexToken.symbol()).to.equal(TOKEN_SYMBOL);
      expect(await rendexToken.cdiOracle()).to.equal(await cdiOracle.getAddress());
      expect(await rendexToken.totalSupply()).to.equal(INITIAL_SUPPLY);
      expect(await rendexToken.balanceOf(owner.address)).to.equal(INITIAL_SUPPLY);
    });

    it("Should have correct rebase parameters", async function () {
      expect(await rendexToken.REBASE_INTERVAL()).to.equal(24 * 60 * 60); // 1 day
      expect(await rendexToken.CDI_MULTIPLIER()).to.equal(120); // 120%
      expect(await rendexToken.sharesPerToken()).to.equal(ethers.parseEther("1"));
    });
  });

  describe("CDI Integration", function () {
    it("Should get current CDI from oracle", async function () {
      expect(await rendexToken.getCurrentCDI()).to.equal(INITIAL_CDI);
    });

    it("Should calculate correct rebase rate", async function () {
      // 120% of 10% = 12%
      const expectedRebaseRate = (INITIAL_CDI * 120) / 100;
      expect(await rendexToken.calculateRebaseRate()).to.equal(expectedRebaseRate);
    });

    it("Should update CDI rate correctly", async function () {
      const newCDI = 1500; // 15%
      await cdiOracle.updateCDI(newCDI);
      expect(await rendexToken.getCurrentCDI()).to.equal(newCDI);
    });
  });

  describe("Rebasing", function () {
    it("Should not allow rebase before interval", async function () {
      await expect(rendexToken.rebase()).to.be.revertedWith(
        "RendexToken: rebase not ready"
      );
    });

    it("Should not allow unauthorized rebase", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(rendexToken.connect(unauthorized).rebase()).to.be.revertedWith(
        "RendexToken: caller is not the rebaser"
      );
    });

    it("Should execute rebase correctly", async function () {
      // Fast forward time
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      const balanceBefore = await rendexToken.balanceOf(owner.address);
      const rebaseCountBefore = await rendexToken.rebaseCount();

      await rendexToken.rebase();

      const balanceAfter = await rendexToken.balanceOf(owner.address);
      const rebaseCountAfter = await rendexToken.rebaseCount();

      expect(balanceAfter).to.be.gt(balanceBefore);
      expect(rebaseCountAfter).to.equal(rebaseCountBefore + 1n);
    });

    it("Should emit RebaseExecuted event", async function () {
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);

      await expect(rendexToken.rebase())
        .to.emit(rendexToken, "RebaseExecuted")
        .withArgs(
          1, // rebaseCount
          INITIAL_CDI, // cdiRate
          (INITIAL_CDI * 120) / 100, // rebaseRate
          anyValue, // newSharesPerToken
          anyValue // timestamp
        );
    });
  });

  describe("Token Transfers", function () {
    beforeEach(async function () {
      // Transfer some tokens to user1
      await rendexToken.transfer(user1.address, ethers.parseEther("1000"));
    });

    it("Should transfer tokens correctly", async function () {
      const transferAmount = ethers.parseEther("100");
      const balanceBefore = await rendexToken.balanceOf(user2.address);

      await rendexToken.connect(user1).transfer(user2.address, transferAmount);

      const balanceAfter = await rendexToken.balanceOf(user2.address);
      expect(balanceAfter).to.equal(balanceBefore + transferAmount);
    });

    it("Should maintain correct balances after rebase", async function () {
      const user1BalanceBefore = await rendexToken.balanceOf(user1.address);
      const user2BalanceBefore = await rendexToken.balanceOf(user2.address);

      // Execute rebase
      await ethers.provider.send("evm_increaseTime", [24 * 60 * 60 + 1]);
      await ethers.provider.send("evm_mine", []);
      await rendexToken.rebase();

      const user1BalanceAfter = await rendexToken.balanceOf(user1.address);
      const user2BalanceAfter = await rendexToken.balanceOf(user2.address);

      // Both balances should increase proportionally
      expect(user1BalanceAfter).to.be.gt(user1BalanceBefore);
      expect(user2BalanceAfter).to.be.gt(user2BalanceBefore);
    });
  });

  describe("Pausing", function () {
    it("Should pause and unpause correctly", async function () {
      await rendexToken.pause();
      expect(await rendexToken.paused()).to.be.true;

      await rendexToken.unpause();
      expect(await rendexToken.paused()).to.be.false;
    });

    it("Should not allow transfers when paused", async function () {
      await rendexToken.pause();
      
      await expect(
        rendexToken.transfer(user1.address, ethers.parseEther("100"))
      ).to.be.revertedWith("Pausable: paused");
    });
  });

  describe("Utility Functions", function () {
    it("Should return correct rebase stats", async function () {
      const stats = await rendexToken.getRebaseStats();
      
      expect(stats[0]).to.equal(await rendexToken.lastRebaseTime()); // lastRebaseTime
      expect(stats[1]).to.equal(await rendexToken.getNextRebaseTime()); // nextRebaseTime
      expect(stats[2]).to.equal(0); // rebaseCount
      expect(stats[3]).to.equal(INITIAL_CDI); // currentCDI
      expect(stats[4]).to.equal((INITIAL_CDI * 120) / 100); // rebaseRate
      expect(stats[5]).to.be.false; // isReady
    });

    it("Should return correct share calculations", async function () {
      const tokenAmount = ethers.parseEther("1000");
      const shares = await rendexToken.sharesForTokens(tokenAmount);
      const calculatedTokens = await rendexToken.tokensForShares(shares);
      
      expect(calculatedTokens).to.equal(tokenAmount);
    });
  });

  describe("Oracle Integration", function () {
    it("Should update oracle correctly", async function () {
      const newOracle = await ethers.deployContract("CDIOracle", [1500]);
      
      await expect(rendexToken.updateCDIOracle(await newOracle.getAddress()))
        .to.emit(rendexToken, "CDIOracleUpdated")
        .withArgs(await cdiOracle.getAddress(), await newOracle.getAddress());
    });

    it("Should not allow invalid oracle address", async function () {
      await expect(
        rendexToken.updateCDIOracle(ethers.ZeroAddress)
      ).to.be.revertedWith("RendexToken: invalid oracle address");
    });
  });
});

// Helper function for event testing
function anyValue() {
  return true;
} 