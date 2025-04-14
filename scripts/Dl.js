const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

module.exports = {
  config: {
    name: "dl",
    aliases: [],
    version: "1.4",
    author: "Team Calyx | Rômeo",
    category: "media",
    role: 0,
  },

  annieStart: async function ({ bot, msg }) {
    let videoURL = msg.text?.split(" ")[1];

    // Try to get URL from reply if none provided
    if (!videoURL && msg.reply_to_message?.text) {
      const urlMatch = msg.reply_to_message.text.match(/https?:\/\/[^\s]+/);
      if (urlMatch) videoURL = urlMatch[0];
    }

    if (!videoURL) {
      return bot.sendMessage(msg.chat.id, "❌ Please provide a valid video URL or reply to a message that contains one.");
    }

    try {
      const apiRes = await axios.get("https://raw.githubusercontent.com/romeoislamrasel/romeobot/refs/heads/main/api.json");
      const apiUrl = apiRes.data?.alldl;

      const waitMsg = await bot.sendMessage(msg.chat.id, "⏳ Fetching video details...");

      const response = await axios.get(`${apiUrl}/allLink`, {
        params: { link: videoURL },
      });

      if (response.status === 200 && response.data.download_url) {
        const { download_url: videoLink, platform, video_title } = response.data;

        const videoPath = path.join(cacheDir, `dl_${Date.now()}.mp4`);
        const video = (await axios.get(videoLink, { responseType: "arraybuffer" })).data;
        fs.writeFileSync(videoPath, video);

        await bot.sendVideo(msg.chat.id, videoPath, {
          caption: `✅ Video downloaded successfully!\n\nPlatform: ${platform}\nTitle: ${video_title}`,
        });

        await fs.unlink(videoPath);
        await bot.deleteMessage(msg.chat.id, waitMsg.message_id);
      } else {
        await bot.sendMessage(msg.chat.id, "❌ Failed to retrieve the download link.");
        await bot.deleteMessage(msg.chat.id, waitMsg.message_id);
      }
    } catch (err) {
      console.error("[dl error]", err.message);
      await bot.sendMessage(msg.chat.id, "❌ Error occurred while downloading the video.");
    }
  }
};
