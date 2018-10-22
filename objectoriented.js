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
			var ipCandidate = userTextInput[0].trim();
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
}