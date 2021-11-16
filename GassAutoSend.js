'use strict';
require('dotenv').config();
const { GoogleSpreadsheet } = require('google-spreadsheet');
const Web3 = require('web3')
const web3 = new Web3(new Web3.providers.HttpProvider(process.env.PROVIDERORURL))
const account = web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);

web3.eth.accounts.wallet.add(account);
web3.eth.defaultAccount = account.address;

const from_address = process.env.MYADDRESS;
const expectedBlockTime = 1000;
let alreadyNumber = 0;

const sleep = (milliseconds) => {
    return new Promise(resolve => setTimeout(resolve, milliseconds))
}


async function autoSend(value){
    const to_addresses = [];
    const flags = [];
    const all_to_addresses = [];
    const all_flags = [];

    const doc = new GoogleSpreadsheet(process.env.SPREADSHEET_ID);
    const credentials = require('./key.json');
    await doc.useServiceAccountAuth(credentials);
    await doc.loadInfo();

    //新しく送付するアドレスの取得
    //重複確認

    const walletSheet = await doc.sheetsById[process.env.SHIFT_WALLET_ID];
    const walletRows = await walletSheet.getRows();

    //全アドレスを取得
    for (let i = 0;i < walletRows.length;i++){
        let data = walletRows[i]._rawData;
        all_to_addresses.push(data[1]);
        all_flags.push(data[2]);
    }

    for(let i = alreadyNumber;i < walletRows.length;i++){
        let already_index = all_to_addresses.slice(0, alreadyNumber).indexOf(all_to_addresses[i]);
        to_addresses.push(all_to_addresses[i])
        //今回の実行の中で重複されていないか
        if (to_addresses.indexOf(all_to_addresses[i]) != -1){
            flags.push(1)
        }else{
            flags.push(all_flags[i])
        }
        //これまでに登録されているかどうか
        if(already_index != -1){
            flags.push(1)
        }else{
            flags.push(all_flags[i])
        }
    }

    //formからの追加がなかった場合
    if(to_addresses.length == 0){
        return [0,[]];//送付したガス量、送付先
    }else{//formからの追加があった場合
        let sendGassAddress = [];
        let nonce =  await web3.eth.getTransactionCount(from_address);
        for (let i = 0; i < to_addresses.length; i++){
            try{
                if(flags[i] == 0){//これまで送付をしたことがないアカウントに対して
                    console.log("to_address : ",to_addresses[i]);
                    web3.eth.sendTransaction({
                        from : from_address,
                        to:to_addresses[i],
                        value:web3.utils.toWei(value,"ether"),
                        nonce: nonce++,
                        gasLimit : 21000,
                    }, function(error, hash){
                        console.log("Submitted transaction with hash: ", hash)
                        let transactionReceipt = null
                        while (transactionReceipt == null) {
                            transactionReceipt = web3.eth.getTransactionReceipt(hash);
                            sleep(expectedBlockTime);
                        }
                    });
                    sendGassAddress.push(to_addresses[i]);
                }
            }catch(e){
                console.log(e)
                continue;
            }
        }
        //送付したアドレスにflagを立てる
        for (let i = alreadyNumber;i < walletRows.length;i++){
            let data = walletRows[i]._rawData;
            if(sendGassAddress.indexOf(data[1]) != -1){
                walletRows[i]._rawData[2] = 1;
                await walletRows[i].save();
            }
        }
        //次回実行時のための初期化
        alreadyNumber = walletRows.length;
        return [(value - 0) * sendGassAddress.length,sendGassAddress]
    }
}

setInterval(function(){
    autoSend('0.00001').then(result => {
        console.log(result);
    })
}, 10000);