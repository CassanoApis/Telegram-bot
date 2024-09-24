const fs = require("fs");
const path = require("path");
const axios = require("axios");

const baseURL = 'https://www.samirxpikachu.run.place/niji';

// Create cache directory if it doesn't exist
const cacheDir = path.join(__dirname, 'cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir);
}

// Retry function for handling API calls
const retry = async (fn, retries = 3, delay = 1000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
};

// Command configuration
module.exports = {
  config: {
    name: "niji",
    version: "1.0",
    author: "Your_Name", // Change to your name
    category: "AI",
    role: 0,
  },
  annieStart: async function ({ bot, chatId, msg }) {
    const args = msg.text.split(' ');
    const prompt = args.slice(1).join(' ').trim(); // Join all but the command
    let resolution = "1:1"; // Default resolution

    // Check for aspect ratio specification in the command
    const aspectRatioArg = args.find(arg => arg.startsWith('--ar'));
    if (aspectRatioArg) {
      resolution = aspectRatioArg.split('=')[1] || "1:1"; // Set resolution from the argument or default to 1:1
    }

    if (!prompt) {
      return bot.sendMessage(chatId, "😡 Please provide a prompt.");
    }

    try {
      const apiUrl = `${baseURL}?prompt=${encodeURIComponent(prompt)}&resolution=${resolution}`;
      const response = await retry(() => axios.get(apiUrl, { responseType: 'arraybuffer' }));

      if (response.status !== 200) {
        throw new Error(`Unexpected response status: ${response.status}`);
      }

      const imagePath = path.join(cacheDir, `niji_image.png`);
      fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
      await bot.sendPhoto(chatId, imagePath, { caption: `Image generated with resolution ${resolution}.` });
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "😔 Something went wrong, please try again later.");
    }
  }
};