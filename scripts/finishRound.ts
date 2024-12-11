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

    const winnerAddress = Address.parse(args.length > 0 ? args[0] : await ui.input('Winner address'));
    const main = provider.open(Main.fromAddress(address));
    let roundBefore = await main.getRound();

    await main.send(
        provider.sender(),
        {
            value: toNano('0.05'),
        },
        {
            $$type: 'FinishRound',
            queryId: 0n,
            winner: winnerAddress
        }
    );

    ui.write('Waiting for counter to increase...');

    let roundAfter = await main.getRound();
    let attempt = 1;
    while (roundAfter === roundBefore) {
        ui.setActionPrompt(`Attempt ${attempt}`);
        await sleep(2000);
        roundAfter = await main.getRound();
        attempt++;
    }

    ui.clearActionPrompt();
    ui.write('Round finished successfully!');
}
