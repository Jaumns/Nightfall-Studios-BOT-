// src/commands/music/queue.js
const { getQueue } = require('../../music/player');

module.exports = {
  name: 'queue',
  description: 'Mostra a fila de músicas',
  async execute(message) {
    const guildId = message.guild.id;
    const queue = getQueue(guildId);

    if (!queue.songs.length) {
      return message.reply('A fila está vazia.');
    }

    const description = queue.songs
      .map((s, i) => `${i === 0 ? '**Tocando agora ►**' : `${i}.`} ${s.title}`)
      .join('\n');

    await message.channel.send(description);
  },
};