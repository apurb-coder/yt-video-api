import express from "express";
import ytdl from "ytdl-core";
import crypto from "crypto";
import fs from "fs";
import {
  videoDownloadOnly,
  videoAudioDownloadBoth,
  decodeURLAndFolderName,
} from "./download.js";

const router = express.Router();

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
      duration: `${Math.floor(info.videoDetails.lengthSeconds / 60)}:${
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

router.get("/video-download/:yt_link", async (req, res) => {
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
router.get("/:filePath", (req, res) => {
  const filePath = req.params.filePath; // extracting :filePath from the url
  try {
    if (isDownloadInProgress) {
      // If a download is already in progress, send a response indicating that
      res.status(409).send("Download already in progress");
      return;
    }

    const fileName = req.body.fileName || "output.mp4";

    isDownloadInProgress = true;
    res.download(filePath, fileName, (err) => {
      isDownloadInProgress = false; // Reset the flag when the download is complete or encounters an error

      if (err) {
        // Handle error, such as file not found
        console.error("Error downloading file:", err);
        // deleting files and folder cause File Download Failed
        const folderPath = decodeURLAndFolderName(filePath);
        fs.unlink(filePath,(error)=>{
          if (error) {
            console.log(`Error Deleteing File ${filePath}`);
          } else {
            console.log(`Successfully Deleted ${filePath}`);
          }
        });
        fs.unlink(`Downloads/${folderPath}/audio.webm`, (error) => {
          if (error) {
            console.log("Error Deleteing File audio.webp");
          } else {
            console.log("Successfully Deleted audio.webp");
          }
        });
        fs.unlink(`Downloads/${folderPath}/video.mp4`, (error) => {
          if (error) {
            console.log("Error Deleteing File video.mp4");
          } else {
            console.log("Successfully Deleted video.mp4");
          }
        });
        fs.unlink(`Downloads/${folderPath}/video.webm`, (error) => {
          if (error) {
            console.log("Error Deleteing File video.webm");
          } else {
            console.log("Succesfully Deleted video.webm");
          }
        });
        fs.rmdir(`Downloads/${folderPath}`, { recursive: true }, (error) => {
          if (error) {
            console.log("Error Deleting File:", error.message);
          } else {
            console.log(`Deleted Successfully Deleted Folder-${folderPath}`);
          }
        });
      } else {
        console.log("File downloaded successfully");
        const folderPath = decodeURLAndFolderName(filePath);
        //deleting file after the download has finished
        fs.unlink(filePath, (error) => {
          if (error) {
            console.log(`Error Deleteing File ${filePath}`);
          } else {
            console.log(`Successfully Deleted ${filePath}`);
          }
        });
        fs.unlink(`Downloads/${folderPath}/audio.webm`, (error) => {
          if (error) {
            console.log("Error Deleteing File audio.webp");
          } else {
            console.log("Successfully Deleted audio.webp");
          }
        });
        fs.unlink(`Downloads/${folderPath}/video.mp4`, (error) => {
          if (error) {
            console.log("Error Deleteing File video.mp4");
          } else {
            console.log("Successfully Deleted video.mp4");
          }
        });
        fs.unlink(`Downloads/${folderPath}/video.webm`, (error) => {
          if (error) {
            console.log("Error Deleteing File video.webm");
          } else {
            console.log("Succesfully Deleted video.webm");
          }
        });
        fs.rmdir(`Downloads/${folderPath}`, { recursive: true }, (error) => {
          if (error) {
            console.log("Error Deleting File:", error.message);
          } else {
            console.log(`Deleted Successfully Deleted Folder-${folderPath}`);
          }
        });
      }
    });
  } catch (error) {
    console.log(error);
  }
});

export default router;
