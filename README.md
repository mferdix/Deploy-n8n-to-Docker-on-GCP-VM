# Automasi Screenshot ke Email & Teams Menggunakan n8n

Repositori ini berisi panduan lengkap dan komponen yang dibutuhkan untuk membangun alur kerja automasi penuh menggunakan n8n, dari awal hingga akhir.

Tujuan utamanya adalah membuat sistem yang secara otomatis dapat mengambil tangkapan layar (screenshot) halaman web, lalu mengirimkannya sebagai laporan melalui Email atau Microsoft Teams.

## Gambaran Umum Proyek

Proyek ini terdiri dari tiga tahap utama:

1.  **Deploy n8n di Server**: Menyiapkan fondasi dengan menginstal n8n menggunakan Docker di Virtual Machine (VM) Google Cloud Platform (GCP).
2.  **Membuat API Screenshot Kustom**: Karena keterbatasan pada beberapa versi n8n atau lingkungan Docker, kita akan membuat microservice terpisah menggunakan Puppeteer untuk mengambil screenshot secara andal.
3.  **Membangun Workflow di n8n**: Merancang alur kerja yang menghubungkan semuanya: memicu proses, memanggil API screenshot, dan mengirim hasilnya ke tujuan.

Dokumentasi ini akan memandu Anda melalui semua tahap tersebut.

---

## Tahap 1: Deploy n8n di GCP dengan Docker

Bagian ini menjelaskan cara menyiapkan instance n8n yang self-hosted.

### Prasyarat

-   Akun Google Cloud Platform yang aktif.
-   Pengetahuan dasar terminal Linux.

### 1. Setup Virtual Machine (VM) di GCP

1.  Buka **GCP Console** -> **Compute Engine** -> **VM instances**.
2.  Klik **CREATE INSTANCE**.
3.  Gunakan konfigurasi berikut:
    * **Name**: `n8n-server` (atau nama lain).
    * **Region**: Pilih yang terdekat, misal `asia-southeast2` (Jakarta).
    * **Machine type**: `e2-medium` (2 vCPU, 4 GB RAM) direkomendasikan.
    * **Boot disk**: OS `Ubuntu`, Version `Ubuntu 22.04 LTS`, Size `30 GB`.
    * **Firewall**: Centang `Allow HTTP traffic` dan `Allow HTTPS traffic`.
    * **Networking** -> **Network tags**: Tambahkan tag `n8n-server`.
4.  Klik **Create**.

### 2. Konfigurasi Aturan Firewall

Kita perlu membuka port `5678` agar n8n bisa diakses dari internet.
1.  Buka **VPC network** -> **Firewall**.
2.  Klik **CREATE FIREWALL RULE**.
3.  Konfigurasi:
    * **Name**: `allow-n8n-access`
    * **Target tags**: `n8n-server`
    * **Source IPv4 ranges**: `0.0.0.0/0`
    * **Protocols and ports**: Pilih `Specified protocols and ports`, centang `TCP`, dan isi `5678`.
4.  Klik **Create**.

### 3. Instalasi Docker di Server

1.  Hubungkan ke VM Anda menggunakan tombol **SSH** di GCP Console.
2.  Update sistem:
    ```bash
    sudo apt update && sudo apt upgrade -y
    ```
3.  Install Docker Engine:
    ```bash
    curl -fsSL [https://get.docker.com](https://get.docker.com) -o get-docker.sh
    sudo sh get-docker.sh
    ```
4.  Install Docker Compose:
    ```bash
    sudo apt install docker-compose -y
    ```
5.  (Opsional) Tambahkan user Anda ke grup docker agar tidak perlu `sudo`:
    ```bash
    sudo usermod -aG docker $USER
    ```
    > **Penting**: Anda harus keluar dari sesi SSH dan masuk kembali agar perubahan ini aktif.

### 4. Jalankan n8n

1.  Buat direktori untuk n8n dan masuk ke dalamnya:
    ```bash
    mkdir ~/n8n-server && cd ~/n8n-server
    ```
2.  Buat file `docker-compose.yml`:
    ```bash
    nano docker-compose.yml
    ```
3.  Salin dan tempel konfigurasi berikut ke dalam file:
    ```yaml
    version: '3.7'

    services:
      n8n:
        image: n8nio/n8n:latest
        restart: always
        ports:
          - "5678:5678"
        environment:
          - TZ=Asia/Jakarta
          - N8N_SECURE_COOKIE=false
        volumes:
          - n8n_data:/home/node/.n8n

    volumes:
      n8n_data: {}
    ```
4.  Jalankan n8n di background:
    ```bash
    docker-compose up -d
    ```

### 5. Akses n8n
Buka browser dan akses `http://<IP_EKSTERNAL_ANDA>:5678`. Ikuti proses setup untuk membuat akun admin.

---

## Tahap 2: Setup API Screenshot Kustom

Bagian ini menjelaskan cara membuat microservice untuk mengambil screenshot.

### Prasyarat
-   Node.js (v18.x atau lebih tinggi) dan npm.
    ```bash
    # Jalankan di terminal SSH Anda
    curl -sL [https://deb.nodesource.com/setup_18.x](https://deb.nodesource.com/setup_18.x) | sudo -E bash -
    sudo apt install -y nodejs
    ```

### 1. Instalasi Komponen API

1.  Buat direktori proyek dan masuk ke dalamnya:
    ```bash
    mkdir ~/screenshot-api && cd ~/screenshot-api
    ```

2.  Inisialisasi proyek Node.js:
    ```bash
    npm init -y
    ```

3.  Instal dependensi yang dibutuhkan (Express, Puppeteer, Sharp):
    ```bash
    npm install express puppeteer sharp
    ```

4.  Instal dependensi sistem untuk Chromium:
    ```bash
    sudo apt-get update && sudo apt-get install -y chromium-browser
    ```

5.  Buat file `server.js` untuk kode API Anda:
    ```bash
    nano server.js
    ```
    Salin kode dari bagian **Konfigurasi API (server.js)** di bawah ke dalam file ini.

### 2. Menjalankan Server API

Kita akan menggunakan PM2 agar server API berjalan secara persisten.

1.  Instal PM2 secara global:
    ```bash
    sudo npm install -g pm2
    ```
2.  Jalankan server dari dalam direktori `~/screenshot-api`:
    ```bash
    pm2 start server.js --name screenshot-api
    ```
3.  Pastikan server berjalan (`pm2 list`) dan simpan prosesnya agar otomatis berjalan saat reboot (`pm2 save` lalu `pm2 startup`).

---

## Tahap 3: Pengaturan Kredensial & Flow di n8n

Sebelum membangun flow, siapkan koneksi ke layanan eksternal.

### Setup Kredensial SMTP Gmail

Ini adalah metode paling stabil untuk mengirim email dari akun Gmail pribadi melalui n8n.

**1. Prasyarat di Akun Google**

Kunjungi halaman Keamanan Akun Google Anda: [myaccount.google.com/security](https://myaccount.google.com/security)

-   **Aktifkan Verifikasi 2 Langkah**: Opsi "Sandi Aplikasi" hanya akan muncul jika Verifikasi 2 Langkah sudah aktif.
-   **Nonaktifkan Program Perlindungan Lanjutan**: Jika akun Anda terdaftar dalam program keamanan tertinggi ini, Anda tidak akan bisa membuat Sandi Aplikasi. Anda harus menonaktifkannya terlebih dahulu.

**2. Buat Sandi Aplikasi (App Password)**

1.  Di halaman Keamanan Google, cari dan klik bagian **Sandi Aplikasi**.
2.  Klik **Pilih aplikasi** dan pilih **Lainnya (Nama kustom)**.
3.  Beri nama (misalnya, `n8n Server`) lalu klik **BUAT**.
4.  Google akan menampilkan **sandi 16 digit**. **Salin dan simpan sandi ini**, karena tidak akan ditampilkan lagi.

**3. Buat Kredensial SMTP di n8n**

1.  Di antarmuka n8n, buka **Credentials** > **Add credential**.
2.  Cari dan pilih **SMTP**.
3.  Isi formulir dengan detail berikut:
    -   **Host**: `smtp.gmail.com`
    -   **Port**: `465`
    -   **User**: Alamat email Gmail lengkap Anda.
    -   **Password**: Masukkan **sandi 16 digit** yang Anda buat sebelumnya.
    -   **SSL/TLS**: Aktifkan (`true`).
4.  Klik **Save**.

Kredensial Anda sekarang siap digunakan di dalam node `Send Email` pada flow n8n Anda.

---

## Lampiran: Kode `server.js` untuk API Screenshot

```javascript
const express = require('express');
const puppeteer = require('puppeteer');
const sharp = require('sharp');

const app = express();
const port = 3000; // API akan berjalan di port 3000

app.get('/screenshot', async (req, res) => {
  const { url } = req.query;
  if (!url) {
    return res.status(400).send('Error: parameter "url" tidak ditemukan.');
  }
  console.log(`Menerima permintaan untuk screenshot: ${url}`);
  try {
    const browser = await puppeteer.launch({
      executablePath: '/usr/bin/chromium-browser',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 120000 // Timeout 2 menit
    });
    // Jeda tambahan 5 detik setelah halaman dimuat
    await new Promise(resolve => setTimeout(resolve, 5000));
    const imageBuffer = await page.screenshot({ type: 'jpeg' });
    await browser.close();

    // Proses resize dan kompresi gambar
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 }) // Ubah lebar gambar menjadi 800px
      .jpeg({ quality: 70 })   // Kompres kualitas JPEG menjadi 70%
      .toBuffer();

    // Atur header dan kirim gambar yang sudah di-resize
    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Disposition', 'attachment; filename="screenshot-laporan.jpg"');
    res.send(resizedImageBuffer);

  } catch (error) {
    console.error('Gagal mengambil screenshot:', error);
    res.status(500).send(`Gagal mengambil screenshot: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server API Screenshot berjalan di http://localhost:${port}`);
});

```

## Konfigurasi

Anda dapat menyesuaikan beberapa parameter langsung di dalam file `server.js`:

-   **Port Server**: Ubah nilai variabel `port`.
    ```javascript
    const port = 3000;
    ```
-   **Dimensi Browser**: Ubah nilai di `page.setViewport`.
    ```javascript
    await page.setViewport({ width: 1280, height: 720 });
    ```
-   **Batas Waktu Tunggu**: Ubah nilai `timeout` di `page.goto` (dalam milidetik).
    ```javascript
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 120000 });
    ```
-   **Jeda Tambahan**: Ubah waktu tunggu tambahan setelah halaman dimuat (dalam milidetik).
    ```javascript
    await new Promise(resolve => setTimeout(resolve, 5000));
    ```
-   **Kualitas dan Ukuran Gambar**: Ubah parameter `width` dan `quality` di dalam fungsi `sharp`.
    ```javascript
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 })
      .jpeg({ quality: 70 })
      .toBuffer();
    ```

---

## Flow n8n 
Mouse Click > HTTP Request Puppett > Email

