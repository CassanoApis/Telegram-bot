const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const channelLinks = [ // add channel link below from which channel you want to get video
  "https://youtube.com/@XenozEdit?si=2bCELglhr50HU-Ol",
  // Add more if you want
];

async function getStreamFromURL(url) {
  const response = await axios.get(url, { responseType: 'stream' });
  return response.data;
}

module.exports = {
  config: {
    name: "xenoz", // name your cmd
    aliases: ["ch"], // add aliases if needed
    author: "Vex_Kshitiz", // don't change this
    version: "1.0",
    cooldowns: 5,
    role: 0,
    shortDescription: "Get a random channel video",
    longDescription: "Get a random youtube channel video.",
    category: "utility",
    guide: "{p}channel",
  },

  annieStart: async function({ bot, msg }) { // Changed to annieStart
    try {
      // Ensure the cache directory exists
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);

      const randomChannelLink = channelLinks[Math.floor(Math.random() * channelLinks.length)];
      const apiResponse = await axios.get(`https://god-kshitiz.vercel.app/channel?link=${encodeURIComponent(randomChannelLink)}`);
      const channelVideoUrl = apiResponse.data.urls[0];

      if (!channelVideoUrl) {
        await bot.sendMessage(msg.chat.id, 'Error: Video not found.');
        return;
      }

      const videoStream = await getStreamFromURL(channelVideoUrl);

      const fileName = `channel_${Date.now()}.mp4`;
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
          await bot.sendVideo(msg.chat.id, video, { caption: `Here is your random channel video.` });
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