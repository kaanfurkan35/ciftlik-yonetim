# Production Readiness — Çiftliğe Teslim Öncesi

## Context

Proje çiftliğe teslim edilecek. Mimari sağlam (RBAC, multi-tenancy, audit, soft delete) ama 3 BLOCKER + birkaç HIGH seviye sorun var. Tek sunucu deployment (çiftlik ortamı) için in-memory rate limiter kabul edilebilir ama diğer sorunlar düzeltilmeli.

---

## BLOCKER — Mutlaka Düzeltilmeli

### 1. `.env` dosyası git'ten çıkarılmalı
- `.env` committed durumda (DATABASE_URL + AUTH_SECRET açıkta)
- `git rm --cached .env` ile izlemeden çıkar
- `.env.example` oluştur (sadece placeholder değerler)
- AUTH_SECRET placeholder'ı gerçek bir secret'a çevrilmeli

### 2. CSP başlıkları sıkılaştırılmalı
**Dosya:** `next.config.ts`
- `'unsafe-eval'` kaldır (Next.js dev'de gerekli, prod'da değil)
- `'unsafe-inline'` kaldır — Tailwind v4 external CSS kullanıyor, inline gerekmiyor
- Veya en azından: `process.env.NODE_ENV === 'production'` kontrolü ile sıkılaştır

### 3. Rate limiter — Tek sunucu için kabul edilebilir
- Çiftlik tek sunucu kullanacaksa in-memory yeterli
- Yorum olarak "çoklu sunucu için Redis gerekir" notu zaten var
- **BLOCKER DEĞİL** tek sunucu deployment için → atlayabiliriz

---

## HIGH — Teslim öncesi düzeltilmeli

### 4. Hayvanlar sayfası `?status=` query param desteği
**Dosya:** `src/app/(dashboard)/hayvanlar/page.tsx`
- Dashboard'dan "Sağmal İnek" tıklayınca `?status=LACTATING` gidiyor ama sayfa bunu filtrelemiyor
- `searchParams` prop'u alınıp Prisma sorgusuna eklenmeli

### 5. Error page'lerde hata loglama
**Dosyalar:** `src/app/error.tsx`, `src/app/(dashboard)/error.tsx`
- `console.error(error)` ekle
- Kullanıcıya "Bir hata oluştu" mesajı göster (zaten var)

### 6. Health check endpoint
- `src/app/api/health-check/route.ts` oluştur
- DB bağlantısını test et, 200 OK döndür
- Load balancer / monitoring için gerekli

### 7. Standalone output modu
**Dosya:** `next.config.ts`
- `output: 'standalone'` ekle — Docker/VPS deployment için daha küçük image

### 8. Seed script güvenliği
**Dosya:** `prisma/seed.ts`
- Şifreleri console.log ile yazdırma (production loglarına sızar)
- Veya `NODE_ENV !== 'production'` kontrolü ekle

---

## MEDIUM — İyi olur ama engellemez

### 9. `.env.example` oluştur
```
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
AUTH_SECRET=change-this-to-a-random-secret-at-least-32-characters
NEXTAUTH_URL=http://localhost:3000
```

### 10. Structured logging notu
- Şu an `console.error` kullanılıyor — tek sunucu için yeterli
- Gelecekte Sentry/pino eklenebilir

---

## Dosyalar

| Dosya | İşlem |
|-------|-------|
| `.env` | `git rm --cached` ile izlemeden çıkar |
| `.env.example` | YENİ — placeholder değerlerle oluştur |
| `next.config.ts` | CSP sıkılaştır + `output: 'standalone'` |
| `src/app/(dashboard)/hayvanlar/page.tsx` | `searchParams` ile status filtresi |
| `src/app/error.tsx` | `console.error(error)` ekle |
| `src/app/(dashboard)/error.tsx` | `console.error(error)` ekle |
| `src/app/api/health-check/route.ts` | YENİ — health check endpoint |
| `prisma/seed.ts` | Console.log'da şifreleri kaldır |

## Doğrulama
1. `npm run build` — hatasız
2. `npm run test` — 253+ test geçmeli
3. `.env` artık git'te görünmemeli (`git status` kontrolü)
4. `curl http://localhost:3000/api/health-check` — 200 OK
5. `/hayvanlar?status=LACTATING` — sadece sağmal inekleri göstermeli
