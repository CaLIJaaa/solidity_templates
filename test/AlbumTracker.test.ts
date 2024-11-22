import { loadFixture, ethers, expect } from "./setup";
import { AlbumTracker, Album__factory } from "../typechain-types";
import { ContractTransactionReceipt } from "ethers";
 
describe("AlbumTracker", function() { //открытие блока теста
    async function deploy() { //функция развёртываения контракта
        const [signer, buyer] = await ethers.getSigners()

        const AlbumTracker = await ethers.getContractFactory("AlbumTracker");
        const tracker = await AlbumTracker.deploy()
        await tracker.waitForDeployment()

        return { tracker, signer, buyer }
    }

    it("deploys albums", async function() { //написание теста
        const { tracker, buyer } = await loadFixture(deploy); //развёртывание чистого контракта

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("0.0004")

        await createAlbum(tracker, albumTitle, albumPrice) //создание альбома

        const expectedAlbumAddr = await precomputeAddress(tracker) // предсказание адреса альбома

        const album = Album__factory.connect(expectedAlbumAddr, buyer) //подключение к контракту альбома
        
        expect(await album.price()).to.eq(albumPrice) //проверка правильности работы
        expect(await album.title()).to.eq(albumTitle)
        expect(await album.purchased()).to.be.false;
        expect(await album.index()).to.eq(0);
    } 

    ) 

    it("create albums", async function() {
        const { tracker, buyer } = await loadFixture(deploy); 

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("0.0004")

        const receiptTx = await createAlbum(tracker, albumTitle, albumPrice)

        const album = await tracker.albums(0);

        expect(album.price).to.eq(albumPrice) // тут не надо ставить await и () так как await tracker.albums(0) возвращает готовые данные   
        expect(album.title).to.eq(albumTitle)
        expect(album.state).to.eq(0)

        const expectedAlbumAddr = await precomputeAddress(tracker)

        expect(receiptTx?.logs[0].topics[1]).to.eq(ethers.zeroPadValue(expectedAlbumAddr, 32)) // просмотриваем событие для транзакции
        await expect(receiptTx).to.emit(tracker, "AlbumStateChanged").withArgs(expectedAlbumAddr, 0, 0); //Проверка что было создано событие с этим именем (то же самое что в предыдущей строке) в случае с emit должно быть await!!!!!

    })

    it("Allows to buy album", async function() {
        const { tracker, buyer } = await loadFixture(deploy); 

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("0.0004")

        await createAlbum(tracker, albumTitle, albumPrice)

        const expectedAlbumAddr = await precomputeAddress(tracker)

        const album = Album__factory.connect(expectedAlbumAddr, buyer)

        const buyTxData = {
            to: expectedAlbumAddr,
            value: albumPrice
        }

        const buyTx = await buyer.sendTransaction(buyTxData);
        await buyTx.wait();

        expect(await album.purchased()).to.be.true
        expect((await tracker.albums(0)).state).to.eq(1)

        await expect(buyTx).to.changeEtherBalances([buyer, tracker], [-albumPrice, albumPrice]) // проверка где что списалось где что добавилось приавльно (с учетом газа)

        await expect(buyer.sendTransaction(buyTxData)).to.be.revertedWith("This album is already purchased!")
    })

    it("valid means", async function() {
        const { tracker, buyer } = await loadFixture(deploy); 

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("1")

        await createAlbum(tracker, albumTitle, albumPrice)

        const expectedAlbumAddr = await precomputeAddress(tracker) 

        const album = Album__factory.connect(expectedAlbumAddr, buyer)

        const txData = {
            to: expectedAlbumAddr,
            value: ethers.parseEther('2')
        }

        await expect(buyer.sendTransaction(txData)).to.be.revertedWith("We accept only full payments!")

    })

    it("only Owner test", async function() {
        const { tracker, buyer } = await loadFixture(deploy); 

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("1")

        await expect(tracker.connect(buyer).createAlbum(albumPrice, albumTitle)).to.be.revertedWithCustomError(tracker, "OwnableUnauthorizedAccount").withArgs(buyer.address)
        await expect(tracker.connect(buyer).triggerDelivery(0)).to.be.revertedWithCustomError(tracker, "OwnableUnauthorizedAccount").withArgs(buyer.address)
    })

    it("triggerDelivery test", async function() {
        const { tracker, buyer } = await loadFixture(deploy); 

        const albumTitle = "Pil"
        const albumPrice = ethers.parseEther("1")

        await createAlbum(tracker, albumTitle, albumPrice)

        const expectedAlbumAddr = await precomputeAddress(tracker) 

        const buyTx = await tracker.triggerPayment(0, {value: ethers.parseEther("1")});
        await buyTx.wait();

        const delivTx = await tracker.triggerDelivery(0);
        const delivTxFinal = await delivTx.wait();

        expect((await tracker.albums(0)).state).to.eq(2)
        await expect(delivTxFinal).to.emit(tracker, "AlbumStateChanged").withArgs(expectedAlbumAddr, 0, 2);

    })

    async function precomputeAddress(tracker: AlbumTracker, nonce = 1): Promise<string> { 
        return ethers.getCreateAddress({
            from: await tracker.getAddress(),
            nonce
        })
    } //функция для предсказания адреса

    async function createAlbum(tracker: AlbumTracker, title: string, price: bigint): Promise<null | ContractTransactionReceipt> {
        const createAlbumTx = await tracker.createAlbum(price, title);

        return await createAlbumTx.wait();

    } //функция для создания альбома
}) 