import express from "express";
import ytdl from "ytdl-core";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import * as rimraf from "rimraf"; // used for deleting of file
import {
  videoDownloadOnly,
  videoAudioDownloadBoth,
  decodeURLAndFolderName,
} from "./download.js";

const router = express.Router();

let fileName_ = "";
// NOTE: ':yt_link' must be encoded using encodeURIComponent() before hitting the endpoint
router.get("/video-info/:yt_link", async (req, res) => {
  try {
    //use encodeURIComponent() to encode utl in the front-end and then send it to back-end
    const videoId = req.params.yt_link; // url se :yt_link ka content extract karta hai

    if (!videoId) {
      throw new Error("Invalid YouTube video link");
    }

    // Use await to wait for the getInfo operation to complete
    const info = await ytdl.getInfo(videoId);

    const formats = ytdl.filterFormats(info.formats, "video");
    // object of available download options
    const optionsDownload = { videoDetails: {}, quality: {} };
    //filling the video details inside optionDownload object
    optionsDownload.videoDetails = {
      title: info.videoDetails.title,
      duration: `${
        Math.floor(info.videoDetails.lengthSeconds / 3600) !== 0
          ? `${Math.floor(info.videoDetails.lengthSeconds / 3600)}:`
          : ""
      }${Math.floor((info.videoDetails.lengthSeconds % 3600) / 60)}:${
        info.videoDetails.lengthSeconds % 60
      }`,
      thumbnails: info.videoDetails.thumbnails,
      videoId: info.videoDetails.videoId,
    };

    formats.forEach((format) => {
      if (format.container === "mp4") {
        optionsDownload.quality[format.qualityLabel] = {
          container: format.container,
          itag: format.itag,
          audioExist: format.audioCodec === null ? false : true,
        };
      }
      if (
        format.qualityLabel === "2160p" ||
        format.qualityLabel === "1440p" ||
        format.qualityLabel === "2160p60"
      ) {
        optionsDownload.quality[format.qualityLabel] = {
          container: format.container,
          itag: format.itag,
          audioExist: format.audioCodec === null ? false : true,
        };
      }
    });

    // Sending response after getting video-info and available download options
    // res.json(info)
    res.json(optionsDownload);
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: error.message });
  }

  // sending response of the video-info and available download options
});

router.post("/video-download/:yt_link", async (req, res) => {
  try {
    const folder_name = crypto.randomUUID(); // Random folder name
    const folder_path = `Downloads/${folder_name}`;

    // Creating folder with folder_name
    fs.mkdirSync(folder_path);

    const videoId = req.params.yt_link;

    if (!videoId) {
      throw new Error("Invalid YouTube video link");
    }

    const info = await ytdl.getInfo(videoId);
    const formats = ytdl.filterFormats(info.formats, "video");

    const optionsDownload = {};

    formats.forEach((format) => {
      if (format.container === "mp4") {
        optionsDownload[format.qualityLabel] = {
          container: format.container,
          itag: format.itag,
          audioExist: format.audioCodec === null ? false : true,
          vid_id: info.videoDetails.videoId,
        };
      }
      if (
        format.qualityLabel === "2160p" ||
        format.qualityLabel === "1440p" ||
        format.qualityLabel === "2160p60"
      ) {
        optionsDownload[format.qualityLabel] = {
          container: format.container,
          itag: format.itag,
          audioExist: format.audioCodec === null ? false : true,
          vid_id: info.videoDetails.videoId,
        };
      }
    });

    const reqested_quality = req.body.quality || "720p";

    let fileName;

    if (
      optionsDownload[reqested_quality].audioExist === false ||
      optionsDownload[reqested_quality].audioExist === undefined
    ) {
      fileName = await videoAudioDownloadBoth(
        optionsDownload[reqested_quality].itag,
        optionsDownload[reqested_quality].vid_id,
        folder_name
      );
    } else {
      fileName = await videoDownloadOnly(
        optionsDownload[reqested_quality].itag,
        optionsDownload[reqested_quality].vid_id,
        folder_name
      );
    }

    const filePath = `${folder_path}/${fileName}`;
    fileName_ = fileName;
    console.log(filePath);
    // Send a response to the client
    res.json({
      itag: optionsDownload[reqested_quality].itag,
      quality: reqested_quality,
      filePath: encodeURIComponent(filePath),
      fileName: fileName,
    });
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ error: error.message });
  }
});

// to handle and avoid multiple download request
let isDownloadInProgress = false;

// must give the correct file path
// Must give the correct file path
router.get("/:filePath", async (req, res) => {
  const filePath = req.params.filePath;
  console.log(`http://localhost:8000/${filePath}`);
  const fileName = fileName_;

  try {
    // Set appropriate headers for file download
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Length", fs.statSync(filePath).size);

    // Stream the file to the client
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Clean up temporary files and folders after the download is complete
    fileStream.on("close", () => cleanupDownload(filePath));

    // Handle errors during file streaming
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

// Function to clean up temporary files and folders
function cleanupDownload(filePath) {
  let folderPath = decodeURIComponent(filePath);
  folderPath = `Downloads/${folderPath.split("/")[1]}`;

  // Get a list of all files in the directory
  const files = fs.readdirSync(folderPath);

  // Delete each file
  for (const file of files) {
    rimraf.sync(path.join(folderPath, file));
  }
}

export default router;
