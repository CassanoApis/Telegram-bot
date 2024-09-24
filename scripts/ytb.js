const axios = require('axios');
const fs = require('fs');

let tracksData = [];

// Fonction pour obtenir l'URL de base de l'API
const baseApiUrl = async () => {
    const base = await axios.get('https://raw.githubusercontent.com/Blankid018/D1PT0/main/baseApiUrl.json');
    return base.data.api;
};

module.exports = {
    config: {
        name: "ytb",
        version: "1.0",
        author: "Dipto",
        category: "MEDIA",
        role: 0,
    },

    annieReply: function (bot) {
        bot.on('callback_query', async (callbackQuery) => {
            const chatId = callbackQuery.message.chat.id;
            const userId = callbackQuery.from.id;
            const data = JSON.parse(callbackQuery.data);

            if (data.action === 'select_track') {
                const { index } = data;
                const selectedTrack = tracksData[index];

                if (!selectedTrack || !selectedTrack.url) {
                    return bot.sendMessage(chatId, "❌ The selected video is invalid.", { parse_mode: 'HTML' });
                }

                const downloadingMessage = await bot.sendMessage(chatId, `⬇️ | Downloading the video for you, <a href="tg://user?id=${userId}">${callbackQuery.from.first_name}</a>`, { parse_mode: 'HTML' });

                try {
                    // Obtenir l'URL de base de l'API
                    const apiUrl = await baseApiUrl();
                    const apiResponse = await axios.get(`${apiUrl}/ytDl3`, {
                        params: {
                            link: selectedTrack.url,
                            format: 'mp4',
                            quality: 3
                        }
                    });

                    if (apiResponse.data && apiResponse.data.downloadLink) {
                        const { downloadLink } = apiResponse.data;
                        const res = await axios.get(downloadLink, { responseType: 'stream' });
                        const videoStream = fs.createWriteStream('ytb.mp4');
                        res.data.pipe(videoStream);

                        await new Promise((resolve, reject) => {
                            videoStream.on('finish', resolve);
                            videoStream.on('error', reject);
                        });

                        await bot.deleteMessage(chatId, callbackQuery.message.message_id);
                        await bot.deleteMessage(chatId, downloadingMessage.message_id);

                        await bot.sendVideo(chatId, fs.createReadStream('ytb.mp4'));
                        fs.unlinkSync('ytb.mp4'); // Supprimer le fichier après l'envoi
                    } else {
                        throw new Error("No download URL provided by the API.");
                    }

                } catch (error) {
                    console.error(error);
                    bot.sendMessage(chatId, "An error occurred while downloading the video.");
                }
            }
        });
    },

    annieStart: async function ({ bot, msg }) {
        const chatId = msg.chat.id;
        const query = msg.text.split(' ').slice(1).join(' ');

        if (!query) {
            return bot.sendMessage(chatId, "Please enter a track name!");
        }

        try {
            // Obtenir l'URL de base de l'API
            const apiUrl = await baseApiUrl();
            const searchUrl = `${apiUrl}/ytFullSearch`;

            const response = await axios.get(searchUrl, {
                params: {
                    songName: query
                }
            });

            tracksData = response.data.slice(0, 6); // Limiter aux 6 premiers résultats

            if (tracksData.length === 0) {
                return bot.sendMessage(chatId, "No videos found for the given query.");
            }

            const buttons = tracksData.map((track, index) => ({
                text: `${index + 1}. ${track.title}`,
                callback_data: JSON.stringify({ action: 'select_track', index })
            }));

            await bot.sendMessage(chatId, "Select a video:", {
                reply_markup: {
                    inline_keyboard: buttons.map(button => [button])
                }
            });
        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "An error occurred while searching for videos.");
        }
    }
};