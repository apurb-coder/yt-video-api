import express from "express";
import { exec } from "child_process";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as rimraf from "rimraf"; // for deleting files
import {
  getYouTubeVideoId,
  sanitizeFilePath,
} from "./download.js";

const router = express.Router();
let fileName_ = "";

router.get("/video-info/:yt_link", async (req, res) => {
  try {
    const videoId = decodeURIComponent(req.params.yt_link);
    const extractedVideoId = getYouTubeVideoId(videoId);
    if (!extractedVideoId) throw new Error("Invalid YouTube video link");

    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `yt-dlp --dump-json https://www.youtube.com/watch?v=${extractedVideoId}`,
        (error, stdout, stderr) => {
          if (error) return reject(error);
          resolve({ stdout });
        }
      );
    });

    const info = JSON.parse(stdout);
    const optionsDownload = {
      videoDetails: {
        title: info.title,
        duration: `${
          Math.floor(info.duration / 3600) !== 0
            ? `${Math.floor(info.duration / 3600)}:`
            : ""
        }${Math.floor((info.duration % 3600) / 60)}:${info.duration % 60}`,
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
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post("/video-download/:yt_link", async (req, res) => {
  try {
    const folderName = crypto.randomUUID();
    const folderPath = `Downloads/${folderName}`;
    fs.mkdirSync(folderPath);

    const videoId = decodeURIComponent(req.params.yt_link);
    const extractedVideoId = getYouTubeVideoId(videoId);
    if (!extractedVideoId) throw new Error("Invalid YouTube video link");

    const { stdout } = await new Promise((resolve, reject) => {
      exec(
        `yt-dlp --dump-json https://www.youtube.com/watch?v=${extractedVideoId}`,
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

    const requestedQuality = req.body.quality || "720p";
    const qualityInfo = optionsDownload.quality[requestedQuality];
    if (!qualityInfo?.itag) throw new Error("Requested quality not available");

    const itagVal = qualityInfo.itag;
    const hasAudio = qualityInfo.audioExist;
    const ytLink = `https://www.youtube.com/watch?v=${extractedVideoId}`;

    const fileName = await new Promise((resolve, reject) => {
      const formatArg = hasAudio
        ? `${itagVal}`
        : `${itagVal}+bestaudio[ext=m4a]`;

      exec(
        `yt-dlp -f "${formatArg}" -o "Downloads/${folderName}/%(title)s.%(ext)s" --merge-output-format mp4 ${ytLink}`,
        (error, stdout, stderr) => {
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
    fileName_ = fileName;

    res.json({
      itag: itagVal,
      quality: requestedQuality,
      filePath: encodeURIComponent(filePath),
      fileName,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get("/:filePath", async (req, res) => {
  const filePath = req.params.filePath;
  console.log(`http://localhost:8000/${filePath}`);
  const fileName = fileName_ || "output.mp4";

  try {
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", fs.statSync(filePath).size);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("close", () => cleanupDownload(filePath));
    fileStream.on("error", (err) => {
      console.error("Error streaming file:", err);
      cleanupDownload(filePath);
      res.status(500).send("Error streaming file");
    });
  } catch (err) {
    console.error("Error downloading file:", err);
    res.status(500).send("Error downloading file");
  }
});

function cleanupDownload(filePath) {
  let folderPath = decodeURIComponent(filePath);
  folderPath = `Downloads/${folderPath.split("/")[1]}`;

  const files = fs.readdirSync(folderPath);
  for (const file of files) {
    rimraf.sync(path.join(folderPath, file));
  }
}

export default router;
