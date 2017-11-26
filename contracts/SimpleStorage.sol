pragma solidity ^0.4.18;

contract SimpleStorage {
    string storedData; // 存储图片hash

    function set(string x) public {
        storedData = x;
    }

    function get() view public returns (string x) {
        return storedData;
    }
}
