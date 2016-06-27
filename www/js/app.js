// angular.module is a global place for creating, registering and retrieving Angular modules
// 'KJHKApp' is the name of this angular module (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('KJHKApp', ['ionic'])
	.run(function($ionicPlatform) {
		$ionicPlatform.ready(function() {
			if (window.cordova && window.cordova.plugins.Keyboard) {
				// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
				// for form inputs)
				cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

				// Don't remove this line unless you know what you are doing. It stops the viewport
				// from snapping when text inputs are focused. Ionic handles this internally for
				// a much nicer keyboard experience.
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.StatusBar) {
				StatusBar.styleDefault();
			}
		});
	})

//This handles all the playlist angular UI functions
angular.module('KJHKApp')
	.controller('PlaylistsController', function($scope, $http) {
		$scope.playlistsInit = function() {
			playlistsLoad();
		};
		$scope.playlistRefresh = function() {
			console.log('This is working');
			changeDay(logDay);
			$scope.$broadcast('scroll.refreshComplete');
		};
		$scope.swipeRight = function() {
			changeDay(-1)
		};
		$scope.swipeLeft = function() {
			changeDay(1);
		};
	});

/****** STREAM ******/

var streamPlayer = null; //The Element object of the <audio> element, set to null when the stream is paused

//Used to keep track of whether the stream is playing or not
var playing = false;

//Used to force a play attempt after 15 seconds if loading is going slowly
var timeout;

//Play and Pause
function play() {
	if (!playing) {
		//Start the music by creating a new <audio> element
		$('#play-button').addClass('ng-hide');
		$('#pause-button').addClass('loading');
		$('#pause-button').removeClass('ng-hide');
		$('#play-pause-mask').removeClass('ng-hide');
		$('#stream-spinner').removeClass('ng-hide');

		streamPlayer = document.createElement('audio');
		var source = document.createElement('source');
		source.setAttribute('src', 'http://kjhkstream.org:8000/stream_low');
		streamPlayer.appendChild(source);
		streamPlayer.setAttribute('id', 'streamPlayer');

		document.getElementById('audioplayer').appendChild(streamPlayer);

		// If loading takes longer than 20 seconds, this event listener will cause
		// the stream to play as soon as possible, even if the buffer is not large enough
		// to play without gaps
		timeout = setTimeout(function() {
			streamPlayer.addEventListener('canplay',
				function() {
					$('#stream-spinner').addClass('ng-hide');
					$('#play-pause-mask').addClass('ng-hide');
					$('#pause-button').removeClass('loading');
					streamPlayer.play();
				}, 20000);
		});

		// Hides spinner and starts playback if the stream can start playing without
		// gaps in playback
		streamPlayer.addEventListener('canplaythrough',
			function() {
				if (streamPlayer.played.length == 0) {
					clearTimeout(timeout);
					$('#stream-spinner').addClass('ng-hide');
					$('#play-pause-mask').addClass('ng-hide');
					$('#pause-button').removeClass('loading');
					streamPlayer.play();
				}
			}, false);

		// If playback stops due to slow connection, display the loading indicator
		streamPlayer.addEventListener("waiting",
			function() {
				$('#stream-spinner').removeClass('ng-hide');
				$('#play-pause-mask').removeClass('ng-hide');
				$('#pause-button').addClass('loading');
			}, false);

		// Make sure that the pause button appears and loading indicator is hidden on playback
		streamPlayer.addEventListener("playing",
			function() {
				$('#stream-spinner').addClass('ng-hide');
				$('#play-pause-mask').addClass('ng-hide');
				$('#pause-button').removeClass('loading');
			}, false);

		playing = true;
	} else {
		//Destroy the <audio> element so that it doesn't keep using data while paused
		streamPlayer.pause();
		var source = streamPlayer.firstElementChild;
		source.setAttribute('src', '');
		streamPlayer.load();
		document.getElementById('audioplayer').removeChild(streamPlayer);
		streamPlayer = null; //This deletes all associated event listeners as well

		//Do this to make sure the spinner doesn't get left on screen if the play button is pressed before loading is finished
		$('#stream-spinner').addClass('ng-hide');
		$('#play-pause-mask').addClass('ng-hide');

		console.log('Changing button image to play');
		// Switch play button appearance to play
		document.getElementById('pause-button').classList.add('ng-hide');
		document.getElementById('play-button').classList.remove('ng-hide');
		playing = false;
	}
}

/**
 * Updates the current song playing (displayed underneath play/pause button)
 */
function updateCurrentSong() {
	$.getJSON("http://kjhk.org/web/app_resources/nowPlaying.php", function(data) {
		document.getElementById('nowplaying-song').innerHTML = data.song;
		document.getElementById('nowplaying-artist').innerHTML = data.artist;
	});
}

/******PLAYLISTS******/

/**
 * Used for displaying the month as a string in the "Music Logs for ..." area
 * @type {String[]}
 */
var monthStrings = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/**
 * Holds the elements of playlist containers for each day
 * @type {Object[]}
 */
var playlistSlides = [document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div')];

/**
 * Number of days ago that logs are being viewed for
 * @type {number}
 */
var logDay = 0;

/**
 * Date the current displayed logs are for
 */
var logDate = new Date();

/**
 * Extracts a javascript date object from a string formatted as YYYY?MM?DD?HH?mm?ss
 * @param rawDate {string}
 * @return cleanDate {Date}
 */
function getCleanDate(rawDate) {
	var cleanDate = new Date(rawDate.substring(0, 4),
		rawDate.substring(5, 7),
		rawDate.substring(8, 10),
		rawDate.substring(11, 13),
		rawDate.substring(14, 16),
		rawDate.substring(17));
	return cleanDate;
}

/**
 * Transforms two 24 hour format, integer hour/minute params into a 12 hour format string
 * @param hours {number} hours from 0-23
 * @param minutes {number} miniutes from 0-59
 * @return {string}
 */
function getTwelveHourTime(hours, minutes) {
	if (minutes < 10) {
		minutes = '0' + minutes;
	}
	if (hours == 0) {
		return '12:' + minutes + 'am';
	} else if (hours < 12) {
		return hours + ':' + minutes + ' am';
	} else if (hours == 12) {
		return '12:' + minutes + ' pm';
	} else {
		return hours % 12 + ':' + minutes + ' pm';
	}
}

/**
 * Updates the music logs with those of a given number of days ago, handling all appearance and formatting
 * @param day {number} The number of days ago logs are to be retrieved from (from 0-13)
 */
function getMusicLogs(day) {
	var logDate;
	$.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php?day=" + day, function(data) {
		var logs = '';
		var iter = false;
		$.each(data.logs, function(key, entry) {
			var bgClass = iter ? 'bg-1' : 'bg-2';
			iter = !iter;
			var items = [];
			items.push('<div class="music-entry ' + bgClass + '">');
			var myDate = getCleanDate(entry.Entry_Date);
			var dateStr = getTwelveHourTime(myDate.getHours(), myDate.getMinutes());

			items.push('<h5 class="music-entry-time">' + dateStr + '</h5>');
			items.push('<p class="music-entry-details">' + entry.Song + '<br> by ' + entry.Artist + '<br><i>from ' + entry.Album + '</i></p>');

			items.push('</div>');
			logs += items.join('');
		});
		playlistSlides[day].innerHTML = logs;
	});
}

/**
 * Handles the visual sliding transition between playlist slides
 * @param element {object} The slide element to transition in
 */
function transitionSlide(element) {
	var oldSlide = $('.slide.active');
	oldSlide.removeClass('active');
	if (oldSlide.data('day') > $(element).data('day')) {
		oldSlide.addClass('after');
	} else {
		oldSlide.addClass('before');
	}
	$(element).removeClass('before after');
	$(element).addClass('active');
}

/**
 * Changes the day of songs loaded by a given number of days (limited to between 0-13 inclusive)
 * @param num {number} a positive or negative integer to iterate days by
 */
function changeDay(num) {
	if (logDay + num > 13) {
		logDay = 13;
	} else if (logDay + num < 0) {
		logDay = 0;
	} else {
		logDay += num;
		logDate.setDate(logDate.getDate() - num);
	}
	if (num <= 0) getMusicLogs(logDay);
	if (logDay < 13 && playlistSlides[logDay + 1].innerHTML == '') getMusicLogs(logDay + 1);
	transitionSlide(playlistSlides[logDay]);
	updateDate();
}

function updateDate() {
	document.getElementById('music-log-date').innerHTML = 'Music Logs for ' + monthStrings[logDate.getMonth()] + ' ' + logDate.getDate();
}

function playlistsLoad() {
	console.log('playlists initializing...');
	//prepare playlistSlides elements
	$(playlistSlides[0]).addClass('slide active');
	for (var i = 0; i < playlistSlides.length; ++i) {
		if (i > 0) $(playlistSlides[i]).addClass('slide after');
		$(playlistSlides[i]).data('day', i);
		$('#music-logs').append(playlistSlides[i]);
	}
	$('#logs-spinner').addClass('ng-hide');
	changeDay(0);
}

updateCurrentSong();

window.setInterval(function() {
	updateCurrentSong()
}, 15000);
