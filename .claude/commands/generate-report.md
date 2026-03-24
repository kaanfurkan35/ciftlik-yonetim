# Rapor/Dashboard Widget Üretici

Analitik bileşenleri ve rapor sayfaları oluştur.

## Oluşturulacak Dosyalar

1. `src/components/charts/$REPORT_NAME-chart.tsx` - Grafik bileşeni
2. `src/app/api/reports/$REPORT_NAME/route.ts` - Veri API endpoint'i
3. Opsiyonel: `src/app/(dashboard)/raporlar/$REPORT_NAME/page.tsx` - Tam sayfa rapor

## Grafik Tipleri

- **bar** - Karşılaştırma (aylık gelir/gider, ırk bazlı dağılım)
- **line** - Trend (süt üretimi trendi, ağırlık değişimi)
- **pie** - Dağılım (hayvan durumu, gider kategorileri)
- **area** - Kümülatif trend (toplam gelir akışı)
- **stat-card** - Tek metrik kartı (toplam hayvan, günlük süt, aylık kar)

## Kurallar

1. **Grafik bileşeni:**
   - Recharts kullan
   - `"use client"` direktifi
   - shadcn/ui `Card` ile sarmalanmış
   - Responsive (`ResponsiveContainer`)
   - Türkçe etiketler ve tooltip
   - Yükleniyor skeleton'ı
   - Veri yoksa EmptyState

2. **API endpoint:**
   - Tarih aralığı filtresi: `?from=2024-01-01&to=2024-12-31`
   - Gruplama: `?groupBy=month|week|day`
   - Prisma aggregation kullan (`groupBy`, `_sum`, `_avg`, `_count`)
   - Cache-Control header ekle

3. **Stat Card:**
   ```tsx
   <StatCard
     title="Toplam Hayvan"
     value={245}
     change={+5}
     changeType="increase"
     icon={<Cow />}
   />
   ```

4. **Renk Paleti (grafikler):**
   - Yeşil tonları: `hsl(142, 60%, 35%)` ile `hsl(142, 40%, 55%)`
   - Amber: `hsl(38, 90%, 50%)`
   - Kırmızı: `hsl(0, 70%, 50%)`
   - Mavi: `hsl(210, 60%, 50%)`

## Kullanım
Rapor adı, veri kaynağı (hangi tablo/model), grafik tipi ve hesaplama mantığını iste.

$ARGUMENTS
