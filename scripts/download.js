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
    name: "download",
    version: "1.0.5",
    author: "Dipto",
    countDown: 2,
    role: 0,
    description: {
      en: "𝗗𝗼𝘄𝗻𝗹𝗼𝗮𝗱 𝘃𝗶𝗱𝗲𝗼 𝗳𝗿𝗼𝗺 𝘁𝗶𝗸𝘁𝗼𝗸, 𝗳𝗮𝗰𝗲𝗯𝗼𝗼𝗸, 𝗜𝗻𝘀𝘁𝗮𝗴𝗿𝗮𝗺, 𝗬𝗼𝘂𝗧𝘂𝗯𝗲, 𝗮𝗻𝗱 𝗺𝗼𝗿𝗲",
    },
    category: "𝗠𝗘𝗗𝗜𝗔",
    guide: {
      en: "[video_link]",
    },
  },
  annieStart: async function({ bot, msg, match }) {
    const dipto = msg.reply_to_message?.body || match[1];
    if (!dipto) {
      await bot.sendMessage(msg.chat.id, "❌ Please provide a valid link.");
      return;
    }

    try {
      // Ensure the cache directory exists
      const cacheDir = path.join(__dirname, 'cache');
      fs.ensureDirSync(cacheDir);

      await bot.sendMessage(msg.chat.id, "⏳ Downloading...");

      // Fetch the download URL from the API
      const { data } = await axios.get(`${await baseApiUrl()}/alldl?url=${encodeURIComponent(dipto)}`);

      // Log the API response for debugging
      console.log('API Response:', data);

      // Check if the URL is valid
      if (!data.result || !data.result.startsWith('http')) {
        throw new Error("Invalid URL received from API");
      }

      // Determine file extension and path
      const ext = path.extname(data.result) || '.mp4'; // Default to '.mp4' if no extension is found
      const filePath = path.join(cacheDir, `vid${ext}`);

      // Download the video
      const vid = (
        await axios.get(data.result, { responseType: "arraybuffer" })
      ).data;

      // Write the video to the file
      fs.writeFileSync(filePath, Buffer.from(vid, "binary"));

      // Send the video
      await bot.sendMessage(msg.chat.id, "", { attachment: fs.createReadStream(filePath) });

      // Clean up
      fs.unlinkSync(filePath);

    } catch (error) {
      console.error('[ERROR]', error);
      await bot.sendMessage(msg.chat.id, 'Sorry, the video could not be downloaded. Please check the link or try again later.');
    }
  }
};