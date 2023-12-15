# You-Tube Video Downloader API

This API provides functionality to retrieve information about YouTube videos, download videos, and manage downloaded files on the server.

> [!IMPORTANT]
> Use this repo **as a Backend/Server** for your **Front-end Application**. 

-------------
## Features

1. Can download YouTube videos in the highest possible quality to the lowest possible quality.

2. YouTube allows us to download 2160p video without audio. Still, in case the downloaded 2160p video has audio, the API combines the video (without audio) and audio separately using ffmpeg.

3. Similarly, YouTube allows us to download 1080p video without audio. If the downloaded 1080p video has audio, the API combines the video (without audio) and audio separately using ffmpeg.

## Note

1. Before hitting any endpoints in the API, always use `encodeURIComponent()` for the URL. The `:yt_link` parameter must be encoded using `encodeURIComponent()`.

2. When hitting the endpoint `/video-download/:yt_link`, send `{"quality":"2160p"}` from the front-end to specify the desired video quality.

3. When hitting the endpoint `/:filePath`, send `{"fileName":"output.mp4"}` from the front-end to specify the desired video file name.

## 3 Endpoints

| Endpoint                                  | Method | Description                                                      |
|-------------------------------------------|--------|------------------------------------------------------------------|
| `/video-info/:yt_link`                    | GET    | Retrieve information about a YouTube video.                      |
| `/video-download/:yt_link`                | GET    | Download a YouTube video to the server.                          |
| `/:filePath`                              | GET    | Serve the downloaded video to the client.                        |

### 1. Get Video Information

#### Endpoint

```https
  GET /api/items/${id}
```

#### Description
Retrieve information about a YouTube video, including title, duration, and thumbnails.

#### Parameters
- `yt_link`: YouTube video link (URL-encoded using encodeURIComponent())

#### Response
Returns a JSON object containing video information and available download options.

### 2. Download YouTube Video

#### Endpoint

```https
  GET /video-download/:yt_link
```

#### Description
Download a YouTube video to the server. Include an object in the request body with the desired video quality.

#### Parameters
- `yt_link`: YouTube video link (URL-encoded using encodeURIComponent())
- Request Body:
  ```json
    {
    "quality": "your_quality_choice"
    }
  ```

#### Response
Returns a JSON object with information about the downloaded video, including quality, file path, and file name.


### 3. Serve Downloaded Video

```https
 GET /:filePath
```

#### Description
Serve the downloaded video to the client. The server deletes the downloaded files after the download is complete or encounters an error. Include an object in the request body with the desired video file name.

#### Parameters
- `filePath`: Path to the downloaded video file (URL-encoded using encodeURIComponent())

- Request Body:
```json
{
  "fileName": "output.mp4"
}
```

> [!TIP]
> you can get the `fileName` from the response of `/video-download/:yt_link` 

-----------------------

## Example Usage

``` js
// Example request using axios
const axios = require('axios');

// Get Video Information
axios.get('/video-info/:yt_link')
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// Download YouTube Video
axios.get('/video-download/:yt_link', { data: { "quality": "your_quality_choice" } })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

// Serve Downloaded Video
axios.get('/:filePath', { data: { "fileName": "output.mp4" } })
  .then(response => {
    console.log(response.data);
  })
  .catch(error => {
    console.error(error);
  });

```
--------------
## Implementation Details
The provided code in routes.js implements the functionality of the API using Express, ytdl-core, and other libraries. The code includes error handling and cleanup procedures to manage downloaded files on the server.

Feel free to adapt the code and integrate it into your project.


Feel free to use and modify this content as needed. If you have any further changes or additions, let me know!
