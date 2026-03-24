# Prisma Model Üretici

Yeni bir Prisma modeli oluştur. Kullanıcının verdiği bilgilere göre `prisma/schema.prisma` dosyasına model ekle.

## Kurallar

1. Her modelde şu alanlar ZORUNLU:
   - `id` String @id @default(uuid())
   - `createdAt` DateTime @default(now())
   - `updatedAt` DateTime @updatedAt
   - `deletedAt` DateTime? (soft delete)
   - `createdById` String (User'a FK)

2. Tüm ilişkiler `onDelete: Cascade` veya `onDelete: SetNull` olmalı (mantığa göre)

3. Index'ler: Sık sorgulanan alanlar + `farmId` + `deletedAt` kombine index

4. Enum'lar dosyanın üstünde tanımlanmalı

5. Her alan için Türkçe yorum ekle: `/// Kulak numarası`

6. Model oluşturduktan sonra:
   - `src/lib/validations/` altına Zod validasyon şeması oluştur
   - `src/types/` altına TypeScript tip dosyası oluştur
   - `npx prisma format` çalıştır
   - Kullanıcıya `npx prisma migrate dev --name <migration_name>` komutunu öner

## Şablon

```prisma
model $MODEL_NAME {
  id          String    @id @default(uuid())
  // ... kullanıcının istediği alanlar
  farmId      String
  farm        Farm      @relation(fields: [farmId], references: [id])
  createdById String
  createdBy   User      @relation(fields: [createdById], references: [id])
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  deletedAt   DateTime?

  @@index([farmId, deletedAt])
}
```

## Kullanım
Kullanıcıdan model adını ve alanları iste, ardından yukarıdaki kurallara uygun şekilde üret.

$ARGUMENTS
