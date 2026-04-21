// ─── Time Filter Options ──────────────────────────────────────────────────────

export const TIME_OPTIONS = [
  { value: "all",        label: "All Time" },
  { value: "today",      label: "Today" },
  { value: "yesterday",  label: "Yesterday" },
  { value: "this_week",  label: "This Week" },
  { value: "last_week",  label: "Last Week" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "this_year",  label: "This Year" },
  { value: "last_year",  label: "Last Year" }
] as const;

// ─── Category Filter Options ──────────────────────────────────────────────────

export const CATEGORY_OPTIONS = [
  { value: "all",           label: "All Categories" },
  { value: "general",       label: "Umum" },
  { value: "science",       label: "Sains" },
  { value: "math",          label: "Matematika" },
  { value: "history",       label: "Sejarah" },
  { value: "geography",     label: "Geografi" },
  { value: "language",      label: "Bahasa" },
  { value: "technology",    label: "Teknologi" },
  { value: "sports",        label: "Olahraga" },
  { value: "entertainment", label: "Hiburan" },
  { value: "business",      label: "Bisnis" }
] as const;

// ─── Language Filter Options ──────────────────────────────────────────────────

export const LANGUAGE_OPTIONS = [
  { value: "all", label: "All Languages" },
  { value: "id",  label: "🇮🇩 Indonesia" },
  { value: "en",  label: "🇺🇸 English" }
] as const;

// ─── Pagination ───────────────────────────────────────────────────────────────

export const CARD_ITEMS_PER_PAGE  = 12;
export const TABLE_ITEMS_PER_PAGE = 10;
