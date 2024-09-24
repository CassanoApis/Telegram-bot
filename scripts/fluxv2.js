const fs = require("fs");
const path = require("path");
const axios = require("axios");

const baseURL = 'https://www.samirxpikachu.run.place/fluxgen';

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

// Function to generate an image from the API
const generateImage = async (index, prompt, model = 2) => {
  try {
    const params = { prompt, model };
    const apiUrl = `${baseURL}?${new URLSearchParams(params)}`;

    const response = await retry(() => axios.get(apiUrl, { responseType: 'arraybuffer' }));

    if (response.status !== 200) {
      throw new Error(`Unexpected response status: ${response.status}`);
    }

    const imagePath = path.join(cacheDir, `image_${index}.png`);
    fs.writeFileSync(imagePath, Buffer.from(response.data, 'binary'));
    return imagePath;
  } catch (error) {
    console.error(`Error generating image ${index}:`, error.message);
    throw error;
  }
};

// Command configuration
module.exports = {
  config: {
    name: "fluxv2",
    version: "1.0",
    author: "Your_Name", // Change to your name
    category: "AI",
    role: 0,
  },
  annieStart: async function ({ bot, chatId, msg }) {
    const args = msg.text.split(' ');
    const prompt = args.slice(1).join(' ').trim(); // Join all but the command
    let model = 2; // Default model

    // Check for model specification in the command
    const modelIndex = args.find(arg => arg.startsWith('|'));
    if (modelIndex) {
      const models = modelIndex.slice(1).split(',').map(Number); // Get the models from the command
      const validModels = models.filter(m => m >= 1 && m <= 9); // Ensure the models are valid (1 to 9)
      if (validModels.length > 0) {
        model = validModels[0]; // Use the first valid model
      }
    }

    if (!prompt) {
      return bot.sendMessage(chatId, "😡 Please provide a prompt.");
    }

    try {
      const imagePath = await generateImage(1, prompt, model);
      await bot.sendPhoto(chatId, imagePath, { caption: `Image generated with model ${model}.` }); // Remove prompt from caption
    } catch (error) {
      bot.sendMessage(chatId, "😔 Something went wrong, please try again later.");
    }
  }
};