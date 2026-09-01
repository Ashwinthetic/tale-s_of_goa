const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("FaceVerification Smart Contract", function () {
  let faceVerification;
  let owner;

  beforeEach(async function () {
    [owner] = await ethers.getSigners();
    const FaceVerificationFactory = await ethers.getContractFactory("FaceVerification");
    faceVerification = await FaceVerificationFactory.deploy();
  });

  it("Should record a biometric verification hash and emit VerificationRecorded event", async function () {
    const sampleHash = ethers.keccak256(ethers.toUtf8Bytes("sample_biometric_record"));

    await expect(faceVerification.recordVerification(sampleHash))
      .to.emit(faceVerification, "VerificationRecorded")
      .withArgs(sampleHash, await ethers.provider.getBlock('latest').then(b => b.timestamp + 1), owner.address);

    const record = await faceVerification.getVerification(sampleHash);
    expect(record.recorder).to.equal(owner.address);
    expect(record.timestamp).to.be.gt(0);
  });

  it("Should reject zero bytes32 hash", async function () {
    const zeroHash = "0x0000000000000000000000000000000000000000000000000000000000000000";
    await expect(faceVerification.recordVerification(zeroHash)).to.be.revertedWith("Invalid record hash");
  });
});
