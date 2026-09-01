// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract SampleContract {
    string public name;

    event NameUpdated(string newName);

    constructor(string memory _initialName) {
        name = _initialName;
    }

    function updateName(string memory _newName) public {
        name = _newName;
        emit NameUpdated(_newName);
    }
}
