
module.exports = {
  command: '/ping',
  description: 'Speed',
  handler: async function(bot, msg) {
    const chatId = msg.chat.id;
    const startTime = Date.now();
    const sentMessage = await bot.sendMessage(chatId, 'Pinging...');
    const endTime = Date.now();
    const Time = endTime - startTime;

    await bot.editMessageText(`Speed:${Time}`, {
      chat_id: chatId,
      message_id: sentMessage.message_id
    });
  });
};
