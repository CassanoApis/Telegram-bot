const fs = require("fs-extra");
const axios = require("axios");
const ytdl = require("@neoxr/ytdl-core");
const yts = require("yt-search");
const { shorten } = require('tinyurl');

module.exports = {
    config: {
        name: "video",
        version: "1.0",
        author: "JARiF",
        category: "MEDIA",
        role: 0,
    },
    annieStart: async function({ bot, msg, match }) {
        try {
            const replyToMessage = msg.reply_to_message;

            if (replyToMessage && (replyToMessage.audio || replyToMessage.video)) {
                let attachmentUrl;
                let videoUrl = '';

                if (replyToMessage.video) {
                    attachmentUrl = await bot.getFileLink(replyToMessage.video.file_id);
                } else if (replyToMessage.audio) {
                    attachmentUrl = await bot.getFileLink(replyToMessage.audio.file_id);
                } else {
                    throw new Error("No valid media found to process.");
                }

                // Check if the attachment is a video
                if (replyToMessage.video) {
                    videoUrl = attachmentUrl;
                } else if (replyToMessage.audio) {
                    // Use the audio URL to find a related video (if applicable)
                    const shortUrl = await shorten(attachmentUrl);
                    const response = await axios.get(`https://www.api.vyturex.com/songr?url=${shortUrl}`);
                    const songName = response.data.title;

                    if (!songName) {
                        throw new Error("Unable to retrieve video related to the audio.");
                    }

                    // Perform a search or use another method to get a related video
                    // This is an example, adjust as needed
                    const videoSearch = await yts(songName);
                    if (videoSearch.videos.length > 0) {
                        videoUrl = videoSearch.videos[0].url;
                    } else {
                        throw new Error("No related video found.");
                    }
                }

                // Send the video URL to the chat
                if (videoUrl) {
                    await bot.sendMessage(msg.chat.id, { video: videoUrl });
                } else {
                    throw new Error("No video URL available to send.");
                }

            } else {
                throw new Error("No audio or video message found.");
            }
        } catch (error) {
            await bot.sendMessage(msg.chat.id, `Error: ${error.message}`);
        }
    }
};