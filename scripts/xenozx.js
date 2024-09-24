const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const channelLinks = [ // Add channel link below from which channel you want to get video
  "https://youtube.com/@XenozEdit?si=2bCELglhr50HU-Ol",
  // Add more if you want
];

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchVideos(keyword) {
  try {
    const videoUrls = [];
    for (const link of channelLinks) {
      const response = await axios.get(`https://god-kshitiz.vercel.app/channel?link=${encodeURIComponent(link)}`);
      const videos = response.data.urls;
      // Filter videos based on the keyword
      const filteredVideos = videos.filter(video => video.includes(keyword.toLowerCase()));
      videoUrls.push(...filteredVideos);
    }
    return videoUrls;
  } catch (error) {
    console.error(error);
    return [];
  }
}

module.exports = {
  config: {
    name: "xenozx", // Name your cmd
    aliases: ["ch"], // Add aliases if needed
    author: "Vex_Kshitiz", // Don't change this
    version: "1.1",
    cooldowns: 5,
    role: 0,
    shortDescription: "Get a video based on keyword or random video",
    longDescription: "Get a video from the channel based on a keyword or a random video if no keyword is provided.",
    category: "utility",
    guide: "{p}xenoz [keyword]",
  },

  annieStart: async function({ bot, msg, match }) {
    try {
      // Ensure the cache directory exists
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);

      const query = match[1] ? match[1].toLowerCase() : ''; // Get the keyword if provided
      let videoUrls;

      if (query) {
        videoUrls = await fetchVideos(query); // Fetch videos matching the keyword
      } 

      if (!query || (videoUrls && videoUrls.length === 0)) { // If no query or no matching videos
        const randomChannelLink = channelLinks[Math.floor(Math.random() * channelLinks.length)];
        const apiResponse = await axios.get(`https://god-kshitiz.vercel.app/channel?link=${encodeURIComponent(randomChannelLink)}`);
        videoUrls = apiResponse.data.urls;
      }

      if (videoUrls.length === 0) {
        await bot.sendMessage(msg.chat.id, 'No videos found.');
        return;
      }

      const selectedVideoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

      if (!selectedVideoUrl) {
        await bot.sendMessage(msg.chat.id, 'Error: Video not found.');
        return;
      }

      const videoStream = await getStreamFromURL(selectedVideoUrl);

      const fileName = `video_${Date.now()}.mp4`;
      const filePath = path.join(cacheDir, fileName);
      const writeStream = fs.createWriteStream(filePath);
      videoStream.pipe(writeStream);

      writeStream.on('finish', async () => {
        console.info('[DOWNLOADER] Downloaded');

        if (fs.statSync(filePath).size > 26214400) {
          fs.unlinkSync(filePath);
          await bot.sendMessage(msg.chat.id, '[ERR] The file could not be sent because it is larger than 25MB.');
        } else {
          const video = fs.createReadStream(filePath);
          await bot.sendVideo(msg.chat.id, video, { caption: `Here is your video${query ? ` related to "${query}"` : ''}.` });
        }

        writeStream.close();
        fs.unlinkSync(filePath);
      });

      writeStream.on('error', async (error) => {
        console.error('[WRITE STREAM ERROR]', error);
        await bot.sendMessage(msg.chat.id, '[ERR] Failed to write video file.');
      });

    } catch (error) {
      console.error('[ERROR]', error);
      await bot.sendMessage(msg.chat.id, 'An error occurred while processing the video.\nPlease try again later.');
    }
  }
};