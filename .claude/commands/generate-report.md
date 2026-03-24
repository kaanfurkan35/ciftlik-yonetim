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
   - `auth()` + `checkPermission(session.user.role, "read", resource)` — GET dahil
   - Tarih aralığı filtresi: `?from=2024-01-01&to=2024-12-31`
   - Tarih parametreleri doğrula: `isNaN(new Date(str).getTime())` kontrolü
   - Gruplama: `?groupBy=month|week|day`
   - Prisma aggregation kullan (`groupBy`, `_sum`, `_avg`, `_count`)
   - Tenant izolasyonu: `farmId: session.user.farmId`
   - Hata yakalama: 403 permission hatası + 500 genel hata

3. **Renk Paleti (tema uyumlu — CSS değişkenleri kullan):**
   - chart-1: Çayır yeşili (primary)
   - chart-2: Orman yeşili (koyu)
   - chart-3: Altın sarısı/buğday (accent)
   - chart-4: Ahır kırmızısı (destructive)
   - chart-5: Gökyüzü mavisi
   - Hardcoded `hsl(...)` değerleri KULLANMA, `var(--chart-1)` vb. kullan

4. **Sayı/Tarih Formatları:**
   - `src/lib/format.ts` fonksiyonlarını kullan:
     - `formatCurrency(amount)` — Türk Lirası formatı
     - `formatDate(date)` — "24 Mart 2026"
     - `formatShortDate(date)` — "24.03.2026"
     - `formatNumber(n)` — Türkçe sayı formatı
     - `formatPercentage(value)` — "%12,5"
   - Tooltip'lerde ve etiketlerde bu fonksiyonları kullan

5. **StatCard:**
   ```tsx
   <StatCard
     title="Toplam Hayvan"
     value={formatNumber(245)}
     change={5}
     changeType="increase"
     icon={<Beef className="size-5" />}
   />
   ```
   - Artış: `text-success` (tema rengi), azalış: `text-destructive`
   - Hardcoded yeşil/kırmızı renk KULLANMA

## Kullanım
Rapor adı, veri kaynağı (hangi tablo/model), grafik tipi ve hesaplama mantığını iste.

$ARGUMENTS
