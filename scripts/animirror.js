const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const models = {
  "1": "Anime Premium",
  "2": "Cartoon Premium",
  "3": "Anime Style: Maid Outfit",
  "4": "Anime Style: Beach Babe",
  "5": "Anime Style: Sweet Fantasy",
  "6": "Anime Style: Love Story Comic",
  "7": "Anime Style: High School Memories",
  "8": "Anime Style: Festive Christmas",
  "9": "Anime Art: Pirate Adventure ( One Piece )",
  "10": "Anime Art: Pop Star Sensation ( Oshi no Ko )",
  "11": "Anime Art: Ninja Legacy ( Naruto )",
  "12": "Anime Art: Super Warriors ( DBZ )",
  "13": "Anime Art: Dark Notebook ( Death Note )",
  "14": "Anime Art: Eternal Battle ( Bleach )",
  "15": "Anime Art: Wings of Destiny ( AOT )",
  "16": "Anime Art: Mystic Magic (Jujutsu Kaisen)",
  "17": "Anime Art: Tennis Prodigy (ThePrince of Tennis)",
  "18": "Anime Art: Demon Slayer Chronicles (Demon Slayer)",
  "19": "Anime Art: Alchemical Adventures (Fullmetal Alchemist)",
  "20": "Anime Art: Heroic Future (My Hero Academia)",
  "21": "Anime Art: Prehistoric Quest (Dr Stone)",
  "22": "Anime Art: Court Clash (Haikyuu)"
};

const cacheDir = path.join(__dirname, "cache");
fs.ensureDirSync(cacheDir);

module.exports = {
  config: {
    name: "animirror",
    aliases: ["ani"],
    version: "1.0",
    author: "SiAM",
    category: "image",
    role: 0,
  },

  annieStart: async function ({ bot, msg }) {
    try {
      const modelNumber = msg.text?.split(" ")[1];
      if (!modelNumber || isNaN(modelNumber) || !models[modelNumber]) {
        return bot.sendMessage(msg.chat.id, "❌ Invalid model number.\n\nAvailable models:\n" + Object.entries(models).map(([num, name]) => `❏ ${num} : ${name}`).join("\n"));
      }

      const replyPhoto = msg.reply_to_message?.photo;
      if (!replyPhoto) {
        return bot.sendMessage(msg.chat.id, "❌ Please reply to a photo to apply the anime filter.");
      }

      const file = await bot.downloadFile(replyPhoto[replyPhoto.length - 1].file_id, cacheDir);
      const imageBuffer = fs.readFileSync(file);
      const base64Image = encodeURIComponent(`data:image/jpeg;base64,${imageBuffer.toString("base64")}`);

      const waitMsg = await bot.sendMessage(msg.chat.id, `⏳ Applying filter...\nModel: ${modelNumber} (${models[modelNumber]})`);

      const { data } = await axios.get(`https://simo-aiart.onrender.com/generate?imageUrl=${base64Image}&modelNumber=${modelNumber}`);
      const imageUrl = data.imageUrl;

      const finalImage = (await axios.get(imageUrl, { responseType: "arraybuffer" })).data;
      const outputPath = path.join(cacheDir, `anime_result_${Date.now()}.jpg`);
      fs.writeFileSync(outputPath, Buffer.from(finalImage, "binary"));

      await bot.sendPhoto(msg.chat.id, fs.createReadStream(outputPath), {
        caption: `✨ Anime Art Generated\nModel: ${modelNumber} (${models[modelNumber]})`
      });

      await fs.unlink(outputPath);
      await bot.deleteMessage(msg.chat.id, waitMsg.message_id);

    } catch (error) {
      console.error("[animirror error]", error.message);
      await bot.sendMessage(msg.chat.id, "❌ Failed to generate anime image.");
    }
  }
};
