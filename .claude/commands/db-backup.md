# Veritabanı Yedekleme/Geri Yükleme

Veritabanı yedekleme ve geri yükleme işlemlerini yönet.

## Komutlar

Argüman olarak şu aksiyonlardan birini al: `backup`, `restore`, `export-json`, `seed`

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
- Dosya boyutlarını listele

### seed
Test verileri ile veritabanını doldur:
```bash
npx prisma db seed
```
- `prisma/seed.ts` dosyasını çalıştırır
- Oluşturulan kayıt sayılarını bildir

## Güvenlik
- `.env` dosyasından `DATABASE_URL` kullan
- Yedek dosyalarını `.gitignore`'a ekle
- Geri yükleme öncesi MUTLAKA onay al

$ARGUMENTS
