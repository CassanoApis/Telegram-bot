const fs = require('fs');
const path = require('path');
const axios = require('axios');

const promptsFilePath = path.join(__dirname, 'prompts.txt');

// Function to read the prompts from the file
const loadPrompts = async () => {
  try {
    const data = await fs.promises.readFile(promptsFilePath, 'utf8');
    return data.split('\n').filter(line => line.trim() !== '');
  } catch (err) {
    console.error('Error reading prompts file:', err);
    return [];
  }
};

module.exports = {
  config: {
    name: 'wc',
    aliases: [],
    version: '1.0',
    role: 0,
    countDown: 5,
    author: 'MarianCross & Vincenzo',
    category: 'AI',
    guide: {
      en: 'Usage: wc [keyword]'
    }
  },

  // Rename 'onStart' to 'annieStart'
  annieStart: async function ({ bot, chatId, msg }) {
    let keyword = msg.text.split(' ').slice(1).join(' ').toLowerCase().trim();
    if (!keyword) {
      return bot.sendMessage(chatId, 'Please provide a keyword to search.');
    }

    try {
      const response = await axios.post('https://wc-api-prompt-30cm.onrender.com/search', { keyword });
      const results = response.data;

      if (results.length === 0) {
        return bot.sendMessage(chatId, 'No prompts found matching the keyword.');
      }

      const promptList = results.map((item, index) => `${index + 1}. ${item.prompt}`).join('\n');
      const replyMessage = await bot.sendMessage(chatId, `Here are the prompts matching your search:\n\n${promptList}\n\nReply with the number of the prompt you want to select.`);

      const waitForResponse = async () => {
        const timeout = 60000; // 1 minute
        const startTime = Date.now();

        while (Date.now() - startTime < timeout) {
          const history = await bot.getThreadHistory(chatId, 1, null, null, replyMessage.messageID);
          const response = history[0];

          if (response && response.senderID === msg.senderID) {
            const choice = parseInt(response.body.trim(), 10);
            if (!isNaN(choice) && choice >= 1 && choice <= results.length) {
              return choice;
            }
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        return null;
      };

      const userChoice = await waitForResponse();

      if (userChoice) {
        const selectedPrompt = results[userChoice - 1].prompt;
        await bot.sendMessage(chatId, `Selected prompt: ${selectedPrompt}`);
      } else {
        await bot.sendMessage(chatId, 'No valid selection made or timeout expired.');
      }

    } catch (err) {
      console.error('Error:', err.message);
      await bot.sendMessage(chatId, `Error: ${err.message}`);
    }
  }
};