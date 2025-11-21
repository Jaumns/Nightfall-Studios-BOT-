// src/config.js
require('dotenv').config();

module.exports = {
  PREFIX: process.env.PREFIX || '!',
  DISCORD_TOKEN: process.env.DISCORD_TOKEN,
  YTDLP_PATH: process.env.YTDLP_PATH || null, // se quiser apontar pro yt-dlp por env
};