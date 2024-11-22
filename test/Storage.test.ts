import { loadFixture, ethers, expect, upgrades } from "./setup";

describe("Box", function() { //открытие блока теста
    async function deploy() { //функция развёртываения контракта
        const [ deployer ] = await ethers.getSigners()

        const StorageFactory = await ethers.getContractFactory("Storage");
        const storage = await upgrades.deployProxy(StorageFactory, [100], { //деплой контракта через прокси ([100] - аргумент конструктора ( в нашем случае функции))
                initializer: "initialize"
        }) 

        return { storage, deployer }
    }
    describe("Deployment", function() {
        it("Works", async function() {
            const {storage} = await loadFixture(deploy)

            const initialVal = await storage.val();
            expect(initialVal).to.eq(100)

            const StorageFactoryV2 = await ethers.getContractFactory("Storage2");
            const storage2 = await upgrades.upgradeProxy(storage, StorageFactoryV2) //выкладываем новый контракт

            const tx = await storage2.inc();
            await tx.wait()
            
            const initialVal2 = await storage2.val();
            expect(initialVal2).to.eq(101)
        })
    })
})