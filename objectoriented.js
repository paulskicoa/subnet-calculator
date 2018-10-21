class Network {
	constructor(ipCidr, numSubnets) {
    this.numSubnets = numSubnets;
    this.subnets = [];
    // process the ip cidr combo
    this.id = '192.168.1.0'; // first ip
    this.cidr = '24';
  }
}

class Subnet {
	constructor(networkId, cidr) {
  	this.id = networkId; // first ip
    this.cidr = cidr;
  }
}

class IpRange {
	constructor(ipCidr) {
  	// process the ip and cidr to separate ip and cidr properties
    this.firstAddress = '192.168.1.0';
    this.lastAddress = '192.168.1.255';
  }
}

class NetworkUtils {
	 validateInput() {}
	 handleBadInput() {} // etc
}

// separate js file
// user clicks calculate and the text in the ip/cidr box becomes a network  object
var network = new Network('192.168.1.12/24', '4');
document.getElementById('text-area').innerHTML = network.id + ' /' + network.cidr;
// must create as many subnet objects as user picked
var text = document.getElementById('text-area').innerHTML;
for(i=0; i<network.numSubnets; i++) {
	network.subnets.push(new Subnet('192.168.1.64', '26'));
}

network.subnets.forEach(function(subnet) {
	document.getElementById('text-area').innerHTML += subnet.networkId + subnet.cidr;
});






