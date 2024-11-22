import hre, { ethers } from "hardhat";

async function main() {
    const [signer] = await ethers.getSigners();

    const Factory = await ethers.getContractFactory("createDeposit") //подключение к контракту
    const contract = await Factory.deploy() // создание экземпляра контракта, в() указываются параметры конструктора
    await contract.waitForDeployment(); // ждём пока развернётся

    console.log(contract)
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });