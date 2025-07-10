import fs from 'fs/promises';
import path from 'path';
import { 
  readSpreadsheet,
  insertSpreadsheet,
  updateSpreadsheet
} from './spreadsheet.js';

export async function getSpreadsheetConfigs() {
  const config = JSON.parse(await fs.readFile(new URL('../config/spreadsheet-config.json', import.meta.url)));
  return config.spreadsheets || [];
}

export async function getInstruksiSistem() {
  const data = JSON.parse(await fs.readFile(new URL('../config/instruksi.json', import.meta.url)));
  return data.instruksiSistem;
}

export async function getApiKey() {
  const data = JSON.parse(await fs.readFile(new URL('../config/apikey.json', import.meta.url)));
  if (Array.isArray(data.apiKeys)) {
    return data.apiKeys[Math.floor(Math.random() * data.apiKeys.length)];
  }
  return data.apiKey;
}

export async function buildInstruksiSistem(instruksiSistem, spreadsheets) {
  for (const s of spreadsheets) {
    const sheetName = s.range.split('!')[0];
    const data = await readSpreadsheet(s.spreadsheetId, s.range);
    instruksiSistem = instruksiSistem.replace(
      new RegExp(`{${sheetName}}`, 'g'),
      JSON.stringify(data)
    );
  }

  if (instruksiSistem.includes('{data}') && spreadsheets.length > 0) {
    const data = await readSpreadsheet(spreadsheets[0].spreadsheetId, spreadsheets[0].range);
    instruksiSistem = instruksiSistem.replace('{data}', JSON.stringify(data));
  }

  return instruksiSistem;
}

export async function addToSheet(spreadsheetId, range, values) {
  const response = await insertSpreadsheet(spreadsheetId, range, values);
  return response;
}

const MEMORY_DIR = path.join(process.cwd(), 'memory');

export async function ensureMemoryDir() {
  try {
    await fs.mkdir(MEMORY_DIR, { recursive: true });
  } catch {}
}

export async function getMemory(userId) {
  await ensureMemoryDir();
  const filePath = path.join(MEMORY_DIR, `${userId}.json`);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function saveMemory(userId, history) {
  await ensureMemoryDir();
  const filePath = path.join(MEMORY_DIR, `${userId}.json`);
  await fs.writeFile(filePath, JSON.stringify(history, null, 2));
}

async function getSheetConfigByAlias(alias) {
  const configs = await getSpreadsheetConfigs();
  return configs.find(s => s.range.toLowerCase() === alias.toLowerCase());
}

export async function handleTambahCommand(pesan) {
  const idx = pesan.toLowerCase().indexOf('!tambah');
  if (idx === -1){
    return 'Perintah !tambah tidak ditemukan dalam pesan.';
  };
  const perintah = pesan.slice(idx);

  const regex = /^!tambah\s+'([^']+)'\s*,\s*(\[[\s\S]*\])/i;
  const match = perintah.match(regex);
  if (!match){
    return 'Format perintah !tambah salah. Gunakan: !tambah \'alias\' , [\'value1\', \'value2\', ...]';
  };

  const alias = match[1];
  const arrayStr = match[2];

  const config = await getSheetConfigByAlias(alias);
  if (!config) {
    return `Sheet alias '${alias}' tidak ditemukan di config!`
  };

  const values = Array.from(arrayStr.matchAll(/(['"])(.*?)\1/g)).map(m => m[2].trim());
  try {
    await insertSpreadsheet(config.spreadsheetId, config.range, values);
    return 'Data berhasil ditambahkan ke spreadsheet!';
  } catch (err) {
    return 'Gagal menambahkan data ke spreadsheet.';
  }
}

export async function handleUpdateCommand(pesan) {
  const idx = pesan.toLowerCase().indexOf('!update');
  if (idx === -1) {
    return 'Perintah !update tidak ditemukan dalam pesan.';
  };
  const perintah = pesan.slice(idx);

  const regex = /^!update\s+'([^']+)'\s*,\s*(\[[\s\S]*\])/i;
  const match = perintah.match(regex);
  if (!match){
    return 'Format perintah !update salah. Gunakan: !update \'alias\' , [\'value1\', \'value2\', ...]';
  };

  const alias = match[1];
  const arrayStr = match[2];

  const config = await getSheetConfigByAlias(alias);
  if (!config) {
    return `Sheet alias '${alias}' tidak ditemukan di config!`
  };

  const values = Array.from(arrayStr.matchAll(/(['"])(.*?)\1/g)).map(m => m[2].trim());
  try {
    await updateSpreadsheet(config.spreadsheetId, config.range, values);
    return 'Data berhasil diupdate di spreadsheet!';
  } catch (err) {
    return 'Gagal mengupdate data di spreadsheet.';
  }
}

export async function getInstruksiSistemByNumber(number) {
  try {
    const data = JSON.parse(await fs.readFile(new URL('../config/instruksi-per-nomor.json', import.meta.url)));
    if (data[number]) return data[number];
  } catch {}
  return null;
}