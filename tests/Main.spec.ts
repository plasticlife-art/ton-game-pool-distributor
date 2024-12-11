import { Blockchain, SandboxContract, TreasuryContract } from '@ton/sandbox';
import { Address, toNano } from '@ton/core';
import { FinishRound, Main } from '../wrappers/Main';
import '@ton/test-utils';
import { NetworkProvider } from '@ton/blueprint';

const entryFee = toNano(0.5);
const commissionPercentage = 25n*1000n;
const prizePercentage = 70n*1000n;
const transactionFee = 3000000n;

describe('Main', () => {
    let blockchain: Blockchain;
    let deployer: SandboxContract<TreasuryContract>;
    let main: SandboxContract<Main>;

    beforeEach(async () => {
        blockchain = await Blockchain.create();

        deployer = await blockchain.treasury('deployer');

        main = blockchain.openContract(await Main.fromInit(0n, deployer.getSender().address, entryFee, commissionPercentage, prizePercentage));

        const deployResult = await main.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'Deploy',
                queryId: 0n,
            }
        );

        expect(deployResult.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            deploy: true,
            success: true,
        });
    });

    it('should deploy', async () => {
        // the check is done inside beforeEach
        // blockchain and main are ready to use
    });

    it('should fail join round, because not enough money sent', async () => {

        const player = await blockchain.treasury('player');

        const joinResult = await main.send(
            player.getSender(),
            {
                value: toNano('0.05'),
            },
            "join"
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: player.address,
            to: main.address,
            success: false,
        });

    })


    it('should join round and balance increased to at least entryFee - commissionPercentage(should be sent to owner) - totalFee', async () => {

        const player = await blockchain.treasury('player');

        const contractStateBefore = await blockchain.getContract(main.address);
        const balanceBefore = contractStateBefore.balance;

        const joinResult = await main.send(
            player.getSender(),
            {
                value: entryFee + transactionFee,
            },
            "join"
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: player.address,
            to: main.address,
            success: true,
        });


        expect(joinResult.transactions).toHaveTransaction({
            from: main.address,
            to: deployer.address,
            success: true,
        });

        const contractStateAfter = await blockchain.getContract(main.address);
        const balanceAfter = contractStateAfter.balance;

        let totalFee = 0n
        for (const tx of joinResult.transactions) {
            totalFee += tx.totalFees.coins;
        }

        const eventSendOverpay = joinResult.events[joinResult.events.length - 1]
        let overpay = 0n
        if (eventSendOverpay.type === 'message_sent') {
            overpay = eventSendOverpay.value;
        }

        expect(balanceAfter).toBeGreaterThan(balanceBefore + entryFee - entryFee * commissionPercentage / 100000n - totalFee - overpay);
    })


    it('should send winner prise and increment round', async () => {
        const winner = await blockchain.treasury('winner');

        await main.send(
            winner.getSender(),
            {
                value: entryFee + transactionFee,
            },
            "join"
        );

        const result = await main.send(
            deployer.getSender(),
            {
                value: toNano('0.05')
            },
            {
                $$type: 'FinishRound',
                queryId: 0n,
                winner: winner.address
            }
        )

        expect(result.transactions).toHaveTransaction({
            from: deployer.address,
            to: main.address,
            success: true,
        });

        expect(result.transactions).toHaveTransaction({
            from: main.address,
            to: winner.address,
            success: true
        });

        const round = await main.getRound();
        expect(round).toBe(1n)
    })


    it('should fail join if contract stopped', async () => {
        await main.send(
            deployer.getSender(),
            {
                value: toNano('0.05')
            },
            "Stop"
        )


        const player = await blockchain.treasury('player');

        const joinResult = await main.send(
            player.getSender(),
            {
                value: toNano('0.05'),
            },
            "join"
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: player.address,
            to: main.address,
            success: false,
        });
    })



    it('should fail finish round if called not by owner', async () => {

        const alice = await blockchain.treasury('alice');

        const joinResult = await main.send(
            alice.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'FinishRound',
                queryId: 0n,
                winner: alice.address
            }
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: alice.address,
            to: main.address,
            success: false,
        });
    })


    it('should fail change owner if called not by owner', async () => {

        const alice = await blockchain.treasury('alice');

        const joinResult = await main.send(
            alice.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'ChangeOwner',
                queryId: 0n,
                newOwner: alice.address
            }
        );

        expect(joinResult.transactions).toHaveTransaction({
            from: alice.address,
            to: main.address,
            success: false,
        });

        const owner = await main.getOwner();
        expect(owner.toString()).toEqual(deployer.address.toString())
    })




    it('should change update params if called by owner', async () => {
        await main.send(
            deployer.getSender(),
            {
                value: toNano('0.05'),
            },
            {
                $$type: 'UpdateParams',
                queryId: 0n,
                entryFee: 1n,
                prizePercentage: 1n,
                commissionPercentage: 1n,
            }
        );
        const newEntryFee = await main.getEntryFee();
        expect(newEntryFee).toEqual(1n)

        const newCommissionPercentage = await main.getCommissionPercentage();
        expect(newCommissionPercentage).toEqual(1n)

        const newPrizePercentage = await main.getPrizePercentage();
        expect(newPrizePercentage).toEqual(1n)
    })


})
