# Game-Pool-Distributor Contract

This contract implements a simple game mechanism where users can "join" by sending a specified entry fee. The contract also supports the ability for the owner to update parameters and finish rounds, distributing the prize to the winner. The contract includes features for ownership management, stoppability, and fee handling.

## Features

- **Owner management**: Only the owner can update contract parameters or finish the round. Also, owner can transfer ownership.
- **Join game**: Users can join the game by paying an entry fee. The fee is split between the contract owner and the prize pool.
- **Round management**: The owner can finish a round and send the prize to the winner.
- **Stoppable contract**: The contract can be stopped to prevent further actions.
- **Parameter updates**: The owner can update the entry fee, prize percentage, and commission percentage.

## Contract Structure

### Messages

#### `FinishRound`
- **queryId**: Unique identifier for the query (uint64).
- **winner**: The address of the winner who will receive the prize.

#### `UpdateParams`
- **queryId**: Unique identifier for the query (uint64).
- **entryFee**: The new entry fee for players (Int).
- **prizePercentage**: The percentage of the total funds that will be given to the winner (Int).
- **commissionPercentage**: The percentage of the entry fee that will be sent to the owner (Int).

#### `UpdateParamsOk`
- **queryId**: Unique identifier for the query (uint64).
- **entryFee**: The new entry fee (Int).
- **prizePercentage**: The new prize percentage (Int).
- **commissionPercentage**: The new commission percentage (Int).

#### `FinishRoundOk`
- **queryId**: Unique identifier for the query (uint64).
- **round**: The round number after finishing (Int).

#### `ChangeOwner`
- **queryId**: Unique identifier for the query (uint64).
- **newOwner**: The address of the new owner.

#### `ChangeOwnerOk`
- **queryId**: Unique identifier for the query (uint64).
- **newOwner**: The address of the new owner.


## Constructor

The constructor initializes the contract with the following parameters:
- `id`: A unique identifier for the contract (Int).
- `owner`: The address of the contract owner (Address).
- `entryFee`: The entry fee for players (Int).
- `commissionPercentage`: The commission percentage for the owner (Int).
- `prizePercentage`: The percentage for the prize pool (Int).

## Methods

### `receive("join")`
- Users call this method to join the game by sending the required entry fee.
- The contract checks if the sent value meets the entry fee and transaction fee.
- The owner's commission is sent, and any overpayment is refunded back to the sender.

### `receive("FinishRound")`
- This method can only be called by the owner.
- The winner is sent their prize, which is a percentage of the total balance after deducting the transaction fees.
- The round number is incremented.

### `receive("UpdateParams")`
- This method allows the owner to update the entry fee, prize percentage, and commission percentage.
- Only the owner can call this method.

### `getRound()`
- Returns the current round number (Int).

### `getEntryFee()`
- Returns the current entry fee (Int).

### `getCommissionPercentage()`
- Returns the current commission percentage (Int).

### `getPrizePercentage()`
- Returns the current prize percentage (Int).

## Basic console commands

### Build

`npx blueprint build` or `yarn blueprint build`
### Test

`npx blueprint test` or `yarn blueprint test`
### Deploy or run another script

`npx blueprint run` or `yarn blueprint run`

## Usage

### Deploy
To deploy the contract, use the [deploy.ts script](./scripts/deploy.ts).

### Joining the Game

To join the game, the user needs to send the entry fee along with the transaction. The contract will validate the fee and send the commission to the owner. If the sent value exceeds the required amount, the excess will be refunded.
To join the game just send transaction with "join" comment or use [join.ts script](./scripts/join.ts).

### Finishing the Round

Only the owner can finish the round and send the prize to the winner. This method will distribute the prize according to the configured prize percentage.
See [finishRound.ts script](./scripts/finishRound.ts).

### Updating Parameters

The owner can update the contract parameters, such as the entry fee, prize percentage, and commission percentage.
See [updateParams.ts script](./scripts/updateParams.ts).

### Stop contract

The owner can stop the contract by sending a transaction with a ‘Stop’ comment. After this, any new joins will be rejected.