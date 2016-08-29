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

				// Ionic handles this internally for a much nicer keyboard experience.
				cordova.plugins.Keyboard.disableScroll(true);
			}
			if (window.StatusBar) {
				StatusBar.styleDefault();
			}
		});
	});

angular.module('ionicApp', ['ionic']).config(function($ionicConfigProvider) {
	if (ionic.Platform.isAndroid())
		$ionicConfigProvider.scrolling.jsScrolling(false);
});

//This handles all the playlist angular UI functions
angular.module('KJHKApp')
	.controller('PlaylistsController', function($scope, $http, $ionicScrollDelegate) {
		$scope.playlistsInit = function() {
			console.log('Initializing Playlists...');
			playlistSlides[0].innerHTML = preloadSlide;
			loadPlaylists();
		};
		$scope.playlistRefresh = function() {
			console.log('Refreshing playlist');
			changeDay(logDay);
			$scope.$broadcast('scroll.refreshComplete');
		};
		$scope.swipeRight = function() {
			changeDay(-1);
			$scope.scrollToTop();
		};
		$scope.swipeLeft = function() {
			changeDay(1);
			$scope.scrollToTop();
		};
		$scope.scrollToTop = function() {
			$ionicScrollDelegate.$getByHandle('logs').scrollTop();
		};
	});
angular.module('KJHKApp')
	.controller('StreamController', function($scope, $http) {
		$scope.streamInit = function() {
			console.log('Initializing Stream...');
		};
	});
angular.module('KJHKApp')
	.controller('ContactController', function($scope, $http) {
		$scope.contactInit = function() {};
	});

/****** TOAST ******/

/**
 * Displays a toast message
 * @param {string} msg The message
 * @param {number} [duration=3000] The duration of the toast message in ms
 */
function showToast(msg, duration) {
	duration = duration || 3000;
	$('.toast-message').html(msg);
	$('.toast').removeClass('ng-hide hidden');
	setTimeout(hideToast, duration);
}

function hideToast() {
	$('.toast').addClass('hidden');
	setTimeout(function() {
		$('.toast').addClass('ng-hide');
	}, 1200);
}

/****** STREAM ******/

var streamPlayer = null; //The Element object of the <audio> element, set to null when the stream is paused

//Used to keep track of whether the stream is playing or not
var playing = false;

//Used to force a play attempt after 15 seconds if loading is going slowly
var timeout;

var streamSpinnerDeg = 0;

function visPlay() {
	$('#stream-spinner').addClass('ng-hide');
	$('#play-pause-mask').addClass('ng-hide');
	$('#pause-button').removeClass('loading');
}

function visLoad() {
	$('#stream-spinner').removeClass('ng-hide');
	$('#play-pause-mask').removeClass('ng-hide');
	$('#pause-button').addClass('loading');
}

function visPause() {
	$('#stream-spinner').addClass('ng-hide');
	$('#play-pause-mask').addClass('ng-hide');
	$('#pause-button').addClass('ng-hide');
	$('#play-button').removeClass('ng-hide');
}

/**
 * Checks if the stream is playing and updates the classes of the UI if it is.  If not, this will recurse through a 1s timeout
 * This is necessary because some browsers will not fire the 'playing' event after playback stalls
 *
 */
function checkPause() {
	if (streamPlayer.played.length) {
		visPlay();
	} else {
		setTimeout(checkPause, 1000);
	}
}

function play() {
	//Start the music by creating a new <audio> element
	$('#play-button').addClass('ng-hide');
	$('#pause-button').addClass('loading');
	$('#pause-button').removeClass('ng-hide');
	$('#play-pause-mask').removeClass('ng-hide');
	$('#stream-spinner').removeClass('ng-hide');

	streamPlayer = document.createElement('audio');
	source = document.createElement('source');
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
				visPlay();
				streamPlayer.play();
			});
	}, 10000);

	// Hides spinner and starts playback if the stream can start playing without
	// gaps in playback
	streamPlayer.addEventListener('canplaythrough',
		function() {
			if (streamPlayer.played.length === 0) {
				clearTimeout(timeout);
				visPlay();
				streamPlayer.play();
			}
		}, false);

	//
	streamPlayer.addEventListener('error',
		function() {
			showToast('An error occurred while trying to load the stream\nThe KJHK stream requires a stable data connection');
			stop();
		});

	// If playback stops due to slow connection, display the loading indicator
	streamPlayer.addEventListener("waiting",
		function() {
			visLoad();
			checkPause();
		}, false);

	// If playback stops due to slow connection, display the loading indicator
	streamPlayer.addEventListener("stalled",
		function() {
			showToast('Playback has stalled due to a slow data connection');
		}, false);

	// Make sure that the pause button appears and loading indicator is hidden on playback
	streamPlayer.addEventListener("playing",
		function() {
			visPlay();
		}, false);
	// Make sure that the pause button appears and loading indicator is hidden on playback
	streamPlayer.addEventListener("play",
		function() {
			visPlay();
		}, false);

	playing = true;
}

function stop() {
	//Destroy the <audio> element so that it doesn't keep using data while paused
	streamPlayer.pause();
	source = streamPlayer.firstElementChild;
	source.setAttribute('src', '');
	streamPlayer.load();
	document.getElementById('audioplayer').removeChild(streamPlayer);
	streamPlayer = null; //This deletes all associated event listeners as well
	clearTimeout(timeout);
	visPause();
	playing = false;
}

//Play and Pause
function play_pause() {
	var source;
	if (!playing) {
		play();
	} else {
		stop();
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
 * Holds the first day of music logs as a string so that they do not need to be loaded
 * @type {string}
 */
var preloadSlide = '';

/**
 * Number of days ago that logs are being viewed for
 * @type {number}
 */
var logDay = 0;

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
	if (hours === 0) {
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

function preloadMusicLogs() {
	$.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php?day=0", function(data) {
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
		preloadSlide = logs;
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
	}
	if (logDay === 0) getMusicLogs(logDay);
	if (logDay < 13 && playlistSlides[logDay + 1].innerHTML === '') getMusicLogs(logDay + 1);
	transitionSlide(playlistSlides[logDay]);
	updateDate();
}

function updateDate() {
	var date = new Date();
	date.setDate(date.getDate() - logDay);
	document.getElementById('music-log-date').innerHTML = 'Music Logs for ' + monthStrings[date.getMonth()] + ' ' + date.getDate();
}

function loadPlaylists() {
	//prepare playlistSlides elements
	$(playlistSlides[0]).addClass('slide active');
	for (var i = 0; i < playlistSlides.length; ++i) {
		if (i > 0) {
			$(playlistSlides[i]).addClass('slide after');
		}
		$(playlistSlides[i]).data('day', i);
		$('#music-logs').append(playlistSlides[i]);
	}
	$('#logs-spinner').addClass('ng-hide');
	changeDay(0);
}

updateCurrentSong();

preloadMusicLogs();

window.setInterval(function() {
	updateCurrentSong();
}, 15000);

/******CONTACT******/
