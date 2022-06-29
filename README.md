# Cola Day 2022 - Room Booking System [PoC]

This app is a proof of concept of room booking system for Cola Day 2022.

<img width="1157" alt="demo" src="https://user-images.githubusercontent.com/315819/176455131-6ed7c308-21b5-4dde-b988-0265eb836842.png">

## Demo
- https://coladay.vercel.app/

## Features
- shows meeting rooms availability
- allows users to book meeting rooms
- allows users to cancel their booking
- stores data on blockChain (Ropsten Test Net)
- encrypts event title with public key encryption (end to end)

## Usage
- On your browser, login to MetaMask and connect to Ropsten Test Network
- Visit the demo site: https://coladay.vercel.app/
- Now, you can start booking rooms, by dragging the mouse over the time table!
- Note: Each time you create or delete an event on the blockchain, it requires ethereum gas for the transaction.

## Dev setup

### Contract

#### Install dependencies
```sh
$ cd truffle
$ npm install
$ npm install -g truffle
$ npm install -g ganache-cli
```

#### Local Development with Truffle & Ganache
```sh
$ cd truffle
$ ganache-cli --accounts 10
$ truffle compile
$ truffle compile && truffle migrate --network develop
```

#### Test with Truffle
```sh
$ truffle test --show-events
```

#### Deploy to Ropsten Test Net
```sh
$ truffle compile &&truffle migrate --network ropsten
```

### Front-end

#### Install dependencies
```sh
$ cd client
$ npm install
```

#### Start React dev server
```sh
$ npm start
```

#### Build
```sh
$ npm build
```
