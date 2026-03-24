# API Route Üretici

Next.js 16 App Router API route'ları oluştur.

## Oluşturulacak Dosyalar

1. `src/app/api/$RESOURCE/route.ts` - GET (liste) + POST (oluştur)
2. `src/app/api/$RESOURCE/[id]/route.ts` - GET (tekil) + PUT (güncelle) + DELETE (soft delete)

## Kurallar

### İmportlar
```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";
import { $schemaName } from "@/lib/validations/$resource";
```

### Her Route'un Akışı
1. `auth()` — oturum doğrula
2. `checkPermission(session.user.role, action, resource)` — GET dahil tüm endpoint'lerde
3. Zod validasyonu — request body veya query params
4. Tenant izolasyonu — tüm sorgular `farmId: session.user.farmId` ile filtreli
5. Prisma işlemi
6. `apiSuccess()` / `apiError()` ile yanıt

### Response Formatı
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: { page: number; limit: number; total: number; totalPages: number };
};
```

### GET Liste
- Sayfalama: `?page=1&limit=20` (max 100)
- Sıralama: `?sortBy=createdAt&sortOrder=desc`
- Arama: `?search=text`
- Filtreleme: `?status=ACTIVE&breed=SIMENTAL`
- `sortBy` alanı Zod'da `z.enum([...])` ile whitelist olmalı
- Soft delete filtresi: `deletedAt: null`

### POST Oluştur
- Zod ile body doğrula
- `createdById` ve `farmId` session'dan ekle
- Birden fazla DB işlemi varsa `prisma.$transaction()` kullan
- Başarı sonrası `createAuditLog({ action: "CREATE", ... })` çağır (fire-and-forget)

### PUT Güncelle
- `.partial()` schema ile body doğrula
- Kaydın var olduğunu ve `farmId` eşleştiğini kontrol et
- Başarı sonrası `createAuditLog({ action: "UPDATE", ... })` çağır

### DELETE
- Soft delete: `deletedAt: new Date()`
- Kalıcı silme YAPMA
- Başarı sonrası `createAuditLog({ action: "DELETE", ... })` çağır

### Hata Yakalama
```typescript
} catch (error) {
  if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
    return apiError(error.message, 403);
  }
  console.error("...", error);
  return apiError("...", 500);
}
```

### params Tipi (Next.js 16)
```typescript
{ params }: { params: Promise<{ id: string }> }
// Kullanım: const { id } = await params;
```

### Şablon
```typescript
import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import { createAuditLog } from "@/lib/audit";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Oturum açmanız gerekiyor", 401);

    checkPermission(session.user.role, "read", "$RESOURCE");

    // ... implementasyon
    return apiSuccess(data);
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("...", error);
    return apiError("...", 500);
  }
}
```

## Kullanım
Kaynak adı ve Prisma model adını iste, izin verilen rolleri belirle.

$ARGUMENTS
