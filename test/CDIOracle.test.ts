import { expect } from "chai";
import { ethers } from "hardhat";
import { anyValue } from "@nomicfoundation/hardhat-chai-matchers/withArgs";
import { CDIOracle } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("CDIOracle", function () {
  let oracle: CDIOracle;
  let owner: HardhatEthersSigner;
  let updater: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  const INITIAL_CDI = 534; // 0.0534%/day in units of 0.0001%

  beforeEach(async function () {
    [owner, updater, stranger] = await ethers.getSigners();
    const CDIOracle = await ethers.getContractFactory("CDIOracle");
    oracle = await CDIOracle.deploy(INITIAL_CDI, owner.address);
    await oracle.waitForDeployment();
  });

  describe("Deployment", function () {
    it("sets the initial CDI rate", async function () {
      expect(await oracle.getCDI()).to.equal(INITIAL_CDI);
    });

    it("sets the owner", async function () {
      expect(await oracle.owner()).to.equal(owner.address);
    });

    it("records lastUpdateTime on deploy", async function () {
      const lastUpdate = await oracle.getLastUpdateTime();
      expect(lastUpdate).to.be.gt(0);
    });

    it("is not stale immediately after deploy", async function () {
      expect(await oracle.isStale()).to.be.false;
    });

    it("is healthy after deploy", async function () {
      expect(await oracle.isHealthy()).to.be.true;
    });
  });

  describe("updateCDI", function () {
    it("allows owner to update CDI", async function () {
      await oracle.connect(owner).updateCDI(641);
      expect(await oracle.getCDI()).to.equal(641);
    });

    it("allows authorized updater to update CDI", async function () {
      await oracle.connect(owner).setAuthorizedUpdater(updater.address, true);
      await oracle.connect(updater).updateCDI(641);
      expect(await oracle.getCDI()).to.equal(641);
    });

    it("reverts for unauthorized caller", async function () {
      await expect(oracle.connect(stranger).updateCDI(1365))
        .to.be.revertedWith("CDIOracle: caller is not authorized updater");
    });

    it("reverts if rate exceeds MAX_CDI_RATE", async function () {
      await expect(oracle.connect(owner).updateCDI(500001))
        .to.be.revertedWith("CDIOracle: invalid CDI rate");
    });

    it("emits CDIUpdated event", async function () {
      await expect(oracle.connect(owner).updateCDI(641))
        .to.emit(oracle, "CDIUpdated")
        .withArgs(INITIAL_CDI, 641, anyValue, owner.address);
    });
  });

  describe("setAuthorizedUpdater", function () {
    it("grants and revokes updater permission", async function () {
      await oracle.connect(owner).setAuthorizedUpdater(updater.address, true);
      expect(await oracle.authorizedUpdaters(updater.address)).to.be.true;

      await oracle.connect(owner).setAuthorizedUpdater(updater.address, false);
      expect(await oracle.authorizedUpdaters(updater.address)).to.be.false;
    });

    it("reverts for zero address", async function () {
      await expect(oracle.connect(owner).setAuthorizedUpdater(ethers.ZeroAddress, true))
        .to.be.revertedWith("CDIOracle: invalid updater address");
    });

    it("reverts if called by non-owner", async function () {
      await expect(oracle.connect(stranger).setAuthorizedUpdater(updater.address, true))
        .to.be.reverted;
    });
  });

  describe("Staleness", function () {
    it("becomes stale after 7 days", async function () {
      const sevenDays = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [sevenDays + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await oracle.isStale()).to.be.true;
    });

    it("is not stale just before 7 days", async function () {
      const almostSevenDays = 7 * 24 * 60 * 60 - 10;
      await ethers.provider.send("evm_increaseTime", [almostSevenDays]);
      await ethers.provider.send("evm_mine", []);
      expect(await oracle.isStale()).to.be.false;
    });

    it("getTimeUntilStale returns 0 when stale", async function () {
      const sevenDays = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [sevenDays + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await oracle.getTimeUntilStale()).to.equal(0);
    });

    it("isHealthy returns false when stale", async function () {
      const sevenDays = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [sevenDays + 1]);
      await ethers.provider.send("evm_mine", []);
      expect(await oracle.isHealthy()).to.be.false;
    });
  });

  describe("emergencyUpdateCDI", function () {
    it("allows owner to update when stale", async function () {
      const sevenDays = 7 * 24 * 60 * 60;
      await ethers.provider.send("evm_increaseTime", [sevenDays + 1]);
      await ethers.provider.send("evm_mine", []);

      await oracle.connect(owner).emergencyUpdateCDI(641);
      expect(await oracle.getCDI()).to.equal(641);
      expect(await oracle.isStale()).to.be.false;
    });

    it("reverts if rate is not stale", async function () {
      await expect(oracle.connect(owner).emergencyUpdateCDI(1500))
        .to.be.revertedWith("CDIOracle: rate not stale, use regular update");
    });
  });

  describe("getCDIWithMetadata", function () {
    it("returns rate, timestamp, and validity", async function () {
      const [cdiRate, lastUpdate, isValid] = await oracle.getCDIWithMetadata();
      expect(cdiRate).to.equal(INITIAL_CDI);
      expect(lastUpdate).to.be.gt(0);
      expect(isValid).to.be.true;
    });
  });

  describe("Pause", function () {
    it("owner can pause and unpause", async function () {
      await oracle.connect(owner).pause();
      expect(await oracle.paused()).to.be.true;
      expect(await oracle.isHealthy()).to.be.false;

      await oracle.connect(owner).unpause();
      expect(await oracle.paused()).to.be.false;
    });
  });
});
