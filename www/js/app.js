// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
angular.module('starter', ['ionic'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
      // for form inputs)
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);

      // Don't remove this line unless you know what you are doing. It stops the viewport
      // from snapping when text inputs are focused. Ionic handles this internally for
      // a much nicer keyboard experience.
      cordova.plugins.Keyboard.disableScroll(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }
  });
})

/****** STREAM ******/

var streamPlayer = null; //The Element object of the <audio> element, set to null when the stream is paused

var playing = false;

var timeout;

//Play and Pause
function play() {
  if (!playing) { //Start the music by creating a new <audio> element
    streamPlayer = document.createElement('audio');
    var source = document.createElement('source');
    source.setAttribute('src', 'http://kjhkstream.org:8000/stream_low');
    streamPlayer.appendChild(source);
    streamPlayer.setAttribute('id', 'streamPlayer');

    document.getElementById('audioplayer').appendChild(streamPlayer);

    timeout = setTimeout(function() {
      streamPlayer.addEventListener('canplay',
        function() {
          document.getElementById('stream-spinner').classList.add('ng-hide');
          streamPlayer.play();
        }, 20000);
    });

    // Hides spinner, starts playback
    streamPlayer.addEventListener('canplaythrough',
      function() {
        if (streamPlayer.played.length == 0) {
          clearTimeout(timeout);
          document.getElementById('stream-spinner').classList.add('ng-hide');
          streamPlayer.play();
        }
      }, false);

    streamPlayer.addEventListener("waiting",
      function() {
        document.getElementById('stream-spinner').classList.remove('ng-hide');
      }, false);

    streamPlayer.addEventListener("playing",
      function() {
        document.getElementById('stream-spinner').classList.add('ng-hide');
      }, false);

    console.log('Changing button image to pause');
    //Switch play button appearance to pause
    document.getElementById('play-button').classList.add('ng-hide');
    document.getElementById('pause-button').classList.remove('ng-hide');
    document.getElementById('stream-spinner').classList.remove('ng-hide');
    playing = true;
  } else { //Destroy the <audio> element so that it doesn't keep using data while paused
    streamPlayer.pause();
    var source = streamPlayer.firstElementChild;
    source.setAttribute('src', '');
    streamPlayer.load();
    document.getElementById('audioplayer').removeChild(streamPlayer);
    streamPlayer = null; //This deletes all associated event listeners as well

    //Do this to make sure the spinner doesn't get left on screen if the play button is pressed before loading is finished
    document.getElementById('stream-spinner').classList.add('ng-hide');

    console.log('Changing button image to play');
    // Switch play button appearance to play
    document.getElementById('pause-button').classList.add('ng-hide');
    document.getElementById('play-button').classList.remove('ng-hide');
    playing = false;
  }
}


/******PLAYLISTS******/

var logDay = 0;

function getCleanDate(rawDate) {
  var cleanDate = new Date(rawDate.substring(0, 4),
    rawDate.substring(5, 7),
    rawDate.substring(8, 10),
    rawDate.substring(11, 13),
    rawDate.substring(14, 16),
    rawDate.substring(17));
  return cleanDate;
}

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

function getMusicLogs(day) {
  document.getElementById('music-logs-loading').classList.remove('ng-hide');
  document.getElementById('music-logs-spinner').classList.remove('ng-hide');

  $.getJSON("http://kjhk.org/web/app_resources/appMusicLogs.php?day=" + day, function(data) {
    var logs = '';
    var iter = false;
    $.each(data, function(key, entry) {
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
    document.getElementById('music-logs-loading').classList.add('ng-hide');
    document.getElementById('music-logs-spinner').classList.add('ng-hide');
    document.getElementById('music-logs').innerHTML = logs;

  })
}

function changeDay(num) {
  var oldDay = logDay;
  if (logDay + num > 13) {
    logDay = 13;
  } else if (logDay + num < 0) {
    logDay = 0;
  } else {
    logDay += num;
  }
  getMusicLogs(logDay);
}

function loadPlaylists() {
  console.log('loadPlaylists fired');
  getMusicLogs(logDay);
}
