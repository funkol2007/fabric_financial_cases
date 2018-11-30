var path = require('path');
var fs = require('fs');
var util = require('util');
var hfc = require('fabric-client');
var Peer = require('fabric-client/lib/Peer.js');
var EventHub = require('fabric-client/lib/EventHub.js');
var User = require('crypto');
var FabricCAService = require('fabric-ca-client');

//var log4js = require('log4js');
//var logger = log4js.getLogger('Helper');
//logger.setLevel('DEBUG');

var tempdir = "/home/dc2-user/kongli/fabric-client-js-kvs";

let client = new hfc();
let tls_cacerts_content_orderer = fs.readFileSync('./orderer/tls/ca.crt');
let opt_orderer = {
    pem: Buffer.from(tls_cacerts_content_orderer).toString(),
    'ssl-target-name-override':'orderer.gyl.com'
};
//peer1
let tls_cacerts_content_peer1 = fs.readFileSync('./peer1/tls/ca.crt');
let opt_peer1 = {
    pem: Buffer.from(tls_cacerts_content_peer1).toString(),
    'ssl-target-name-override':'peer0.org1.gyl.com'
};
//peer2
let tls_cacerts_content_peer2 = fs.readFileSync('./peer2/tls/ca.crt');
let opt_peer2 = {
    pem: Buffer.from(tls_cacerts_content_peer2).toString(),
    'ssl-target-name-override':'peer0.org2.gyl.com'
};
//peer3
let tls_cacerts_content_peer3 = fs.readFileSync('./peer3/tls/ca.crt');
let opt_peer3 = {
    pem: Buffer.from(tls_cacerts_content_peer3).toString(),
    'ssl-target-name-override':'peer0.org3.gyl.com'
};

var channel = client.newChannel('gylchannel');
var order = client.newOrderer('grpcs://10.254.186.164:7050',opt_orderer);
channel.addOrderer(order);
var peer1 = client.newPeer('grpcs://10.254.186.164:7051',opt_peer1);
var peer2 = client.newPeer('grpcs://10.254.247.165:7051',opt_peer2);
var peer3 = client.newPeer('grpcs://10.254.207.154:7051',opt_peer3);
channel.addPeer(peer1);
channel.addPeer(peer2);
channel.addPeer(peer3);

var event_url = 'grpcs://10.254.186.164:7053';
/**
    发起交易
    @returns {Promis.<TResult>}
*/
var sendTransaction = function(chaincodeid, func, chaincode_args, channelId) {
    var tx_id = null;
    return getOrgUser4Local().then((user)=>{
        tx_id = client.newTransactionID();
        var request = {
            chaincodeId: chaincodeid,
            fcn: func,
            args: chaincode_args,
            chainId: channelId,
            txId: tx_id
        };
        return channel.sendTransactionProposal(request);
    },(err)=>{
        console.log('error',err);
    }).then((chaincodeinvokresult)=>{
        var proposalResponses = chaincodeinvokresult[0];
        var proposal = chaincodeinvokresult[1];
        var header = chaincodeinvokresult[2];
        var all_good = true;
        for (var i in proposalResponses) {
            let one_good = false;
            //成功
            if (proposalResponses && proposalResponses[0].response && proposalResponses[0].response.status == 200) {
                one_good = true;
                console.info('transaction proposal was good');
            }else {
                console.error('transaction proposal was bad');
            }
            all_good = all_good & one_good;
        }

        if (all_good) {
            console.info(util.format(
                'Successfully sent proposal and received proposalResponses: Status - %s, message - "%s", metadate - "%s", endorsement signature :%s',
                proposalResponses[0].response.status,proposalResponses[0].response.message,
                proposalResponses[0].response.payload,proposalResponses[0].endorsement.signature));

            var request = {
                proposalResponses: proposalResponses,
                proposal: proposal,
                orderer: order,
                txId: tx_id,
		header:header
            };

            var transactionID = tx_id.getTransactionID();
	    var eventPromises = []; 
	    let eh = client.newEventHub(); 
	    //接下来设置EventHub，用于监听Transaction是否成功写入，这里也是启用了TLS 
	    eh.setPeerAddr(event_url,opt_peer1); 
            eh.connect();
            let txPromise = new Promise((resolve, reject) => { 
            	let handle = setTimeout(() => { 
                	eh.disconnect(); 
                	reject(); 
            	}, 30000); 
	    	//向EventHub注册事件的处理办法 
            	eh.registerTxEvent(transactionID, (tx, code) => { 
                	clearTimeout(handle); 
                	eh.unregisterTxEvent(transactionID); 
                	eh.disconnect();

                	if (code !== 'VALID') { 
                    		console.error( 
                        	'The transaction was invalid, code = ' + code); 
                    		reject(); 
                 	} else { 
                    		console.log( 
                         	'The transaction has been committed on peer ' + 
                         	eh._ep._endpoint.addr); 
                    		resolve(); 
                	} 
            	}); 
            }); 
            eventPromises.push(txPromise); 
            //把背书后的结果发到orderer排序 
            var sendPromise = channel.sendTransaction(request);
	    return Promise.all([sendPromise].concat(eventPromises)).then((results) => { 
            	console.log(' event promise all complete and testing complete');
             	return results[0]; // the first returned value is from the 'sendPromise' which is from the 'sendTransaction()' call 
            }).catch((err) => { 
            	console.error( 
                	'Failed to send transaction and get notifications within the timeout period.' 
                ); 
                return 'Failed to send transaction and get notifications within the timeout period.'; 
           }); 
         } else { 
             console.error( 
                'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...' 
             ); 
            return 'Failed to send Proposal or receive valid response. Response null or status is not 200. exiting...'; 
        } 
    },(err)=>{
        console.log('error',err);
    }).then((response)=>{
	if (response.status === 'SUCCESS') { 
            console.log('Successfully sent transaction to the orderer.'); 
            return tx_id.getTransactionID(); 
    	} else { 
            console.error('Failed to order the transaction. Error code: ' + response.status); 
            return 'Failed to order the transaction. Error code: ' + response.status; 
    	} 
    },(err)=>{
        console.log('error',err);
    });
}


/**
    根据cryptogen模块生成的账号通过Fabric接口进行相关操作
    @returns {Promise.<TResult>}
*/
function getOrgUser4Local(){
    var keyPath = "./users/keystore";
    var keyPEM = Buffer.from(readAllFiles(keyPath)[0]).toString();
    var certPath = "./users/signcerts";
    var certPEM = readAllFiles(certPath)[0].toString();

    return hfc.newDefaultKeyValueStore({
        path: tempdir
    }).then((store)=>{
        client.setStateStore(store);

        return client.createUser({
            username: 'user87',
            mspid: 'GylOrg1MSP',
            cryptoContent: {
                privateKeyPEM: keyPEM,
                signedCertPEM: certPEM
            }
        });
    });
};

function readAllFiles(dir) {
    var files = fs.readdirSync(dir);
    var certs = [];
    files.forEach((file_name)=>{
        let file_path = path.join(dir,file_name);
        let data = fs.readFileSync(file_path);
        certs.push(data);
    });
    return certs;
}

/**
    获取channel的区块信息
    @returns {Promise.<TResult>}
*/
var getBlockChainInfo = function() {
    return getOrgUser4Local().then((user)=>{
        return channel.queryInfo(peer1);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    根据区块链的编号获取详细信息
    @param blocknum
    @returns {Promise.<TResult>} 
*/
var getblockInfobyNum = function(blocknum) {
    return getOrgUser4Local().then((user)=>{
        return channel.queryBlock(blocknum,peer1,null);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    根据区块链的哈希值获取区块详细信息
    @param blockhash
    @returns {Promise.<TResult>}
*/
var getblockInfobyHash = function(blockHash) {
    return getOrgUser4Local().then((user)=>{
        return channel.queryBlockByHash(new Buffer(blockHash,"hex"),peer1);
    },(err)=>{
        console.log('error',err);
    })
}
/**
    获取当前节点加入的通道信息
    @returns {Promise.<TResult>}
*/
var getPeerChannel = function() {
    return getOrgUser4Local().then((user)=>{
        return client.queryChannels(peer1);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    查询指定peer节点已经install的chaincode
    @returns {Promise.<TResult>}
*/
var getPeerInstallCc = function() {
    return getOrgUser4Local().then((user)=>{
        return client.queryInstalledChaincodes(peer1);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    查询指定channel中已实例化的chaincode
    @returns {Promise.<TResult>}
*/
var getPeerInstantiatedCc = function() {
    return getOrgUser4Local().then((user)=>{
        return channel.queryInstantiatedChaincodes(peer1);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    查询指定交易所在区块信息
    @param txId
    @returns {Promis.<TResult>} 
 */
var getBlockByTxID = function(TxID) {
    return getOrgUser4Local().then((user)=>{
        return channel.queryBlockByTxID(TxID,peer1);
    },(err)=>{
        console.log('error',err);
    })
}

/**
    查询指定交易所在区块信息
    @param txId
    @returns {Promis.<TResult>}
 */
var getTransaction = function(TxID) {
    return getOrgUser4Local().then((user)=>{
        return channel.queryTransaction(TxID,peer1);
    },(err)=>{
        console.log('error',err);
    })
}

exports.sendTransaction = sendTransaction;
exports.getBlockChainInfo = getBlockChainInfo;
exports.getblockInfobyNum = getblockInfobyNum;
exports.getblockInfobyHash = getblockInfobyHash;
exports.getPeerChannel = getPeerChannel;
exports.getPeerInstantiatedCc = getPeerInstantiatedCc;
exports.getPeerInstallCc = getPeerInstallCc;
exports.getBlockByTxID = getBlockByTxID;
exports.getTransaction = getTransaction;



