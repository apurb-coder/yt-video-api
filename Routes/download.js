import ytdl from "ytdl-core";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";

//function to combine a video and a audio using ffmpeg
const combineVideoAndAudio = (videoPath, audioPath, outputPath) => {
  const command = ffmpeg()
    .input(videoPath)
    .input(audioPath)
    .output(outputPath)
    .videoCodec("copy")
    .audioCodec("copy")
    .on("progress", (progress) => {
      const percentDone = isNaN(progress.percent) ? 100 : progress.percent;
      console.log("Processing: " + percentDone + "% done");
    })
    .on("end", () => {
      console.log("Conversion finished");
    })
    .on("error", (err) => {
      console.error("Error:", err);
    });

  command.run();
  
};

// to remove |\*: and other reserved spcial character from the vidoe Title
const sanitizeFilePath = (filePath) => {
  // Define a regular expression to match special characters
  const regex = /[\\/:"*?<>|]/g;

  // Replace special characters with an empty string
  const sanitizedPath = filePath.replace(regex, "");

  return sanitizedPath;
};

const videoAudioDownloadBoth = (itagVal, videoId, folder) => {
  return new Promise((resolve, reject) => {
    // for downloading yt videos and audios and combine them
    ytdl
      .getInfo(videoId)
      .then((info) => {
        // Select the video format and quality

        const formatVideo = ytdl.chooseFormat(info.formats, {
          quality: itagVal,
        }); // besically itag value are this
        const formatAudio = ytdl.chooseFormat(info.formats, { quality: "251" });
        // Create a write stream to save the video file
        // console.log(formatAudio)
        const outputFilePathVideo = `Downloads/${folder}/video.${formatVideo.container}`;
        const outputFilePathAudio = `Downloads/${folder}/audio.${formatAudio.container}`;

        const vInfoTitle = sanitizeFilePath(info.videoDetails.title);

        const outputFilePath = `Downloads/${folder}/${vInfoTitle}.${formatVideo.container}`;
        const outputStreamVideo = fs.createWriteStream(outputFilePathVideo);
        const outputStreamAudio = fs.createWriteStream(outputFilePathAudio);
        // Download the video file
        ytdl
          .downloadFromInfo(info, { format: formatVideo })
          .pipe(outputStreamVideo);
        // When the download is complete, show a message
        outputStreamVideo.on("finish", () => {
          console.log(`Finished downloading: ${outputFilePathVideo}`);
          //Download the Audio File
          ytdl
            .downloadFromInfo(info, { format: formatAudio })
            .pipe(outputStreamAudio);
        });

        // When the download is complete, show a message
        outputStreamAudio.on("finish", () => {
          console.log(`Finished downloading: ${outputFilePathAudio}`);
          combineVideoAndAudio(
            outputFilePathVideo,
            outputFilePathAudio,
            outputFilePath
          );
          resolve(`${vInfoTitle}.${formatVideo.container}`);//  a promise must be resolved not returned
        });

        
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const videoDownloadOnly = (itagVal, videoId, folder) => {
  return new Promise((resolve, reject) => {
    // for downloading yt videos only when audio exist
    ytdl
      .getInfo(videoId)
      .then((info) => {
        // Select the video format and quality

        const formatVideo = ytdl.chooseFormat(info.formats, {
          quality: itagVal,
        }); // besically itag value are this
        const fileName = sanitizeFilePath(info.videoDetails.title);
        // Create a write stream to save the video file
        const outputFilePathVideo = `Downloads/${folder}/${fileName}.${formatVideo.container}`;

        const outputStreamVideo = fs.createWriteStream(outputFilePathVideo);
        // Download the video file
        ytdl
          .downloadFromInfo(info, { format: formatVideo })
          .pipe(outputStreamVideo);
        // When the download is complete, show a message
        outputStreamVideo.on("finish", () => {
          console.log(`Finished downloading: ${outputFilePathVideo}`);
          resolve(`${fileName}.${formatVideo.container}`); //  a promise must be resolved not returned
        });
      })
      .catch((err) => {
        console.error(err);
      });
  });
};

const decodeURLAndFolderName=(filePath)=>{
  const folderPath = decodeURIComponent(filePath);
  console.log(filePath);
  // Define a regular expression to match UUID pattern
  const uuidPattern =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;

  // Use the regular expression to extract the UUID
  const match = folderPath.match(uuidPattern);

  // Check if a match is found
  let extractedUuid
  if (match && match.length > 0) {
    extractedUuid = match[0];
    console.log(extractedUuid);
  } else {
    console.log("UUID not found in the file path.");
  }
  return extractedUuid;
}

export { videoDownloadOnly, videoAudioDownloadBoth,decodeURLAndFolderName };
