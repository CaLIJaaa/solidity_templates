import hre, { ethers } from "hardhat";

async function main() {
    console.log('DEPLOYING...')

    const [deployer] = await ethers.getSigners()

    const Demo = await ethers.getContractFactory("EventsWork", deployer)
    const demo = await Demo.deploy()
    await demo.waitForDeployment()

    console.log(await demo.getAddress())

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });