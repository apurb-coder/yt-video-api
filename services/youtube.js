import { exec } from "child_process";
import fs from "fs";
import crypto from "crypto";
import { sanitizeFilePath, getYouTubeVideoId } from "../Routes/download.js";

export async function handleYouTubeInfo(url, res) {
  try {
    const videoId = getYouTubeVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube video link");

    console.log("Fetching video info for:", videoId);
    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `yt-dlp --dump-json https://www.youtube.com/watch?v=${videoId}`,
        (error, stdout) => {
          if (error) return reject(error);
          resolve({ stdout });
        }
      );
    });

    const info = JSON.parse(stdout);
    const optionsDownload = {
      videoDetails: {
        title: info.title,
        duration: `${Math.floor(info.duration / 60)}:${info.duration % 60}`,
        thumbnails: info.thumbnails,
        videoId: info.id,
      },
      quality: {},
    };

    info.formats.forEach((format) => {
      if (format.ext === "mp4" && format.vcodec !== "none") {
        optionsDownload.quality[format.format_note] = {
          container: format.ext,
          itag: format.format_id,
          audioExist: format.acodec !== "none",
        };
      }
    });

    res.json(optionsDownload);
  } catch (error) {
    console.error("YouTube info error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleYouTubeDownload(url, requestedQuality = "720p") {
  const folderName = crypto.randomUUID();
  const folderPath = `Downloads/${folderName}`;
  fs.mkdirSync(folderPath);

  const videoId = getYouTubeVideoId(url);
  if (!videoId) throw new Error("Invalid YouTube video link");

  console.log("Getting video formats for:", videoId);
  const { stdout } = await new Promise((resolve, reject) => {
    exec(
      `yt-dlp --dump-json https://www.youtube.com/watch?v=${videoId}`,
      (error, stdout) => {
        if (error) return reject(error);
        resolve({ stdout });
      }
    );
  });

  const info = JSON.parse(stdout);
  const optionsDownload = { quality: {} };
  info.formats.forEach((format) => {
    if (format.ext === "mp4" && format.vcodec !== "none") {
      optionsDownload.quality[format.format_note] = {
        container: format.ext,
        itag: format.format_id,
        audioExist: format.acodec !== "none",
      };
    }
  });

  const qualityInfo = optionsDownload.quality[requestedQuality];
  if (!qualityInfo?.itag) throw new Error("Requested quality not available");

  const itagVal = qualityInfo.itag;
  const hasAudio = qualityInfo.audioExist;
  const ytLink = `https://www.youtube.com/watch?v=${videoId}`;

  console.log("Downloading video with itag:", itagVal, "audioExist:", hasAudio);

  const fileName = await new Promise((resolve, reject) => {
    const formatArg = hasAudio ? `${itagVal}` : `${itagVal}+bestaudio[ext=m4a]`;

    exec(
      `yt-dlp -f "${formatArg}" -o "${folderPath}/%(title)s.%(ext)s" --merge-output-format mp4 ${ytLink}`,
      (error) => {
        if (error) return reject(error);

        exec(`yt-dlp --get-title ${ytLink}`, (error, titleOut) => {
          if (error) return reject(error);
          const sanitized = sanitizeFilePath(titleOut.trim());
          resolve(`${sanitized}.mp4`);
        });
      }
    );
  });

  const filePath = `${folderPath}/${fileName}`;
  console.log("Download complete:", filePath);

  return {
    itag: itagVal,
    quality: requestedQuality,
    filePath: encodeURIComponent(filePath),
    fileName,
  };
}
