/*function fadeOut() {
	var target = document.getElementsByClassName('container-2');
	var length = target.length;
	for (var i = 0; i < length; i++) {
		target[i].className = 'animate';	
	}

	var calcButton = document.getElementById('calcButton');
	calcButton.className = 'animate';
}

function unhideResults() {
	document.getElementById('card-deck-id').removeAttribute('hidden');
	fadeIn();
}

function fadeIn() {
	/*var target = document.getElementsByClassName('card-deck');
	var length = target.length;
	for (var i = 0; i < length; i++) {
		target[i].className = 'animateCards';	
	}
} */

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