// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract PiggyBank {
    address public owner; // Owner of the piggy bank (could be the contract deployer)
    uint public lockUpPeriod; // Lock-up period in seconds

    // Struct to represent each user's deposit information
    struct Deposit {
        uint amount;         // Amount of Ether the user has deposited
        uint depositTime;    // Timestamp of when the deposit was made
    }

    mapping(address => Deposit) public deposits; // Mapping from user address to their deposit details

    event Deposited(address indexed user, uint amount);
    event Withdrawn(address indexed user, uint amount);

    // Modifier to ensure only the owner can withdraw or set the lock-up period
    modifier onlyOwner() {
        require(msg.sender == owner, "Not the contract owner");
        _;
    }

    // Constructor to set the initial owner and the lock-up period
    constructor(uint _lockUpPeriod) {
        owner = msg.sender;
        lockUpPeriod = _lockUpPeriod;  // Set the lock-up period (in seconds)
    }

    // Deposit Ether into the PiggyBank
    function deposit() external payable {
        require(msg.value > 0, "Must send Ether to deposit");

        Deposit storage userDeposit = deposits[msg.sender];

        // If the user already has a deposit, we just add to it
        userDeposit.amount += msg.value;

        // If this is the user's first deposit, we set the deposit time
        if (userDeposit.depositTime == 0) userDeposit.depositTime = block.timestamp;

        emit Deposited(msg.sender, msg.value);
    }

    // Withdraw funds after the lock-up period has passed
    function withdraw() external {
        Deposit storage userDeposit = deposits[msg.sender];
        require(userDeposit.amount > 0, "No funds to withdraw");
        require(block.timestamp >= userDeposit.depositTime + lockUpPeriod, "Funds are still locked");

        uint amountToWithdraw = userDeposit.amount;
        userDeposit.amount = 0; // Reset the user's deposit

        // Transfer the funds back to the user
        payable(msg.sender).transfer(amountToWithdraw);

        emit Withdrawn(msg.sender, amountToWithdraw);
    }

    // View the balance of the user's deposit
    function getDepositBalance(address _user) external view returns (uint) {
        return deposits[_user].amount;
    }

    // View the time at which the user can withdraw their funds
    function getUnlockTime() external view returns (uint) {
        return deposits[msg.sender].depositTime + lockUpPeriod;
    }

    // Owner can update the lock-up period (if desired)
    function setLockUpPeriod(uint _newLockUpPeriod) external onlyOwner {
        lockUpPeriod = _newLockUpPeriod;
    }

    // Owner can withdraw all funds (for example, in case of emergencies)
    function ownerWithdraw(uint amount) external onlyOwner {
        require(amount <= address(this).balance, "Insufficient balance in the contract");
        payable(owner).transfer(amount);
    }
}
