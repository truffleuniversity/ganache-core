pragma solidity ^0.4.2;

contract Payable {
    uint public balance;
    function deposit() external payable {
        balance = address(this).balance;
    }
}
