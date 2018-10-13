const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];
// don't want global vars. fix this later.
var CIDR = 0;
var startingNetworkId = '';

function main(ipWithCIDR) {
	var octetArrayBinary = [];
	var ipWithCIDRArray = ipWithCIDR.split('/'); // e.g. '192.168.1.0/24' becomes [192.168.1.0, 24]
	var octetArrayDecimal = ipWithCIDRArray[0].split('.'); // get just the IP portion from the array and split it into octets
	CIDR = parseInt(ipWithCIDRArray[1], 10); //get just the CIDR portion from the array, convert to int with base 10 (decimal)

	octetArrayDecimal.forEach(function(octetDecimal) {
		var octetBinary = getBinaryStringForIP(octetDecimal);
		octetArrayBinary.push(octetBinary);
	});

	console.log('CIDR value given: /', CIDR);

	// join the IP binary strings in the array into one and print binary IP
	var ipBinary = octetArrayBinary.join('');
	console.log('IP address given (binary):', ipBinary);

	// print IP in decimal
	console.log('IP address given: ', getIpAsString(getDecimalFromBinaryIP(ipBinary)));

	// print the subnet mask in binary
	var netmask = getSubnetMaskFromCIDR(CIDR);
	console.log('Netmask given (binary): ', netmask);

	// print the subnet mask in decimal
	var netmaskDecimal = getIpAsString(getDecimalFromBinaryIP(netmask));
	console.log('Netmask given: ', netmaskDecimal);

	// get the network ID as a binary string
	var networkIdBinary = getNetworkId(ipBinary, netmask);
	console.log('Network ID (binary) :', networkIdBinary);
	startingNetworkId = networkIdBinary;

	// get the network ID as a decimal array
	var networkIdDecimal = getDecimalForNetworkId(networkIdBinary);
	displayNetworkId(networkIdDecimal);

	// get the address range, display it for user
	var addressRange = getAddressRange(networkIdBinary, CIDR);
	displayAddressRange(addressRange);
	
}

function displayNetworkId(networkIdDecimal) {
	// takes network ID as a decimal string, display it for user
	var networkIdChild = document.createElement('li');
	var networkIdString = getIpAsString(networkIdDecimal);
	var networkIdText = document.createTextNode(networkIdString);
	networkIdChild.appendChild(networkIdText);
	document.getElementById('network-id-list').appendChild(networkIdChild);
	console.log('Network ID: ', networkIdString);
}

function displayAddressRange(addressRange) {
	var addressRangeChild = document.createElement('li');
	var addressRangeText = document.createTextNode(addressRange[0] + ' to ' + addressRange[1]);
	addressRangeChild.appendChild(addressRangeText);
	document.getElementById('address-range-list').appendChild(addressRangeChild);
	console.log('Address range: ', addressRange[0], '-', addressRange[1]);
}

function getBinaryStringForIP(octetDecimal){
	var currentValue = octetDecimal;
	var octetBinary = '';
	// find the first value in powers of two that's smaller than currentValue
	powersOfTwo.forEach(function(powerOfTwo) {
		if (currentValue >= powerOfTwo) {
			currentValue -= powerOfTwo;
			octetBinary += '1';
		}

		else {
			octetBinary += '0';
		}
	});

	return octetBinary;

}

function getSubnetMaskFromCIDR(cidrValue) {
	var subnetMask = '';
	var networkBits = cidrValue; // given CIDR value tells us how many bits belong to the network
	var hostBits = 32 - cidrValue; // IPv4 addresses are 32 bits, so remainder belongs to hosts

	// add a number of 1s to the netmask equal to CIDR value, the network portion
	for (var i = 0; i < networkBits; i++) {
		subnetMask += '1';
	}

	// add a number of 0s to netmask equal to 32 - CIDR value, the host portion
	for (var i = 0; i < hostBits; i++) {
		subnetMask += '0';
	}

	return subnetMask;
}

// return the network ID as a binary string
function getNetworkId(ip, netmask) {
	var networkId = '';
	// do bitwise AND on the IP address and subnet mask to get network ID
	for (var i = 0; i < ip.length; i++) {
		networkId += ip.charAt(i) & netmask.charAt(i);
	}

	return networkId;
}

// converts an IP given as a binary string (32 bits) to an array of decimal octets
function getDecimalFromBinaryIP(binary) {
	var binaryOctets = binary.match(/.{8}/g); //
	var decimalOctets = [];
	binaryOctets.forEach(function (octet) {
		// each octet is a binary string. use the sum of powers of 2 to get decimal value
		var decimal = 0; // reset decimal value to 0 for each new octet
		for (var i = 0; i < octet.length; i++) {
			decimal += powersOfTwo[i] * octet.charAt(i);
		}
		decimalOctets.push(decimal);
	});

	return decimalOctets;
}

// take the network ID as a binary string and return the network ID as an array of decimal octets
function getDecimalForNetworkId(networkId) {
	var networkIdOctetsDecimal = getDecimalFromBinaryIP(networkId);
	return networkIdOctetsDecimal;
}

// change the array of IP octets to a string for displaying
function getIpAsString(ipOctets) {
	var ipString = ipOctets.join('.');
	return ipString;
}

// calculate the range of addresses for the subnet. this will be from host bits all 0 (network ID) to host bits all 1 (broadcast addr)
// takes a networkIdBinary string and an integer CIDR
function getAddressRange(networkIdBinary, CIDR) {
	var addressRange = []; // will contain first and last address in the subnet as properly formatted strings, e.g. ['192.168.0.0', '192.168.0.255']
	var firstAddress = getIpAsString(getDecimalFromBinaryIP(networkIdBinary));
	// change host bits from all 0s to all 1s for broadcast address
	// get just the network portion of the IP
	var networkPortion = networkIdBinary.slice(0, CIDR);
	// concat the needed number of host bits (32-CIDR) to the end
	var hostPortion = '1'.repeat(32 - CIDR);
	var lastAdressBinary = networkPortion + hostPortion;
	var lastAddress = getIpAsString(getDecimalFromBinaryIP(lastAdressBinary));
	addressRange.push(firstAddress, lastAddress);
	return addressRange;
}

function processSubnets(selectedValue) {
	// each time this runs, clear the entries from before
	var networkIdList = document.getElementById('network-id-list');
	var addressRangeList = document.getElementById('address-range-list');

	while(networkIdList.firstChild) {
		networkIdList.removeChild(networkIdList.firstChild);
	}

	while(addressRangeList.firstChild) {
		addressRangeList.removeChild(addressRangeList.firstChild);
	}

	// display the first network ID
	displayNetworkId(getDecimalForNetworkId(startingNetworkId));

	// 32 - CIDR gives host bits and also how many could be borrowed for subnetting.
	// n bits borrowed for subnetting gives max of 2^n subnets
	// 0 bits -> 1 subnet, 1 bit 2 subnets, 2 bits 4 subnets, 3 bits 8 subnets, etc
	// this uses my formula N = ceil(log_2(n)) to calculate bits N required to create at least n subnets
	var selectedValue = parseInt(selectedValue);
	var bitsRequired = Math.ceil((Math.log2(selectedValue)));
	var numberOfSubnets = 2 ** bitsRequired; // e.g. 2^3 = 8 subnets if the user-selected value of n was 6
	console.log('Number of subnets selected:', selectedValue)
	console.log('Number of subnets to be created:', numberOfSubnets,'(using', bitsRequired, 'bits)');

	// divide the address space as required. the borrowed bits will now be part of the network ID. 
	// e.g. if we take 192.168.1.0/24 and borrow 2 bits, we get 4 subnets that are /26.
	// the network IDs would then be 192.168.1.0, 192.168.1.64, 192.168.1.128, 192.168.1.192
	// borrowed bits are from the 128 and 64 value places, and those IPs represent borrowed bit values 00, 01, 10, 11, respectively
	// so 192.168.1.0 - 192.168.1.127 has that bit as a 0, and 192.168.1.128 - 192.168.1.255 has that bit as a 1
	var addressRanges = []; 
	var startingCIDR = CIDR;
	var startingNetmask = getSubnetMaskFromCIDR(startingCIDR); //e.g. '11111111111111111111111100000000' for the /24 example above

	// adjust the subnet mask by the number of bits required to make the subnets
	var newCIDR = startingCIDR + bitsRequired;
	var newNetmask = getSubnetMaskFromCIDR(newCIDR); //e.g. '11111111111111111111111111000000' for the /26 above
	
	// need to grab the starting network ID as a binary string. e.g. '11000000101010000000000100000000' for 192.168.1.0
	// using the subnet mask, in the network ID, flip the bit in the position of the rightmost 1 of the mask (e.g. pos. 25 in the /26 mask above)
	// that will be the new CIDR number - 1
	var startNetId = startingNetworkId;
	var nextNetworkId = replaceAt(startNetId, newCIDR - 1, '1'); // should give '11000000101010000000000100100000', 192.168.1.64
	var nextNetworkIdDecimal = getDecimalForNetworkId(nextNetworkId);
	displayNetworkId(nextNetworkIdDecimal);

}

function replaceAt(string, index, replacementText) {
  return string.substring(0, index) + replacementText + string.substring(index + 1);
}
