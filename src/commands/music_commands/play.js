// src/commands/music/play.js
const play = require('play-dl');
const { getQueue, connectToVoice, playSong } = require('../../music/player');

module.exports = {
  name: 'play',
  description: 'Toca uma música do YouTube',
  async execute(message, args) {
    const guildId = message.guild.id;
    const queue = getQueue(guildId);
    queue.textChannel = message.channel;

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel) {
      return message.reply('Você precisa estar em um canal de voz!');
    }

    const query = args.join(' ');
    if (!query) {
      return message.reply('Use: `!play <link ou nome da música>`');
    }

    if (!queue.connection) {
      try {
        const connection = await connectToVoice(voiceChannel);
        queue.connection = connection;
        queue.voiceChannel = voiceChannel;
      } catch (err) {
        console.error('Erro ao conectar no canal de voz:', err);
        return message.reply('Não consegui entrar no canal de voz 😭');
      }
    }

    try {
      let url;
      let title;

      const type = play.yt_validate(query); // 'video' | 'playlist' | 'search' | 'invalid'

      if (type === 'video') {
        url = query;
        const info = await play.video_basic_info(url);
        title = info.video_details.title;
      } else {
        const results = await play.search(query, {
          limit: 1,
          source: { youtube: 'video' },
        });

        if (!results.length) {
          return message.reply('Não encontrei nada com essa busca.');
        }

        url = results[0].url;
        title = results[0].title;
      }

      if (!url) {
        return message.reply('Não consegui obter uma URL válida para essa música.');
      }

      queue.songs.push({ title, url });
      await message.channel.send(`✅ Adicionada à fila: **${title}**`);

      if (!queue.playing) {
        playSong(guildId);
      }
    } catch (err) {
      console.error('Erro no comando play:', err);
      message.reply('Deu erro ao tentar buscar/tocar essa música.');
    }
  },
};