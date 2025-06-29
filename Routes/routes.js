import express from "express";
import {
  handleYouTubeInfo,
  handleYouTubeDownload,
} from "../services/youtube.js";
import {
  handleInstagramInfo,
  handleInstagramDownload,
} from "../services/instagram.js";
import {
  handleTwitterInfo,
  handleTwitterDownload,
} from "../services/twitter.js";
import { handleRedditInfo, handleRedditDownload } from "../services/reddit.js";
import {
  handleFacebookInfo,
  handleFacebookDownload,
} from "../services/facebook.js";
import fs from "fs";
import path from "path";
import * as rimraf from "rimraf";

const router = express.Router();
let fileName_ = "";

function detectPlatform(url) {
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/instagram\.com/.test(url)) return "instagram";
  if (/twitter\.com/.test(url)) return "twitter";
  if (/reddit\.com/.test(url)) return "reddit";
  if (/facebook\.com/.test(url)) return "facebook";
  return null;
}

router.get("/video-info/:link", async (req, res) => {
  const rawLink = decodeURIComponent(req.params.link);
  const platform = detectPlatform(rawLink);
  try {
    if (platform === "youtube") return await handleYouTubeInfo(rawLink, res);
    if (platform === "instagram")
      return await handleInstagramInfo(rawLink, res);
    if (platform === "twitter") return await handleTwitterInfo(rawLink, res);
    if (platform === "reddit") return await handleRedditInfo(rawLink, res);
    if (platform === "facebook") return await handleFacebookInfo(rawLink, res);
    throw new Error("Unsupported platform");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.post("/video-download/:link", async (req, res) => {
  const rawLink = decodeURIComponent(req.params.link);
  const platform = detectPlatform(rawLink);
  try {
    if (platform === "youtube") {
      const result = await handleYouTubeDownload(rawLink, req.body.quality);
      fileName_ = result.fileName;
      return res.json(result);
    }
    if (platform === "instagram") {
      const result = await handleInstagramDownload(rawLink);
      fileName_ = result.fileName;
      return res.json(result);
    }
    if (platform === "twitter") {
      const result = await handleTwitterDownload(rawLink);
      fileName_ = result.fileName;
      return res.json(result);
    }
    if (platform === "reddit") {
      const result = await handleRedditDownload(rawLink);
      fileName_ = result.fileName;
      return res.json(result);
    }
    if (platform === "facebook") {
      const result = await handleFacebookDownload(rawLink);
      fileName_ = result.fileName;
      return res.json(result);
    }
    throw new Error("Unsupported platform");
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: err.message });
  }
});

router.get("/:filePath", async (req, res) => {
  const filePath = req.params.filePath;
  const fileName = fileName_ || "output.mp4";

  try {
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${fileName}\"`
    );
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
