import { getSupabase } from './supabaseClient';
import { DEFAULT_CHECKLISTS } from '../data/defaultChecklists';

/**
 * Checklist data layer — SCOPED PER ÉTABLISSEMENT.
 * Each hotel/restaurant gets its own independent set of criteria, seeded from
 * DEFAULT_CHECKLISTS the first time that establishment is opened, then fully
 * editable per establishment without affecting any other establishment.
 */

const LOCAL_PREFIX = 'emb-audit:checklists:';

function cloneDefaults() {
  const out = {};
  for (const dept of Object.keys(DEFAULT_CHECKLISTS)) {
    out[dept] = DEFAULT_CHECKLISTS[dept].map((item, i) => ({ ...item, order_index: i }));
  }
  return out;
}

function groupRows(rows) {
  const out = {};
  for (const row of rows) {
    if (!out[row.department_id]) out[row.department_id] = [];
    out[row.department_id].push({ id: row.id, category: row.category, text: row.text, order_index: row.order_index });
  }
  for (const dept of Object.keys(out)) out[dept].sort((a, b) => a.order_index - b.order_index);
  return out;
}

export async function loadChecklists(establishmentId) {
  const supabase = getSupabase();

  if (supabase) {
    const { data, error } = await supabase.from('checklist_items').select('*').eq('establishment_id', establishmentId).order('order_index');
    if (error) throw error;

    if (!data || data.length === 0) {
      // First time this establishment is opened: seed its own copy from the defaults.
      const defaults = cloneDefaults();
      const rows = [];
      for (const dept of Object.keys(defaults)) {
        for (const item of defaults[dept]) {
          rows.push({ id: `${establishmentId}__${item.id}`, establishment_id: establishmentId, department_id: dept, category: item.category, text: item.text, order_index: item.order_index });
        }
      }
      const { error: seedError } = await supabase.from('checklist_items').insert(rows);
      if (seedError) throw seedError;
      return defaults;
    }
    return groupRows(data);
  }

  // No Supabase: fall back to localStorage, keyed per establishment.
  const key = LOCAL_PREFIX + establishmentId;
  const raw = localStorage.getItem(key);
  if (raw) return JSON.parse(raw);
  const defaults = cloneDefaults();
  localStorage.setItem(key, JSON.stringify(defaults));
  return defaults;
}

async function persistLocal(establishmentId, all) {
  localStorage.setItem(LOCAL_PREFIX + establishmentId, JSON.stringify(all));
}

export async function addChecklistItem(establishmentId, departmentId, category, text) {
  const supabase = getSupabase();
  const id = `${establishmentId}__${departmentId}_${Date.now()}`;

  if (supabase) {
    const { data: existing } = await supabase.from('checklist_items').select('order_index').eq('establishment_id', establishmentId).eq('department_id', departmentId).order('order_index', { ascending: false }).limit(1);
    const nextIndex = existing && existing.length ? existing[0].order_index + 1 : 0;
    const { error } = await supabase.from('checklist_items').insert({ id, establishment_id: establishmentId, department_id: departmentId, category, text, order_index: nextIndex });
    if (error) throw error;
    return { id, category, text, order_index: nextIndex };
  }

  const all = JSON.parse(localStorage.getItem(LOCAL_PREFIX + establishmentId) || '{}');
  if (!all[departmentId]) all[departmentId] = [];
  const item = { id, category, text, order_index: all[departmentId].length };
  all[departmentId].push(item);
  await persistLocal(establishmentId, all);
  return item;
}

export async function updateChecklistItem(establishmentId, departmentId, id, patch) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('checklist_items').update(patch).eq('id', id);
    if (error) throw error;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_PREFIX + establishmentId) || '{}');
  all[departmentId] = (all[departmentId] || []).map(it => it.id === id ? { ...it, ...patch } : it);
  await persistLocal(establishmentId, all);
}

export async function deleteChecklistItem(establishmentId, departmentId, id) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('checklist_items').delete().eq('id', id);
    if (error) throw error;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_PREFIX + establishmentId) || '{}');
  all[departmentId] = (all[departmentId] || []).filter(it => it.id !== id);
  await persistLocal(establishmentId, all);
}

export async function swapOrder(establishmentId, departmentId, itemA, itemB) {
  const supabase = getSupabase();
  if (supabase) {
    const { error: e1 } = await supabase.from('checklist_items').update({ order_index: itemB.order_index }).eq('id', itemA.id);
    const { error: e2 } = await supabase.from('checklist_items').update({ order_index: itemA.order_index }).eq('id', itemB.id);
    if (e1 || e2) throw e1 || e2;
    return;
  }
  const all = JSON.parse(localStorage.getItem(LOCAL_PREFIX + establishmentId) || '{}');
  all[departmentId] = (all[departmentId] || []).map(it => {
    if (it.id === itemA.id) return { ...it, order_index: itemB.order_index };
    if (it.id === itemB.id) return { ...it, order_index: itemA.order_index };
    return it;
  });
  await persistLocal(establishmentId, all);
}

/** Called when an establishment is deleted, to avoid leaving orphan criteria rows. */
export async function deleteEstablishmentChecklists(establishmentId) {
  const supabase = getSupabase();
  if (supabase) {
    const { error } = await supabase.from('checklist_items').delete().eq('establishment_id', establishmentId);
    if (error) throw error;
    return;
  }
  localStorage.removeItem(LOCAL_PREFIX + establishmentId);
}
