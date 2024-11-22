const hre = require("hardhat");
const { ethers } = hre;

async function main() {

    const provider = new ethers.JsonRpcProvider("https://arb-sepolia.g.alchemy.com/v2/3fZE8g3WdRYEWTk2guGpWNgSeqnNo0Q7");

    const contractAddr = "0xa91176BD792a6Ce23132eeaa73CB17b5fe417B62"

    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY_ARBITRUM_SEPOLIA, provider);

    const createDepoContract = await ethers.getContractAt("createDeposit", contractAddr, provider);

    const contractWithSigner = createDepoContract.connect(wallet);


    // const linkSigner = await contractWithSigner.linkVertexSigner(contractAddr, "0xD32ea1C76ef1c296F131DD4C5B2A0aac3b22485a");
    // console.log('Транзакция подключения отправлена. Хэш:', linkSigner.hash);
    // await linkSigner.wait();
    // console.log('Транзакция подтверждена.');

    // const createShort = await contractWithSigner.createShort("0xD32ea1C76ef1c296F131DD4C5B2A0aac3b22485a")
    // console.log('Транзакция создания шорта отправлена. Хэш:', createShort.hash);
    // await createShort.wait()
    // console.log("Транзакция подтверждена")

    const execute = await contractWithSigner.executeTransaction()
    console.log('Транзакция запуска предыдущих транзакций отправлена. Хэш:', execute.hash);
    await execute.wait()
    console.log("Транзакция подтверждена")

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });