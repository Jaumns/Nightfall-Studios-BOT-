// src/services/battlemetrics.js
require('dotenv').config();

const BM_API = 'https://api.battlemetrics.com';
const BM_TOKEN = process.env.BATTLEMETRICS_TOKEN;

/**
 * Requisição genérica à API do BattleMetrics usando fetch nativo
 */
async function bmRequest(method, url, params = {}) {
  const fullUrl = new URL(BM_API + url);

  // adiciona querystring se tiver params
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null) {
      fullUrl.searchParams.set(key, value);
    }
  }

  const res = await fetch(fullUrl, {
    method,
    headers: {
      Authorization: `Bearer ${BM_TOKEN}`,
      Accept: 'application/json',
    },
  });

  let data;
  try {
    data = await res.json();
  } catch (e) {
    data = null;
  }

  if (!res.ok) {
    console.error('[BattleMetrics] Erro na API:', res.status, res.statusText, data);
    throw new Error(`Erro BattleMetrics ${res.status} - ${res.statusText}`);
  }

  return data;
}

/**
 * Busca um servidor por ID
 */
async function getServerById(id) {
  const json = await bmRequest('GET', `/servers/${id}`);
  const s = json.data;
  const a = s.attributes || {};
  const details = a.details || {}; // game-specific info (map, mode, etc.)

  return {
    id: s.id,
    name: a.name,
    status: a.status,        // "online", "offline", etc.
    address: a.address,      // ex: "play.example.com"
    ip: a.ip,
    port: a.port,
    players: a.players,
    maxPlayers: a.maxPlayers,
    country: a.country,      // ex: "US"
    details,                 // objeto bruto, pra extrair map/mode
  };
}

/**
 * Busca vários servidores por ID
 */
async function getServersByIds(ids = []) {
  const cleanedIds = ids.map((i) => String(i).trim()).filter(Boolean);

  const servers = [];

  for (const id of cleanedIds) {
    try {
      const server = await getServerById(id);
      servers.push(server);
    } catch (err) {
      console.error(`[BattleMetrics] Falha ao buscar servidor ${id}`, err);
    }
  }

  return servers;
}

module.exports = {
  getServersByIds,
};