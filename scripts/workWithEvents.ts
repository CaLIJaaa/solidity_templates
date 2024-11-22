import hre, { ethers } from "hardhat";

async function main() {
    //Запускаем npx hardhat console, деплоим контракт. Делаем подписку на события - await contract.on("WorkDone", (sender, at, result) => console.log(sender, at, result))
    //await contract.queryFilter("WorkDone") - чтобы просмотреть все старые события, await contract.queryFilter("WorkDone", 1, 2) - c по такой-то блок
    //await contract.queryFilter("WorkDone", -3) - в трёх последних блоках
    //const filter2 = contract.filters.WorkDone(await signer.getAddress()) - создание фильтра по индексированному полю(в этом случе по конкреному адресу)
    // await contract.on(filter2, (data) => console.log(data)) - создание подключения по фильтру
    //await ethers.provider.getBlock(1) - получение информации о блоке
    //await ethers.provider.getTransaction(hash) - получение транзакции по хешу

}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });