/******STREAM STUFF******/

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
