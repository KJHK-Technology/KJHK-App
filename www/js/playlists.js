/******PLAYLIST STUFF******/

var spinnerHTML = '<i class="fa fa-circle-o-notch fa-spin" style="font-size:24px"></i>';

var logDay = 0;

function getCleanDate(rawDate)
{
	var cleanDate = new Date(   rawDate.substring(0, 4), 
								rawDate.substring(5, 7), 
								rawDate.substring(8, 10),
								rawDate.substring(11, 13),
								rawDate.substring(14, 16),
								rawDate.substring(17));
	return cleanDate;
}

function getTwelveHourTime(hours, minutes)
{
	if(minutes < 10)
	{
		minutes = '0' + minutes;
	}
	if(hours == 0)
	{
		return '12:' + minutes + 'am';
	}
	else if(hours < 12)
	{
		return hours + ':' + minutes + ' am';
	}
	else if(hours == 12)
	{
		return '12:' + minutes + ' pm';
	}
	else
	{
		return hours % 12 + ':' + minutes + ' pm';
	}
}

function getMusicLogs(day)
{
	var target = document.getElementById('music_logs');
	target.innerHTML = spinnerHTML;

$.getJSON( "http://kjhk.org/web/app_resources/appMusicLogs.php?day=" + day, function( data ) {

		var logs = "";
		$.each( data, function( key, entry ) {
			var items = [];
			items.push( '<div class="material_card music_card">' );
			var myDate = getCleanDate(entry.Entry_Date);
			var dateStr = myDate.getHours() + ':' + myDate.getMinutes() + ' -- ' + getTwelveHourTime(myDate.getHours(), myDate.getMinutes());

			items.push( "<h5>" + dateStr + "</h5>");
			items.push( "<p>" + entry.Song + "<br> by " + entry.Artist + "<br>");
			items.push( '<i class="album-text">from ' + entry.Album + "</i></p>");

			items.push( "</div>");
			logs += items.join( "" );
		});
		target.innerHTML = logs;
	})
}

function changeDay(num)
{
	var oldDay = logDay;
	if(logDay + num > 13)
	{
		logDay = 13;
	}
	else if(logDay + num < 0)
	{
		logDay = 0;
	}
	else{
		logDay += num;
	}

	if(oldDay != logDay)
	{
		getMusicLogs(logDay);
	}
}

getMusicLogs(logDay);	