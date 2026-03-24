# API Route Üretici

Next.js App Router API route'ları oluştur.

## Oluşturulacak Dosyalar

1. `src/app/api/$RESOURCE/route.ts` - GET (liste) + POST (oluştur)
2. `src/app/api/$RESOURCE/[id]/route.ts` - GET (tekil) + PUT (güncelle) + DELETE (soft delete)

## Kurallar

### Genel
- Her route'da auth kontrolü: `auth()` ile oturum doğrula
- Rol bazlı yetkilendirme: `checkPermission(session, action, resource)`
- Request validasyonu: `src/lib/validations/` altındaki Zod şeması ile
- Hata yakalama: try/catch ile sarmalayıp standart hata dön

### Response Formatı
```typescript
type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};
```

### GET Liste
- Sayfalama: `?page=1&limit=20`
- Sıralama: `?sortBy=createdAt&sortOrder=desc`
- Arama: `?search=text` (metin alanlarında)
- Filtreleme: `?status=ACTIVE&breed=SIMENTAL`
- Soft delete filtresi: `where: { deletedAt: null }`
- `farmId` filtresi: session'dan al

### POST Oluştur
- Zod ile body doğrula
- `createdById` ve `farmId` session'dan ekle
- Oluşturulan kaydı dön

### GET Tekil
- `id` ve `farmId` ile bul
- İlişkili verileri `include` ile çek
- 404 kontrolü

### PUT Güncelle
- Zod ile body doğrula (partial)
- Sadece değişen alanları güncelle
- Güncellenen kaydı dön

### DELETE
- Soft delete: `deletedAt: new Date()`
- Kalıcı silme YAPMA

### Şablon
```typescript
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { $SchemaName } from "@/lib/validations/$resource";
import { apiResponse, apiError } from "@/lib/api-response";

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return apiError("Yetkisiz erişim", 401);
    // ... implementasyon
  } catch (error) {
    return apiError("Sunucu hatası", 500);
  }
}
```

## Kullanım
Kaynak adı ve Prisma model adını iste, izin verilen rolleri belirle.

$ARGUMENTS
