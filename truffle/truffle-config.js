const { projectId, mnemonic, etherscanApiKey } = require('./secrets.json')
const HDWalletProvider = require('@truffle/hdwallet-provider')

module.exports = {
  contracts_build_directory: "../client/src/contracts",

  networks: {
    develop: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*"
    },
    ropsten: {
      provider: () => new HDWalletProvider(mnemonic, `https://ropsten.infura.io/v3/${projectId}`),
      network_id: 3,        // Ropsten's id
      gas: 5500000,         // Ropsten has a lower block limit than mainnet
      confirmations: 2,      // # of confs to wait between deployments.
      timeoutBlocks: 200,   // # of blocks before a deployment times out
      skipDryRun: false     // # Skip dry run before migrations?
    },
  },

  mocha: {
    // timeout: 100000
  },

  compilers: {
    solc: {
      version: "0.8.14",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        },
      }
    }
  },

  plugins: ['truffle-plugin-verify'],

  api_keys: {
    etherscan: etherscanApiKey
  }
}
