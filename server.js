const express = require('express');
const puppeteer = require('puppeteer');
const sharp = require('sharp'); // Impor library sharp

const app = express();
const port = 3000;

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

    // Tunggu jeda tambahan jika diperlukan
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Ambil screenshot dalam format buffer
    const imageBuffer = await page.screenshot({ type: 'jpeg' });
    await browser.close();

    // --- PROSES RESIZE DAN KOMPRESI DIMULAI DI SINI ---
    const resizedImageBuffer = await sharp(imageBuffer)
      .resize({ width: 800 }) // Ubah lebar gambar menjadi 800px (tinggi akan menyesuaikan)
      .jpeg({ quality: 70 }) // Kompres kualitas JPEG menjadi 70%
      .toBuffer();
    // --- PROSES RESIZE SELESAI ---

    // Atur header dan kirim gambar yang sudah di-resize
    res.set('Content-Type', 'image/jpeg');
    res.set('Content-Disposition', 'attachment; filename="screenshot-laporan.jpg"');
    res.send(resizedImageBuffer); // Kirim buffer gambar yang baru

  } catch (error) {
    console.error('Gagal mengambil screenshot:', error);
    res.status(500).send(`Gagal mengambil screenshot: ${error.message}`);
  }
});

app.listen(port, () => {
  console.log(`Server API Screenshot berjalan di http://localhost:${port}`);
});
