# Test & Doğrulama

Projenin kalite kontrolünü sırasıyla çalıştır. Her adımın sonucunu raporla.

## Adımlar

1. **Prisma Şema Doğrulama**
   ```bash
   npx prisma validate
   ```

2. **TypeScript Tip Kontrolü**
   ```bash
   npx tsc --noEmit
   ```

3. **ESLint Kontrolü**
   ```bash
   npx eslint . --max-warnings=0
   ```

4. **Ortam Değişkeni Doğrulama**
   - `.env` dosyasının var olduğunu kontrol et
   - `DATABASE_URL`, `AUTH_SECRET` (min 32 karakter) tanımlı mı kontrol et
   - `AUTH_SECRET` placeholder ise ("change-this...") uyar

5. **Build Doğrulama**
   ```bash
   npx next build
   ```

## Raporlama

Her adım için sonucu bildir:
- ✅ BAŞARILI veya ❌ BAŞARISIZ
- Hata varsa ilk 3 hatayı göster ve düzeltme öner
- Tüm adımlar başarılıysa özet göster

## Hata Düzeltme

Eğer bir adımda hata varsa:
1. Hatayı analiz et
2. Düzeltmeyi öner veya uygula
3. O adımı tekrar çalıştır
4. Sonraki adıma geç

## Güvenlik Kontrolleri (Opsiyonel)

Eğer `--security` argümanı verilmişse ek kontroller:
- Tüm API route'larda `checkPermission()` çağrısı var mı?
- GET endpoint'lerinde `checkPermission(role, "read", ...)` var mı?
- Tüm mutation'larda `createAuditLog()` çağrısı var mı?
- `sortBy` alanları `z.enum()` ile whitelist mi?
- Hardcoded Tailwind renkleri yerine tema değişkenleri mi kullanılıyor?

$ARGUMENTS
