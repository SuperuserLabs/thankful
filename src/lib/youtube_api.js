var { google } = require('googleapis');

let APIKEY = 'AIzaSyAH537EhinOitffW0F470DEQOS1MnvIaGw';

function getChannelOfVideo(id) {
  var service = google.youtube('v3');
  service.videos.list(
    {
      auth: APIKEY,
      part: 'snippet',
      id: id,
    },
    function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        console.log(err.errors);
        return;
      }
      var videos = response.data.items;
      if (videos.length == 0) {
        console.log('No videos found.');
      } else {
        let video = videos[0];
        console.log(
          'Video: %s (ID: %s)\nChannel: %s (ID: %s)',
          video.snippet.title,
          video.id,
          video.snippet.channelTitle,
          video.snippet.channelId
        );
      }
    }
  );
}

getChannelOfVideo('FnEW6dX_BmU');
