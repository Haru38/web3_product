'use strict';
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const Web3 = require('web3')
const opensea = require('opensea-js')
const HDWalletProvider = require("@truffle/hdwallet-provider");
const provider = new HDWalletProvider({
    mnemonic: process.env.MNEMONIC,
    providerOrUrl: process.env.PROVIDERORURL,
    addressIndex: 0
});
const seaport = new opensea.OpenSeaPort(provider, {
  networkName: opensea.Network.Rinkeby
})

const accountAddress = process.env.MYADDRESS;
const tokenAddress = process.env.TOKENADDRESS;
const toAddresses = [];
const tokenIds = [];

// Googleスプレッドシートからシフト情報をロードし、tokenIdとwalletを取得
async function loadWalletAndBatchTransfer() {
    // スプレッドシートIDと資格情報を用いてGoogleスプレッドシートをロード
    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    const credentials = require('./key.json');
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();
    console.log(doc.title);

    const walletSheet = await doc.sheetsById[process.env.SHIFT_WALLET_ID];
    const walletRows = await walletSheet.getRows();
    for (let i = 0;i < walletRows.length;i++){
        let data = walletRows[i]._rawData;
        tokenIds.push(data[0])
        toAddresses.push(data[1]);
    }
    console.log(tokenIds)

    for(let i = 0;i < toAddresses.length;i++){
        let toAddress = toAddresses[i];
        let tokenId = tokenIds[i];
        const transactionHash = await seaport.transfer({
            asset: { tokenId, tokenAddress },
            fromAddress : accountAddress, // Must own the asset
            toAddress : toAddress
        })
        console.log("(success) tokenId "+tokenId+" : transfer to "+ toAddress);
    }
}


loadWalletAndBatchTransfer()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });