const axios = require('axios');

async function fetchQuote() {
  try {
    const response = await axios.get('https://api.quotable.io/random');
    const { content, author } = response.data;
    return { content, author };
  } catch (error) {
    console.error(error.message);
    return null;
  }
}

module.exports = {
  command: '/quote',
  description: 'Get a daily inspirational quote',
  handler: async function(bot, msg) {
    const chatId = msg.chat.id;
    
    try {
      const quote = await fetchQuote();
      if (quote) {
        const message = `"${quote.content}"\n\n- ${quote.author}`;
        bot.sendMessage(chatId, message);
      } else {
        bot.sendMessage(chatId, '_Please try again_');
      }
    } catch (error) {
      console.error(error.message);
      bot.sendMessage(chatId, '_Please try again_');
    }
  }
};

