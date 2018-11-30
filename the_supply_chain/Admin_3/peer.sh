#!/bin/bash
export FABRIC_CFG_PATH=`pwd`

export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_TLS_CERT_FILE=./tls/client.crt
export CORE_PEER_TLS_KEY_FILE=./tls/client.key

export CORE_PEER_MSPCONFIGPATH=./msp
export CORE_PEER_ADDRESS=peer0.org3.gyl.com:7051
export CORE_PEER_LOCALMSPID=GylOrg3MSP
export CORE_PEER_TLS_ROOTCERT_FILE=./tls/ca.crt
export CORE_PEER_ID=cli
export CORE_LOGGING_LEVEL=INFO

peer $*
