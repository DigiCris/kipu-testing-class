import { expect } from "chai";
import { ethers } from "hardhat";
import { PiggyBank } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("PiggyBank Contract", function () {
  let piggyBank: PiggyBank;
  let owner: HardhatEthersSigner;
  let user: HardhatEthersSigner;
  let lockUpPeriod: number;

  beforeEach(async () => {
    // Get the signers (owner and a user)
    [owner, user] = await ethers.getSigners();
    
    // Deploy the PiggyBank contract with a lock-up period of 1 week
    lockUpPeriod = 7 * 24 * 60 * 60; // 7 days in seconds
    const PiggyBankFactory = await ethers.getContractFactory("PiggyBank");
    piggyBank = await PiggyBankFactory.deploy(lockUpPeriod);
    await piggyBank.waitForDeployment();
  });

  describe("Deployment", function () {
    it("Should deploy with the correct owner and lock-up period", async function () {
      expect(await piggyBank.owner()).to.equal(owner.address);
      expect(await piggyBank.lockUpPeriod()).to.equal(lockUpPeriod);
    });
  });

  describe("Deposit", function () {
    it("Should allow a user to deposit Ether", async function () {
      const depositAmount = ethers.parseEther("1.0");

      // Use the deposit function instead of direct transfer
      await piggyBank.connect(user).deposit({ value: depositAmount });

      const depositBalance = await piggyBank.getDepositBalance(user.address);
      expect(depositBalance).to.equal(depositAmount);
    });

    it("Should revert when trying to deposit 0 Ether", async function () {
      await expect(piggyBank.connect(user).deposit({ value: 0 }))
        .to.be.revertedWith("Must send Ether to deposit");
    });

    it("Should emit a Deposited event when Ether is deposited", async function () {
      const depositAmount = ethers.parseEther("0.5");

      await expect(piggyBank.connect(user).deposit({ value: depositAmount }))
        .to.emit(piggyBank, "Deposited")
        .withArgs(user.address, depositAmount);
    });

    it("Should update deposit time only on first deposit", async function () {
      const firstDeposit = ethers.parseEther("0.5");
      const secondDeposit = ethers.parseEther("0.5");

      // First deposit
      await piggyBank.connect(user).deposit({ value: firstDeposit });
      const firstDepositTime = (await ethers.provider.getBlock('latest'))!.timestamp;

      // Second deposit
      await piggyBank.connect(user).deposit({ value: secondDeposit });
      
      const deposit = await piggyBank.deposits(user.address);
      expect(deposit.depositTime).to.equal(firstDepositTime);
      expect(deposit.amount).to.equal(firstDeposit + secondDeposit);
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
      // Setup: User deposits some Ether
      await piggyBank.connect(user).deposit({ value: ethers.parseEther("1.0") });
    });

    it("Should allow withdrawal after lock-up period", async function () {
      // Fast-forward time
      await ethers.provider.send("evm_increaseTime", [lockUpPeriod]);
      await ethers.provider.send("evm_mine", []);

      await expect(piggyBank.connect(user).withdraw())
        .to.changeEtherBalance(user, ethers.parseEther("1.0"));
    });

    it("Should revert withdrawal before lock-up period", async function () {
      await expect(piggyBank.connect(user).withdraw())
        .to.be.revertedWith("Funds are still locked");
    });

    it("Should revert withdrawal with no deposit", async function () {
      const newUser = (await ethers.getSigners())[2];
      await expect(piggyBank.connect(newUser).withdraw())
        .to.be.revertedWith("No funds to withdraw");
    });

    it("Should correctly report unlock time", async function () {
      const depositTime = (await ethers.provider.getBlock('latest'))!.timestamp;
      const expectedUnlockTime = depositTime + lockUpPeriod;
      expect(await piggyBank.connect(user).getUnlockTime())
        .to.equal(expectedUnlockTime);
    });
  });

  describe("Owner Functions", function () {
    it("Should allow only owner to change lock-up period", async function () {
      const newPeriod = 30 * 24 * 60 * 60; // 30 days
      await expect(piggyBank.connect(user).setLockUpPeriod(newPeriod))
        .to.be.revertedWith("Not the contract owner");

      await piggyBank.connect(owner).setLockUpPeriod(newPeriod);
      expect(await piggyBank.lockUpPeriod()).to.equal(newPeriod);
    });

    it("Should allow only owner to withdraw funds", async function () {
      const amount = ethers.parseEther("1.0");
      await piggyBank.connect(user).deposit({ value: amount });

      await expect(piggyBank.connect(user).ownerWithdraw(amount))
        .to.be.revertedWith("Not the contract owner");

      await expect(piggyBank.connect(owner).ownerWithdraw(amount))
        .to.changeEtherBalance(owner, amount);
    });

    it("Should revert owner withdrawal if insufficient balance", async function () {
      const amount = ethers.parseEther("1.0");
      await expect(piggyBank.connect(owner).ownerWithdraw(amount))
        .to.be.revertedWith("Insufficient balance in the contract");
    });
  });
});