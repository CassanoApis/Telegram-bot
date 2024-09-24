const axios = require('axios');

module.exports = {
  config: { 
    name: "flux2",
    role: 0,
    author: "Mariancross",
    category: "ai-generated" 
  },

  annieStart: async function ({ bot, chatId, msg }) {
    let pr = msg.text.split(' ').slice(1).join(' ');

    // If the user types "flux ratio", send the ratio options
    if (pr === "ratio") {
      bot.sendMessage(chatId, `
        Available Ratios:
        1:1 - Square
        9:16 - Portrait
        3:2 - Classic
        16:9 - Landscape
      `);
      return;
    }

    if (!pr) {
      bot.sendMessage(chatId, "Please add a query.");
      return;
    }

    let ratio = "1:1", m = pr.match(/--(\d)$/);

    if (m) {
      ratio = { 
        "1": "1:1", 
        "2": "9:16", 
        "3": "3:2", 
        "4": "16:9" 
      }[m[1]] || "1:1";
      pr = pr.replace(/--\d$/, "").trim();
    }

    try {
      const apiUrl = `https://samirxpikachuio.onrender.com/fluxpro?prompt=${encodeURIComponent(pr)}&ratio=${ratio}`;
      const response = await axios.get(apiUrl, { responseType: 'arraybuffer' });
      const imageData = Buffer.from(response.data, 'binary');
      await bot.sendPhoto(chatId, imageData);
    } catch (err) {
      console.error('Error sending image:', err);
      bot.sendMessage(chatId, err.message);
    }
  }
};