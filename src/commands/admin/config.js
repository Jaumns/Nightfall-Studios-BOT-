// src/commands/admin/config.js
const { getGuildConfig, setGuildConfig } = require('../../config-store');

module.exports = {
  name: 'config',
  description: 'Painel de configuração do bot',
  async execute(message, args) {
    // Permissão necessária (Gerenciar Servidor)
    if (!message.member.permissions.has('ManageGuild')) {
      return message.reply('❌ Você não tem permissão para usar este comando (Gerenciar Servidor necessário).');
    }

    const sub = (args.shift() || '').toLowerCase();
    const guildId = message.guild.id;

    // Ajuda do comando
    if (!sub) {
      return message.reply(
        '📋 **Painel de Configuração**\n\n' +
        '`!config show` — mostra as configurações do servidor\n' +
        '`!config setchannel #Comandos` — define o canal de comandos\n' +
        '`!config clearchannel` — remove o canal configurado (bot volta a responder em qualquer canal)\n'
      );
    }

    // ==========================
    //        SHOW
    // ==========================
    if (sub === 'show') {
      const cfg = getGuildConfig(guildId);
      const channelId = cfg.allowedChannelId;

      const channelText = channelId
        ? `<#${channelId}>`
        : 'Nenhum (bot responde em qualquer canal)';

      return message.reply(
        '⚙️ **Configurações atuais:**\n' +
        `• Canal de comandos: ${channelText}`
      );
    }

    // ==========================
    //      SETCHANNEL
    // ==========================
    if (sub === 'setchannel') {
      const channelMention = args[0];

      if (!channelMention) {
        return message.reply('Use: `!config setchannel #Comandos`');
      }

      // Pode ser <#ID> ou apenas ID
      const channelId = channelMention.replace('<#', '').replace('>', '');

      const channel = message.guild.channels.cache.get(channelId);

      if (!channel || channel.type !== 0) { // 0 = texto
        return message.reply('❌ Canal inválido. Escolha um canal de texto.');
      }

      setGuildConfig(guildId, { allowedChannelId: channelId });

      return message.reply(
        `✅ Canal de comandos configurado para <#${channelId}>.\n` +
        `O bot **só aceitará comandos** neste canal.`
      );
    }

    // ==========================
    //      CLEARCHANNEL
    // ==========================
    if (sub === 'clearchannel') {
      const cfg = getGuildConfig(guildId);

      if (!cfg.allowedChannelId) {
        return message.reply('ℹ️ Nenhum canal está configurado no momento.');
      }

      // Remove o canal salvo
      setGuildConfig(guildId, { allowedChannelId: null });

      return message.reply(
        '🗑️ **Canal removido!**\n' +
        'Agora o bot volta a aceitar comandos em qualquer canal.'
      );
    }

    // Subcomando desconhecido
    return message.reply(
      '❌ Subcomando inválido.\n' +
      'Use:\n' +
      '`!config show`\n' +
      '`!config setchannel #Comandos`\n' +
      '`!config clearchannel`'
    );
  },
};