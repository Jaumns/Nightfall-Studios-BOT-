// src/commands/music/skip.js
const { getQueue } = require('../../music/player');

module.exports = {
  name: 'skip',
  description: 'Pula a música atual',
  async execute(message) {
    const guildId = message.guild.id;
    const queue = getQueue(guildId);

    if (!queue.songs.length) {
      return message.reply('Não há música tocando.');
    }

    await message.channel.send('⏭ Pulando música...');
    // Isso dispara AudioPlayerStatus.Idle, que chama playSong para a próxima
    queue.player.stop();
  },
};
