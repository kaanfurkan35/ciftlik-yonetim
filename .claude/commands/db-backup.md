# Veritabanı Yedekleme/Geri Yükleme

Veritabanı yedekleme ve geri yükleme işlemlerini yönet.

## Komutlar

Argüman olarak şu aksiyonlardan birini al: `backup`, `restore`, `export-json`, `seed`, `api-backup`, `api-restore`

### backup
PostgreSQL veritabanının tam yedeğini al:
```bash
pg_dump $DATABASE_URL --format=custom --file=backups/backup_$(date +%Y%m%d_%H%M%S).dump
```
- `backups/` klasörünün var olduğundan emin ol
- Dosya adını ve boyutunu bildir
- Son 10 yedeği listele

### restore
Mevcut yedeklerden geri yükleme yap:
1. `backups/` klasöründeki yedekleri listele
2. Kullanıcıdan hangisini geri yükleyeceğini sor
3. **UYARI:** Mevcut veriler silinecek, onay iste
4. Geri yükle:
```bash
pg_restore --clean --if-exists -d $DATABASE_URL backups/<seçilen_dosya>
```

### export-json
Prisma ile tüm verileri JSON olarak dışa aktar:
- Her tablo için ayrı JSON dosyası: `backups/json_export_<tarih>/<tablo>.json`
- Taşınabilir format, başka ortama aktarılabilir

### seed
Test verileri ile veritabanını doldur:
```bash
npx prisma db seed
```
- `prisma/seed.ts` dosyasını çalıştırır
- Oluşturulan kayıt sayılarını bildir
- **UYARI:** Seed verileri test/varsayılan şifreler içerir, production'da kullanmayın

### api-backup
Uygulama API'si üzerinden JSON yedekleme oluştur:
- `POST /api/backup` endpoint'ini kullan
- Sonuç: JSON dosyası olarak indirilir
- Avantaj: Prisma serileştirmesi ile tutarlı format

### api-restore
Uygulama API'si üzerinden JSON yedekten geri yükle:
- `POST /api/backup/restore` endpoint'ini kullan
- `?dryRun=true` ile önce doğrulama yap
- Doğrulama başarılıysa gerçek geri yükleme çalıştır
- **UYARI:** Mevcut veriler silinecek

## Güvenlik
- `.env` dosyasından `DATABASE_URL` kullan
- Yedek dosyalarını `.gitignore`'a ekle
- Geri yükleme öncesi MUTLAKA onay al
- API endpoint'leri sadece ADMIN rolü ile erişilebilir

$ARGUMENTS
