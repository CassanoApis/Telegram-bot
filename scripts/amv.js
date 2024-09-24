const fs = require('fs-extra');
const axios = require('axios');
const path = require('path');

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

async function fetchTikTokVideos(query) {
  try {
    const response = await axios.get(`https://lyric-search-neon.vercel.app/kshitiz?keyword=${query}`);
    return response.data;
  } catch (error) {
    console.error(error);
    return null;
  }
}

module.exports = {
  config: {
    name: "anime",
    version: "1.0",
    author: "Vex_kshitiz",
    category: "fun",
    role: 0,
  },
  annieStart: async function({ bot, msg, match }) {
    try {
      // Ensure the cache directory exists
      const cacheDir = path.join(__dirname, 'scripts', 'cmds', 'cache');
      fs.ensureDirSync(cacheDir);

      const query = match[1] ? match[1] : '';
      const modifiedQuery = `${query} anime edit`;

      const videos = await fetchTikTokVideos(modifiedQuery);

      if (!videos || videos.length === 0) {
        await bot.sendMessage(msg.chat.id, `${query} not found.`);
        return;
      }

      const selectedVideo = videos[Math.floor(Math.random() * videos.length)];
      const videoUrl = selectedVideo.videoUrl;

      if (!videoUrl) {
        await bot.sendMessage(msg.chat.id, 'Error: Video not found.');
        return;
      }

      const videoStream = await getStreamFromURL(videoUrl);

      const fileName = `anime_edit_${Date.now()}.mp4`;
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
          await bot.sendVideo(msg.chat.id, video, { caption: `Here is your anime edit video.` });
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