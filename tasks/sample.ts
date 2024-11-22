import { task } from "hardhat/config"

task("get_owner", "Read demo owner").setAction(async (_taskArgs, { ethers }) => { //не параметризованный
    console.log("running task...")
    const [signer] = await ethers.getSigners()
    const contractAddr = "0x5fbdb2315678afecb367f032d93f642f64180aa3"
    const demo = await ethers.getContractAt("testContr", contractAddr, signer);

    console.log(await demo.owner())
})

task("get_owner_from_contract", "Read demo owner from contract") //параметризованный
    .addParam("contract", "address contract to call")
    .setAction(async (_taskArgs, { ethers }) => {
        console.log("running task...")
        const [signer] = await ethers.getSigners()
        const contractAddr = _taskArgs.contract //"0x5fbdb2315678afecb367f032d93f642f64180aa3"
        const demo = await ethers.getContractAt("testContr", contractAddr, signer);

        console.log(await demo.owner())
    })