
/******TAB STUFF******/

var streamTab = document.getElementById( 'stream_tab' );
var playlistsTab = document.getElementById( 'playlists_tab' );
var contactTab = document.getElementById( 'contact_tab' );

var streamContent = document.getElementById( 'stream_content' );
var playlistsContent = document.getElementById( 'playlists_content' );
var contactContent = document.getElementById( 'contact_content' );

//activates the tab indicated by the tab parameter and hides the others content
//tab options: STREAM, PLAYLISTS, CONTACT
function setTab(tab)
{

	switch(tab)
	{
		case "STREAM":

			streamTab.classList.add('active_tab');
			playlistsTab.classList.remove('active_tab');
			contactTab.classList.remove('active_tab');

			streamContent.classList.add('active_content');
			playlistsContent.classList.remove('active_content');
			contactContent.classList.remove('active_content');
		  break;
		case "PLAYLISTS":
			streamTab.classList.remove('active_tab');
			playlistsTab.classList.add('active_tab');
			contactTab.classList.remove('active_tab');

			streamContent.classList.remove('active_content');
			playlistsContent.classList.add('active_content');
			contactContent.classList.remove('active_content');
		  break;
		case "CONTACT":
			streamTab.classList.remove('active_tab');
			playlistsTab.classList.remove('active_tab');
			contactTab.classList.add('active_tab');

			streamContent.classList.remove('active_content');
			playlistsContent.classList.remove('active_content');
			contactContent.classList.add('active_content');
		  break;
	}
}