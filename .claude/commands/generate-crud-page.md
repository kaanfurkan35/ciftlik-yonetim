# CRUD Sayfa Üretici

Belirtilen kaynak (resource) için tam CRUD sayfa seti oluştur.

## Oluşturulacak Dosyalar

1. `src/app/(dashboard)/$ROUTE/page.tsx` - Liste sayfası (DataTable ile)
2. `src/app/(dashboard)/$ROUTE/[id]/page.tsx` - Detay sayfası
3. `src/app/(dashboard)/$ROUTE/new/page.tsx` - Oluşturma formu
4. `src/app/(dashboard)/$ROUTE/[id]/edit/page.tsx` - Düzenleme formu
5. `src/app/(dashboard)/$ROUTE/loading.tsx` - Skeleton yükleniyor state'i

## Kurallar

1. **Liste sayfası (server component):**
   - `auth()` ile oturum doğrula, yoksa `/login`'e yönlendir
   - Prisma ile veri çek, Date alanlarını `.toISOString()` ile serileştir
   - Client bileşenine (`*-client.tsx`) veri aktar
   - DataTable: arama, sıralama, sayfalama
   - "Yeni Ekle" butonu: `<Button render={<Link href="/$ROUTE/new" />}>`
   - Boş state: `EmptyState` bileşeni kullan
   - `render` prop kullanıldığında Button otomatik olarak `nativeButton={false}` ayarlar

2. **Detay sayfası (server component):**
   - `params: Promise<{ id: string }>` — `const { id } = await params;`
   - Kart tabanlı layout, ilişkili veriler tab veya bölümler ile
   - Düzenle/Sil butonları sağ üstte
   - Tarih/para formatları: `src/lib/format.ts` fonksiyonlarını kullan
     - `formatDate()`, `formatCurrency()`, `formatNumber()`, `formatWeight()`

3. **Form sayfaları (client component — "use client"):**
   - `react-hook-form` + `@hookform/resolvers` + Zod validasyon
   - shadcn/ui Form bileşenleri (Input, Select, Textarea, Calendar)
   - Kaydetme butonu loading state'i: `isSubmitting` ile disabled
   - Başarılı kayıt sonrası `toast.success()` (Sonner) ve `router.push("/$ROUTE")`
   - İptal butonu: `router.back()`
   - Hata durumunda `toast.error()`
   - Form hata mesajları `FormFieldError` bileşeni ile (`role="alert"`)

4. **Ortak:**
   - `PageHeader` bileşeni ile başlık ve açıklama
   - Türkçe label'lar — `src/lib/constants.ts`'den çek
   - Responsive: mobilde kart grid, masaüstünde tablo
   - Silme işleminde `ConfirmDialog` göster
   - Durum badge renkleri: `src/lib/constants.ts`'deki tema uyumlu renkler (hardcoded Tailwind rengi KULLANMA)
   - Tarih gösterimi: `src/lib/format.ts` fonksiyonlarını kullan

5. **Loading sayfası:**
   - Skeleton bileşenleri ile sayfa yapısını taklit et
   - Gerçek sayfanın layout'unu yansıt

## Kullanım
Kaynak adı (örn: hayvanlar), Türkçe adı, ve alan bilgilerini iste.

$ARGUMENTS
