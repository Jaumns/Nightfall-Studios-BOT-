// src/commands/index.js
const play = require('./music/play');
const skip = require('./music/skip');
const stop = require('./music/stop');
const queue = require('./music/queue');
const config = require('./admin/config');
const squad = require('./battlemetrics/squad');

const commands = new Map();

[play, skip, stop, queue, config, squad].forEach((cmd) => {
  commands.set(cmd.name, cmd);
});

module.exports = commands;
