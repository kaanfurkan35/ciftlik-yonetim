# Grafik Visualizasyonları + Data Export

## Context

Recharts v3.8.0, jspdf, jspdf-autotable ve xlsx kütüphaneleri kurulu ama hiçbiri kullanılmıyor. Tüm veriler HTML tabloları ve düz rakamlarla gösteriliyor. Raporlar sayfasında PDF/Excel butonları var ama "yakında" toastu gösteriyor. Bu plan, en yüksek etkili grafikleri ve export özelliğini ekliyor.

---

## 1. Dashboard Grafikleri (`src/app/(dashboard)/page.tsx`)

Dashboard'a 2 grafik ekle:

**a) Aylık Süt Üretimi — AreaChart**
- Son 6 ayın toplam süt üretimini göster
- X ekseni: ay isimleri (Türkçe), Y ekseni: litre
- API: Yeni endpoint gerekli değil — client-side `/api/milk` ile son 6 ayı çek ve grupla
- Veya dashboard server component'inde Prisma ile doğrudan hesapla

**b) Gelir/Gider Trendi — BarChart**
- Son 6 ayın gelir vs gider karşılaştırması
- API: `/api/finance/summary` zaten `monthlyTrend` döndürüyor (kullanıma hazır)
- İki renkli bar: yeşil (gelir), kırmızı (gider)

Her iki grafik de `"use client"` wrapper component olarak oluşturulacak (Recharts client-only).

## 2. Finans Sayfası Grafikleri (`src/app/(dashboard)/finans/page.tsx`)

**a) Kategori Dağılımı — PieChart**
- Gelir kategorileri (süt satışı, hayvan satışı, vb.) pasta grafik
- Gider kategorileri ayrı pasta grafik
- Veri: Zaten `summary.incomeByCategory` ve `summary.expenseByCategory` mevcut

**b) 6 Aylık Trend — LineChart**
- Mevcut HTML tablosunun yerine veya yanına
- Veri: `summary.monthlyTrend` zaten mevcut

## 3. Raporlar Sayfası Grafikleri (`src/app/(dashboard)/raporlar/page.tsx`)

**a) Sürü Durumu — PieChart**
- Hayvan status dağılımı (Aktif, Gebe, Laktasyon, Kuru, vb.)
- Veri: Raporlar sayfasında zaten `statusDistribution` hesaplanıyor

**b) Irk Dağılımı — BarChart**
- Horizontal bar chart, ırk başına hayvan sayısı
- Veri: `breedDistribution` zaten mevcut

**c) Aylık Süt Üretimi — AreaChart**
- Son 6 ay süt üretimi trendi
- Veri: `monthlyMilk` zaten hesaplanıyor

**d) Sağlık Uyum — BarChart**
- Aşı tipleri bazında yapılan/geciken sayılar

## 4. PDF/Excel Export (`src/app/(dashboard)/raporlar/export-buttons.tsx`)

**PDF Export:**
- `jspdf` + `jspdf-autotable` ile
- Aktif sekmeye göre tablo verilerini PDF'e dönüştür
- Çiftlik adı + tarih başlık

**Excel Export:**
- `xlsx` kütüphanesi ile
- Aktif sekmeye göre verileri .xlsx olarak indir

## 5. Yeni Chart Components

Oluşturulacak client component'ler:
```
src/components/charts/
  milk-production-chart.tsx    — AreaChart (süt üretimi)
  income-expense-chart.tsx     — BarChart (gelir/gider)
  category-pie-chart.tsx       — PieChart (kategori dağılımı)
  status-distribution-chart.tsx — PieChart (hayvan durumu)
  breed-distribution-chart.tsx  — BarChart (ırk dağılımı)
  monthly-trend-chart.tsx      — LineChart (aylık trend)
```

Her component:
- `"use client"` directive
- Recharts `ResponsiveContainer` wrapper
- Türkçe tooltip ve legend
- Tema uyumlu renkler (`var(--chart-1)` vb. CSS değişkenlerinden)
- Dark mode desteği

## Dosyalar

| Dosya | İşlem |
|-------|-------|
| `src/components/charts/*.tsx` | YENİ — 6 chart component |
| `src/app/(dashboard)/page.tsx` | DÜZENLE — 2 grafik ekle |
| `src/app/(dashboard)/finans/page.tsx` | DÜZENLE — 2 grafik ekle |
| `src/app/(dashboard)/raporlar/page.tsx` | DÜZENLE — 4 grafik ekle |
| `src/app/(dashboard)/raporlar/export-buttons.tsx` | DÜZENLE — PDF/Excel export |

## Doğrulama
- `npm run build` — hatasız
- `npm run test` — 253+ test geçmeli
- Dashboard'da 2 grafik görünmeli
- Finans'ta 2 grafik görünmeli
- Raporlar'da 4 grafik görünmeli
- PDF/Excel butonları dosya indirmeli
