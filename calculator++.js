function fadeOut() {
	var target = document.getElementsByClassName('container-2');
	var length = target.length;
	for (var i = 0; i < length; i++) {
		target[i].className = 'animate';
	}

	var calcButton = document.getElementById('calcButton');
	calcButton.className = 'animate';
}