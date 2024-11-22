import hre, { ethers } from "hardhat";

async function main() {
    const provider = ethers.provider; //это то, к чему мы коннектимся (мейннет, тестнет, в нашем случае ethers.provider) (если хочется работать с блокчейном на локалхосте то надо в конце команды писать --network localhost)
    // const provider = new ethers.JsonRpcProvider("http://127.0.0.1:8545/") //второй споосб подключения. Подключает к конкретной работающей ноде (почему-то не сработал)

    //const signer = await provider.getSigner() //тот, кто подписывает транзакцию. Вытаскивает первый аккаунт ил локальной ноды
    const [signer] = await ethers.getSigners() //второй способ вытащить signer. Достаёт первого из списка

    const addr = await signer.getAddress(); //получение адреса

    console.log(signer)
    console.log(addr)

    const reciever = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8" //получатель средств

    const amount = ethers.parseEther("1") //количество в wei

    const txData = {
        to: reciever,
        value: amount
    } //задаём данные о транзакции

    const tx = await signer.sendTransaction(txData); //signer отправляет транзакцию
    await tx.wait() //дожидаемся подтверждения

    console.log(tx)

    const balance = await provider.getBalance(reciever); //получение баланса ресивера

    console.log(ethers.formatEther(balance))

}

main()
    .catch((error) => {
        console.error(error);
        process.exitCode = 1;
    });