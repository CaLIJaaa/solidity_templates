import hre, { ethers } from "hardhat";

async function main() {
    const [signer1, signer2] = await ethers.getSigners();
    const contractAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3"

    const demo = await ethers.getContractAt("testContr", contractAddr, signer1);

    console.log(await demo.owner())

    const txData = {
        value: ethers.parseEther("1"),
        to: contractAddr,
    }

    const tx = await signer1.sendTransaction(txData)
    await tx.wait()

    const provider = ethers.provider;
    const addr1 = await signer1.getAddress()
    const addr2 = await signer2.getAddress()

    console.log(`balance: ${ethers.formatEther(await provider.getBalance(contractAddr))}`)
    console.log(await demo.transfers(signer1))

    // const txChangeOwner = await demo.changeOwner(signer2)
    // await txChangeOwner.wait()

    // console.log(await demo.owner())

    const txChangeOwner2 = await demo.connect(signer2).changeOwner(addr1) //оно работает. Хз чего подчеркивает
    await txChangeOwner2.wait()
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });