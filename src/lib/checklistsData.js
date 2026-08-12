import { getSupabase } from './supabaseClient';
import { DEFAULT_CHECKLISTS } from '../data/defaultChecklists';

const LOCAL_KEY = 'emb-audit:checklists-override';

function cloneDefaults() {
  // Deep-ish clone so callers can freely mutate without touching the module-level defaults
  const out = {};
  for (const dept of Object.keys(DEFAULT_CHECKLISTS)) {
    out[dept] = DEFAULT_CHECKLISTS[dept].map((item, i) => ({ ...item, order_index: i }));
  }
  return out;
}

/** Groups Supabase rows by department_id, sorted by order_index. */
function groupRows(rows) {
  const out = {};
  for (const row of rows) {
    if (!out[row.department_id]) out[row.department_id] = [];
    out[row.department_id].push({ id: row.id, category: row.category, text: row.text, order_index: row.order_index });
  }
  for (const dept of Object.keys(out)) out[dept].sort((a, b) => a.order_index - b.order_index);
  return out;
}

/**
 * Loads all checklist items grouped by department.
 * - Supabase configured: reads from `checklist_items`, auto-seeding from
 *   DEFAULT_CHECKLISTS the very first time the table is empty.
 * - Otherwise: uses localStorage (so edits still persist locally without Supabase).
 */
export async function loadChecklists() {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from('checklist_items').select('*').order('order_index');
    if (error) throw error;

    if (!data || data.length === 0) {
      // First run: seed the table from the defaults.
      const defaults = cloneDefaults();
      const rows = [];
      for (const dept of Object.keys(defaults)) {
        for (const item of defaults[dept]) {
          rows.push({ id: item.id, department_id: dept, category: item.category, text: item.text, order_index: item.order_index });
        }
      }
      const { error: seedError } = await supabase.from('checklist_items').insert(rows);
      if (seedError) throw seedError;
      return defaults;
    }
    return groupRows(data);
  }

  // No Supabase: fall back to localStorage-backed defaults
  const raw = localStorage.getItem(LOCAL_KEY);
  if (raw) return JSON.parse(raw);
  const defaults = cloneDefaults();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(defaults));
  return defaults;
}

async function persistLocal(all) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(all));
}

export async function addChecklistItem(departmentId, category, text) {
  const supabase = getSupabase();
  const id = `${departmentId}_${Date.now()}`;

  if (supabase) {
    const { data: existing } = await supabase.from('checklist_items').select('order_index').eq('department_id', departmentId).order('order_index', { ascending: false }).limit(1);
    const nextIndex = existing && existing.length ? existing[0].order_index + 1 : 0;
    const { error } = await supabase.from('checklist_items').insert({ id, department_id: departmentId, category, text, order_index: nextIndex });
    if (error) throw error;
    return { id, category, text, order_index: nextIndex };
  }

  const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  if (!all[departmentId]) all[departmentId] = [];
  const item = { id, category, text, order_index: all[departmentId].length };
  all[departmentId].push(item);
  await persistLocal(all);
  return item;
}

export async function updateChecklistItem(departmentId, id, patch) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('checklist_items').update(patch).eq('id', id);
    if (error) throw error;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  all[departmentId] = (all[departmentId] || []).map(it => it.id === id ? { ...it, ...patch } : it);
  await persistLocal(all);
}

export async function deleteChecklistItem(departmentId, id) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  all[departmentId] = (all[departmentId] || []).filter(it => it.id !== id);
  await persistLocal(all);
}

/** Swaps order_index between two items (used for the up/down reorder buttons). */
export async function swapOrder(departmentId, itemA, itemB) {
  const supabase = getSupabase();
  if (supabase) {
    const { error: e1 } = await supabase.from('checklist_items').update({ order_index: itemB.order_index }).eq('id', itemA.id);
    const { error: e2 } = await supabase.from('checklist_items').update({ order_index: itemA.order_index }).eq('id', itemB.id);
    if (e1 || e2) throw e1 || e2;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_KEY) || '{}');
  all[departmentId] = (all[departmentId] || []).map(it => {
    if (it.id === itemA.id) return { ...it, order_index: itemB.order_index };
    if (it.id === itemB.id) return { ...it, order_index: itemA.order_index };
    return it;
  });
  await persistLocal(all);
}
