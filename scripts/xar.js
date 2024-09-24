const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");

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

const apiKeyList = {
    "keys": [
        "6046cf8e-2eb8-487d-99a8-e18f62675328",
        "07da7000-c812-459e-b004-b79f1d544665"
    ]
};

let currentKeyIndex = 0;

function getNextKey() {
    const nextKey = apiKeyList.keys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeyList.keys.length;
    return nextKey;
}

module.exports = {
    config: {
        name: 'xar',
        aliases: [],
        version: '1.0',
        role: 0,
        countDown: 5,
        author: 'Vincenzo',
        category: 'AI',
        guide: {
            en: 'Use the command followed by your prompt and optionally add parameters for aspect ratio (--ar) and style (--style). For example:\n{pn} cute girl, smiling --ar 1:1 --style 3\n{pn} cute girl, smiling --ar 9:16\n{pn} cute girl, smiling --style 3\n{pn} cute girl, smiling'
        }
    },
    annieStart: async ({ bot, chatId, msg }) => {
        let args = msg.text.split(' ').slice(1);
        let prompt = args.join(' ') || '';
        let aspectRatio = '1:1'; // Default aspect ratio
        let style = '';

        args.forEach(arg => {
            if (arg.startsWith('--ar=')) {
                aspectRatio = arg.slice(5);
            } else if (arg.startsWith('--style=')) {
                style = arg.slice(8);
            }
        });

        const { width, height } = aspectRatioMap[aspectRatio] || { width: 1024, height: 1024 };
        let apiKey = getNextKey();

        try {
            bot.sendMessage(chatId, 'Generating, please wait... ⏳');
            let response;
            let success = false;

            while (!success) {
                try {
                    response = await axios.post('https://visioncraft.top/api/image/generate', {
                        prompt: prompt,
                        token: apiKey,
                        model: "AnimagineXL-V3",
                        negative_prompt: "nsfw, lowres, (bad), text, error, fewer, extra, missing, worst quality, jpeg artifacts, low quality, watermark, unfinished, displeasing, oldest, early, chromatic aberration, signature, extra digits, artistic error, username, scan, [abstract]",
                        steps: 28,
                        width: width,
                        height: height,
                        sampler: "Euler a",
                        cfg_scale: 7,
                        seed: -1,
                        stream: false,
                    });

                    success = true; // Mark as success if the API call is successful
                } catch (error) {
                    if (error.response && error.response.status === 403) {
                        console.log("Retrying with a new key...");
                        apiKey = getNextKey();
                    } else {
                        throw new Error(error.message);
                    }
                }
            }

            if (success) {
                const imagePath = path.join(__dirname, 'tmp', `image_${Date.now()}.png`);
                const imageUrl = response.data.image_url;

                const imageResponse = await axios({
                    url: imageUrl,
                    method: 'GET',
                    responseType: 'stream'
                });

                const writer = fs.createWriteStream(imagePath);
                imageResponse.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', resolve);
                    writer.on('error', reject);
                });

                const imageData = fs.createReadStream(imagePath);
                await bot.sendPhoto(chatId, imageData);
                fs.unlinkSync(imagePath); // Clean up after sending

            } else {
                bot.sendMessage(chatId, "❌ Failed to generate image. Try Again!.");
            }

        } catch (err) {
            console.error("Error sending request", err);
            bot.sendMessage(chatId, `❌ Error: ${err.message}`);
        }
    }
};