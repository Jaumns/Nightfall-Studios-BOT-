// src/index.js
const { Client, GatewayIntentBits } = require('discord.js');
const { PREFIX, DISCORD_TOKEN } = require('./config');
const commands = require('./commands');
const { REFRESH_MS } = require('./constants');
const { getGuildConfig } = require('./config-store');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.guild) return;

  const guildId = message.guild.id;
  const guildConfig = getGuildConfig(guildId);
  const allowedChannelId = guildConfig.allowedChannelId || null;

  // Se houver canal configurado para esse servidor, só lê daquele canal
  if (allowedChannelId && message.channel.id !== allowedChannelId) {
    return;
  }

  // Daqui pra baixo só trata comandos
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const commandName = args.shift()?.toLowerCase();

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command.execute(message, args);
  } catch (err) {
    console.error(`Erro ao executar comando ${commandName}:`, err);
    message.reply('❌ Ocorreu um erro ao executar esse comando.');
  }
});

client.once('ready', () => {
  // Limpa o canal configurado em cada guild
  async function clearAllowedChannel() {
    for (const [guildId, guild] of client.guilds.cache) {
      try {
        const cfg = getGuildConfig(guildId);
        const channelId = cfg.allowedChannelId;
        if (!channelId) continue;

        const channel = await client.channels.fetch(channelId).catch(() => null);
        if (!channel) continue;

        const messages = await channel.messages.fetch({ limit: 100 });
        if (messages.size > 0) {
          await channel.bulkDelete(messages, true);
          console.log(
            `[ClearChat] Limpou ${messages.size} mensagens no canal ${channelId} da guild ${guildId}`
          );
        }
      } catch (err) {
        console.error('[ClearChat] Erro ao limpar canal:', err);
      }
    }
  }

  // usa o MESMO tempo do cooldown do !squad
  setInterval(clearAllowedChannel, REFRESH_MS);
  console.log(`Logado como ${client.user.tag}`);
});

client.login(DISCORD_TOKEN);
