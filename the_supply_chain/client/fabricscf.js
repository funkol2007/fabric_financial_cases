var co = require('co');
var fabricservice = require('./fabricservice.js');
var express = require('express');

var app = express();

var channelid = "gylchannel";
var chaincodeid = "gyl";

//供应商发起供货交易
app.get('/sendTransaction1',function(req,res){
    co(function * () {
        var k = req.query.k;
        var v = req.query.v;
        var blockinfo = yield fabricservice.sendTransaction(chaincodeid,"invoke",["putvalue",k,v],channelid);
         res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
});

//核心企业发起确认
app.get('/sendTransaction2',function(req,res){
    co(function * () {
        var k = req.query.k;
        var v = req.query.v;
        var blockinfo = yield fabricservice.sendTransaction(chaincodeid,"invoke",["putvalue",k,v],channelid);
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//金融机构审核并放款
app.get('/sendTransaction3',function(req,res){
    co(function * () {
        var k = req.query.k;
        var v = req.query.v;
        var blockinfo = yield fabricservice.sendTransaction(chaincodeid,"invoke",["putvalue",k,v],channelid);
         res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//查询交易记录
app.get('/queryhistory',function(req,res){
    co(function * () {
        var k = req.query.k;
        var blockinfo = yield fabricservice.sendTransaction(chaincodeid,"invoke",["gethistory",k,"-1"],channelid);
         res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})


//查询最新结果
app.get('/getlastvalue',function(req,res){
    co(function * () {
        var k = req.query.k;
        var blockinfo = yield fabricservice.sendTransaction(chaincodeid,"invoke",["getlastvalue",k,"-1"],channelid);
         res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})


//获取当前通道块儿高度
app.get('/getchannelheight',function(req,res){
    co(function * () {
        var blockinfo = yield fabricservice.getBlockChainInfo();
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//根据区块编号获取区块信息
app.get('/getblockInfobyNum',function(req,res){
    co(function * () {
        var param = parseInt(req.query.params);
        var blockinfo = yield fabricservice.getblockInfobyNum(param);
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//根据区块Hash值获取区块信息
app.get('/getblockInfobyHash',function(req,res){
    co(function * () {
        var param = req.query.params;
        var blockinfo = yield fabricservice.getblockInfobyHash(param);
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//获取指定peer节点加入的通道数
app.get('/getPeerChannel',function(req,res){
    co(function * () {
        var blockinfo = yield fabricservice.getPeerChannel();
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})


//获取channel已经安装的链码
app.get('/getPeerInstallCc',function(req,res){
    co(function * () {
        var blockinfo = yield fabricservice.getPeerInstallCc();
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})


//获取指定channel已经实例化的链码
app.get('/getPeerInstantiatedCc',function(req,res){
    co(function * () {
        var blockinfo = yield fabricservice.getPeerInstantiatedCc();
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//通过交易ID获取区块信息
app.get('/getBlockByTxID',function(req,res){
    co(function * () {
        var param = req.query.TxID;
        var blockinfo = yield fabricservice.getBlockByTxID(param);
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//通过交易ID获取交易信息
app.get('/getTransaction',function(req,res){
    co(function * () {
        var param = req.query.TxID;
        var blockinfo = yield fabricservice.getTransaction(param);
        res.send(JSON.stringify(blockinfo));
    }).catch((err)=>{
        res.send(err);
    })
})

//启动http服务
var server = app.listen(3000,function(){
    var host = server.address().address;
    var port = server.address().port;
    console.log('Example app listen at http://%s:%s',host,port);
});

//注册异常处理器
process.on('unhandleRejection',function(err){
    console.error(err.stack);
});

process.on('uncaughtException',console.error);

