# Chatbot WhatsApp dengan Gemini AI

Proyek ini adalah chatbot WhatsApp yang terintegrasi dengan Gemini AI dari Google. Chatbot ini dapat digunakan untuk melakukan percakapan otomatis di WhatsApp dengan kecerdasan buatan berbasis Gemini.

---

This project is a WhatsApp chatbot integrated with Google's Gemini AI. The chatbot can be used to conduct automated conversations on WhatsApp powered by Gemini-based artificial intelligence.

## Fitur / Features

- **Integrasi WhatsApp / WhatsApp Integration**: Menghubungkan chatbot dengan WhatsApp menggunakan library WhatsApp Web API.  
  Connects the chatbot to WhatsApp using the WhatsApp Web API library.
- **Gemini AI**: Menggunakan Gemini AI untuk menghasilkan respon cerdas secara otomatis.  
  Uses Gemini AI to automatically generate intelligent responses.
- **Respon Otomatis / Auto Reply**: Menjawab pesan WhatsApp secara real-time sesuai dengan input pengguna.  
  Responds to WhatsApp messages in real-time based on user input.
- **Mudah Dikembangkan / Easy to Customize**: Kode modular dan mudah dikustomisasi sesuai kebutuhan.  
  Modular code and easy to customize as needed.

## Cara Instalasi / Installation Guide

### Prasyarat / Prerequisites

- Node.js (disarankan versi terbaru LTS / latest LTS version recommended)
- npm (Node Package Manager)
- Akun Google Gemini & API Key Gemini AI / Google Gemini account & Gemini AI API Key
- WhatsApp aktif untuk scan QR code / Active WhatsApp account to scan QR code

### Langkah Instalasi / Installation Steps

1. **Clone repository**
   ```bash
   git clone https://github.com/wans112/Chatbot-Whatsapp-with-Gemini-AI.git
   cd Chatbot-Whatsapp-with-Gemini-AI
   ```

2. **Install dependensi / Install dependencies**
   ```bash
   npm install
   ```

3. **Konfigurasi API Key Gemini / Configure Gemini API Key**
   - Buat file `.env` di root folder, lalu tambahkan:  
     Create a `.env` file in the root folder, then add:
     ```
     GEMINI_API_KEY=API_KEY_ANDA
     ```
     Ganti `API_KEY_ANDA` dengan API key Gemini AI Anda.  
     Replace `API_KEY_ANDA` with your Gemini AI API key.

4. **Jalankan Bot / Run the Bot**
   ```bash
   npm start
   ```
   - Scan QR code WhatsApp yang muncul di terminal.  
     Scan the WhatsApp QR code that appears in the terminal.

5. **Selesai! / Done!**
   Bot akan aktif dan siap menjawab pesan WhatsApp secara otomatis.  
   The bot will be active and ready to automatically reply to WhatsApp messages.
