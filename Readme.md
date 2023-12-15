
## FEATURES:
1. if video name contain unwanted special character it removes them , because special characters doesn't allows ffmpeg to work well 
2. can download in higest possible quality to lowest possible quality of youtube videos
3. yt allow us to download 2160p video without audio, then why downloaded 2160p have audio? we did this by combining 2160p(without audio) + audio seperatly using ffmpeg
4. yt allow us to download 1080p video without audio, then why downloaded 1080p have audio? we did this by combining 1080p(without audio) + audio seperatly using ffmpeg

---------------------------------------------------------------------------------------------------

## NOTE : 
1. before hiting any end points in the api , always encodeURIComponent() the url , url should be encoded or it will cause error, :yt_link, param must be encoded using encodeURIComponent().

2. also send {"quality":"2160p"} from front-end when hitting end-point /video-download/:yt_link

3. also send {"fileName":"output.mp4"} from front-end when hitting endpoint  /:filePath

---------------------------------------------------------------------------------------------------

## 3 END POINTS:
1. /video-info/:yt_link => used get video information like video , title, video duration, thubmline

2. /video-download/:yt_link => used to download yt video in the server folder "/Downloads",  when you hit this endpoint also send obj {"quality":"your_quality_choice"} in the body of the request for mentioning video quality.

3. /:filePath => when you hit this end point , the video is downloaded from the "/filePath". After downloading is Completed all the files included the folder is deleted. To save server storage. When you hit this endpoint also send obj {"fileName":"output.mp4"} in the body of the request for mentioning video fileName.