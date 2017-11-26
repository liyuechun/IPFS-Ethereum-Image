import React, {Component} from 'react'
import SimpleStorageContract from '../build/contracts/SimpleStorage.json'
import getWeb3 from './utils/getWeb3'

import './css/oswald.css'
import './css/open-sans.css'
import './css/pure-min.css'
import './App.css'

const ipfsAPI = require('ipfs-api');
const ipfs = ipfsAPI({host: 'localhost', port: '5001', protocol: 'http'});

const contract = require('truffle-contract')
const simpleStorage = contract(SimpleStorageContract)
let account;

// Declaring this for later so we can chain functions on SimpleStorage.
let contractInstance;

let saveImageOnIpfs = (reader) => {
  return new Promise(function(resolve, reject) {
    const buffer = Buffer.from(reader.result);
    ipfs.add(buffer).then((response) => {
      console.log(response)
      resolve(response[0].hash);
    }).catch((err) => {
      console.error(err)
      reject(err);
    })
  })
}

class App extends Component {
  constructor(props) {
    super(props)

    this.state = {
      blockChainHash: null,
      web3: null,
      address: null,
      imgHash: null,
      isWriteSuccess: false
    }
  }

  componentWillMount() {

    ipfs.swarm.peers(function(err, res) {
      if (err) {
        console.error(err);
      } else {
        // var numPeers = res.Peers === null ? 0 : res.Peers.length;
        // console.log("IPFS - connected to " + numPeers + " peers");
        console.log(res);
      }
    });

    getWeb3.then(results => {
      this.setState({web3: results.web3})

      // Instantiate contract once web3 provided.
      this.instantiateContract()
    }).catch(() => {
      console.log('Error finding web3.')
    })
  }

  instantiateContract = () => {

    simpleStorage.setProvider(this.state.web3.currentProvider);
    this.state.web3.eth.getAccounts((error, accounts) => {
      account = accounts[0];
      simpleStorage.at('0x66e9bbfe244799149a9c4eb708a34ea7c9ce67e2').then((contract) => {
        console.log(contract.address);
        contractInstance = contract;
        this.setState({address: contractInstance.address});
        return;
      });
    })

  }
  render() {
    return (<div className="App">
      {
        this.state.address
          ? <h1>合约地址：{this.state.address}</h1>
          : <div/>
      }
      <h2>上传图片到IPFS：</h2>
      <div>
        <label id="file">Choose file to upload</label>
        <input type="file" ref="file" id="file" name="file" multiple="multiple"/>
      </div>
      <div>
        <button onClick={() => {
            var file = this.refs.file.files[0];
            var reader = new FileReader();
            // reader.readAsDataURL(file);
            reader.readAsArrayBuffer(file)
            reader.onloadend = function(e) {
              console.log(reader);
              saveImageOnIpfs(reader).then((hash) => {
                console.log(hash);
                this.setState({imgHash: hash})
              });

            }.bind(this);

          }}>将图片上传到IPFS并返回图片HASH</button>
      </div>
      {
        this.state.imgHash
          ? <div>
              <h2>imgHash：{this.state.imgHash}</h2>
              <button onClick={() => {
                  contractInstance.set(this.state.imgHash, {from: account}).then(() => {
                    console.log('图片的hash已经写入到区块链！');
                    this.setState({isWriteSuccess: true});
                  })
                }}>将图片hash写到区块链：contractInstance.set(imgHash)</button>
            </div>
          : <div/>
      }
      {
        this.state.isWriteSuccess
          ? <div>
              <h1>图片的hash已经写入到区块链！</h1>
              <button onClick={() => {
                  contractInstance.get({from: account}).then((data) => {
                    console.log(data);
                    this.setState({blockChainHash: data});
                  })
                }}>从区块链读取图片hash：contractInstance.get()</button>
            </div>
          : <div/>
      }
      {
        this.state.blockChainHash
          ? <div>
              <h3>从区块链读取到的hash值：{this.state.blockChainHash}</h3>
            </div>
          : <div/>
      }
      {
        this.state.blockChainHash
          ? <div>
              <h2>浏览器访问：{"http://localhost:8080/ipfs/" + this.state.imgHash}</h2>
              <img alt="" style={{
                  width: 1600
                }} src={"http://localhost:8080/ipfs/" + this.state.imgHash}/>
            </div>
          : <img alt=""/>
      }
    </div>);
  }
}

export default App
