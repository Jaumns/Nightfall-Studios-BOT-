// src/commands/battlemetrics/squad.js
const { getServersByIds } = require('../../services/battlemetrics');
const { SQUAD_REFRESH_MS } = require('../../constants');

// IDs dos servidores favoritos: BM_SQUAD_SERVERS=123456,987654
const FAVORITE_SERVERS = (process.env.BM_SQUAD_SERVERS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

// Cooldown em milissegundos (usa o mesmo do refresh)
const COOLDOWN_MS = SQUAD_REFRESH_MS / 2;
let lastExecution = 0;

module.exports = {
  name: 'squad',
  description: 'Mostra a lista de servidores do Squad no BattleMetrics',

  async execute(message) {
    // ------------------------------
    //  COOLDOWN / TIMEOUT
    // ------------------------------
    const now = Date.now();
    const elapsed = now - lastExecution;

    if (elapsed < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - elapsed) / 1000);
      return message.reply(
        `⏳ Aguarde **${remaining}s** antes de usar este comando novamente.`
      );
    }

    lastExecution = now;

    if (!FAVORITE_SERVERS.length) {
      return message.reply(
        '⚠️ Nenhum servidor configurado.\n' +
          'Defina a variável de ambiente `BM_SQUAD_SERVERS` com os IDs separados por vírgula.\n'
      );
    }

    let servers;
    try {
      servers = await getServersByIds(FAVORITE_SERVERS);
    } catch (err) {
      console.error('[BattleMetrics] Erro ao buscar servidores:', err);
      return message.reply(
        '❌ Ocorreu um erro ao falar com a API do BattleMetrics. Veja o log no console.'
      );
    }

    if (!servers.length) {
      return message.reply(
        '❌ Não consegui encontrar nenhum dos servidores configurados. Confira se os IDs estão corretos.'
      );
    }

    // Monta estilo "server browser"
    const lines = servers.map((s, index) => {
      const status = (s.status || 'unknown').toLowerCase();
      const statusIcon = status === 'online' ? '🟢 ONLINE' : '🔴 OFFLINE';

      const addrBase = s.address || s.ip || 'endereço desconhecido';
      const addr = s.port ? `${addrBase}:${s.port}` : addrBase;

      const players =
        s.players != null && s.maxPlayers != null
          ? `${s.players}/${s.maxPlayers}`
          : '??/??';

      const country = s.country || '??';

      const d = s.details || {};

      // tenta pegar o modo
      const gameMode =
        d.gameMode ||
        d.gamemode ||
        d.game_mode ||
        d.mode ||
        d.Gamemode ||
        'desconhecido';

      // tenta pegar o mapa
      const map =
        d.map ||
        d.currentMap ||
        d.mapLabel ||
        d.level ||
        'desconhecido';

      //mostra a bandeira se for BR ou US
      const flag = country == 'BR' ? '  |  :flag_br: **'+country+'**' : country == 'US' ? '  |  :flag_um: **'+country+'**' : null ;

      return (
        `**${s.name || 'Servidor sem nome'}**${flag}\n` +
        `> ${statusIcon} | 🧩 **${gameMode}** | 🎮 **${players}**\n` +
        `> 🗺️ **${map}**\n` +
        `> 📡 IP: \`${addr}\``
      );
    });

        const header =
            '```ini\n' +
            '[       BATTLEMETRICS.COM      ]\n' +
            '[ Lista de Servidores do Squad ]\n' +
            '```\n';

    return message.channel.send({
      content: header + lines.join('\n\n'),
    });
  },
};