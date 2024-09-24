const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

const baseApiUrl = async () => {
    const base = await axios.get(
        `https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json`,
    );
    return base.data.api;
};

module.exports = {
    config: {
        name: "aniedit",
        role: 0,
        version: "1.0",
        author: "Mesbah Bb'e",
        category: "MEDIA",
        description: "Search for TikTok videos",
    },
    annieStart: async function ({ bot, chatId, msg }) {
        let search = msg.text.split(' ').slice(1).join(' ');
        let searchLimit = 10;

        const match = search.match(/^(.+)\s*-\s*(\d+)$/);
        if (match) {
            search = match[1].trim();
            searchLimit = parseInt(match[2], 10);
        }

        if (!search) {
            return bot.sendMessage(chatId, "Please provide a search term.");
        }

        const apiUrl = `${await baseApiUrl()}/tiktoksearch?search=${encodeURIComponent(search)}&limit=${searchLimit}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data.data;

            if (!data || data.length === 0) {
                return bot.sendMessage(chatId, `No results found for '${search}'.`);
            }

            let replyOption = "🔍 Search Results:\n\n";
            for (let i = 0; i < data.length; i++) {
                const video = data[i];
                replyOption += `${i + 1}. ${video.title}\n\n`;
            }
            replyOption += "Reply with the number of the video you want to download.";

            const replyMessage = await bot.sendMessage(chatId, replyOption);

            bot.once("text", async (msg) => {
                const selectedNumber = parseInt(msg.text);
                if (isNaN(selectedNumber) || selectedNumber <= 0 || selectedNumber > data.length) {
                    return bot.sendMessage(chatId, "Invalid option. Please reply with a valid number.");
                }

                const selectedVideo = data[selectedNumber - 1];
                try {
                    const videoResponse = await axios.get(selectedVideo.video, { responseType: "arraybuffer" });
                    const videoBuffer = videoResponse.data;

                    const filename = `${selectedVideo.title.replace(/[^\w\s]/gi, "")}.mp4`;
                    const filepath = path.join(__dirname, filename);

                    await fs.writeFile(filepath, videoBuffer);

                    // Only send the video without title in the message body
                    await bot.sendVideo(chatId, filepath);
                    await fs.unlink(filepath);
                } catch (error) {
                    console.error(error);
                    bot.sendMessage(chatId, "An error occurred while downloading the TikTok video.");
                }
            });
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, `Error: ${error.message}`);
        }
    }
};