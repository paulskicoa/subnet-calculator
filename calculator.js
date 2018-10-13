const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];
// don't want global vars. fix this later.
var CIDR = 0;

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

	// get the network ID as a binary string and print it
	var networkIdBinary = getNetworkId(ipBinary, netmask);

	// get the network ID as a decimal array, print it
	var networkIdDecimal = getDecimalForNetworkId(networkIdBinary);
	displayNetworkId(networkIdDecimal);

	// get the address range, display it for user
	var addressRange = getAddressRange(networkIdBinary, CIDR);
	displayAddressRange(addressRange);
	
}

function displayNetworkId(networkIdDecimal) {
	// get network ID as a decimal string, display it for user
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

function processNumberOfSubnets(selectedValue) {
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
	// e.g. if we take 192.168.1.0/24 and borrow 1 bit, we get 2 subnets that are /25.
	// the network IDs would then be 192.168.1.0 and 192.168.1.128 (borrowed bit is a 0 or 1, respectively). this also means it's a 0 or 1 in the netmask
	var addressRanges = []; 
	var startingCIDR = CIDR;
	var startingNetmask = getSubnetMaskFromCIDR(startingCIDR); //e.g. '11111111111111111111111100000000' for the /24 example above

}