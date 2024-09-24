const axios = require("axios");
module.exports = {
  config: {
    name: "sdxl",
    version: "1.0",
    author: "Fahim_Noob",
    category: "image",
    role: 0,
  },
  annieStart: async function ({ bot, chatId, msg }) {
    try {
      const prompt = msg.text.split(' ').slice(1).join(' ');
      if (!prompt) {
        return bot.sendMessage(chatId, "😡 Please provide a prompt.");
      }

      const waitingMessage = await bot.sendMessage(chatId, "✅ | Generating, please wait...");
      const url = `https://smfahim.onrender.com/sdxl?prompt=${encodeURIComponent(prompt)}`;

      const response = await axios.get(url, { responseType: 'arraybuffer' });
      const imgBuffer = Buffer.from(response.data, 'binary');

      await bot.sendPhoto(chatId, imgBuffer, { caption: `Here is your image 🥰\nPrompt: ${prompt}` });
      await bot.deleteMessage(chatId, waitingMessage.message_id);
    } catch (error) {
      console.error(error);
      bot.sendMessage(chatId, "😔 Something went wrong, please try again later.");
    }
  }
};