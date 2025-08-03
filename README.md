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
