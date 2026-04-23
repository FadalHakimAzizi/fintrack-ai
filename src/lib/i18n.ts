export type Locale = "id" | "en" | "es" | "fr" | "ar";
export type ThemeName = "ocean" | "forest" | "grape" | "ember" | "blossom" | "midnight";
export type Mode = "light" | "dark";

export const LOCALES: { value: Locale; label: string; flag: string; dir: "ltr" | "rtl" }[] = [
  { value: "id", label: "Bahasa Indonesia", flag: "🇮🇩", dir: "ltr" },
  { value: "en", label: "English",          flag: "🇬🇧", dir: "ltr" },
  { value: "es", label: "Español",          flag: "🇪🇸", dir: "ltr" },
  { value: "fr", label: "Français",         flag: "🇫🇷", dir: "ltr" },
  { value: "ar", label: "العربية",          flag: "🇸🇦", dir: "rtl" },
];

export const THEMES: { value: ThemeName; label: string; primary: string; secondary: string }[] = [
  { value: "ocean",    label: "Ocean Blue",    primary: "#00288e", secondary: "#006c49" },
  { value: "forest",   label: "Forest Green",  primary: "#00631a", secondary: "#006865" },
  { value: "grape",    label: "Grape Purple",  primary: "#641895", secondary: "#785187" },
  { value: "ember",    label: "Ember Orange",  primary: "#a42300", secondary: "#526200" },
  { value: "blossom",  label: "Blossom Pink",  primary: "#8f004b", secondary: "#006274" },
  { value: "midnight", label: "Midnight Slate", primary: "#1d2a8f", secondary: "#37474f" },
];

const T = {
  id: {
    nav: {
      dashboard: "Dasbor", transactions: "Transaksi", analytics: "Analitik",
      ai: "Asisten AI", budgets: "Anggaran", goals: "Target", settings: "Pengaturan",
      addTransaction: "Tambah Transaksi", help: "Pusat Bantuan", logout: "Keluar",
    },
    common: {
      save: "Simpan", cancel: "Batal", delete: "Hapus", edit: "Edit",
      add: "Tambah", back: "Kembali", loading: "Memuat...", viewAll: "Lihat semua →",
    },
    dashboard: {
      title: "Dasbor", subtitle: "Ringkasan arus kas bulanan Anda",
      income: "Pemasukan (bulan ini)", expense: "Pengeluaran (bulan ini)", net: "Neto",
      insights: "Wawasan", insightsSubtitle: "Terdeteksi otomatis dari transaksi terbaru",
      askAI: "Tanya AI →", trend: "Tren 6 Bulan", trendSubtitle: "Pemasukan vs pengeluaran",
      recent: "Transaksi Terbaru", recentSubtitle: "Aktivitas terkini Anda",
      topCategories: "Kategori Teratas", expenseBreakdown: "Rincian pengeluaran",
      noTransactions: "Belum ada transaksi", noTransactionsHint: "Mulai dengan menambahkan transaksi pertama Anda.",
    },
    transactions: {
      title: "Transaksi", subtitle: "Semua catatan pemasukan dan pengeluaran",
      new: "Baru", exportCsv: "Ekspor CSV", importCsv: "Impor CSV", uploadReceipt: "Unggah Struk",
      income: "Pemasukan", expense: "Pengeluaran", all: "Semua tipe",
      allSources: "Semua sumber", allCategories: "Semua kategori",
      applyFilters: "Terapkan filter", reset: "Reset",
      noResults: "Tidak ada transaksi yang cocok", noResultsHint: "Coba sesuaikan filter.",
      aiSearch: "Pencarian AI", aiSearchSubtitle: "Cari dengan bahasa natural — bisa pakai Bahasa Indonesia",
    },
    budgets: { title: "Anggaran", subtitle: "Batas pengeluaran bulanan per kategori" },
    goals: {
      title: "Target Tabungan", subtitle: "Pantau pencapaian keuangan Anda",
      newGoal: "Target Baru", active: "Target Aktif", completed: "Selesai",
      noGoals: "Belum ada target tabungan", noGoalsHint: "Buat target untuk tetap termotivasi.",
      createFirst: "Buat target pertama", updateAmount: "Perbarui jumlah",
      daysLeft: "hari lagi", overdue: "Terlambat", dueToday: "Jatuh tempo hari ini!",
      remaining: "tersisa", done: "Selesai!",
    },
    analytics: { title: "Analitik", subtitle: "Tren dan pola pengeluaran" },
    ai: { title: "Asisten AI", subtitle: "Tanya seputar keuangan Anda" },
    settings: {
      title: "Pengaturan", subtitle: "Kelola profil dan integrasi Anda",
      profile: "Profil", profileSubtitle: "Informasi pribadi Anda",
      appearance: "Tampilan", appearanceSubtitle: "Tema, warna, dan bahasa",
      categories: "Kelola Kategori", categoriesSubtitle: "Tambah, edit, atau hapus kategori transaksi",
      integrations: "Integrasi", integrationsSubtitle: "Hubungkan saluran eksternal untuk alur kerja n8n",
      accountStats: "Statistik Akun", dangerZone: "Zona Berbahaya",
      dangerZoneSubtitle: "Keluar dari browser ini. Data Anda tetap aman.",
      signOut: "Keluar", userId: "ID Pengguna", memberSince: "Bergabung sejak", transactions: "Transaksi",
    },
    appearance: {
      title: "Tampilan", subtitle: "Sesuaikan tema dan bahasa",
      language: "Bahasa", languageSubtitle: "Pilih bahasa yang Anda inginkan",
      theme: "Tema Warna", themeSubtitle: "Pilih palet warna untuk aplikasi",
      mode: "Mode Tampilan", modeSubtitle: "Beralih antara terang dan gelap",
      lightMode: "Terang", darkMode: "Gelap",
    },
  },

  en: {
    nav: {
      dashboard: "Dashboard", transactions: "Transactions", analytics: "Analytics",
      ai: "AI Advisor", budgets: "Budgets", goals: "Goals", settings: "Settings",
      addTransaction: "Add Transaction", help: "Help Center", logout: "Logout",
    },
    common: {
      save: "Save", cancel: "Cancel", delete: "Delete", edit: "Edit",
      add: "Add", back: "Back", loading: "Loading...", viewAll: "View all →",
    },
    dashboard: {
      title: "Dashboard", subtitle: "Monthly overview of your cash flow",
      income: "Income (this month)", expense: "Expense (this month)", net: "Net",
      insights: "Insights", insightsSubtitle: "Auto-detected from your recent transactions",
      askAI: "Ask AI →", trend: "6-Month Trend", trendSubtitle: "Income vs expense",
      recent: "Recent Transactions", recentSubtitle: "Your latest activity",
      topCategories: "Top Categories", expenseBreakdown: "Expense breakdown",
      noTransactions: "No transactions yet", noTransactionsHint: "Start by adding your first transaction.",
    },
    transactions: {
      title: "Transactions", subtitle: "All income and expense records",
      new: "New", exportCsv: "Export CSV", importCsv: "Import CSV", uploadReceipt: "Upload Receipt",
      income: "Income", expense: "Expense", all: "All types",
      allSources: "All sources", allCategories: "All categories",
      applyFilters: "Apply filters", reset: "Reset",
      noResults: "No matching transactions", noResultsHint: "Try adjusting your filters.",
      aiSearch: "AI Search", aiSearchSubtitle: "Search by natural language — try your own language too",
    },
    budgets: { title: "Budgets", subtitle: "Monthly spending limits by category" },
    goals: {
      title: "Savings Goals", subtitle: "Track your financial milestones",
      newGoal: "New Goal", active: "Active Goals", completed: "Completed",
      noGoals: "No savings goals yet", noGoalsHint: "Set a goal to stay motivated.",
      createFirst: "Create first goal", updateAmount: "Update amount",
      daysLeft: "days left", overdue: "Overdue by", dueToday: "Due today!",
      remaining: "remaining", done: "Done!",
    },
    analytics: { title: "Analytics", subtitle: "Trends and spending patterns" },
    ai: { title: "AI Advisor", subtitle: "Ask questions about your finances" },
    settings: {
      title: "Settings", subtitle: "Manage your profile and integrations",
      profile: "Profile", profileSubtitle: "Your personal information",
      appearance: "Appearance", appearanceSubtitle: "Theme, colors, and language",
      categories: "Manage Categories", categoriesSubtitle: "Add, edit, or remove transaction categories",
      integrations: "Integrations", integrationsSubtitle: "Link external channels for n8n workflows",
      accountStats: "Account Stats", dangerZone: "Danger Zone",
      dangerZoneSubtitle: "Sign out of this browser. Your data is safe.",
      signOut: "Sign out", userId: "User ID", memberSince: "Member since", transactions: "Transactions",
    },
    appearance: {
      title: "Appearance", subtitle: "Customize your theme and language",
      language: "Language", languageSubtitle: "Choose your preferred language",
      theme: "Color Theme", themeSubtitle: "Pick a color palette for the app",
      mode: "Display Mode", modeSubtitle: "Switch between light and dark",
      lightMode: "Light", darkMode: "Dark",
    },
  },

  es: {
    nav: {
      dashboard: "Panel", transactions: "Transacciones", analytics: "Análisis",
      ai: "Asesor IA", budgets: "Presupuestos", goals: "Metas", settings: "Ajustes",
      addTransaction: "Agregar Transacción", help: "Centro de ayuda", logout: "Cerrar sesión",
    },
    common: {
      save: "Guardar", cancel: "Cancelar", delete: "Eliminar", edit: "Editar",
      add: "Agregar", back: "Volver", loading: "Cargando...", viewAll: "Ver todo →",
    },
    dashboard: {
      title: "Panel", subtitle: "Resumen mensual de tu flujo de caja",
      income: "Ingresos (este mes)", expense: "Gastos (este mes)", net: "Neto",
      insights: "Perspectivas", insightsSubtitle: "Detectado automáticamente de tus transacciones recientes",
      askAI: "Preguntar a IA →", trend: "Tendencia 6 meses", trendSubtitle: "Ingresos vs gastos",
      recent: "Transacciones recientes", recentSubtitle: "Tu actividad más reciente",
      topCategories: "Categorías principales", expenseBreakdown: "Desglose de gastos",
      noTransactions: "Aún no hay transacciones", noTransactionsHint: "Comienza agregando tu primera transacción.",
    },
    transactions: {
      title: "Transacciones", subtitle: "Todos los registros de ingresos y gastos",
      new: "Nuevo", exportCsv: "Exportar CSV", importCsv: "Importar CSV", uploadReceipt: "Subir recibo",
      income: "Ingresos", expense: "Gastos", all: "Todos los tipos",
      allSources: "Todas las fuentes", allCategories: "Todas las categorías",
      applyFilters: "Aplicar filtros", reset: "Restablecer",
      noResults: "Sin transacciones coincidentes", noResultsHint: "Intenta ajustar los filtros.",
      aiSearch: "Búsqueda IA", aiSearchSubtitle: "Busca en lenguaje natural",
    },
    budgets: { title: "Presupuestos", subtitle: "Límites de gasto mensuales por categoría" },
    goals: {
      title: "Metas de ahorro", subtitle: "Sigue tus hitos financieros",
      newGoal: "Nueva meta", active: "Metas activas", completed: "Completadas",
      noGoals: "Aún no hay metas", noGoalsHint: "Establece una meta para mantenerte motivado.",
      createFirst: "Crear primera meta", updateAmount: "Actualizar monto",
      daysLeft: "días restantes", overdue: "Vencido por", dueToday: "¡Vence hoy!",
      remaining: "restante", done: "¡Listo!",
    },
    analytics: { title: "Análisis", subtitle: "Tendencias y patrones de gasto" },
    ai: { title: "Asesor IA", subtitle: "Haz preguntas sobre tus finanzas" },
    settings: {
      title: "Ajustes", subtitle: "Gestiona tu perfil e integraciones",
      profile: "Perfil", profileSubtitle: "Tu información personal",
      appearance: "Apariencia", appearanceSubtitle: "Tema, colores e idioma",
      categories: "Gestionar categorías", categoriesSubtitle: "Agregar, editar o eliminar categorías",
      integrations: "Integraciones", integrationsSubtitle: "Conecta canales externos para flujos n8n",
      accountStats: "Estadísticas de cuenta", dangerZone: "Zona de peligro",
      dangerZoneSubtitle: "Cerrar sesión en este navegador. Tus datos están seguros.",
      signOut: "Cerrar sesión", userId: "ID de usuario", memberSince: "Miembro desde", transactions: "Transacciones",
    },
    appearance: {
      title: "Apariencia", subtitle: "Personaliza tu tema e idioma",
      language: "Idioma", languageSubtitle: "Elige tu idioma preferido",
      theme: "Tema de color", themeSubtitle: "Elige una paleta de colores para la app",
      mode: "Modo de pantalla", modeSubtitle: "Cambia entre claro y oscuro",
      lightMode: "Claro", darkMode: "Oscuro",
    },
  },

  fr: {
    nav: {
      dashboard: "Tableau de bord", transactions: "Transactions", analytics: "Analytique",
      ai: "Conseiller IA", budgets: "Budgets", goals: "Objectifs", settings: "Paramètres",
      addTransaction: "Ajouter une transaction", help: "Centre d'aide", logout: "Déconnexion",
    },
    common: {
      save: "Enregistrer", cancel: "Annuler", delete: "Supprimer", edit: "Modifier",
      add: "Ajouter", back: "Retour", loading: "Chargement...", viewAll: "Voir tout →",
    },
    dashboard: {
      title: "Tableau de bord", subtitle: "Aperçu mensuel de vos flux de trésorerie",
      income: "Revenus (ce mois)", expense: "Dépenses (ce mois)", net: "Net",
      insights: "Perspectives", insightsSubtitle: "Détecté automatiquement de vos transactions récentes",
      askAI: "Demander à l'IA →", trend: "Tendance 6 mois", trendSubtitle: "Revenus vs dépenses",
      recent: "Transactions récentes", recentSubtitle: "Votre activité la plus récente",
      topCategories: "Meilleures catégories", expenseBreakdown: "Répartition des dépenses",
      noTransactions: "Pas encore de transactions", noTransactionsHint: "Commencez par ajouter votre première transaction.",
    },
    transactions: {
      title: "Transactions", subtitle: "Tous les enregistrements de revenus et dépenses",
      new: "Nouveau", exportCsv: "Exporter CSV", importCsv: "Importer CSV", uploadReceipt: "Télécharger reçu",
      income: "Revenus", expense: "Dépenses", all: "Tous les types",
      allSources: "Toutes les sources", allCategories: "Toutes les catégories",
      applyFilters: "Appliquer les filtres", reset: "Réinitialiser",
      noResults: "Aucune transaction correspondante", noResultsHint: "Essayez d'ajuster vos filtres.",
      aiSearch: "Recherche IA", aiSearchSubtitle: "Rechercher en langage naturel",
    },
    budgets: { title: "Budgets", subtitle: "Limites de dépenses mensuelles par catégorie" },
    goals: {
      title: "Objectifs d'épargne", subtitle: "Suivez vos jalons financiers",
      newGoal: "Nouvel objectif", active: "Objectifs actifs", completed: "Terminés",
      noGoals: "Pas encore d'objectifs", noGoalsHint: "Fixez un objectif pour rester motivé.",
      createFirst: "Créer le premier objectif", updateAmount: "Mettre à jour le montant",
      daysLeft: "jours restants", overdue: "En retard de", dueToday: "À rendre aujourd'hui !",
      remaining: "restant", done: "Terminé !",
    },
    analytics: { title: "Analytique", subtitle: "Tendances et habitudes de dépenses" },
    ai: { title: "Conseiller IA", subtitle: "Posez des questions sur vos finances" },
    settings: {
      title: "Paramètres", subtitle: "Gérez votre profil et vos intégrations",
      profile: "Profil", profileSubtitle: "Vos informations personnelles",
      appearance: "Apparence", appearanceSubtitle: "Thème, couleurs et langue",
      categories: "Gérer les catégories", categoriesSubtitle: "Ajouter, modifier ou supprimer des catégories",
      integrations: "Intégrations", integrationsSubtitle: "Lier des canaux externes pour les flux n8n",
      accountStats: "Statistiques du compte", dangerZone: "Zone dangereuse",
      dangerZoneSubtitle: "Se déconnecter de ce navigateur. Vos données sont en sécurité.",
      signOut: "Se déconnecter", userId: "ID utilisateur", memberSince: "Membre depuis", transactions: "Transactions",
    },
    appearance: {
      title: "Apparence", subtitle: "Personnalisez votre thème et votre langue",
      language: "Langue", languageSubtitle: "Choisissez votre langue préférée",
      theme: "Thème de couleur", themeSubtitle: "Choisissez une palette de couleurs",
      mode: "Mode d'affichage", modeSubtitle: "Basculer entre clair et sombre",
      lightMode: "Clair", darkMode: "Sombre",
    },
  },

  ar: {
    nav: {
      dashboard: "لوحة التحكم", transactions: "المعاملات", analytics: "التحليلات",
      ai: "مستشار الذكاء الاصطناعي", budgets: "الميزانيات", goals: "الأهداف", settings: "الإعدادات",
      addTransaction: "إضافة معاملة", help: "مركز المساعدة", logout: "تسجيل الخروج",
    },
    common: {
      save: "حفظ", cancel: "إلغاء", delete: "حذف", edit: "تعديل",
      add: "إضافة", back: "رجوع", loading: "جارٍ التحميل...", viewAll: "عرض الكل →",
    },
    dashboard: {
      title: "لوحة التحكم", subtitle: "نظرة عامة شهرية على تدفقاتك النقدية",
      income: "الدخل (هذا الشهر)", expense: "النفقات (هذا الشهر)", net: "الصافي",
      insights: "الرؤى", insightsSubtitle: "كُشف تلقائياً من معاملاتك الأخيرة",
      askAI: "اسأل الذكاء الاصطناعي →", trend: "اتجاه 6 أشهر", trendSubtitle: "الدخل مقابل النفقات",
      recent: "المعاملات الأخيرة", recentSubtitle: "نشاطك الأخير",
      topCategories: "الفئات الأعلى", expenseBreakdown: "تفصيل النفقات",
      noTransactions: "لا توجد معاملات حتى الآن", noTransactionsHint: "ابدأ بإضافة أول معاملة لك.",
    },
    transactions: {
      title: "المعاملات", subtitle: "جميع سجلات الدخل والنفقات",
      new: "جديد", exportCsv: "تصدير CSV", importCsv: "استيراد CSV", uploadReceipt: "رفع الإيصال",
      income: "الدخل", expense: "النفقات", all: "جميع الأنواع",
      allSources: "جميع المصادر", allCategories: "جميع الفئات",
      applyFilters: "تطبيق الفلاتر", reset: "إعادة تعيين",
      noResults: "لا توجد معاملات مطابقة", noResultsHint: "جرب تعديل الفلاتر.",
      aiSearch: "بحث الذكاء الاصطناعي", aiSearchSubtitle: "ابحث بالغة الطبيعية",
    },
    budgets: { title: "الميزانيات", subtitle: "حدود الإنفاق الشهرية حسب الفئة" },
    goals: {
      title: "أهداف الادخار", subtitle: "تتبع معالمك المالية",
      newGoal: "هدف جديد", active: "الأهداف النشطة", completed: "المكتملة",
      noGoals: "لا توجد أهداف حتى الآن", noGoalsHint: "ضع هدفاً لتبقى متحفزاً.",
      createFirst: "إنشاء أول هدف", updateAmount: "تحديث المبلغ",
      daysLeft: "أيام متبقية", overdue: "متأخر بـ", dueToday: "موعد اليوم!",
      remaining: "متبقٍ", done: "تم!",
    },
    analytics: { title: "التحليلات", subtitle: "الاتجاهات وأنماط الإنفاق" },
    ai: { title: "مستشار الذكاء الاصطناعي", subtitle: "اسأل عن أموالك" },
    settings: {
      title: "الإعدادات", subtitle: "إدارة ملفك الشخصي وتكاملاتك",
      profile: "الملف الشخصي", profileSubtitle: "معلوماتك الشخصية",
      appearance: "المظهر", appearanceSubtitle: "السمة والألوان واللغة",
      categories: "إدارة الفئات", categoriesSubtitle: "إضافة أو تعديل أو حذف الفئات",
      integrations: "التكاملات", integrationsSubtitle: "ربط القنوات الخارجية لسير عمل n8n",
      accountStats: "إحصائيات الحساب", dangerZone: "منطقة الخطر",
      dangerZoneSubtitle: "تسجيل الخروج من هذا المتصفح. بياناتك آمنة.",
      signOut: "تسجيل الخروج", userId: "معرّف المستخدم", memberSince: "عضو منذ", transactions: "المعاملات",
    },
    appearance: {
      title: "المظهر", subtitle: "تخصيص السمة واللغة",
      language: "اللغة", languageSubtitle: "اختر لغتك المفضلة",
      theme: "سمة الألوان", themeSubtitle: "اختر لوحة ألوان للتطبيق",
      mode: "وضع العرض", modeSubtitle: "التبديل بين الفاتح والمظلم",
      lightMode: "فاتح", darkMode: "مظلم",
    },
  },
} as const;

export { T as translations };

export function getTranslation(locale: Locale, path: string): string {
  const parts = path.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let cur: any = (T as any)[locale];
  for (const p of parts) {
    cur = cur?.[p];
    if (cur === undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let fb: any = (T as any).en;
      for (const fp of parts) fb = fb?.[fp];
      return fb ?? path;
    }
  }
  return cur ?? path;
}
