const powersOfTwo = [128, 64, 32, 16, 8, 4, 2, 1];
const ipOnlyRegex = /^(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)$/;
const ipWithCidrRegex = /^(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\.(\d\d?\d?)\s*\/\d{1,2}$/;
const cidrRegex = /.*\/\d{1,2}$/;

class Network { // can only be constructed from valid input. therefore, need an external method to validate before calling ctor
	constructor(ip, cidr, numSubnets) {
		this.ip = ip;
		this.cidr = cidr;
	    this.numSubnets = numSubnets;
	    this.subnets = [];   
  }
}

class Subnet {
	constructor(networkId, cidr) {
	  	this.id = networkId; // first ip
	    this.cidr = cidr;
  }
}

class NetworkUtils {

	constructor() {
		this.cidrInferred = false;
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

	attemptCidrInference(ip) {
		var octetArrayDecimal = ip.split('.');
		var firstOctet = parseInt(octetArrayDecimal[0]);
			if(firstOctet >= 0 && firstOctet <= 127) {return 8;} // Class A
			if(firstOctet >= 128 && firstOctet <= 191) {return 16;} // Class B
			if(firstOctet >= 192 && firstOctet <= 223) {return 24;} // Class C

			// user hasn't entered enough info. subnet mask/CIDR can't be determined, and there's no way to proceed
			return -3;
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
		var network = new Network(ip, cidr, '0');
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

	/*processSubnets(selectedValue, startingNetworkId) {
		// holds the network ids for all subnets (in decimal)
		var networkIds = [];
		var networkIdsBinary = []; // for use with the getUsableAddressRanges() function

		// holds address ranges for all subnets, without subtracting out the ones for network ID and broadcast
		var addressRanges = [];

		// convert the first network ID to a string like '192.168.1.0', add it to the array, display it
		var formattedNetworkId = getIpAsString(getDecimalForNetworkId(startingNetworkId));
		networkIds.push(formattedNetworkId);
		
		var numberOfSubnets = 2**parseInt(selectedValue);
		displayInputSummary('Subnets: ' + numberOfSubnets);

		var bitsRequired = parseInt(selectedValue);
		displayStatistics('Bits borrowed for subnets: ' + bitsRequired);

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
		var decimalStringNetmask = getIpAsString(getDecimalFromBinaryIP(newNetmask));
		displayStatistics('/' + newCIDR + ' netmask: ' + decimalStringNetmask);
		
		// need to grab the starting network ID as a binary string. e.g. '11000000101010000000000100000000' for 192.168.1.0
		// using the subnet mask, in the network ID, flip the bit in the position of the rightmost 1 of the mask (e.g. pos. 25 in the /26 mask above)
		// that will be the new CIDR number - 1
		// this handles the network IDs
		var startNetId = startingNetworkId;
		displayNetworkId(getDecimalForNetworkId(startingNetworkId), newCIDR);
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
			displayNetworkId(nextNetIdDecimal, newCIDR);
		});
		console.log('Network IDs:', networkIds);
		var usableAddressRanges = getUsableAddressRanges(networkIdsBinary, newCIDR);
		usableAddressRanges.forEach(function(addressRange){
			displayAddressRange(addressRange)});
		var numHostsPerSubnet = getNumUsableHostsPerSubnet(newCIDR);
		displayStatistics('Max ' + numHostsPerSubnet + ' hosts per subnet');
		displayStatistics(getNumTotalAssignableIps(numHostsPerSubnet, numberOfSubnets) + ' total assignable IPs');
	}*/

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
}