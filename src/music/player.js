// src/music/player.js
const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  NoSubscriberBehavior,
  AudioPlayerStatus,
  VoiceConnectionStatus,
  entersState,
  StreamType,
} = require('@discordjs/voice');

const { spawn } = require('child_process');
const path = require('path');
const ffmpegPath = require('ffmpeg-static');
const { YTDLP_PATH } = require('../config');

const ytdlpPath =
  YTDLP_PATH || path.resolve(__dirname, '../../bin/yt-dlp.exe');

// Map para guardar fila por servidor
const queues = new Map();

/**
 * Cria um stream de áudio usando yt-dlp + ffmpeg
 */
function createYtDlpStream(url) {
  const ytdlp = spawn(
    ytdlpPath,
    [
      '-f',
      'bestaudio[ext=webm]/bestaudio/best',
      '--no-playlist',
      '-q',
      '-o',
      '-',
      url,
    ],
    { stdio: ['ignore', 'pipe', 'inherit'] }
  );

  const ffmpeg = spawn(
    ffmpegPath,
    [
      '-loglevel',
      'error',
      '-i',
      'pipe:0',
      '-f',
      's16le',
      '-ar',
      '48000',
      '-ac',
      '2',
      'pipe:1',
    ],
    { stdio: ['pipe', 'pipe', 'inherit'] }
  );

  // conecta yt-dlp → ffmpeg
  ytdlp.stdout.pipe(ffmpeg.stdin);

  // ignorar erros de EPIPE ao dar skip/stop
  ytdlp.stdout.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      console.error('Erro no stdout do yt-dlp:', err);
    }
  });

  ffmpeg.stdin.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      console.error('Erro no stdin do ffmpeg:', err);
    }
  });

  ffmpeg.stdout.on('error', (err) => {
    if (err.code !== 'EPIPE') {
      console.error('Erro no stdout do ffmpeg:', err);
    }
  });

  return {
    stream: ffmpeg.stdout,
    processes: { ytdlp, ffmpeg },
  };
}

/**
 * Limpa processos atuais (yt-dlp / ffmpeg) da queue
 */
function cleanupCurrentProcess(queue) {
  if (!queue.currentProc) return;

  try {
    queue.currentProc.ytdlp?.stdout?.unpipe(queue.currentProc.ffmpeg?.stdin);
  } catch (e) {}

  try {
    queue.currentProc.ytdlp?.kill();
  } catch (e) {}

  try {
    queue.currentProc.ffmpeg?.kill();
  } catch (e) {}

  queue.currentProc = null;
}

/**
 * Pega (ou cria) a fila do servidor
 */
function getQueue(guildId) {
  let queue = queues.get(guildId);
  if (!queue) {
    const player = createAudioPlayer({
      behaviors: {
        noSubscriber: NoSubscriberBehavior.Pause,
      },
    });

    queue = {
      guildId,
      voiceChannel: null,
      textChannel: null,
      connection: null,
      player,
      songs: [],
      playing: false,
      currentProc: null, // yt-dlp + ffmpeg
    };

    queues.set(guildId, queue);

    player.on(AudioPlayerStatus.Idle, () => {
      cleanupCurrentProcess(queue);
      queue.songs.shift();
      playSong(guildId);
    });

    player.on('error', (error) => {
      console.error('Erro no player:', error);
      cleanupCurrentProcess(queue);
      queue.songs.shift();
      playSong(guildId);
    });
  }
  return queue;
}

/**
 * Conecta no canal de voz e retorna a conexão
 */
async function connectToVoice(voiceChannel) {
  const connection = joinVoiceChannel({
    channelId: voiceChannel.id,
    guildId: voiceChannel.guild.id,
    adapterCreator: voiceChannel.guild.voiceAdapterCreator,
    selfDeaf: true,
  });

  await entersState(connection, VoiceConnectionStatus.Ready, 5_000);
  return connection;
}

/**
 * Toca a próxima música da fila
 */
async function playSong(guildId) {
  const queue = queues.get(guildId);
  if (!queue) return;

  const song = queue.songs[0];

  if (!song) {
    queue.playing = false;
    cleanupCurrentProcess(queue);
    if (queue.connection) {
      queue.connection.destroy();
      queue.connection = null;
    }
    return;
  }

  if (!song.url || typeof song.url !== 'string') {
    console.error('Música na fila sem URL válida:', song);
    queue.textChannel?.send('❌ A música na fila está sem URL válida, pulando...');
    queue.songs.shift();
    return playSong(guildId);
  }

  try {
    if (!queue.connection) {
      console.log('Sem conexão de voz, abortando.');
      return;
    }

    const { stream, processes } = createYtDlpStream(song.url);
    queue.currentProc = processes;

    const resource = createAudioResource(stream, {
      inputType: StreamType.Raw,
    });

    queue.player.play(resource);
    queue.connection.subscribe(queue.player);
    queue.playing = true;

    queue.textChannel?.send(`🎵 Tocando agora: **${song.title}**`);
  } catch (err) {
    console.error('Erro ao tocar música:', err);
    queue.textChannel?.send('❌ Ocorreu um erro ao tentar tocar essa música, pulando...');
    queue.songs.shift();
    playSong(guildId);
  }
}

module.exports = {
  getQueue,
  connectToVoice,
  playSong,
  cleanupCurrentProcess,
};