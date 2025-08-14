// Category utilities shared across board, modal, and changelog

export function normalizeCategories(boardCategories = []) {
  const list = Array.isArray(boardCategories) ? boardCategories : [];
  const hasGeneral = list.some((c) => (c.name || '').trim().toLowerCase() === 'general');
  if (hasGeneral) return list;
  return [{ id: 'general', name: 'General', color: '#3b82f6' }, ...list];
}

export function categoryEquals(a, b) {
  const aStr = String(a || '').trim().toLowerCase();
  const bStr = String(b || '').trim().toLowerCase();
  return aStr === bStr;
}

export function buildCategoryCounts(tasks = [], boardCategories = []) {
  // Returns counts keyed by category id for reliability
  const counts = {};
  const normalized = normalizeCategories(boardCategories);
  const general = normalized.find((c) => categoryEquals(c.name, 'General')) || { id: 'general', name: 'General' };
  normalized.forEach((c) => { counts[c.id] = 0; });
  tasks.forEach((t) => {
    if (t.status !== 'backlog') return;
    // Support legacy data: categoryId, category name, or object
    const catVal = t.categoryId || t.category;
    const tName = typeof catVal === 'object' && catVal !== null ? (catVal.name || '') : (typeof catVal === 'string' ? catVal : '');
    const tId = typeof catVal === 'object' && catVal !== null ? (catVal.id || '') : (typeof t.categoryId === 'string' ? t.categoryId : '');
    const matchCat = normalized.find((c) => categoryEquals(c.id, tId) || categoryEquals(c.name, tName) || categoryEquals(c.id, catVal) || categoryEquals(c.name, catVal));
    const key = matchCat ? matchCat.id : general.id;
    counts[key] = (counts[key] || 0) + 1;
  });
  return counts;
}

export function mergeCategoriesWithCounts(boardCategories = [], counts = {}) {
  const normalized = normalizeCategories(boardCategories);
  const set = new Set(normalized.map((c) => String(c.name || '').trim().toLowerCase()));
  const result = normalized.map((c) => ({ ...c, count: counts[c.name] || 0 }));
  Object.keys(counts || {}).forEach((name) => {
    const key = String(name || '').trim().toLowerCase();
    if (!set.has(key)) {
      result.push({ id: key.replace(/[^a-z0-9]/g, '-'), name, color: '#6c6c84', count: counts[name] || 0 });
    }
  });
  return result;
}


