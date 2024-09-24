const fs = require("fs");
const fsExtra = require("fs-extra");
const axios = require("axios");

module.exports = {
  config: {
    name: "v2a",
    aliases: ["video2audio"],
    description: "Convert video to audio",
    version: "1.0",
    author: "OtinXShiva",
    countDown: 10,
    Description: {
      vi: "",
      en: "Provide a video URL or reply to a video."
    },
    category: "utility",
  },
  annieStart: async function ({ bot, chatId, msg, args }) {
    try {
      let videoUrl;

      // Check if there's a reply to a video
      if (msg.reply_to_message && msg.reply_to_message.video) {
        videoUrl = msg.reply_to_message.video.file_id; // Use the file ID for the video
      } else if (args.length > 0) {
        videoUrl = args[0]; // Expecting the URL as the first argument
      }

      if (!videoUrl) {
        return bot.sendMessage(chatId, "Please provide a video URL or reply to a video.");
      }

      // Download the video file from Telegram
      const fileResponse = await bot.getFile(videoUrl);
      const filePath = `./assets/${fileResponse.file_path}`;
      const { data } = await axios.get(`https://api.telegram.org/file/bot${bot.token}/${fileResponse.file_path}`, { responseType: 'arraybuffer' });

      // Save the video as a temporary file
      fsExtra.writeFileSync(filePath, Buffer.from(data, 'binary'));

      // Convert video to audio (using ffmpeg or similar; make sure you have ffmpeg installed and in your PATH)
      const audioFilePath = `./assets/vdtoau.m4a`;
      await new Promise((resolve, reject) => {
        const ffmpeg = require('fluent-ffmpeg');
        ffmpeg(filePath)
          .toFormat('m4a')
          .on('end', () => {
            resolve();
          })
          .on('error', (err) => {
            reject(err);
          })
          .save(audioFilePath);
      });

      // Send the audio file back
      const audioReadStream = fs.createReadStream(audioFilePath);
      await bot.sendMessage(chatId, { caption: "✅ | Here is your audio file:", audio: audioReadStream });

      // Clean up temporary files
      fsExtra.unlinkSync(filePath);
      fsExtra.unlinkSync(audioFilePath);
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "❌ | There was an error converting the video to audio.");
    }
  }
};