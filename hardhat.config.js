require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

const privateKey =
  process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== "your_private_key_here"
    ? process.env.PRIVATE_KEY.startsWith("0x")
      ? process.env.PRIVATE_KEY
      : `0x${process.env.PRIVATE_KEY}`
    : undefined;

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {},
    bohrTestnet: {
      url: "https://rpc.bohr.life",
      chainId: 968,
      accounts: privateKey ? [privateKey] : [],
    },
  },
};
