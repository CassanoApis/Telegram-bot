const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
  const base = await axios.get(
    `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`
  );
  return base.data.api;
};

module.exports = {
  config: {
    name: "alldl",
    role: 0,
    version: "1.0.5",
    author: "Dipto",
    description: "Download videos from TikTok, Facebook, Instagram, YouTube, and more",
    category: "MEDIA",
  },
  annieStart: async function ({ bot, chatId, msg }) {
    const videoLink = msg.reply_to_message?.text || msg.text.split(' ').slice(1).join(' ');

    if (!videoLink) {
      return bot.sendMessage(chatId, "❌ | Please provide a valid video link.");
    }

    try {
      await bot.sendMessage(chatId, "⏳ | Downloading video...");

      const { data } = await axios.get(`${await baseApiUrl()}/alldl?url=${encodeURIComponent(videoLink)}`);
      const ext = path.extname(data.result) || '.mp4';
      const filePath = path.join(__dirname + `/cache/vid.mp4`);

      const videoBuffer = (await axios.get(data.result, { responseType: "arraybuffer" })).data;
      await fs.writeFile(filePath, Buffer.from(videoBuffer, "utf-8"));

      // Send the video without any caption to avoid the error
      await bot.sendVideo(chatId, filePath);

      await fs.unlink(filePath);

      // Handle Imgur-specific links
      if (videoLink.startsWith("https://i.imgur.com")) {
        const ext = path.extname(videoLink);
        const response = await axios.get(videoLink, { responseType: "arraybuffer" });
        const imgurFilePath = path.join(__dirname, `cache/dipto${ext}`);

        await fs.writeFile(imgurFilePath, Buffer.from(response.data, "binary"));

        await bot.sendPhoto(chatId, imgurFilePath, { caption: "✅ | Downloaded from Imgur" });

        await fs.unlink(imgurFilePath);
      }
    } catch (error) {
      console.error(error);
      await bot.sendMessage(chatId, `❎ | Error: ${error.message}`);
    }
  }
};
