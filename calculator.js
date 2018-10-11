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

	displayOctetArrayBinary(octetArrayBinary);
	console.log(CIDR);

	// join the IP binary strings in the array into one and print it
	var ipBinary = octetArrayBinary.join('');
	console.log(ipBinary);

	// print the subnet mask
	var netmask = getSubnetMaskFromCIDR(CIDR);
	console.log(netmask);

	// print network ID
	var networkIdBinary = getNetworkId(ipBinary, netmask);
	console.log(networkIdBinary);

	// get the network ID as a decimal array, print it
	var networkIdDecimal = getDecimalForNetworkId(networkIdBinary);
	console.log(networkIdDecimal);

	// get network ID as a decimal string, display it
	var networkIdString = getNetworkIdAsString(networkIdDecimal);
	document.getElementById('network-id').innerHTML = networkIdString;

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

function getNetworkId(ip, netmask) {
	var networkId = '';
	// do bitwise AND on the IP address and subnet mask to get network ID
	for (var i = 0; i < ip.length; i++) {
		networkId += ip.charAt(i) & netmask.charAt(i);
	}

	return networkId;
}

function getDecimalForNetworkId(networkId) {
	var networkIdOctetsBinary = networkId.match(/.{8}/g); // creates an array of strings of network ID octets in binary
	// TODO: convert to decimal
	var networkIdOctetsDecimal = [];
	networkIdOctetsBinary.forEach(function(octet) {
		// each octet is a binary string. use powers of 2 and the sum to get decimal value
		var decimal = 0; // rest decimal value to 0 for each new octet
		for (var i = 0; i < octet.length; i++) {
			decimal += powersOfTwo[i] * octet.charAt(i);
		}
		networkIdOctetsDecimal.push(decimal);
	});

	return networkIdOctetsDecimal;
}

// change the array of network ID octets to a string for displaying
function getNetworkIdAsString(networkId) {
	var networkIdString = networkId.join('.');
	return networkIdString;
}

function displayOctetArrayBinary(octetArrayBinary) {
	octetArrayBinary.forEach(function(octetBinary) {
		console.log(octetBinary);
	});
}