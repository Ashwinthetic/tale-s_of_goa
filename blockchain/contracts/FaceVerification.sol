// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FaceVerification
 * @dev Stores cryptographic SHA-256 biometric record hashes on-chain for HH GOA Task #3.
 * IMPORTANT: Raw face images or biometric embedding vectors are NEVER stored on-chain.
 */
contract FaceVerification {
    struct VerificationRecord {
        bytes32 recordHash;
        uint256 timestamp;
        address recorder;
    }

    // Mapping from record hash to VerificationRecord struct
    mapping(bytes32 => VerificationRecord) public records;

    // Event emitted when a biometric record hash is committed on-chain
    event VerificationRecorded(
        bytes32 indexed recordHash,
        uint256 timestamp,
        address indexed recorder
    );

    /**
     * @notice Store a biometric record hash on the blockchain.
     * @param recordHash The 32-byte SHA-256 hash of the canonical biometric record.
     */
    function recordVerification(bytes32 recordHash) external returns (bool) {
        require(recordHash != bytes32(0), "Invalid record hash");

        records[recordHash] = VerificationRecord({
            recordHash: recordHash,
            timestamp: block.timestamp,
            recorder: msg.sender
        });

        emit VerificationRecorded(recordHash, block.timestamp, msg.sender);
        return true;
    }

    /**
     * @notice Verify if a record hash exists on-chain.
     * @param recordHash The hash to query.
     */
    function getVerification(bytes32 recordHash) external view returns (uint256 timestamp, address recorder) {
        VerificationRecord memory rec = records[recordHash];
        require(rec.timestamp != 0, "Record hash not found");
        return (rec.timestamp, rec.recorder);
    }
}
