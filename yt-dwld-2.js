import ytdl from "ytdl-core";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";


// Get video info from YouTube
import crypto from "crypto";

const folder = crypto.randomUUID();// generate random id_name for folder creation 

console.log(folder); // Example output: 8183ad19-5f32-4a85-8a8e-92f76580c09f
fs.mkdir(`${folder}`, (err) => {
  if (err) {
    console.error("Error creating directory:", err);
  } else {
    console.log("Directory created successfully!");
  }
});

//function to combine a video and a audio using ffmpeg
const combineVideoAndAudio = (videoPath, audioPath, outputPath) => {
  const command = ffmpeg()
    .input(videoPath)
    .input(audioPath)
    .output(outputPath)
    .videoCodec("copy")
    .audioCodec("copy")
    .on("progress", (progress) => {
      console.log("Processing: " + progress.percent + "% done");
    })
    .on("end", () => {
      console.log("Conversion finished");
    })
    .on("error", (err) => {
      console.error("Error:", err);
    });

  command.run();
  //to delete the downloaded file from the server after some time
  setTimeout(() => {
    fs.unlink(folder, (err) => {
      if (err) {
        console.error(`Error deleting file: ${folder}`, err);
      } else {
        console.log(`File ${folder} deleted successfully!`);
      }
    });
  }, 5000);
};
// to remove |\*: and other reserved spcial character from the vidoe Title
const sanitizeFilePath = (filePath) => {
  // Define a regular expression to match special characters
  const regex = /[\\/:"*?<>|]/g;

  // Replace special characters with an empty string
  const sanitizedPath = filePath.replace(regex, "");

  return sanitizedPath;
};
const videoAudioDownloadBoth = (itagVal) => {
  // for downloading yt videos and audios and combine them
  ytdl
    .getInfo(videoId)
    .then((info) => {
      // Select the video format and quality

      const formatVideo = ytdl.chooseFormat(info.formats, { quality: itagVal }); // besically itag value are this
      const formatAudio = ytdl.chooseFormat(info.formats, { quality: "251" });
      // Create a write stream to save the video file
      // console.log(formatAudio)
      const outputFilePathVideo = `${folder}/video.${formatVideo.container}`;
      const outputFilePathAudio = `${folder}/audio.${formatAudio.container}`;
      
      const vInfoTitle=sanitizeFilePath(info.videoDetails.title);

      const outputFilePath = `${folder}/${vInfoTitle}.${formatVideo.container}`;
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
      });
    })
    .catch((err) => {
      console.error(err);
    });
};


// object of available download options
const optionsDownload = {};
ytdl
  .getInfo(videoId)
  .then((info) => {
    const formats = ytdl.filterFormats(info.formats, "video");
    formats.map((format) => {
      if (format.container === "mp4") {
        // console.log(
        //   `quality:${format.qualityLabel} , container:${format.container}, itag:${format.itag}`
        // );
        optionsDownload[format.qualityLabel] = {
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
        // console.log(
        //   `quality:${format.qualityLabel} , container:${format.container}, itag:${format.itag}`
        // );
        optionsDownload[format.qualityLabel] = {
          container: format.container,
          itag: format.itag,
          audioExist: format.audioCodec === null ? false : true,
        };
      }
    });
  })
  .then(() => {
    const options = Object.keys(optionsDownload);
    options.map((option, index) => {
      console.log(`${index + 1}: ${option}`);
    });
    const choice = readlineSync.question("Enter Choice No: ");
    if (optionsDownload[options[choice - 1]].audioExist === false) {
      videoAudioDownloadBoth(optionsDownload[options[choice - 1]].itag);
    } else {
      videoDownloadOnly(optionsDownload[options[choice - 1]].itag);
    }
  });


  /*
  1. if video name contain unwanted special character it removes them , because special characters doesn't allows ffmpeg to work well 
  2. can download in higest possible quality to lowest possible quality of youtube videos
  3. yt allow us to download 2160p video without audio, then why downloaded 2160p have audio? we did this by combining 2160p(without audio) + audio seperatly using ffmpeg
  4. yt allow us to download 1080p video without audio, then why downloaded 1080p have audio? we did this by combining 1080p(without audio) + audio seperatly using ffmpeg
  */