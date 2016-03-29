/******STREAM STUFF******/

const streamLoadHTML = '<ion-spinner id="stream-load" icon="lines"></ion-spinner>';

const playButton = document.getElementById('play-button'); //Play button

const streamPlayerContainer = document.getElementById('audioplayer'); //Container for <audio> element

const spinnerContainer = document.getElementById("spinner-container");

var streamPlayer = null; //The Element object of the <audio> element, set to null when the stream is paused

var playing = false;

//Play and Pause
function play()
{
  if(!playing) //Start the music by creating a new <audio> element
  {
    streamPlayer = document.createElement('audio');
    var source = document.createElement('source');
    source.setAttribute('src', 'http://kjhkstream.org:8000/stream_low');
    streamPlayer.appendChild(source);
    //streamPlayer.setAttribute('preload', 'all');
    streamPlayer.setAttribute('id', 'streamPlayer');

    streamPlayerContainer.appendChild(streamPlayer);

    //Shows spinner
    streamPlayer.addEventListener("loadstart",
      function()
      {
        spinnerContainer.innerHTML = streamLoadHTML;
      },false);

    // Hides spinner, starts playback
    streamPlayer.addEventListener("canplaythrough",
      function()
      {
        spinnerContainer.innerHTML = "";
        streamPlayer.play();
      },false);

  	//Switch playButton appearance to pause
  	playButton.setAttribute('href', 'img/pause.svg');
    playing = true;
  }
  else
  { //Destroy the <audio> element so that it doesn't keep using data while paused
  	streamPlayer.pause();
    var source = streamPlayer.firstElementChild;
    source.setAttribute('src', '');
    streamPlayer.load();
    streamPlayerContainer.removeChild(streamPlayer);
    streamPlayer = null; //This deletes all associated event listeners as well

    //Do this to make sure the spinner doesn't get left on screen if the play button is pressed before loading is finished
    spinnerContainer.innerHTML = "";

    console.log('Changing play button image');
  	// Switch playButton appearance to play
  	playButton.setAttribute('href', 'img/play.svg');
    playing = false;
  }
}
