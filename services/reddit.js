import { exec } from "child_process";
import fs from "fs";
import crypto from "crypto";
import { sanitizeFilePath } from "../download.js";

export async function handleRedditInfo(url, res) {
  try {
    console.log("Fetching Reddit video info for:", url);

    const { stdout } = await new Promise((resolve, reject) => {
      exec(`yt-dlp --dump-json ${url}`, (error, stdout) => {
        if (error) return reject(error);
        resolve({ stdout });
      });
    });

    const info = JSON.parse(stdout);
    const duration = info.duration || 0;
    const formattedDuration = `${Math.floor(duration / 60)}:${duration % 60}`;

    const optionsDownload = {
      videoDetails: {
        title: info.title,
        duration: formattedDuration,
        thumbnails: info.thumbnails,
        videoId: info.id || crypto.randomUUID(),
      },
      quality: {
        best: {
          container: "mp4",
          itag: "best",
          audioExist: true,
        },
      },
    };

    res.json(optionsDownload);
  } catch (error) {
    console.error("Reddit info error:", error);
    res.status(500).json({ error: error.message });
  }
}

export async function handleRedditDownload(url) {
  const folderName = crypto.randomUUID();
  const folderPath = `Downloads/${folderName}`;
  fs.mkdirSync(folderPath);

  console.log("Downloading Reddit video from:", url);

  const fileName = await new Promise((resolve, reject) => {
    exec(
      `yt-dlp -f bestvideo+bestaudio --merge-output-format mp4 -o "${folderPath}/%(title)s.%(ext)s" ${url}`,
      (error) => {
        if (error) return reject(error);

        exec(`yt-dlp --get-title ${url}`, (error, titleOut) => {
          if (error) return reject(error);
          const sanitized = sanitizeFilePath(titleOut.trim());
          resolve(`${sanitized}.mp4`);
        });
      }
    );
  });

  const filePath = `${folderPath}/${fileName}`;
  console.log("Reddit download complete:", filePath);

  return {
    itag: "best",
    quality: "best",
    filePath: encodeURIComponent(filePath),
    fileName,
  };
}
