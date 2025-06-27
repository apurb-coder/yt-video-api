

// Extract video ID from YouTube URL
const getYouTubeVideoId = (url) => {
  const regex =
    /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i;
  const match = url.match(regex);
  return match ? match[1] : null;
};

// Sanitize file path for safe saving
const sanitizeFilePath = (filePath) => {
  const regex = /[\\/:"*?<>|]/g;
  return filePath.replace(regex, "");
};

// Decode and extract UUID from file path
const decodeURLAndFolderName = (filePath) => {
  const folderPath = decodeURIComponent(filePath);
  const uuidPattern =
    /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/;
  const match = folderPath.match(uuidPattern);
  return match ? match[0] : null;
};

export { getYouTubeVideoId, sanitizeFilePath, decodeURLAndFolderName };
