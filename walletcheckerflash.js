const Web3 = require('web3');
const web3 = new Web3('https://mainnet.infura.io/v3/7157cd565b524ec4a5ce7dc22ed04389');

async function isContract(address) {
    const code = await web3.eth.getCode(address);
    return code !== '0x';
}

const address = '0x4DE23f3f0Fb3318287378AdbdE030cf61714b2f3';
isContract(address).then(isContract => {
    if (isContract) {
        console.log('The address is a contract.');
    } else {
        console.log('The address is a wallet.');
    }
});