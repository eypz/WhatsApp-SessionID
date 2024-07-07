
module.exports = function(bot) {

  bot.onText(/\/ping/, async (msg) => {
    const chatId = msg.chat.id;
    const startTime = Date.now();
    const sentMessage = await bot.sendMessage(chatId, 'Pinging...');
    const endTime = Date.now();
    const Time = endTime - startTime;

    await bot.editMessageText(`Response time:${Time}`, {
      chat_id: chatId,
      message_id: sentMessage.message_id
    });
  });
};
