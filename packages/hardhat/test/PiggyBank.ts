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

  });

  describe("Deployment", function () {
    it("Should deploy with the correct owner and lock-up period", async function () {
    });
  });

  describe("Deposit", function () {
    it("Should allow a user to deposit Ether", async function () {
    });

    it("Should revert when trying to deposit 0 Ether", async function () {
    });

    it("Should emit a Deposited event when Ether is deposited", async function () {
    });

    it("Should update deposit time only on first deposit", async function () {
    });
  });

  describe("Withdraw", function () {
    beforeEach(async function () {
    });

    it("Should allow withdrawal after lock-up period", async function () {
    });

    it("Should revert withdrawal before lock-up period", async function () {
    });

    it("Should revert withdrawal with no deposit", async function () {
    });

    it("Should correctly report unlock time", async function () {
    });
  });

  describe("Owner Functions", function () {
    it("Should allow only owner to change lock-up period", async function () {
    });

    it("Should allow only owner to withdraw funds", async function () {
    });

    it("Should revert owner withdrawal if insufficient balance", async function () {
    });
  });
});