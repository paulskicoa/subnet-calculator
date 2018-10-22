// onblur of ip/cidr, get value and validate it. if invalid, don't filter the subnet options, and when user clicks forward arrow, display invalid
// input modal and clear the input. if valid, filter the subnet options appropriately. either way, clear the previous results when user clicks forward arrow

// onblur validateInput()

$( document ).ready(function() {
	var networkUtils = new NetworkUtils();
	var ipAndCidr = document.getElementById('ipAndCidr');
	var network;
	ipAndCidr.addEventListener('blur', function() {
		network = networkUtils.tryGetNetwork(ipAndCidr.value);
	});

	$('#arrow-box-back').click(function() {
		clearResults();
		$('#card-deck-id').fadeOut(300);
		$('#container-2-id').delay(400).fadeIn(300);
		$('#arrow-box-back').fadeOut(300);
		$('#arrow-box-forward').delay(400).fadeIn(300);
		$('#authorInfo').delay(400).fadeIn(300);
		$('#header-message-results').fadeOut(300);
		$('#header-message-intro').delay(400).fadeIn(300);
	});
});