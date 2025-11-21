// src/commands/music/stop.js
const { getQueue, cleanupCurrentProcess } = require('../../music/player');

module.exports = {
  name: 'stop',
  description: 'Para a música e sai do canal de voz',
  async execute(message) {
    const guildId = message.guild.id;
    const queue = getQueue(guildId);

    queue.songs = [];
    cleanupCurrentProcess(queue);
    queue.player.stop();
    if (queue.connection) {
      queue.connection.destroy();
      queue.connection = null;
    }
    queue.playing = false;
    await message.channel.send('🛑 Parei a música e saí do canal.');
  },
};