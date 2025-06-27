# YouTube Video Downloader API (Backend)

This API allows downloading YouTube videos in various qualities (including merging separate audio/video streams) using `yt-dlp` and `ffmpeg`.

> [!IMPORTANT] 
> Use this repository as the **backend/server** for your **frontend video downloader app**.

---

## 🚀 Features

1. Download YouTube videos in various qualities from 144p to 2160p (4K).
2. Automatically detects and merges separate video-only and audio-only streams (like in 1080p/4K videos).
3. Uses `yt-dlp` under the hood for format selection and downloading.
4. Uses `ffmpeg` (handled by `yt-dlp`) for merging video/audio.

---

## 🧱 Prerequisites

This project uses:

- Node.js (tested on v18+)
- [yt-dlp](https://github.com/yt-dlp/yt-dlp) (Python-based YouTube downloader)
- Python (required for yt-dlp)
- ffmpeg (required for video/audio merging)

---

## 📦 Installation (Requirements Setup)

### ✅ For Linux/macOS:

```bash
# From backend/ directory
chmod +x requirements.sh
./requirements.sh
````

### ✅ For Windows (PowerShell):

```powershell
# From backend\ directory
.\requirements.ps1
```

These scripts will:

* Check/install Python (Windows only)
* Install `yt-dlp` via `pip`
* Install all Node.js dependencies using `yarn`

---

## 📌 Notes

1. All YouTube video URLs **must be URL-encoded** using `encodeURIComponent()` before sending them to the API.
2. To specify quality (e.g., 720p, 1080p), pass `"quality": "720p"` in the request body.
3. Downloaded videos are auto-cleaned from the server after being served.

---

## 📨 API Endpoints

| Endpoint                   | Method | Description                                          |
| -------------------------- | ------ | ---------------------------------------------------- |
| `/video-info/:yt_link`     | GET    | Get video info and available quality options         |
| `/video-download/:yt_link` | POST   | Download and merge YouTube video in selected quality |
| `/:filePath`               | GET    | Serve the final downloadable video to client         |

---

### 📥 1. Get Video Information

```http
GET /video-info/:yt_link
```

* `yt_link` should be a URL-encoded YouTube link
* Returns: video `title`, `duration`, `thumbnails`, and available `quality` options (with/without audio)

---

### 📥 2. Download Video

```http
POST /video-download/:yt_link
```

* Body:

```json
{
  "quality": "720p"
}
```

* Downloads and merges audio (if separate). File is saved on server temporarily.

---

### 📥 3. Serve Downloaded File

```http
GET /:filePath
```

* `filePath` is a URL-encoded path received from `/video-download/:yt_link`
* Triggers download and deletes temp files afterward

---

## ✅ Example Usage with Axios

```js
import axios from "axios";

// Get Video Info
axios.get("/video-info/" + encodeURIComponent("https://youtube.com/watch?v=xyz123"))
  .then(res => console.log(res.data));

// Download Video
axios.post("/video-download/" + encodeURIComponent("https://youtube.com/watch?v=xyz123"), {
  quality: "1080p"
}).then(res => console.log(res.data));

// Download Served File
axios.get(decodeURIComponent(serverResponse.filePath), {
  responseType: "blob"
}).then(response => {
  // Save blob as file in browser
});
```

---

## 🛠️ Implementation Notes

* `yt-dlp` handles downloading of video/audio streams.
* `ffmpeg` (automatically used by `yt-dlp`) merges them if needed.
* Files are stored in a temporary folder and cleaned after delivery.

---

## 📁 Folder Structure (Backend)

```
backend/
├── Routes/
│   └── routes.js          # Main API endpoints
├── download.js            # Utility functions
├── requirements.sh        # Linux/macOS setup script
├── requirements.ps1       # Windows setup script
├── package.json
└── ...
```

---

## ✅ License

MIT (free to use and modify)

```
