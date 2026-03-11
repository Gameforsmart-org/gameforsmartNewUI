// ============================================================
// _utils/constants.ts
// ============================================================

export const ANSWER_COLORS = [
  "#e74c3c", // Red
  "#3498db", // Blue
  "#2ecc71", // Green
  "#f1c40f", // Yellow
];

export const getCategories = (t: (key: string) => string) => [
  { value: "general",       label: "🌍 " + (t("dashboard.categories.general")       || "General") },
  { value: "science",       label: "🔬 " + (t("dashboard.categories.science")       || "Science") },
  { value: "math",          label: "📊 " + (t("dashboard.categories.math")          || "Mathematics") },
  { value: "history",       label: "📚 " + (t("dashboard.categories.history")       || "History") },
  { value: "geography",     label: "🗺️ " + (t("dashboard.categories.geography")     || "Geography") },
  { value: "language",      label: "💬 " + (t("dashboard.categories.language")      || "Language") },
  { value: "technology",    label: "💻 " + (t("dashboard.categories.technology")    || "Technology") },
  { value: "sports",        label: "⚽ " + (t("dashboard.categories.sports")        || "Sports") },
  { value: "entertainment", label: "🎬 " + (t("dashboard.categories.entertainment") || "Entertainment") },
  { value: "business",      label: "💼 " + (t("dashboard.categories.business")      || "Business") },
];

export const getLanguages = (t: (key: string) => string) => [
  { value: "id", label: t("dashboard.languages.indonesia") || "Indonesia" },
  { value: "en", label: t("dashboard.languages.english")   || "English" },
];
