package main

import (
	"fmt"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
	"time"
	"encoding/json"
)

var asset_time = "asset_name_a"
type scfinancechaincode struct {}

/**
	系统初始化
 */

// Init callback representing the invocation of a chaincode
func (t *scfinancechaincode) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Init success! ")
	return shim.Success([]byte("Init success !!!!!"))
}

/**
系统Invoke方法
 */

func (t *scfinancechaincode) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	_, args := stub.GetFunctionAndParameters()
	var opttype = args[0] //操作
	var assetname = args[1] //货物名
	var optcontent = args[2] //内容

	fmt.Printf("param is %s %s %s \n",opttype,assetname,optcontent)

	if opttype == "putvalue" { //设置
		stub.PutState(assetname,[]byte(optcontent))
		return shim.Success([]byte("success put " + optcontent))
	}else if opttype == "getlastvalue" { //取值
		var keyvalue []byte
		var err error
		keyvalue,err = stub.GetState(assetname)
		if err != nil {
			return shim.Error("find error!")
		}
		return shim.Success(keyvalue)
	}else if opttype == "gethistory" { //获取交易记录
		keyIter, err := stub.GetHistoryForKey(assetname)
		if err != nil {
			return shim.Error(fmt.Sprintf("GetHistoryForKey failed. Error accessing state: %s", err.Error()))
		}
		defer keyIter.Close()
		var keys []string //存储所有的交易ID
		for keyIter.HasNext() {
			response, iterErr := keyIter.Next()
			if iterErr != nil {
				return shim.Error(fmt.Sprintf("GetHistoryForKey operation failed. Error accessing state: %s", iterErr.Error()))
			}
			//交易编号
			txid := response.TxId
			//交易的值
			txvalue := response.Value
			//当前交易状态
			txstatus := response.IsDelete
			//交易发生的时间戳
			txtimestamp := response.Timestamp
			tm := time.Unix(txtimestamp.Seconds,0)
			datestr := tm.Format("2006-01-02 03:04:05 PM")

			fmt.Printf("Tx info - txid : %s value : %s if delete: %t datetime: %s \n",txid,string(txvalue),txstatus,datestr)
			keys = append(keys,txid)
		}

		jsonKeys, err := json.Marshal(keys)
		if err != nil {
			return shim.Error(fmt.Sprintf("query operation failed. Error marshaling JSON: %s", err.Error()))
		}
		return shim.Success(jsonKeys)
	}else {
		return shim.Success([]byte("success invoke but invalid operation"))
	}

}

func main() {
	err := shim.Start(new(scfinancechaincode))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}

