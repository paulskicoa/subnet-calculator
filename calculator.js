const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];
// don't want global vars. fix this later.
var CIDR = 0;
var startingNetworkId = '';

function main(ipWithCIDR) {
	clearResults();
	var octetArrayBinary = [];
	var ipWithCIDRArray = ipWithCIDR.split('/'); // e.g. '192.168.1.0/24' becomes [192.168.1.0, 24]
	var octetArrayDecimal = ipWithCIDRArray[0].split('.'); // get just the IP portion from the array and split it into octets
	CIDR = parseInt(ipWithCIDRArray[1], 10); //get just the CIDR portion from the array, convert to int with base 10 (decimal)

	octetArrayDecimal.forEach(function(octetDecimal) {
		var octetBinary = getBinaryStringForIP(octetDecimal);
		octetArrayBinary.push(octetBinary);
	});

	// join the IP binary strings in the array into one and print binary IP
	var ipBinary = octetArrayBinary.join('');
	console.log('IP address given (binary):', ipBinary);

	// print IP in decimal
	var decimalIpString = getIpAsString(getDecimalFromBinaryIP(ipBinary));
	displayInputSummary('IP: ' + decimalIpString);
	console.log('IP address given: ', decimalIpString);

	displayInputSummary('CIDR: /' + CIDR);
	console.log('CIDR value given: /', CIDR);

	// print the subnet mask in binary
	var netmask = getSubnetMaskFromCIDR(CIDR);
	console.log('Netmask given (binary): ', netmask);

	// print the subnet mask in decimal
	var netmaskDecimal = getIpAsString(getDecimalFromBinaryIP(netmask));
	// displayInputSummary('Subnet Mask: ' + netmaskDecimal);
	console.log('Netmask given: ', netmaskDecimal);

	// get the network ID as a binary string
	var networkIdBinary = getNetworkId(ipBinary, netmask);
	console.log('Network ID (binary) :', networkIdBinary);
	startingNetworkId = networkIdBinary;

	// get the network ID as a decimal array
	/*var networkIdDecimal = getDecimalForNetworkId(networkIdBinary);
	// displayNetworkId(networkIdDecimal);

	// get the address range, display it for user
	var addressRange = getAddressRange(networkIdBinary, CIDR);*/
	
}

function displayInputSummary(item) {
	var cardListItem = document.createElement('li');
	var cardListItemText = document.createTextNode(item);
	cardListItem.appendChild(cardListItemText);
	cardListItem.className = 'list-group-item';
	document.getElementById('input-summary').appendChild(cardListItem);
}

function displayStatistics() {

}

function displayNetworkId(networkIdDecimal) {
	// takes network ID as a decimal string, display it for user
	var networkIdChild = document.createElement('li');
	var networkIdString = getIpAsString(networkIdDecimal);
	var networkIdText = document.createTextNode(networkIdString);
	networkIdChild.appendChild(networkIdText);
	networkIdChild.className = 'list-group-item';
	document.getElementById('network-id-list').appendChild(networkIdChild);
	console.log('Network ID: ', networkIdString);
}

// no conversion with this function. Address range should already be in decimal
function displayAddressRange(addressRange) {
	var addressRangeChild = document.createElement('li');
	var addressRangeText = document.createTextNode(addressRange[0] + ' to\n' + addressRange[1]);
	addressRangeChild.appendChild(addressRangeText);
	addressRangeChild.className = 'list-group-item';
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

// this subtracts out the first and last IPs in each subnet, as those are reserved for the network ID and broadcast addresses and aren't assignable
// networkIdsBinary is an array
// all host bits are 0 for the network ID, so to get the first usable address on a subnet, we should make the host bits all 0s ending in 1
// all host bits are 1 for the broadcast addr, so to get the last usable address on a subnet, make the host bits all 1s ending in 0
// e.g. 192.168.1.0, 192.168.1.32 should become 192.168.1.1 to 192.168.1.30 and 192.168.1.33 to ...
function getUsableAddressRanges(networkIdsBinary, newCIDR) {
	var numHostBits = 32 - newCIDR;
	var usableAddressRanges = []; // should be an array of arrays, like [['192.168.1.1', '192.168.1.X'], ['192.168.1.X+1', '192.168.1.Y']...]
	var addressPair = []; // first and last usable addresses in each subnet. the above is an array of these. this will get reused in the for loop
	var tempNetId = ''; // temp string to hold a network ID during the calculation
	var firstIp = ''; // holds the first address in each pair
	var secondIp = ''; // holds the second address in each pair
	for (var i = 0; i < networkIdsBinary.length; i++) {
		addressPair = [];
		// make host bits all 0s ending in 1 for first address
		tempNetId = networkIdsBinary[i].substring(0, newCIDR); // 2nd param, end index, is not inclusive
		firstIp = tempNetId + '0'.repeat(numHostBits - 1) + '1';

		// make host bits all 1s ending in 0 for last address
		// debugger;
		secondIp = tempNetId + '1'.repeat(numHostBits - 1) + '0';

		// convert both IPs to decimal strings
		firstIp = getIpAsString(getDecimalFromBinaryIP(firstIp));
		secondIp = getIpAsString(getDecimalFromBinaryIP(secondIp));

		addressPair.push(firstIp);
		addressPair.push(secondIp);
		usableAddressRanges.push(addressPair);
	}
	return usableAddressRanges;
}

function clearResults() {
	var networkIdList = document.getElementById('network-id-list');
	var addressRangeList = document.getElementById('address-range-list');
	var inputSummaryList = document.getElementById('input-summary');

	while(networkIdList.firstChild) {
		networkIdList.removeChild(networkIdList.firstChild);
	}

	while(addressRangeList.firstChild) {
		addressRangeList.removeChild(addressRangeList.firstChild);
	}

	while(inputSummaryList.firstChild) {
		inputSummaryList.removeChild(inputSummaryList.firstChild);
	}
}

function processSubnets(selectedValue) {
	if (selectedValue === '') { // user left it blank, defaults to 1
		selectedValue = '1';
	}
	// holds the network ids for all subnets (in decimal)
	var networkIds = [];
	var networkIdsBinary = []; // for use with the getUsableAddressRanges() function

	// holds address ranges for all subnets, without subtracting out the ones for network ID and broadcast
	var addressRanges = [];

	// convert the first network ID to a string like '192.168.1.0', add it to the array, display it
	var formattedNetworkId = getIpAsString(getDecimalForNetworkId(startingNetworkId));
	networkIds.push(formattedNetworkId);
	displayNetworkId(getDecimalForNetworkId(startingNetworkId));

	// 32 - CIDR gives host bits and also how many could be borrowed for subnetting.
	// n bits borrowed for subnetting gives max of 2^n subnets
	// 0 bits -> 1 subnet, 1 bit 2 subnets, 2 bits 4 subnets, 3 bits 8 subnets, etc
	// this uses my formula N = ceil(log_2(n)) to calculate bits N required to create at least n subnets
	var selectedValue = parseInt(selectedValue);
	var bitsRequired = Math.ceil((Math.log2(selectedValue)));
	var numberOfSubnets = 2 ** bitsRequired; // e.g. 2^3 = 8 subnets if the user-selected value of n was 6

	if (selectedValue === numberOfSubnets) {
		displayInputSummary('Subnets: ' + selectedValue);
	}
	else {
		displayInputSummary('Subnets: ' + selectedValue + ', adjusted to ' + numberOfSubnets);
	}
	
	console.log('Number of subnets selected:', selectedValue)
	console.log('Number of subnets to be created:', numberOfSubnets,'(using', bitsRequired, 'bits)');

	// divide the address space as required. the borrowed bits will now be part of the network ID. 
	// e.g. if we take 192.168.1.0/24 and borrow 2 bits, we get 4 subnets that are /26.
	// the network IDs would then be 192.168.1.0, 192.168.1.64, 192.168.1.128, 192.168.1.192
	// borrowed bits are from the 128 and 64 value places, and those IPs represent borrowed bit values 00, 01, 10, 11, respectively
	// so 192.168.1.0 - 192.168.1.127 has that bit as a 0, and 192.168.1.128 - 192.168.1.255 has that bit as a 1
	// or you could have borrowed bit values of 000, 001, 010, 011, 100, 101, 110, 111 for 3 bits, etc 
	var startingCIDR = CIDR;
	var startingNetmask = getSubnetMaskFromCIDR(startingCIDR); //e.g. '11111111111111111111111100000000' for the /24 example above

	// adjust the subnet mask by the number of bits required to make the subnets
	var newCIDR = startingCIDR + bitsRequired;
	var newNetmask = getSubnetMaskFromCIDR(newCIDR); //e.g. '11111111111111111111111111000000' for the /26 above
	
	// need to grab the starting network ID as a binary string. e.g. '11000000101010000000000100000000' for 192.168.1.0
	// using the subnet mask, in the network ID, flip the bit in the position of the rightmost 1 of the mask (e.g. pos. 25 in the /26 mask above)
	// that will be the new CIDR number - 1
	// this handles the network IDs
	var startNetId = startingNetworkId;
	networkIdsBinary.push(startNetId);
	// store the first address range
	addressRanges.push(getAddressRange(startNetId, newCIDR)); // for if we ever want the raw address ranges. unused for now.
	var bitCombos = [];
	var nextNetId = startNetId;
	var nextNetworkIdDecimal = 0;
	// count up to 2**bitsRequired (num subnets), pad or trim string length to bitsRequired as needed
	for (var i = 1; i < numberOfSubnets; i++) {
		bitCombos.push(decimalToBinary(i, bitsRequired));
	}
	console.log('Network ID combos to be added:', bitCombos);
	bitCombos.forEach(function(bitCombo) {
		nextNetId = startNetId.slice(0, startingCIDR) + bitCombo;
		nextNetId = nextNetId + '0'.repeat(32 - nextNetId.length);
		networkIdsBinary.push(nextNetId);
		addressRanges.push(getAddressRange(nextNetId, newCIDR)); // for if we ever want the raw address ranges. unused for now.
		nextNetIdDecimal = getDecimalForNetworkId(nextNetId);
		networkIds.push(getIpAsString(nextNetIdDecimal));
		displayNetworkId(nextNetIdDecimal);
	});
	console.log('Network IDs:', networkIds);
	var usableAddressRanges = getUsableAddressRanges(networkIdsBinary, newCIDR);
	usableAddressRanges.forEach(function(addressRange){
		displayAddressRange(addressRange)});
}

function decimalToBinary(decimal, bitsRequired) {
	var currentValue = decimal;
	var binaryString = '';

	// to get max value from 3 bits, it's 1*2^2 + 1*2^1 + 1*2^0 = 7, for example
	for (var exp = bitsRequired - 1; exp >= 0; exp--) {
		if (currentValue >= 2**exp) {
			currentValue -= 2**exp;
			binaryString += '1';
		}

		else {
			binaryString += '0';
		}
	}

	/*while(binaryString.length < bitsRequired) {
		binaryString = '0' + binaryString;
	}*/
	binaryString = binaryString.substring(binaryString.length - bitsRequired);
	return binaryString;

}

function transitionForward() {
	// hide the fields
	var containerTarget = document.getElementsByClassName('container-2');
	var containerLength = containerTarget.length;
	for (var i = 0; i < containerLength; i++) {
		containerTarget[i].style.display = 'none';
	}

	// remove calculate button
	document.getElementById('calcButton').style.display = 'none';

	// show back button

	// show the results
	var cardsTarget = document.getElementsByClassName('card-deck');
	var cardsLength = cardsTarget.length;
	for (var i = 0; i < cardsLength; i++) {
		cardsTarget[i].removeAttribute('hidden');	
	}
}

function transitionBackward () {

}
