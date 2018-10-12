const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];

function main(ipWithCIDR) {
	var octetArrayBinary = [];
	var ipWithCIDRArray = ipWithCIDR.split('/'); // e.g. '192.168.1.0/24' becomes [192.168.1.0, 24]
	var octetArrayDecimal = ipWithCIDRArray[0].split('.'); // get just the IP portion from the array and split it into octets
	var CIDR = parseInt(ipWithCIDRArray[1], 10); //get just the CIDR portion from the array, convert to int with base 10 (decimal)

	octetArrayDecimal.forEach(function(octetDecimal) {
		var octetBinary = getBinaryStringForIP(octetDecimal);
		octetArrayBinary.push(octetBinary);
	});

	// displayOctetArrayBinary(octetArrayBinary);
	console.log('CIDR value given: /', CIDR);

	// join the IP binary strings in the array into one and print binary IP
	var ipBinary = octetArrayBinary.join('');
	console.log('IP address given (Binary):', ipBinary);

	// print IP in decimal
	console.log('IP address given: ', getIpAsString(getDecimalFromBinaryIP(ipBinary)));

	// print the subnet mask
	var netmask = getSubnetMaskFromCIDR(CIDR);
	console.log('Netmask given: ', netmask);

	// get the network ID as a binary string and print it
	var networkIdBinary = getNetworkId(ipBinary, netmask);
	// console.log(networkIdBinary);

	// get the network ID as a decimal array, print it
	var networkIdDecimal = getDecimalForNetworkId(networkIdBinary);
	// console.log(networkIdDecimal);

	// get network ID as a decimal string, display it for user
	var networkIdString = getIpAsString(networkIdDecimal);
	document.getElementById('network-id').innerHTML = networkIdString;
	console.log('Network ID: ', networkIdString);

	// get the address range, display it for user
	var addressRange = getAddressRange(networkIdBinary, CIDR);
	document.getElementById('address-range').innerHTML = addressRange[0] + ' to ' + addressRange[1];
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

function displayOctetArrayBinary(octetArrayBinary) {
	octetArrayBinary.forEach(function(octetBinary) {
		console.log(octetBinary);
	});
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