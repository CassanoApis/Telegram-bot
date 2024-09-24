const axios = require('axios');

module.exports = {
  config: {
    name: "waifu",
    aliases: ["wife"],
    version: "1.0",
    author: "tas3n",
    countDown: 6,
    role: 0,
    shortDescription: "Get random waifu",
    longDescription: "Get waifu neko: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe",
    category: "anime",
    guide: "{pn} {{<name>}}"
  },

  annieStart: async function ({ bot, chatId, msg }) {
    const name = msg.text.split(' ').slice(1).join(' ');
    let url;
    if (!name) {
      try {
        const res = await axios.get('https://api.waifu.pics/sfw/waifu');
        url = res.data.url;
      } catch (e) {
        await bot.sendMessage(chatId, 'Not Found');
        return;
      }
    } else {
      try {
        const res = await axios.get(`https://api.waifu.pics/sfw/${name}`);
        url = res.data.url;
      } catch (e) {
        await bot.sendMessage(chatId, 'No waifu found. Category: waifu, neko, shinobu, megumin, bully, cuddle, cry, kiss, lick, hug, awoo, pat, smug, bonk, yeet, blush, smile, wave, highfive, handhold, nom, bite, glomp, slap, kill, kick, happy, wink, poke, dance, cringe');
        return;
      }
    }

    if (url) {
      try {
        const response = await axios.get(url, { responseType: 'arraybuffer' });
        const imageData = Buffer.from(response.data, 'binary');
        await bot.sendPhoto(chatId, imageData, { caption: '「 𝔀𝓪𝓲𝓯𝓾  」' });
      } catch (e) {
        await bot.sendMessage(chatId, 'Failed to retrieve the image.');
      }
    }
  }
};