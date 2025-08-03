# Automasi Screenshot ke Email

Repositori ini berisi kode dan dokumentasi untuk salah satu komponen kunci dalam membangun alur kerja automasi penuh menggunakan n8n: sebuah **API kustom untuk pengambilan screenshot halaman web**.

Proyek ini dirancang sebagai solusi andal ketika node bawaan atau komunitas n8n untuk mengambil screenshot mengalami kendala, misalnya karena versi n8n yang lebih lama, dependensi yang tidak kompatibel di dalam Docker, atau lingkungan server yang spesifik. Dengan membuat microservice terpisah ini, kita mendapatkan kendali penuh atas proses pengambilan screenshot.

## Gambaran Umum Alur Kerja Keseluruhan

Automasi penuh dari awal hingga akhir melibatkan tiga tahap utama:

1.  **Instalasi n8n**: Menjalankan n8n sebagai layanan utama menggunakan Docker di sebuah server (misalnya, VM di Google Cloud Platform).
2.  **Setup Server API Screenshot (Proyek Ini)**: Menginstal dan menjalankan server API dari repositori ini di server yang sama. Server ini akan bertugas mengambil screenshot saat diminta oleh n8n.
3.  **Pembuatan Flow Automation di n8n**: Merancang alur kerja di antarmuka n8n yang secara berurutan:
    * Memicu alur kerja (misalnya, setiap hari pada jam tertentu).
    * Mengirim permintaan ke API screenshot ini untuk mendapatkan gambar.
    * Mengirim gambar yang diterima ke berbagai tujuan, seperti **Email** dan **Microsoft Teams**.

Dokumentasi di bawah ini akan berfokus pada **Tahap 2**, yaitu cara menginstal, menjalankan, dan menggunakan server API screenshot ini.

---

## Detail Komponen: API Screenshot dengan Puppeteer

Ini adalah sebuah server API sederhana yang dibangun menggunakan Node.js dan Express.js untuk mengambil tangkapan layar (screenshot) dari halaman web mana pun secara dinamis. Proyek ini menggunakan [Puppeteer](https://pptr.dev/) untuk mengontrol browser Chromium dalam mode *headless* dan [Sharp](https://sharp.pixelplumbing.com/) untuk memproses gambar (resize dan kompresi).

### Fitur Utama

-   **Pengambilan Screenshot Dinamis**: Cukup sediakan URL melalui query parameter untuk mendapatkan screenshot.
-   **Pemrosesan Gambar**: Gambar yang dihasilkan secara otomatis diubah ukurannya (resize) dan dikompresi untuk mengoptimalkan ukuran file.
-   **Penanganan Halaman Kompleks**: Dilengkapi dengan mekanisme waktu tunggu untuk memastikan halaman yang memuat konten secara dinamis (JavaScript-heavy) dapat ditangkap dengan sempurna.
-   **Output Siap Pakai**: Respons API menyertakan header `Content-Disposition` sehingga browser akan otomatis mengunduh gambar dengan nama file yang sudah ditentukan.
-   **Manajemen Proses**: Menggunakan [PM2](https://pm2.keymetrics.io/) untuk menjaga agar server API tetap berjalan 24/7.

### Teknologi yang Digunakan

-   **Backend**: Node.js, Express.js
-   **Web Scraping/Browser Automation**: Puppeteer
-   **Image Processing**: Sharp
-   **Process Manager**: PM2
-   **Server**: Ubuntu (atau distro Linux berbasis Debian lainnya)

### Prasyarat

Sebelum memulai, pastikan server Anda sudah memiliki:
-   Sistem Operasi Ubuntu 20.04 atau lebih baru.
-   Node.js (v18.x atau lebih tinggi).
-   npm (biasanya terinstal bersama Node.js).
-   Git.

# Deploy n8n di GCP dengan Docker

Repositori ini berisi panduan dan file konfigurasi `docker-compose.yml` untuk melakukan deployment server otomasi **n8n** di **Google Cloud Platform (GCP)** menggunakan Docker.

## 🚀 Deskripsi Proyek

Tujuan dari proyek ini adalah menyediakan panduan langkah demi langkah yang jelas untuk menyiapkan instance n8n yang self-hosted, mulai dari pembuatan Virtual Machine (VM) di GCP hingga server n8n siap digunakan. Solusi ini menggunakan Docker dan Docker Compose untuk instalasi yang bersih, terisolasi, dan mudah dikelola.

### Teknologi yang Digunakan
* **Platform Cloud:** Google Cloud Platform (GCP)
* **Layanan Compute:** GCP Compute Engine (VM)
* **Sistem Operasi:** Ubuntu 22.04 LTS
* **Containerization:** Docker & Docker Compose
* **Aplikasi:** n8n (Server Otomasi Workflow)

---

## ⚙️ Prasyarat

Sebelum memulai, pastikan Anda memiliki:
1.  Akun Google Cloud Platform yang aktif.
2.  Pengetahuan dasar mengenai terminal Linux.
3.  Pengetahuan dasar mengenai konsep Docker.
4.  (Opsional) `gcloud CLI` terinstal di komputer lokal Anda.

---

## 🔧 Panduan Instalasi

Ikuti langkah-langkah berikut untuk men-deploy n8n dari awal.

### 1. Setup Virtual Machine (VM) di GCP

1.  Buka **GCP Console** -> **Compute Engine** -> **VM instances**.
2.  Klik **CREATE INSTANCE**.
3.  Gunakan konfigurasi berikut:
    * **Name**: `n8n-server` (atau nama lain yang Anda inginkan).
    * **Region**: Pilih yang terdekat, misal `asia-southeast2` (Jakarta).
    * **Machine type**: `e2-medium` (2 vCPU, 4 GB RAM) direkomendasikan untuk stabilitas.
    * **Boot disk**:
        * **OS**: `Ubuntu`
        * **Version**: `Ubuntu 22.04 LTS`
        * **Size**: `30 GB`
    * **Firewall**: Centang `Allow HTTP traffic` dan `Allow HTTPS traffic`.
    * **Networking** -> **Network tags**: Tambahkan tag `n8n-server`.
4.  Klik **Create**.

### 2. Konfigurasi Aturan Firewall

Kita perlu membuka port `5678` agar n8n bisa diakses.
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
2.  Update sistem dan instal paket yang dibutuhkan:
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

1.  Clone repositori ini (atau cukup buat direktori dan file `docker-compose.yml`).
    ```bash
    git clone [URL_REPOSITORI_ANDA]
    cd [NAMA_DIREKTORI_REPO]
    ```
    Atau jika manual:
    ```bash
    mkdir n8n-server && cd n8n-server
    ```
2.  Buat file `docker-compose.yml` dengan isi dari repositori ini.
3.  Jalankan n8n di background:
    ```bash
    docker-compose up -d
    ```
    Docker akan mengunduh image n8n dan menjalankannya. Proses ini mungkin butuh beberapa menit.

---

## 🖥️ Penggunaan

1.  Dapatkan alamat IP eksternal VM Anda dari halaman Compute Engine di GCP Console.
2.  Buka browser dan akses n8n melalui URL:
    ```
    http://<IP_EKSTERNAL_ANDA>:5678
    ```
3.  Saat pertama kali mengakses, Anda akan diminta untuk membuat akun admin. Ikuti prosesnya dan Anda siap menggunakan n8n!

---

## 📄 Konfigurasi `docker-compose.yml`

Berikut adalah isi dari file `docker-compose.yml` yang digunakan dalam proyek ini:

```yaml
version: '3.7'

services:
  n8n:
    image: n8nio/n8n:latest
    restart: always
    ports:
      - "5678:5678"
    environment:
      # Atur zona waktu agar jadwal workflow (cron) akurat
      - TZ=Asia/Jakarta
      # Nonaktifkan secure cookie untuk akses awal via HTTP.
      # Lihat catatan keamanan di bawah.
      - N8N_SECURE_COOKIE=false
    volumes:
      # Menyimpan data n8n (workflows, credentials) secara permanen
      - n8n_data:/home/node/.n8n

volumes:
  n8n_data: {}

```

# API Screenshot Halaman Web dengan Puppeteer

Ini adalah sebuah server API sederhana yang dibangun menggunakan Node.js dan Express.js untuk mengambil tangkapan layar (screenshot) dari halaman web mana pun secara dinamis. Proyek ini menggunakan [Puppeteer](https://pptr.dev/) untuk mengontrol browser Chromium dalam mode *headless* dan [Sharp](https://sharp.pixelplumbing.com/) untuk memproses gambar (resize dan kompresi).

API ini sangat cocok untuk kebutuhan automasi, pelaporan, atau pengarsipan visual halaman web.

## Fitur Utama

-   **Pengambilan Screenshot Dinamis**: Cukup sediakan URL melalui query parameter untuk mendapatkan screenshot.
-   **Pemrosesan Gambar**: Gambar yang dihasilkan secara otomatis diubah ukurannya (resize) dan dikompresi untuk mengoptimalkan ukuran file.
-   **Penanganan Halaman Kompleks**: Dilengkapi dengan mekanisme waktu tunggu untuk memastikan halaman yang memuat konten secara dinamis (JavaScript-heavy) dapat ditangkap dengan sempurna.
-   **Output Siap Pakai**: Respons API menyertakan header `Content-Disposition` sehingga browser akan otomatis mengunduh gambar dengan nama file yang sudah ditentukan.
-   **Manajemen Proses**: Menggunakan [PM2](https://pm2.keymetrics.io/) untuk menjaga agar server API tetap berjalan 24/7.

## Teknologi yang Digunakan

-   **Backend**: Node.js, Express.js
-   **Web Scraping/Browser Automation**: Puppeteer
-   **Image Processing**: Sharp
-   **Process Manager**: PM2
-   **Server**: Ubuntu (atau distro Linux berbasis Debian lainnya)

## Prasyarat

Sebelum memulai, pastikan server Anda sudah memiliki:
-   Sistem Operasi Ubuntu 20.04 atau lebih baru.
-   Node.js (v18.x atau lebih tinggi).
-   npm (biasanya terinstal bersama Node.js).
-   Git.

## Instalasi

1.  **Clone Repositori**
    Masuk ke server Anda melalui SSH dan clone repositori ini.
    ```bash
    git clone https://github.com/mferdix/Deploy-n8n-to-Docker-on-GCP-VM.git
    cd NAMA_REPO_ANDA
    ```

2.  **Instal Dependensi Proyek**
    Instal semua library Node.js yang dibutuhkan (Express, Puppeteer, Sharp).
    ```bash
    npm install
    ```

3.  **Instal Dependensi Sistem untuk Chromium**
    Puppeteer memerlukan browser Chromium dan beberapa library sistem agar dapat berjalan.
    ```bash
    sudo apt-get update
    sudo apt-get install -y chromium-browser
    ```

## Menjalankan Server

Disarankan untuk menggunakan PM2 agar server API berjalan secara persisten di latar belakang.

1.  **Instal PM2 secara Global**
    ```bash
    sudo npm install -g pm2
    ```

2.  **Jalankan Server dengan PM2**
    Dari dalam direktori proyek, jalankan perintah berikut:
    ```bash
    pm2 start server.js --name screenshot-api
    ```

3.  **Verifikasi Status**
    Pastikan server berjalan dengan status `online`.
    ```bash
    pm2 list
    ```

4.  **Simpan Proses agar Berjalan Otomatis saat Reboot**
    ```bash
    pm2 save
    pm2 startup
    ```
    PM2 akan memberikan satu perintah lagi untuk Anda salin dan jalankan.

## Penggunaan API

API ini memiliki satu endpoint untuk digunakan.

### GET /screenshot

Mengambil screenshot dari URL yang diberikan.

-   **URL Endpoint**: `http://<ALAMAT_IP_SERVER>:3000/screenshot`
-   **Method**: `GET`
-   **Query Parameters**:
    -   `url` (wajib): Alamat URL lengkap dari halaman yang ingin di-screenshot.

-   **Contoh Penggunaan**:
    ```
    [http://123.45.67.89:3000/screenshot?url=https://www.google.com](http://123.45.67.89:3000/screenshot?url=https://www.google.com)
    ```

-   **Respons Sukses**:
    -   **Kode Status**: `200 OK`
    -   **Headers**:
        -   `Content-Type: image/jpeg`
        -   `Content-Disposition: attachment; filename="screenshot-laporan.jpg"`
    -   **Body**: Data biner dari gambar screenshot.

-   **Respons Gagal**:
    -   **Kode Status**: `400 Bad Request` jika parameter `url` tidak disertakan.
    -   **Kode Status**: `500 Internal Server Error` jika terjadi kegagalan saat proses Puppeteer.

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
