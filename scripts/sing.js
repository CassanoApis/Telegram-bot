const axios = require("axios");
const fs = require("fs-extra");
const yts = require("yt-search");
const path = require("path");

const cacheDir = path.join(__dirname, "/cache");
fs.ensureDirSync(cacheDir); // Ensure cache directory exists

module.exports = {
    config: {
        name: "sing",
        version: "1.2",
        author: "Team Calyx",
        category: "media",
        role: 0,
    },

    annieStart: async function ({ bot, msg }) {
        try {
            const args = msg.text.split(" ").slice(1);
            if (args.length < 1) {
                return bot.sendMessage(msg.chat.id, "❌ Please use the format `/sing <search term>`.");
            }

            const searchTerm = args.join(" ");
            const searchingMsg = await bot.sendMessage(msg.chat.id, `⏳ Searching for "${searchTerm}"...`);

            const searchResults = await yts(searchTerm);
            const topVideo = searchResults.videos[0];

            if (!topVideo) {
                await bot.editMessageText("❌ No results found.", {
                    chat_id: msg.chat.id,
                    message_id: searchingMsg.message_id
                });
                return;
            }

            const videoUrl = topVideo.url;
            const downloadUrlEndpoint = `http://152.42.220.111:25744/allLink?link=${encodeURIComponent(videoUrl)}`;
            const respo = await axios.get(downloadUrlEndpoint);
            const downloadUrl = respo.data.download_url;

            if (!downloadUrl) {
                await bot.editMessageText("❌ Could not retrieve an MP3 file. Try another search.", {
                    chat_id: msg.chat.id,
                    message_id: searchingMsg.message_id
                });
                return;
            }

            const totalSize = await getTotalSize(downloadUrl);
            const audioPath = path.join(cacheDir, `ytb_audio_${topVideo.videoId}.mp3`);
            await downloadFileParallel(downloadUrl, audioPath, totalSize, 5);

            const audioStat = await fs.stat(audioPath);
            if (audioStat.size > 26214400) {
                await bot.sendMessage(msg.chat.id, "❌ File is too large to send (> 25MB).");
                await fs.unlink(audioPath);
                return;
            }

            const caption = `📥 Audio downloaded:\n• Title: ${topVideo.title}\n• Channel: ${topVideo.author.name}`;
            await bot.sendAudio(msg.chat.id, fs.createReadStream(audioPath), {
                caption
            });

            await fs.unlink(audioPath);
            await bot.deleteMessage(msg.chat.id, searchingMsg.message_id);
        } catch (error) {
            console.error("[ERROR]", error);
            await bot.sendMessage(msg.chat.id, "❌ Failed to process your request.");
        }
    }
};

async function getTotalSize(url) {
    const response = await axios.head(url);
    return parseInt(response.headers["content-length"], 10);
}

async function downloadFileParallel(url, filePath, totalSize, numChunks) {
    const chunkSize = Math.ceil(totalSize / numChunks);
    const chunks = [];
    const progress = Array(numChunks).fill(0);

    async function downloadChunk(url, start, end, index) {
        try {
            const response = await axios.get(url, {
                headers: { Range: `bytes=${start}-${end}` },
                responseType: "arraybuffer",
                timeout: 15000,
            });
            progress[index] = response.data.byteLength;
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    for (let i = 0; i < numChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize - 1, totalSize - 1);
        chunks.push(downloadChunk(url, start, end, i));
    }

    try {
        const buffers = await Promise.all(chunks);
        const fileStream = fs.createWriteStream(filePath);
        for (const buffer of buffers) {
            fileStream.write(Buffer.from(buffer));
        }
        await new Promise((resolve, reject) => {
            fileStream.on("finish", resolve);
            fileStream.on("error", reject);
            fileStream.end();
        });
    } catch (error) {
        console.error("Error downloading or writing the file:", error);
    }
                    }
