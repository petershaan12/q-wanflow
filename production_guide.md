# Production Deployment Guide 🚀

Langkah-langkah untuk publish Q-WANFLOW menggunakan database yang sudah ada.

## 1. Persiapan Database
Jalankan perintah ini di server untuk membuat database baru di dalam container PostgreSQL yang sudah ada (sesuaikan nama container db Anda):
```bash
docker exec -it YOUR_DB_CONTAINER psql -U YOUR_USER -c "CREATE DATABASE qwen_workflow_db;"
```

## 2. Setup Environment Variables
Buat file `.env` di root folder project:

```env
# Database URL
DATABASE_URL=postgresql://user:password@host.docker.internal:5432/qwen_workflow_db

# Security
SECRET_KEY=isi_dengan_random_string_panjang

# Server URL (Gunakan IP Publik atau Domain Server Anda)
BASE_URL=http://your-server-ip:8010

# SMTP Configuration (GMAIL)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=
SMTP_SECURE=
SMTP_USER=
SMTP_PASS=
SUPPORT_EMAIL=
```

## 3. Jalankan Aplikasi
```bash
# Jalankan aplikasi (Build dan jalankan menggunakan Docker Compose)
docker-compose up --build -d

# 1. Buat tabel dasar (WAJIB sekali saja)
docker-compose exec backend python scripts/init_db.py

# 2. Jalankan migrasi kolom tambahan
docker-compose exec backend python scripts/add_auth_columns.py
docker-compose exec backend python scripts/add_storage_column.py
```

## 4. Monitoring & Info
- **Frontend**: Akses via `http://your-server-ip:8080` (Port 8080)
- **Backend/API**: Akses via `http://your-server-ip:8010` (Port 8010)
- **Volume**: Upload file tersimpan aman di folder `./backend/static` di server Anda.

Jika ada konflik port, Anda sudah menggunakan **8080** untuk frontend dan **8010** untuk backend agar aman dari port 80 dan 8000 yang biasanya sudah terpakai.
