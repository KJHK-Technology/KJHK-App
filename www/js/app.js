// angular.module is a global place for creating, registering and retrieving Angular modules
// 'KJHK' is the name of this angular module (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('KJHK', ['ionic'])
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
	$ionicConfigProvider.scrolling.jsScrolling(true);
});

angular.module('KJHK')
	.controller('StreamController', function($scope, $http) {
		$scope.streamInit = function() {
			console.log('Initializing Stream...');

		};
	});

// This handles all the playlist angular UI functions
angular.module('KJHK')
	.controller('PlaylistsController', function($scope, $http, $ionicScrollDelegate) {
		$scope.playlistsInit = function() {
			console.log('Initializing Playlists...');
			playlists.playlistSlides[0].innerHTML = playlists.preloadSlide;
			playlists.loadPlaylists();
		};
		$scope.playlistRefresh = function() {
			console.log('Refreshing playlist');
			playlists.changeDay(0);
			$scope.$broadcast('scroll.refreshComplete');
		};
		$scope.swipeRight = function() {
			playlists.changeDay(1);
			$scope.scrollToTop();
		};
		$scope.swipeLeft = function() {
			playlists.changeDay(-1);
			$scope.scrollToTop();
		};
		$scope.scrollToTop = function() {
			$ionicScrollDelegate.$getByHandle('logs').scrollTop();
		};
	});
angular.module('KJHK')
	.controller('ContactController', function($scope, $http) {
		$scope.contactInit = function() {};
	});

/****** TOAST ******/

/**
 * Toast notifications
 */
var toast = {

	/**
	 * Displays a toast message
	 * @param {string} msg The message
	 * @param {number} [duration=3000] The duration of the toast message in ms
	 */
	show: function(msg, duration) {
		duration = duration || 3000;
		$('.toast-message').html(msg);
		$('.toast').removeClass('ng-hide hidden');
		setTimeout(toast.hide, duration);
	},

	/**
	 * Hides the toast message
	 */
	hide: function() {
		$('.toast').addClass('hidden');
		setTimeout(function() {
			$('.toast').addClass('ng-hide');
		}, 1200);
	}
};

/****** STREAM ******/

function Stream() {

	this.audio = null; //The Element object of the <audio> element, set to null when the stream is paused

	// Used to keep track of whether the stream is playing or not
	this.playing = false;

    this.context = new AudioContext();

	this.visual = {
		play: function() {
			$('#stream-spinner').addClass('ng-hide');
			$('#play-pause-mask').addClass('ng-hide');
			$('#pause-button').removeClass('loading');
		},

		load: function() {
			$('#stream-spinner').removeClass('ng-hide');
			$('#play-pause-mask').removeClass('ng-hide');
			$('#pause-button').addClass('loading');
		},

		pause: function() {
			$('#stream-spinner').addClass('ng-hide');
			$('#play-pause-mask').addClass('ng-hide');
			$('#pause-button').addClass('ng-hide');
			$('#play-button').removeClass('ng-hide');
		}
	};

	// Used to force a play attempt after 15 seconds if loading is going slowly
	this.timeout = null;
}

Stream.prototype = {

	/**
	 * Checks if the stream is playing and updates the classes of the UI if it is.  If not, this will recurse through a 1s timeout
	 * This is necessary because some browsers will not fire the 'playing' event after playback stalls
	 * @deprecated
	 */
	checkPause: function() {
		if (this.audio.played.length) {
			this.visual.play();
		} else {
			setTimeout(checkPause, 1000);
		}
	},

    hasPlayed: function() {
        return this.audio.played.length !== 0;
    },

	play: function() {
		//Start the music by creating a new <audio> element
		$('#play-button').addClass('ng-hide');
		$('#pause-button').addClass('loading');
		$('#pause-button').removeClass('ng-hide');
		$('#play-pause-mask').removeClass('ng-hide');
		$('#stream-spinner').removeClass('ng-hide');

		this.audio = document.createElement('audio');

        //prevents CORS issues
        this.audio.crossOrigin = "anonymous";

		source = document.createElement('source');
		source.setAttribute('src', 'http://kjhkstream.org:8000/stream_low');
	    this.audio.appendChild(source);
		this.audio.setAttribute('id', 'audio-element');
        document.getElementById('audioplayer').appendChild(this.audio);

        /*
        // Our <audio> element will be the audio source.
        this.mediasource = this.context.createMediaElementSource(document.getElementById('audio-element'));
        this.analyser = this.context.createAnalyser();
        this.mediasource.connect(this.analyser);
        this.analyser.fftSize = 2048;
        this.analyser.connect(this.context.destination);
        */

		document.getElementById('audioplayer').appendChild(this.audio);

        //this.interval = setInterval(this.processAudio, 500, false);

		// If loading takes longer than 20 seconds, this event listener will cause
		// the stream to play as soon as possible, even if the buffer is not large enough
		// to play without gaps
		this.timeout = setTimeout(function() {
			stream.audio.addEventListener('canplay',
				function() {
                    console.log('canplay');
					stream.visual.play();
					stream.audio.play();
				});
		}, 10000);

		// Tries to start playback if the stream can start playing without
		// gaps in playback
		this.audio.addEventListener('canplaythrough',
			function() {
                console.log('canplaythrough');
				if (stream.audio.played.length === 0) {
					clearTimeout(stream.timeout);
					stream.audio.play();
				}
			}, false);

		//
		this.audio.addEventListener('error',
			function() {
                console.log('error');
				toast.show('An error occurred while trying to load the stream\nThe KJHK stream requires a stable data connection');
				//stop();
			});

		// If playback stops due to slow connection, display the loading indicator
		this.audio.addEventListener("waiting",
			function() {
                console.log('waiting');
				stream.visual.load();
			}, false);

		// If playback stops due to slow connection, display the loading indicator
		this.audio.addEventListener("stalled",
			function() {
                console.log('stalled');
				toast.show('Playback has stalled<br>You may need to update your <a href="#" onclick="var event = arguments[0] || window.event; event.stopPropagation(); window.open(\'https://play.google.com/store/apps/details?id=com.google.android.webview\', \'_system\', \'location=true\')">Webview</a>');
			}, false);

		// Make sure that the pause button appears and loading indicator is hidden on playback
		this.audio.addEventListener("playing",
			function() {
                console.log('playing');
				stream.visual.play();
			}, false);
		// Stop the stream when paused (like when the pause button is pressed from the iOS lock screen)
		this.audio.addEventListener("pause", function() {
            console.log('pause');
			stream.stop();
		}, false);
		// Make sure that the pause button appears and loading indicator is hidden on playback
		this.audio.addEventListener("play",
			function() {
				stream.visual.play();
			}, false);
        this.audio.addEventListener("durationchange",
            function() {
                console.log('durationchange');
            }, false);
        this.audio.addEventListener("loadstart",
            function() {
                console.log('loadstart');
            }, false);
        this.audio.addEventListener("waiting",
            function() {
                console.log('waiting');
            }, false);
        /*
        this.audio.addEventListener("timeupdate",
            function() {
                console.log('timeupdate');
            }, false);
        this.audio.addEventListener("progress",
            function() {
                console.log('progress');
            }, false);
            */


		//this.audio.play();

		this.playing = true;
	},

	stop: function() {
		//Destroy the <audio> element so that it doesn't keep using data while paused
		this.audio.pause();
		source = this.audio.firstElementChild;
		source.setAttribute('src', '');
		this.audio.load();
		document.getElementById('audioplayer').removeChild(this.audio);
		this.audio = null; //This deletes all associated event listeners as well
		clearTimeout(this.timeout);
		this.visual.pause();
		this.playing = false;
	},

	//Play and Pause
	play_pause: function() {
		var source;
		if (!this.playing) {
			this.play();
		} else {
			this.stop();
		}
	},

    processAudio: function() {
        var bufferLength = stream.analyser.frequencyBinCount;
        var dataArray = new Uint8Array(bufferLength);
        stream.analyser.getByteTimeDomainData(dataArray);
        for(var i = 0; i < dataArray.length; ++i) {
            if(dataArray[i] != 128) {
                window.clearInterval(stream.interval);
                stream.visual.play();
                break;
            }
        }
    }
};

var stream = new Stream();


/**
 * Updates the current song playing (displayed underneath play/pause button)
 */
function updateCurrentSong() {
	jQuery.getJSON("http://kjhk.org/web/app_resources/nowPlaying.php", function(data) {
		if (!data.error) {
			document.getElementById('nowplaying-song').innerHTML = data.song;
			document.getElementById('nowplaying-artist').innerHTML = data.artist;
		} else { // Try this as a backup
			jQuery.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php", function(data) {
				document.getElementById('nowplaying-song').innerHTML = data.logs[0].Song;
				document.getElementById('nowplaying-artist').innerHTML = data.logs[0].Artist;
			});
		}
	});
}

/******PLAYLISTS******/

function Playlists() {
	/**
	 * Used for displaying the month as a string in the "Music Logs for ..." area
	 * @type {String[]}
	 */
	this.monthStrings = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

	/**
	 * Holds the elements of playlist containers for each day
	 * @type {Object[]}
	 */
	this.playlistSlides = [document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div'), document.createElement('div')];

	/**
	 * Holds the first day of music logs as a string so that they do not need to be loaded
	 * @type {string}
	 */
	this.preloadSlide = '';

	/**
	 * Number of days ago that logs are being viewed for
	 * @type {number}
	 */
	this.logDay = 0;

}


Playlists.prototype = {
	/**
	 * Extracts a javascript date object from a string formatted as YYYY?MM?DD?HH?mm?ss
	 * @param rawDate {string}
	 * @return cleanDate {Date}
	 */
	getCleanDate: function(rawDate) {
		var cleanDate = new Date(rawDate.substring(0, 4),
			rawDate.substring(5, 7),
			rawDate.substring(8, 10),
			rawDate.substring(11, 13),
			rawDate.substring(14, 16),
			rawDate.substring(17));
		return cleanDate;
	},

	/**
	 * Transforms two 24 hour format, integer hour/minute params into a 12 hour format string
	 * @param {number} hours from 0-23
	 * @param {number} miniutes from 0-59
	 * @return {string}
	 */
	getTwelveHourTime: function(hours, minutes) {
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
	},

	/**
	 * Updates the music logs with those of a given number of days ago, handling all appearance and formatting
	 * @param {number} day The number of days ago logs are to be retrieved from (from 0-13)
	 */
	getMusicLogs: function(day) {
		jQuery.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php?day=" + day, function(data) {
			var logs = '';
			var iter = false;
			$.each(data.logs, function(key, entry) {
				var bgClass = iter ? 'bg-1' : 'bg-2';
				iter = !iter;
				var items = [];
				items.push('<div class="music-entry ' + bgClass + '">');
				var myDate = playlists.getCleanDate(entry.Entry_Date);
				var dateStr = playlists.getTwelveHourTime(myDate.getHours(), myDate.getMinutes());

				items.push('<h5 class="music-entry-time">' + dateStr + '</h5>');
				items.push('<p class="music-entry-details">' + entry.Song + '<br> by ' + entry.Artist + '<br><i>from ' + entry.Album + '</i></p>');

				items.push('</div>');
				logs += items.join('');
			});
			playlists.playlistSlides[day].innerHTML = logs;
		});
	},

	preload: function() {
		jQuery.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php?day=0", function(data) {
			var logs = '';
			var iter = false;
			$.each(data.logs, function(key, entry) {
				var bgClass = iter ? 'bg-1' : 'bg-2';
				iter = !iter;
				var items = [];
				items.push('<div class="music-entry ' + bgClass + '">');
				var myDate = playlists.getCleanDate(entry.Entry_Date);
				var dateStr = playlists.getTwelveHourTime(myDate.getHours(), myDate.getMinutes());

				items.push('<h5 class="music-entry-time">' + dateStr + '</h5>');
				items.push('<p class="music-entry-details">' + entry.Song + '<br> by ' + entry.Artist + '<br><i>from ' + entry.Album + '</i></p>');

				items.push('</div>');
				logs += items.join('');
			});
			playlists.preloadSlide = logs;
		});
	},

	/**
	 * Handles the visual sliding transition between playlist slides
	 * @param {object} element The slide element to transition in
	 */
	transitionSlide: function(element) {
		var oldSlide = $('.slide.active');
		oldSlide.removeClass('active');
		if (oldSlide.data('day') > $(element).data('day')) {
			oldSlide.addClass('before');
		} else {
			oldSlide.addClass('after');
		}
		$(element).removeClass('before after');
		$(element).addClass('active');
		$('#music-logs').height($('.slide.active').height());
	},

	/**
	 * Changes the day of songs loaded by a given number of days (limited to between 0-13 inclusive)
	 * @param {number} num a positive or negative integer to iterate days by
	 */
	changeDay: function(num) {
		if (this.logDay + num > 13) {
			this.logDay = 13;
		} else if (this.logDay + num < 0) {
			this.logDay = 0;
		} else {
			this.logDay += num;
		}
		if (this.logDay === 0) this.getMusicLogs(this.logDay);
		if (this.logDay < 13 && this.playlistSlides[this.logDay + 1].innerHTML === '') this.getMusicLogs(this.logDay + 1);
		this.transitionSlide(this.playlistSlides[this.logDay]);
		this.updateDate();
	},

	updateDate: function() {
		var date = new Date();
		date.setDate(date.getDate() - this.logDay);
		document.getElementById('music-log-date').innerHTML = 'Logs for ' + (date.getMonth() + 1) + '/' + date.getDate();
	},

	loadPlaylists: function() {
		//prepare playlistSlides elements
		$(this.playlistSlides[0]).addClass('slide active');
		for (var i = 0; i < this.playlistSlides.length; ++i) {
			if (i > 0) {
				$(this.playlistSlides[i]).addClass('slide before');
			}
			$(this.playlistSlides[i]).data('day', i);
			$('#music-logs').append(this.playlistSlides[i]);
		}
		$('#logs-spinner').addClass('ng-hide');
		this.changeDay(0);
	}
};

var playlists = new Playlists();

updateCurrentSong();

playlists.preload();

window.setInterval(function() {
	updateCurrentSong();
}, 15000);

/******CONTACT******/
