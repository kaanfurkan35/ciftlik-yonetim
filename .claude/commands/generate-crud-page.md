# CRUD Sayfa Üretici

Belirtilen kaynak (resource) için tam CRUD sayfa seti oluştur.

## Oluşturulacak Dosyalar

1. `src/app/(dashboard)/$ROUTE/page.tsx` - Liste sayfası (DataTable ile)
2. `src/app/(dashboard)/$ROUTE/[id]/page.tsx` - Detay sayfası
3. `src/app/(dashboard)/$ROUTE/new/page.tsx` - Oluşturma formu
4. `src/app/(dashboard)/$ROUTE/[id]/edit/page.tsx` - Düzenleme formu
5. `src/app/(dashboard)/$ROUTE/loading.tsx` - Yükleniyor state'i
6. `src/app/(dashboard)/$ROUTE/error.tsx` - Hata state'i

## Kurallar

1. **Liste sayfası:**
   - shadcn/ui DataTable kullan
   - Sütunlar: ana alanlar + durum badge + aksiyonlar (düzenle, sil)
   - Arama, filtreleme, sıralama, sayfalama
   - "Yeni Ekle" butonu sağ üstte
   - Boş state: `EmptyState` bileşeni kullan
   - Server component olarak yaz, client alt bileşenler ile

2. **Detay sayfası:**
   - Kart tabanlı layout
   - İlişkili veriler tab veya bölümler ile
   - Düzenle/Sil butonları sağ üstte
   - Zaman çizelgesi varsa göster

3. **Form sayfaları:**
   - `react-hook-form` + Zod validasyon kullan
   - shadcn/ui Form bileşenleri
   - Kaydetme, iptal butonları
   - Loading state formda
   - Başarılı kayıt sonrası toast göster ve listeye yönlendir

4. **Ortak:**
   - `PageHeader` bileşeni ile başlık + breadcrumb
   - Türkçe label'lar (hardcode etme, messages/tr.json'dan çek)
   - Responsive: mobilde kart, masaüstünde tablo
   - TanStack Query ile veri çekme (hooks/ altındaki hook'u kullan)
   - Silme işleminde `ConfirmDialog` göster

## Kullanım
Kaynak adı (örn: hayvanlar), Türkçe adı, ve alan bilgilerini iste.

$ARGUMENTS
