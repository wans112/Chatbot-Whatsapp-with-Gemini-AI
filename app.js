import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import fs from 'fs/promises';
import path from 'path';
import pkg from 'whatsapp-web.js';
import QRCode from 'qrcode';
import { MediaAI, textAI } from './module/gemini.js';
const { Client, LocalAuth } = pkg;

let client;
let isStarted = false;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 3000;

app.use(express.static('public'));

io.on('connection', (socket) => {
    console.log('Web client terhubung ke Socket.IO');
    socket.emit('status', isStarted ? 'Bot aktif.' : 'Bot belum berjalan.');
});

app.get('/get-apikeys', async (req, res) => {
    try {
        const data = await fs.readFile('./config/apikey.json', 'utf-8');
        const { apiKeys } = JSON.parse(data);
        res.json({ apiKeys });
    } catch {
        res.json({ apiKeys: [] });
    }
});

app.post('/add-apikey', express.json(), async (req, res) => {
    const { apiKey } = req.body;
    if (!apiKey) return res.status(400).send('API key kosong!');
    let apiKeys = [];
    try {
        const data = await fs.readFile('./config/apikey.json', 'utf-8');
        apiKeys = JSON.parse(data).apiKeys || [];
    } catch {}
    if (apiKeys.includes(apiKey)) return res.status(400).send('API key sudah ada!');
    apiKeys.push(apiKey);
    await fs.writeFile('./config/apikey.json', JSON.stringify({ apiKeys }, null, 2));
    res.send('API key berhasil ditambah!');
});

app.post('/delete-apikey', express.json(), async (req, res) => {
    const { apiKey } = req.body;
    let apiKeys = [];
    try {
        const data = await fs.readFile('./config/apikey.json', 'utf-8');
        apiKeys = JSON.parse(data).apiKeys || [];
    } catch {}
    apiKeys = apiKeys.filter(k => k !== apiKey);
    await fs.writeFile('./config/apikey.json', JSON.stringify({ apiKeys }, null, 2));
    res.send('API key berhasil dihapus!');
});

app.get('/get-spreadsheet-configs', async (req, res) => {
    try {
        const data = await fs.readFile('./config/spreadsheet-config.json', 'utf-8');
        const { spreadsheets } = JSON.parse(data);
        res.json({ spreadsheets });
    } catch {
        res.json({ spreadsheets: [] });
    }
});

app.post('/add-spreadsheet-config', express.json(), async (req, res) => {
    const { spreadsheetId, range } = req.body;
    if (!spreadsheetId || !range) return res.status(400).send('Spreadsheet ID dan range wajib diisi!');
    let spreadsheets = [];
    try {
        const data = await fs.readFile('./config/spreadsheet-config.json', 'utf-8');
        spreadsheets = JSON.parse(data).spreadsheets || [];
    } catch {}
    spreadsheets.push({ spreadsheetId, range });
    await fs.writeFile('./config/spreadsheet-config.json', JSON.stringify({ spreadsheets }, null, 2));
    res.send('Spreadsheet config berhasil ditambah!');
});

app.post('/delete-spreadsheet-config', express.json(), async (req, res) => {
    const { spreadsheetId, range } = req.body;
    let spreadsheets = [];
    try {
        const data = await fs.readFile('./config/spreadsheet-config.json', 'utf-8');
        spreadsheets = JSON.parse(data).spreadsheets || [];
    } catch {}
    spreadsheets = spreadsheets.filter(s => !(s.spreadsheetId === spreadsheetId && s.range === range));
    await fs.writeFile('./config/spreadsheet-config.json', JSON.stringify({ spreadsheets }, null, 2));
    res.send('Spreadsheet config berhasil dihapus!');
});

app.get('/get-instruksi', async (req, res) => {
    try {
        const data = await fs.readFile('./config/instruksi.json', 'utf-8');
        const { instruksiSistem } = JSON.parse(data);
        res.json({ instruksiSistem });
    } catch {
        res.json({ instruksiSistem: '' });
    }
});

app.post('/set-instruksi', express.json(), async (req, res) => {
    const { instruksiSistem } = req.body;
    if (!instruksiSistem) return res.status(400).send('Instruksi tidak boleh kosong!');
    await fs.writeFile('./config/instruksi.json', JSON.stringify({ instruksiSistem }, null, 2));
    res.send('Instruksi berhasil disimpan!');
});

async function doLogout() {
    if (isStarted && client) {
        await client.destroy();
        client = null;
        isStarted = false;
        io.emit('status', 'Bot dihentikan (logout).');
        io.emit('stopped');
    }
    const authPath = path.join(process.cwd(), '.wwebjs_auth');
    const cachePath = path.join(process.cwd(), '.wwebjs_cache');
    function deleteFolderRecursive(folderPath) {
        if (fs.existsSync(folderPath)) {
            fs.rmSync(folderPath, { recursive: true, force: true });
        }
    }
    try {
        deleteFolderRecursive(authPath);
        deleteFolderRecursive(cachePath);
        io.emit('status', 'Telah Logout dari WhatsApp');
    } catch (err) {
        io.emit('status', 'Gagal logout: ' + err.message);
    }
}

app.get('/start', (req, res) => {
    if (!isStarted) {
        client = new Client({
            authStrategy: new LocalAuth()
        });

        client.on('qr', async (qr) => {
            io.emit('status', 'Scan QR untuk login WhatsApp.');
            const qrImage = await QRCode.toDataURL(qr);
            io.emit('qr-image', qrImage);
        });

        client.on('ready', () => {
            io.emit('status', 'Bot aktif dan siap digunakan.');
            io.emit('qr-image', '');
        });

        client.on('message', async message => {
            if (message.hasMedia) {
                const media = await message.downloadMedia();
                if (media) {
                    if (media.mimetype.startsWith('audio/')){
                        const chat = await message.getChat();
                        await chat.sendStateRecording();
                        const fileType = 'audio/ogg';
                        const fileName = `temp.ogg`;
                        await fs.writeFile(fileName, Buffer.from(media.data, 'base64'));
                        const audioPath = path.join(process.cwd(), fileName);
                        const balasan = await MediaAI(audioPath, message.body, fileType, message.from);
                        if (balasan) {
                            message.reply(balasan);
                        }
                        await chat.clearState();
                        await fs.unlink(audioPath);
                    }
                    if (media.mimetype.startsWith('image/')) {
                        const chat = await message.getChat();
                        await chat.sendStateTyping();
                        const mimeType = media.mimetype.split('/')[1];
                        const fileName = `temp.${mimeType}`;
                        await fs.writeFile(fileName, Buffer.from(media.data, 'base64'));
                        const imagePath = path.join(process.cwd(), fileName);
                        const balasan = await MediaAI(imagePath, message.body, media.mimetype, message.from);
                        if (balasan) {
                            message.reply(balasan);
                        }
                        await chat.clearState();
                        await fs.unlink(imagePath)
                    }
                }
                return;
            }
            const balasan = await textAI(message.body, message.from);
            if (balasan) {
                const chat = await message.getChat();
                await chat.sendStateTyping();
                message.reply(balasan);
                await chat.clearState();
            }
        });

        client.on('disconnected', async (reason) => {
            io.emit('status', 'Bot terputus: ' + reason);
            await doLogout();
        });

        client.initialize();
        isStarted = true;
        io.emit('status', 'Bot sedang inisialisasi...');
        res.send('Bot started!');
    } else {
        res.send('Bot already running.');
    }
});

app.get('/stop', async (req, res) => {
    if (isStarted && client) {
        io.emit('status', 'Mematikan bot, harap tunggu...');
        await new Promise(resolve => setTimeout(resolve, 3000));
        await client.destroy();
        client = null;
        isStarted = false;
        io.emit('status', 'Bot dihentikan.');
        io.emit('stopped');
        res.send('Bot stopped!');
    } else {
        res.send('Bot is not running.');
    }
});

app.get('/logout', async (req, res) => {
    await doLogout();
    res.send('Logout berhasil. Bot dihentikan dan data login dihapus.');
});

server.listen(PORT, () => {
    console.log(`Panel web berjalan di http://localhost:${PORT}`);
});