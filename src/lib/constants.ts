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
  ACTIVE: "bg-success/10 text-success dark:bg-success/20",
  SOLD: "bg-secondary text-secondary-foreground",
  DECEASED: "bg-destructive/10 text-destructive",
  DRY: "bg-muted text-muted-foreground",
  LACTATING: "bg-primary/10 text-primary",
  PREGNANT: "bg-accent/20 text-accent-foreground",
  CALF: "bg-secondary text-secondary-foreground",
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
