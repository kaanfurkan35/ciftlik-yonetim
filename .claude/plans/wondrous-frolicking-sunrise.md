# Kalan İşler — Çiftlik Yönetim

## Context

Faz A (ayarlar sayfası + yedek UI), Faz B (eksik API endpoint'leri), ve Faz C (37 route'a audit log) tamamlandı ama henüz commit edilmedi (47 dosya değişiklik). Kalan işler: düzenleme/silme UI, loading skeleton'ları, ve detay sayfaları.

## Tamamlanan (commit bekliyor)
- [x] Ayarlar: çiftlik profili, manuel yedek, yedek geçmişi
- [x] API: `/api/feeding/records/[id]`, `/api/users/[id]`
- [x] 37 API route'a audit log eklendi
- [x] Test düzeltmeleri (8 dosyaya audit mock)

## Kalan — Faz D: Düzenleme/Silme UI

Her modülün liste sayfasındaki tablolara inline düzenleme/silme butonları eklenmeli. Pattern: `AnimalListClient` componentindeki dropdown menu (Detay/Düzenle/Sil) + `ConfirmDialog` kullanımı.

**Yaklaşım:** Ayrı edit sayfaları oluşturmak yerine, liste sayfalarına satır bazlı dropdown menü (MoreHorizontal icon) + silme onay dialogu ekle. Düzenleme için modal veya inline form kullanılabilir.

### Modüller:
1. **Sağlık** (`src/app/(dashboard)/saglik/page.tsx`) — Sağlık ve aşı kayıtlarına sil butonu
2. **Süt** (`src/app/(dashboard)/sut/page.tsx`) — Süt ve satış kayıtlarına sil butonu
3. **Üreme** (`src/app/(dashboard)/ureme/page.tsx`) — 4 sekmedeki kayıtlara sil butonu
4. **Besleme** (`src/app/(dashboard)/besleme/page.tsx`) — 3 sekmedeki kayıtlara sil butonu
5. **Meralar** (`src/app/(dashboard)/meralar/page.tsx`) — Mera kayıtlarına sil butonu
6. **Kullanıcılar** (`src/app/(dashboard)/kullanicilar/page.tsx`) — Kullanıcı düzenle/sil

### Her modül için:
- Sayfayı client component'e çevir (delete fetch için)
- Satır sonuna dropdown menü ekle (MoreHorizontal → Sil)
- `ConfirmDialog` ile silme onayı
- `fetch(url, { method: 'DELETE' })` + `router.refresh()` + toast

## Kalan — Faz E: Loading Skeleton'ları

5 eksik `loading.tsx` dosyası:
- `src/app/(dashboard)/loading.tsx` (dashboard)
- `src/app/(dashboard)/ayarlar/loading.tsx`
- `src/app/(dashboard)/bildirimler/loading.tsx`
- `src/app/(dashboard)/hayvanlar/[id]/loading.tsx`
- `src/app/(dashboard)/kullanicilar/loading.tsx`

Pattern: Mevcut `src/app/(dashboard)/hayvanlar/loading.tsx` dosyasını referans al — Skeleton component kullan.

## Doğrulama
1. `npm run build` — hatasız
2. `npm run test` — 253+ test geçmeli
3. Her sayfada silme işlemi test et (toast + refresh)
