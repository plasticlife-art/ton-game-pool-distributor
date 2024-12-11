import { Address, toNano } from '@ton/core';
import { Main } from '../wrappers/Main';
import { NetworkProvider, sleep } from '@ton/blueprint';

export async function run(provider: NetworkProvider, args: string[]) {
    const ui = provider.ui();

    const address = Address.parse(args.length > 0 ? args[0] : await ui.input('Contract address'));

    if (!(await provider.isContractDeployed(address))) {
        ui.write(`Error: Contract at address ${address} is not deployed!`);
        return;
    }

    const main = provider.open(Main.fromAddress(address));

    const entryFeeBefore = await main.getEntryFee();
    const prizePercentageBefore = await main.getPrizePercentage();
    const commissionPercentageBefore = await main.getCommissionPercentage();


    await main.send(
        provider.sender(),
        {
            value: toNano('0.01'),
        },
        {
            $$type: "UpdateParams",
            queryId: 0n,
            entryFee: toNano(0.5),
            commissionPercentage:  25n*1000n,
            prizePercentage: 90n*1000n
        }
    );

    ui.write('Waiting for contract params to update...');

    let entryFeeAfter = await main.getEntryFee();
    let commissionPercentageAfter = await main.getCommissionPercentage();
    let prizePercentageAfter = await main.getPrizePercentage();

    let attempt = 1;
    while (entryFeeAfter === entryFeeBefore && commissionPercentageAfter === commissionPercentageBefore && prizePercentageAfter === prizePercentageBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        entryFeeAfter = await main.getEntryFee();
        commissionPercentageAfter = await main.getCommissionPercentage();
        prizePercentageAfter = await main.getPrizePercentage();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Params updated successfully!');
}
