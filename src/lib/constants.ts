export const APP_NAME = "Çiftlik Yönetim";

export const ANIMAL_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Aktif",
  SOLD: "Satılmış",
  DECEASED: "Vefat",
  DRY: "Kuru",
  LACTATING: "Sağmal",
  PREGNANT: "Gebe",
  CALF: "Buzağı",
};

export const ANIMAL_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  SOLD: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  DECEASED: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  DRY: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  LACTATING: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  PREGNANT: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  CALF: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

export const ANIMAL_SEX_LABELS: Record<string, string> = {
  MALE: "Erkek",
  FEMALE: "Dişi",
};

export const USER_ROLE_LABELS: Record<string, string> = {
  ADMIN: "Yönetici",
  MANAGER: "Müdür",
  WORKER: "Çalışan",
  VIEWER: "İzleyici",
};

export const HEALTH_RECORD_TYPE_LABELS: Record<string, string> = {
  VET_VISIT: "Veteriner Ziyareti",
  TREATMENT: "Tedavi",
  SURGERY: "Ameliyat",
  DEWORMING: "Parazit Tedavisi",
  CHECKUP: "Kontrol",
  OTHER: "Diğer",
};

export const HEAT_INTENSITY_LABELS: Record<string, string> = {
  WEAK: "Zayıf",
  MODERATE: "Orta",
  STRONG: "Güçlü",
};

export const INSEMINATION_TYPE_LABELS: Record<string, string> = {
  ARTIFICIAL: "Yapay Tohumlama",
  NATURAL: "Doğal",
};

export const PREGNANCY_RESULT_LABELS: Record<string, string> = {
  POSITIVE: "Pozitif",
  NEGATIVE: "Negatif",
  INCONCLUSIVE: "Belirsiz",
};

export const MILK_SESSION_LABELS: Record<string, string> = {
  MORNING: "Sabah",
  EVENING: "Akşam",
  TOTAL: "Toplam",
};

export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  INCOME: "Gelir",
  EXPENSE: "Gider",
};

export const TRANSACTION_CATEGORY_LABELS: Record<string, string> = {
  MILK_SALE: "Süt Satışı",
  ANIMAL_SALE: "Hayvan Satışı",
  SUBSIDY: "Hibe/Destek",
  FEED: "Yem",
  VETERINARY: "Veteriner",
  MEDICATION: "İlaç",
  EQUIPMENT: "Ekipman",
  LABOR: "İşçilik",
  FUEL: "Yakıt",
  UTILITIES: "Faturalar",
  OTHER: "Diğer",
};

export const TASK_STATUS_LABELS: Record<string, string> = {
  PENDING: "Bekliyor",
  IN_PROGRESS: "Devam Ediyor",
  COMPLETED: "Tamamlandı",
  CANCELLED: "İptal",
};

export const TASK_PRIORITY_LABELS: Record<string, string> = {
  LOW: "Düşük",
  MEDIUM: "Orta",
  HIGH: "Yüksek",
  URGENT: "Acil",
};

export const PASTURE_CONDITION_LABELS: Record<string, string> = {
  EXCELLENT: "Mükemmel",
  GOOD: "İyi",
  FAIR: "Orta",
  POOR: "Kötü",
};

export const GROUP_TYPE_LABELS: Record<string, string> = {
  HERD: "Sürü",
  PEN: "Padok",
  PASTURE_GROUP: "Mera Grubu",
};

export const FEED_UNIT_LABELS: Record<string, string> = {
  KG: "Kg",
  TON: "Ton",
  LITRE: "Litre",
  BALYA: "Balya",
  CUVAL: "Çuval",
};

export const GESTATION_DAYS = 283;
