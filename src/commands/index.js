// src/commands/index.js
const play = require('./music_commands/play');
const skip = require('./music_commands/skip');
const stop = require('./music_commands/stop');
const queue = require('./music_commands/queue');
const config = require('./admin/config');

const commands = new Map();

[play, skip, stop, queue, config].forEach((cmd) => {
  commands.set(cmd.name, cmd);
});

module.exports = commands;
