const hre = require("hardhat");

async function main() {
  console.log("[Blockchain] Deploying FaceVerification smart contract...");

  const FaceVerification = await hre.ethers.getContractFactory("FaceVerification");
  const faceVerification = await FaceVerification.deploy();

  await faceVerification.waitForDeployment();
  const contractAddress = await faceVerification.getAddress();

  console.log(`[Blockchain] FaceVerification deployed successfully to: ${contractAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
