import { GoogleGenAI } from '@google/genai';
import {
  getSpreadsheetConfigs,
  getInstruksiSistem,
  getApiKey,
  buildInstruksiSistem,
  getMemory,
  saveMemory,
  handleTambahCommand,
  handleUpdateCommand,
  getInstruksiSistemByNumber
} from './config-util.js';
import fs from 'fs/promises';

export async function textAI(pesan, userId) {
  const spreadsheets = await getSpreadsheetConfigs();

  let instruksiSistem = await getInstruksiSistemByNumber(userId);
  if (!instruksiSistem) {
    instruksiSistem = await getInstruksiSistem();
  }
  instruksiSistem = await buildInstruksiSistem(instruksiSistem, spreadsheets);

  let history = await getMemory(userId);
  history = [...history, pesan].slice(-5);

  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const contents = history.map(h => ({ text: h }));

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: instruksiSistem
    },
  });

  history = [...history, response.text].slice(-5);
  await saveMemory(userId, history);

  if (response.text.includes('!tambah')) {
    const tambah = await handleTambahCommand(response.text);
    return tambah;
  } else if (response.text.includes('!update')) {
    const edit = await handleUpdateCommand(response.text);
    return edit;
  }

  return response.text;
}

export async function MediaAI(pathFile, pesan, fileType, userId) {
  const spreadsheets = await getSpreadsheetConfigs();
  
  let instruksiSistem = await getInstruksiSistemByNumber(userId);
  if (!instruksiSistem) {
    instruksiSistem = await getInstruksiSistem();
  }
  instruksiSistem = await buildInstruksiSistem(instruksiSistem, spreadsheets);

  let history = await getMemory(userId);
  history = [...history, pesan].slice(-5);

  const apiKey = await getApiKey();
  const ai = new GoogleGenAI({ apiKey });

  const base64ImageFile = (await fs.readFile(pathFile)).toString('base64');

  const contents = [
    ...history.slice(0, -1).map(h => ({ text: h })),
    {
      inlineData: {
        mimeType: fileType,
        data: base64ImageFile,
      },
    },
    { text: pesan },
  ];

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: contents,
    config: {
      systemInstruction: instruksiSistem,
    },
  });

  history = [...history, response.text].slice(-5);
  await saveMemory(userId, history);

  if (response.text.includes('!tambah')) {
    handleTambahCommand(response.text);
  } else

  return response.text;
}