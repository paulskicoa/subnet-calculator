const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];
const ipOnlyRegex = /^(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)$/;
const ipWithCidrRegex = /^(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\s*\/\d{1,2}$/;
const cidrRegex = /.*\/\d{1,2}$/;

class Network { // can only be constructed from valid input. therefore, need an external method to validate before calling ctor
	constructor(ip, cidr, numSubnets, networkUtils) {
		this.networkUtils = networkUtils; // so other methods can use the same networkUtils instance
		this.ip = ip;
		this.ipBinary = '';
		this.cidr = cidr;
		this.newCIDR = cidr; // will be adjusted if there are subnets required
	    this.numSubnets = numSubnets;
	    this.subnets = [];
	    this.addressRanges = []; // all addresses, including network id and broadcast, for each subnet. should be an array of arrays, like [['192.168.1.0', '192.168.1.X'], ['192.168.1.X+1', '192.168.1.Y']...]
	    this.usableAddressRanges = []; // excludes network id and broadcast from each subnet
	    this.networkIdsBinary = []; // for calculations
	    this.networkIdsDecimal = []; // for displaying
	    this.addFirstId();
	    this.usableHostsPerSubnet = 0; // e.g. 254
	    this.addressesPerSubnet = 0; // e.g. 256

    }

    addFirstId() {
    	// add the first id for the network based on user input
    	this.ipBinary = this.networkUtils.getBinaryStringForIP(this.networkUtils.getDecimalIpAsDecimalArray(this.ip));
	    this.networkIdsBinary.push(this.networkUtils.getNetworkId(this.ipBinary, this.networkUtils.getSubnetMaskFromCIDR(this.cidr)));
	    this.networkIdsDecimal.push(this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(this.networkIdsBinary[0])));
    }

    getNumUsableHostsPerSubnet(){ // network
		var numHostBits = 32 - this.newCIDR;
		var hostsPerSubnet = (2**numHostBits) - 2; // subtract one for network id and another for broadcast address
		return hostsPerSubnet;
	}

	getNumTotalAssignableIps() { // network
		return this.numSubnets * this.getNumUsableHostsPerSubnet();
	}

	getUsableAddressRanges() { // network
		var numHostBits = 32 - this.newCIDR;
		var addressPair = []; // first and last usable addresses in each subnet. the above is an array of these. this will get reused in the for loop
		var tempNetId = ''; // temp string to hold a network ID during the calculation
		var firstIp = ''; // holds the first address in each pair
		var secondIp = ''; // holds the second address in each pair
		for (var i = 0; i < this.networkIdsBinary.length; i++) {
			addressPair = [];
			// make host bits all 0s ending in 1 for first address
			tempNetId = this.networkIdsBinary[i].substring(0, this.newCIDR); // 2nd param, end index, is not inclusive
			firstIp = tempNetId + '0'.repeat(numHostBits - 1) + '1';

			// make host bits all 1s ending in 0 for last address
			secondIp = tempNetId + '1'.repeat(numHostBits - 1) + '0';

			// convert both IPs to decimal strings
			firstIp = this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(firstIp));
			secondIp = this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(secondIp));

			addressPair.push(firstIp);
			addressPair.push(secondIp);
			this.usableAddressRanges.push(addressPair);
		}
		return this.usableAddressRanges;
	}

	displayStatistics(item) { // network
		var cardListItem = document.createElement('li');
		var cardListItemText = document.createTextNode(item);
		cardListItem.appendChild(cardListItemText);
		cardListItem.className = 'list-group-item';
		document.getElementById('statistics').appendChild(cardListItem);
	}

	displayInputSummary(item) { // network
		var cardListItem = document.createElement('li');
		var cardListItemText = document.createTextNode(item);
		cardListItem.appendChild(cardListItemText);
		cardListItem.className = 'list-group-item';
		document.getElementById('input-summary').appendChild(cardListItem);
	}

	addSubnets(selectedValue) { // the value from the select option and the first network id, in binary
		this.numSubnets = 2**parseInt(selectedValue); // the "value" of the chosen select option is 0-14 corresponding to 1 to 2^14 subnets, but 1 will be adjusted to 0
		if(selectedValue === '0') {
			this.displayInputSummary('Subnets: 0 (only 1 network)');
		}

		else {
			this.displayInputSummary('Subnets: ' + this.numSubnets);
		}

		var bitsRequired = parseInt(selectedValue);
		this.displayStatistics('Bits borrowed for subnets: ' + bitsRequired);

		// divide the address space as required. the borrowed bits will now be part of the network ID. 
		// e.g. if we take 192.168.1.0/24 and borrow 2 bits, we get 4 subnets that are /26.
		// the network IDs would then be 192.168.1.0, 192.168.1.64, 192.168.1.128, 192.168.1.192
		// borrowed bits are from the 128 and 64 value places, and those IPs represent borrowed bit values 00, 01, 10, 11, respectively
		// so 192.168.1.0 - 192.168.1.127 has that bit as a 0, and 192.168.1.128 - 192.168.1.255 has that bit as a 1
		// or you could have borrowed bit values of 000, 001, 010, 011, 100, 101, 110, 111 for 3 bits, etc 
		var startingNetmask = this.networkUtils.getSubnetMaskFromCIDR(this.cidr); //e.g. '11111111111111111111111100000000' for the /24 example above

		// adjust the subnet mask by the number of bits required to make the subnets
		this.newCIDR = this.cidr + bitsRequired;
		var newNetmask = this.networkUtils.getSubnetMaskFromCIDR(this.newCIDR); //e.g. '11111111111111111111111111000000' for the /26 above
		var decimalStringNetmask = this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(newNetmask));
		this.displayStatistics('/' + this.newCIDR + ' netmask: ' + decimalStringNetmask);
		
		// need to grab the starting network ID as a binary string. e.g. '11000000101010000000000100000000' for 192.168.1.0
		// using the subnet mask, in the network ID, flip the bit in the position of the rightmost 1 of the mask (e.g. pos. 25 in the /26 mask above)
		// that will be the new CIDR number - 1
		// this handles the network IDs
		var bitCombos = [];
		var nextNetId = this.networkIdsBinary[0]; // start the next net ID the same as first one before altering
		var nextNetIdDecimal = '';
		var subnet;
		// count up to 2**bitsRequired (num subnets), pad or trim string length to bitsRequired as needed
		for (var i = 1; i < this.numSubnets; i++) {
			bitCombos.push(this.networkUtils.decimalToBinary(i, bitsRequired));
		}
		console.log('Network ID combos to be added:', bitCombos);
		
		for (var i = 0; i < bitCombos.length; i++) {
			nextNetId = nextNetId.slice(0, this.cidr) + bitCombos[i];
			nextNetId = nextNetId + '0'.repeat(32 - nextNetId.length);
			subnet = new Subnet(nextNetId, this.newCIDR);
			this.subnets.push(subnet);
			this.networkIdsBinary.push(nextNetId);
			this.addressRanges.push(subnet.getAddressRange(this.networkUtils));
			nextNetIdDecimal = this.networkUtils.getDecimalFromBinaryIP(nextNetId);
			this.networkIdsDecimal.push(this.networkUtils.getIpAsString(nextNetIdDecimal));
		}

		// display all network IDs on network
		for (var i = 0; i < this.networkIdsDecimal.length; i++) {
			this.networkUtils.displayNetworkId(this.networkIdsDecimal[i], this.newCIDR);
		}
		console.log('Network IDs:', this.networkIdsDecimal);
		this.usableAddressRanges = this.getUsableAddressRanges();
		// display usable address ranges
		this.networkUtils.displayAddressRanges(this.usableAddressRanges);
		this.usableHostsPerSubnet = this.getNumUsableHostsPerSubnet();
		this.displayStatistics('Max ' + this.usableHostsPerSubnet + ' hosts per subnet');
		this.displayStatistics(this.getNumTotalAssignableIps(this.usableHostsPerSubnet, this.numSubnets) + ' total assignable IPs');
	}

	processInput() {
		var octetArrayDecimal = this.networkUtils.getDecimalIpAsDecimalArray(this.ip); // split IP into octets

		console.log('IP address given (binary):', this.ipBinary);

		// print IP in decimal
		var decimalIpString = this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(this.ipBinary));
		this.displayInputSummary('IP: ' + decimalIpString);
		console.log('IP address given: ', decimalIpString);

		this.displayInputSummary('CIDR: /' + this.cidr + (this.networkUtils.cidrInferred? ' (inferred from IP class)':''));
		console.log('CIDR value given: /', this.cidr);

		// print the subnet mask in binary
		var netmask = this.networkUtils.getSubnetMaskFromCIDR(this.cidr);
		console.log('Netmask given (binary): ', netmask);

		// print the subnet mask in decimal
		var netmaskDecimal = this.networkUtils.getIpAsString(this.networkUtils.getDecimalFromBinaryIP(netmask));
		// displayStatistics('Subnet Mask: ' + netmaskDecimal);
		console.log('Netmask given: ', netmaskDecimal);

		var select = document.getElementById('numSubnets');
		var selectedOption = select.options[select.selectedIndex].value;
		this.addSubnets(selectedOption);
	}
}

class Subnet {
	constructor(networkIdBinary, cidr) {
	  	this.id = networkIdBinary; // first ip
	    this.cidr = cidr;
  	}

  	// calculate the range of addresses for the subnet. this will be from host bits all 0 (network ID) to host bits all 1 (broadcast addr)
	// takes a networkIdBinary string and an integer CIDR. each instance of subnet has its own address range
	getAddressRange(networkUtils) { // subnet
		var addressRange = []; // will contain first and last address in the subnet as properly formatted strings, e.g. ['192.168.0.0', '192.168.0.255']
		var firstAddress = networkUtils.getIpAsString(networkUtils.getDecimalFromBinaryIP(this.id));
		// change host bits from all 0s to all 1s for broadcast address
		// get just the network portion of the IP
		var networkPortion = this.id.slice(0, this.cidr);
		// concat the needed number of host bits (32-CIDR) to the end
		var hostPortion = '1'.repeat(32 - this.cidr);
		var lastAdressBinary = networkPortion + hostPortion;
		var lastAddress = networkUtils.getIpAsString(networkUtils.getDecimalFromBinaryIP(lastAdressBinary));
		addressRange.push(firstAddress, lastAddress);
		return addressRange;
	}
}

class NetworkUtils {
	constructor() {
		this.cidrInferred = false;
	}

	displayNetworkId(networkIdDecimal, newCIDR) {
		// takes network ID as a decimal string, display it for user
		// more common to display e.g. 10.3.0.0/16 as just 10.3/16, so this will do that 
		var networkIdChild = document.createElement('li');
		var regex = /(\.0)+$/;
		networkIdDecimal = networkIdDecimal.replace(regex, '') + '/' + newCIDR;
		var networkIdText = document.createTextNode(networkIdDecimal);
		networkIdChild.appendChild(networkIdText);
		networkIdChild.className = 'list-group-item';
		document.getElementById('network-id-list').appendChild(networkIdChild);
		console.log('Network ID: ', networkIdDecimal);
	}

	displayAddressRanges(addressRanges) {
		for (var i = 0; i < addressRanges.length; i++) {
			this.displayAddressRange(addressRanges[i]);
		}
	}
	
	// no conversion with this function. Address range should already be in decimal
	displayAddressRange(addressRange) {
		var addressRangeChild = document.createElement('li');
		var addressRangeText = document.createTextNode(addressRange[0] + ' to\n' + addressRange[1]);
		addressRangeChild.appendChild(addressRangeText);
		addressRangeChild.className = 'list-group-item';
		document.getElementById('address-range-list').appendChild(addressRangeChild);
		console.log('Address range: ', addressRange[0], '-', addressRange[1]);
	}

	getDecimalIpAsDecimalArray(ip) {
		return ip.split('.');
	}

	// take ip as binary string. return the network ID as a binary string. this is for the first ID in a network. the rest will be calculated in a different method
	getNetworkId(ip, netmask) {
		var networkId = '';
		// do bitwise AND on the IP address and subnet mask to get network ID
		for (var i = 0; i < ip.length; i++) {
			networkId += ip.charAt(i) & netmask.charAt(i);
		}
		return networkId;
	}

	isValidIP(ip) { // utils
		if(ip.match(ipOnlyRegex) === null) {return false;}
		var matches = ipOnlyRegex.exec(ip); // put the capture groups into an array. the octets will start at matches[1]
		// each should be a number between 0 and 255
		var octet;
		for (var i = 1; i < matches.length; i++) {
			octet = this.customParseInt(matches[i]);
			if(octet < 0 || octet > 255) {
				return false;
			}
		}
		return true;
	}

	customParseInt(str) { // used to validate IP or CIDR , utils
		// any string that has a zero as first char followed by any non-zero chars should be rejected
		var badInputRegex = /^0\d\d?$/;
		if(str.match(badInputRegex) == null) {
			// input is good
			return parseInt(str);
		}
		else {
			return -1; // input was bad
		}
	}

	getBinaryStringForIP(octetArrayDecimal){ // utils
		var ipBinaryString = '';
		// find the first value in powers of two that's smaller than currentValue
		for (var i = 0; i < octetArrayDecimal.length; i++) {
			powersOfTwo.forEach(function(powerOfTwo) {
				if (octetArrayDecimal[i] >= powerOfTwo) {
					octetArrayDecimal[i] -= powerOfTwo;
					ipBinaryString += '1';
				}

				else {
					ipBinaryString += '0';
				}
			});
		}
		
		return ipBinaryString;
	}

	getSubnetMaskFromCIDR(cidrValue) { // utils
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

	// converts an IP given as a binary string (32 bits) to an array of decimal octets
	getDecimalFromBinaryIP(binary) { // utils
		var binaryOctets = binary.match(/.{8}/g);
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

	// change the array of IP octets to a string for displaying
	getIpAsString(ipOctets) { // utils
		var ipString = ipOctets.join('.');
		return ipString;
	}

	isValidIP(ip) {
		if(ip.match(ipOnlyRegex) === null) {return false;}
		var matches = ipOnlyRegex.exec(ip); // put the capture groups into an array. the octets will start at matches[1]
		// each should be a number between 0 and 255
		var octet;
		for (var i = 1; i < matches.length; i++) {
			octet = this.customParseInt(matches[i]);
			if(octet < 0 || octet > 255) {
				return false;
			}
		}
		return true;
	}

	handleBadInput(errorCode) {
		// show invalid input modal, clear the ip and cidr input box
		// later: use error code to customize text the modal displays for a specific kind of input error
		// -1 = invalid IP, no cidr given; -3 = couldn't infer cidr from IP; -2=invalid IP/cidr combo; -4 = invalid cidr
		$('#invalidInputModal').modal('show');
		document.getElementById('ipAndCidr').value = '';
		return;
	}

	fixSubnetSelectOptions(cidr) {
		// ip and cidr are valid if this method gets called
		// restore all the options that exist by default
		
		var numHostBits = 32 - cidr;
		var maxBitsForSubnets = numHostBits - 2; // this ensures there will be at least 2 usable host IPs per subnet, i.e. the smallest useful subnet
		// remove all the select options with an id value greater than this number
		var optionsToDelete = [];
		for (var i = maxBitsForSubnets + 1; i < 15; i++) {
			optionsToDelete.push(i.toString());
		}
		$('select option').filter(function() {
			return $.inArray(this.value, optionsToDelete) !== -1
		}).remove();
	}

	isValidCidr(str) {
		var cidrCandidate = this.customParseInt(str);
		if(cidrCandidate === -1) {return false;}
		if(cidrCandidate < 1 || cidrCandidate > 31) {return false;}
		return true;
	}

	customParseInt(str) { // used to validate IP or CIDR
		// any string that has a zero as first char followed by any non-zero chars should be rejected
		var badInputRegex = /^0\d\d?$/;
		if(str.match(badInputRegex) == null) {
			// input is good
			return parseInt(str);
		}
		else {
			return -1; // input was bad
		}
	}

	attemptCidrInference(ip) {
		var octetArrayDecimal = this.getDecimalIpAsDecimalArray(ip);
		var firstOctet = parseInt(octetArrayDecimal[0]);
		if(firstOctet >= 0 && firstOctet <= 127) {return 8;} // Class A
		if(firstOctet >= 128 && firstOctet <= 191) {return 16;} // Class B
		if(firstOctet >= 192 && firstOctet <= 223) {return 24;} // Class C

		// user hasn't entered enough info. subnet mask/CIDR can't be determined, and there's no way to proceed
		return -3;
	}

	tryGetNetwork(userTextInput) {
	 	var ip;
	 	var cidr;
	 	if(userTextInput.match(ipOnlyRegex) !== null) { // only IP was given
	 		// ensure the IP is valid
	 		if(!this.isValidIP(userTextInput)) { // invalid IP given. alert the user
	 			this.handleBadInput(-1);
				return;
	 		} 
			
			ip = userTextInput;
			// the IP is valid, but no CIDR was given. attempt to infer its value from first octet number
			var result = this.attemptCidrInference(userTextInput);
			if(result === -3)  { // couldn't infer CIDR from IP
				this.handleBadInput(-3);
				return;
			}
		
			// we have valid IP and CIDR. proceed
			cidr = result;
			this.cidrInferred = true;
	 	} 

	 	else {
		// check for a valid IP and CIDR combo
			if(userTextInput.match(ipWithCidrRegex) === null) { // invalid input
				this.handleBadInput(-2);
				return;
			}

			// IP and CIDR have right format, but possibly not the valid numerical range. split into IP and CIDR parts and validate both
			var octetArrayBinary = [];
			var ipWithCIDRArray = userTextInput.split('/'); // e.g. '192.168.1.0/24' becomes [192.168.1.0, 24]
			// strip any whitespace from the end of the IP
			var ipCandidate = ipWithCIDRArray[0].trim();
			if(!this.isValidIP(ipCandidate)) { // invalid IP given
				this.handleBadInput(-1);
				return;
			} 
			ip = ipCandidate;
			// IP is valid, now check CIDR
			var cidrCandidate = ipWithCIDRArray[1].trim();
			if(!this.isValidCidr(cidrCandidate)) { // invalid cidr
				this.handleBadInput(-4);
				return;
			} 
			// we have valid IP and CIDR. proceed
			cidr = parseInt(cidrCandidate);
		}
		// filter the subnet choices based on cidr value, stated or inferred
		this.fixSubnetSelectOptions(cidr);

		// create a new network object with 0 subnets (default), which will be used if user clicks forward before changing subnets
		var network = new Network(ip, cidr, '0', this);
		console.log(network.ip, network.cidr, network.numSubnets);
		return network;
	}

	clearResults() {
		var networkIdList = document.getElementById('network-id-list');
		var addressRangeList = document.getElementById('address-range-list');
		var inputSummaryList = document.getElementById('input-summary');
		var statisticsList = document.getElementById('statistics');

		while(networkIdList.firstChild) {
			networkIdList.removeChild(networkIdList.firstChild);
		}

		while(addressRangeList.firstChild) {
			addressRangeList.removeChild(addressRangeList.firstChild);
		}

		while(inputSummaryList.firstChild) {
			inputSummaryList.removeChild(inputSummaryList.firstChild);
		}

		while(statisticsList.firstChild) {
			statistics.removeChild(statistics.firstChild);
		}	
	}

	rebuildSelectOptions() {
		$('#numSubnets').empty();
		// add all options
		var subnetsSelect = document.getElementById('numSubnets');
		for(var i = 0; i < 15; i++) {
			var option = document.createElement('option');
			option.value = i;
			if(i === 0) {
				option.innerHTML = '0 (only 1 network)';
			}
			else {
				option.innerHTML = '' + 2**i;
			}
			subnetsSelect.appendChild(option);
		}
	}

	decimalToBinary(decimal, bitsRequired) {
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

		binaryString = binaryString.substring(binaryString.length - bitsRequired);
		return binaryString;
	}
}