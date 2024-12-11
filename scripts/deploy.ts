import { Address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import { NetworkProvider } from '@ton/blueprint';

const entryFee = toNano(0.5);
const commissionPercentage = 25n*1000n;
const prizePercentage = 70n*1000n;

export async function run(provider: NetworkProvider) {
    const main = provider.open(await Main.fromInit(BigInt(Math.floor(Math.random() * 10000)),
        provider.sender().address as Address,
        entryFee,
        commissionPercentage,
        prizePercentage));

    await main.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'Deploy',
            queryId: 0n,
        }
    );

    await provider.waitForDeploy(main.address);

    console.log('ID', await main.getId());
}
