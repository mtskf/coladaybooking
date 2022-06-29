# Cola Day 2022 - Room Booking System [PoC]

This app is a room booking system for Cola Day 2022.

## Demo
- https://coladay.vercel.app/

## Features
- shows meeting rooms availability
- allows users to book meeting rooms
- allows users to cancel their booking
- stores data on blockChain (Ropsten Test Net)
- encrypts event title with public key encryption

## Usage


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
