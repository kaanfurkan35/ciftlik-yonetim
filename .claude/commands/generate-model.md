# Prisma Model Üretici

Yeni bir Prisma modeli oluştur. `prisma/schema.prisma` dosyasına model ekle ve ilgili dosyaları üret.

## Kurallar

1. **Zorunlu alanlar:**
   - `id String @id @default(uuid())`
   - `createdAt DateTime @default(now())`
   - `updatedAt DateTime @updatedAt`
   - `deletedAt DateTime?` (soft delete)
   - `createdById String` + User ilişkisi
   - `farmId String` + Farm ilişkisi (veya parent model üzerinden)

2. **İlişki kuralları:**
   - Zorunlu child kayıtlar: `onDelete: Cascade` (silinen parent ile birlikte silinir)
   - Opsiyonel referanslar: `onDelete: SetNull` (parent silinince null olur)
   - Kritik parent'lar: `onDelete: Restrict` (child varken silinmeyi engelle)

3. **Index'ler:**
   - `@@index([farmId, deletedAt])` — standart tenant + soft delete filtresi
   - Sık sorgulanan alanlar için ek index (date, status, parentId vb.)

4. **Enum'lar:**
   - Dosyanın üstünde tanımla
   - Türkçe yorum ekle: `/// Hayvan durumu`

5. **Her alan için Türkçe yorum:** `/// Kulak numarası`

6. **Decimal alanlar:** Mali ve ölçüm alanları için `@db.Decimal(10, 2)` kullan

## Model Oluşturduktan Sonra

1. **Zod validasyon şeması** — `src/lib/validations/$model.ts`:
   - Create schema (tüm zorunlu alanlar)
   - Update schema (`.partial()`)
   - Filter schema (sayfalama + sıralama + filtre alanları)
   - `sortBy` alanı `z.enum([...])` ile whitelist olmalı

2. **Prisma formatla:** `npx prisma format`

3. **Migrasyon komutu öner:** `npx prisma migrate dev --name add-$model`

4. **Prisma client yenile:** `npx prisma generate`

## Şablon

```prisma
/// $MODEL_DESCRIPTION_TR
model $MODEL_NAME {
  id          String    @id @default(uuid())
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  /// ... kullanıcının istediği alanlar

  farmId      String
  farm        Farm      @relation(fields: [farmId], references: [id], onDelete: Restrict)
  createdById String
  createdBy   User      @relation("$MODEL_NAMECreatedBy", fields: [createdById], references: [id])

  @@index([farmId, deletedAt])
}
```

## Kullanım
Model adını ve alanları iste, ardından yukarıdaki kurallara uygun şekilde üret.

$ARGUMENTS
