import { auth } from "@/lib/auth";
import { apiSuccess, apiError } from "@/lib/api-response";
import { checkPermission } from "@/lib/permissions";
import {
  checkVaccinationDueAlerts,
  checkFeedStockAlerts,
  checkCalvingAlerts,
} from "@/lib/notifications";

// ============================================================================
// POST /api/notifications/check - Tüm bildirim kontrollerini çalıştır
// ============================================================================

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user) {
      return apiError("Oturum açmanız gerekiyor", 401);
    }

    checkPermission(session.user.role, "manage", "notifications");

    const farmId = session.user.farmId;

    await Promise.all([
      checkVaccinationDueAlerts(farmId),
      checkFeedStockAlerts(farmId),
      checkCalvingAlerts(farmId),
    ]);

    return apiSuccess({ message: "Bildirim kontrolleri başarıyla tamamlandı" });
  } catch (error) {
    if (error instanceof Error && error.message === "Bu işlem için yetkiniz bulunmuyor") {
      return apiError(error.message, 403);
    }
    console.error("Bildirim kontrolü hatası:", error);
    return apiError("Bildirim kontrolleri sırasında bir hata oluştu", 500);
  }
}
