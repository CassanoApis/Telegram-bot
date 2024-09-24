const axios = require('axios');
const fs = require("fs-extra");
const path = require('path');

const aspectRatioMap = {
    '1:1': { width: 1024, height: 1024 },
    '9:7': { width: 1152, height: 896 },
    '7:9': { width: 896, height: 1152 },
    '19:13': { width: 1216, height: 832 },
    '13:19': { width: 832, height: 1216 },
    '7:4': { width: 1344, height: 768 },
    '4:7': { width: 768, height: 1344 },
    '12:5': { width: 1500, height: 625 },
    '5:12': { width: 640, height: 1530 },
    '16:9': { width: 1344, height: 756 },
    '9:16': { width: 756, height: 1344 },
    '2:3': { width: 1024, height: 1536 },
    '3:2': { width: 1536, height: 1024 }
};

module.exports = {
  config: {
    name: 'alya',
    aliases: [],
    version: '1.1',
    role: 0,
    countDown: 5,
    author: 'Vincenzo',
    category: 'AI',
    guide: { 
      en: 'Use the command followed by your prompt and optionally add parameters for aspect ratio (--ar). For example:\n{pn} beautiful sunset --ar 16:9\n{pn} futuristic city --ar 1:1\n\nAvailable Aspect Ratios:\n1:1, 9:7, 7:9, 19:13, 13:19, 7:4, 4:7, 12:5, 5:12, 16:9, 9:16, 2:3, 3:2'
    }
  },

  annieStart: async ({ bot, chatId, msg }) => {
    let prompt = '';
    let ratio = '1:1';

    const args = msg.text.split(' ').slice(1);

    args.forEach(arg => {
      if (arg.startsWith('--ar=')) {
        ratio = arg.slice(5);
      } else {
        prompt += `${arg} `;
      }
    });

    prompt = prompt.trim();  // Clean up extra spaces
    const endpoint = `/alya/gen?prompt=${encodeURIComponent(prompt)}&ratio=${ratio}`;

    try {
      bot.sendMessage(chatId, 'Generating, please wait... ⏰');

      const response = await axios.get(`https://vincenzojin-hub-gui7.onrender.com${endpoint}`);

      if (response.data.success) {
        const imageURL = response.data.imageUrl;
        const imagePath = path.join(__dirname, 'tmp', `image_${Date.now()}.jpg`);

        const writer = fs.createWriteStream(imagePath);
        const imageResponse = await axios({
          url: imageURL,
          method: 'GET',
          responseType: 'stream'
        });
        imageResponse.data.pipe(writer);

        await new Promise((resolve, reject) => {
          writer.on('finish', resolve);
          writer.on('error', reject);
        });

        const imageStream = fs.createReadStream(imagePath);
        await bot.sendPhoto(chatId, imageStream);

        // Clean up the image file after sending
        fs.unlinkSync(imagePath);
      } else {
        bot.sendMessage(chatId, "❌ Failed to generate image. Try again!");
      }

    } catch (err) {
      console.error("Error sending request", err);
      bot.sendMessage(chatId, `❌ Error: ${err.message}`);
    }
  }
};