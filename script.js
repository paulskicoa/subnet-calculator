// onblur of ip/cidr, get value and validate it. if invalid, don't filter the subnet options, and when user clicks forward arrow, display invalid
// input modal and clear the input. if valid, filter the subnet options appropriately. either way, clear the previous results when user clicks forward arrow

$( document ).ready(function() {
	var networkUtils = new NetworkUtils();
	var ipAndCidr = document.getElementById('ipAndCidr');
	var numSubnets = document.getElementById('numSubnets');
	var network;
	ipAndCidr.addEventListener('blur', function() {
		networkUtils.rebuildSelectOptions();
		network = networkUtils.tryGetNetwork(ipAndCidr.value);
	});

	$('#arrow-box-forward').click(function() {
		networkUtils.clearResults();
		network = networkUtils.tryGetNetwork(ipAndCidr.value);
		if (network !== null) {
			// get subnet choice
			network.numSubnets = numSubnets.value;
			console.log(network.ip, network.cidr, network.numSubnets);
			network.processInput();
			$('#container-2-id').fadeOut(300);
			$('#arrow-box-forward').fadeOut(300);
			$('#authorInfo').fadeOut(300);
			$('#header-message-intro').fadeOut(300);
			$('#header-message-results').delay(400).fadeIn(300);
			$('#card-deck-id').delay(400).fadeIn(300);
			$('#arrow-box-back').delay(400).fadeIn(300);
			$('.form-check').delay(400).fadeIn(300);
		}									
	});

	$('#arrow-box-back').click(function() {
		$('#card-deck-id').fadeOut(300);
		$('#container-2-id').delay(400).fadeIn(300);
		$('#arrow-box-back').fadeOut(300);
		$('#arrow-box-forward').delay(400).fadeIn(300);
		$('#authorInfo').delay(400).fadeIn(300);
		$('#header-message-results').fadeOut(300);
		$('.form-check').fadeOut(300);
		$('#header-message-intro').delay(400).fadeIn(300);
	});
});