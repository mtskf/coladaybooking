# Cola Day 2022 - Room Booking System [PoC]

This application is a proof of concept for a room booking system for Cola Day 2022.

[<img width="1157" alt="demo" src="https://user-images.githubusercontent.com/315819/176455131-6ed7c308-21b5-4dde-b988-0265eb836842.png">](https://coladay.vercel.app/)

## Demo
- https://coladay.vercel.app/

## Features
- shows meeting rooms availability
- allows users to book meeting rooms by the hour (up to 4 hours per event)
- allows users to cancel their booking
- stores data in blockChain (Ropsten Test Network)
- encrypts event titles with public key encryption (end to end)

## Usage
- On your browser, login to MetaMask and connect to Ropsten Test Network
- Visit the demo site: https://coladay.vercel.app/
- Then, drag your mouse over the timetable to start booking rooms!
- Note: Each time you create or delete an event on the blockchain, you will need Ethereum gas for the transaction.

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
