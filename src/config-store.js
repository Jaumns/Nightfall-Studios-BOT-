// src/config-store.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.resolve(__dirname, '../data');
const CONFIG_PATH = path.join(DATA_DIR, 'guild-config.json');

// Garante que a pasta data existe
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}

// Carrega o arquivo JSON de configs (ou um objeto vazio)
function loadConfigFile() {
  try {
    if (!fs.existsSync(CONFIG_PATH)) {
      return {};
    }
    const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (err) {
    console.error('Erro ao carregar guild-config.json:', err);
    return {};
  }
}

// Salva o JSON de configs
function saveConfigFile(data) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (err) {
    console.error('Erro ao salvar guild-config.json:', err);
  }
}

// Retorna o config de um guild (ou defaults)
function getGuildConfig(guildId) {
  const all = loadConfigFile();
  return all[guildId] || {};
}

// Atualiza o config de um guild
function setGuildConfig(guildId, partialConfig) {
  const all = loadConfigFile();
  const current = all[guildId] || {};
  const updated = { ...current, ...partialConfig };

  all[guildId] = updated;
  saveConfigFile(all);
  return updated;
}

module.exports = {
  getGuildConfig,
  setGuildConfig,
};