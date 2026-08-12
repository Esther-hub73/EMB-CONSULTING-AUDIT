-- À exécuter une fois dans Supabase : Project → SQL Editor → New query → coller → Run

create table if not exists kv_store (
  key text primary key,
  value text not null,
  updated_at timestamptz default now()
);

-- Active la sécurité au niveau des lignes
alter table kv_store enable row level security;

-- Politique permissive : suffisante pour un usage interne à une seule personne/équipe
-- protégé par ailleurs par l'accès restreint à l'URL de l'application.
-- ⚠️ Pour un usage multi-clients avec des comptes séparés, il faudra ajouter
-- l'authentification Supabase (Supabase Auth) et restreindre l'accès par utilisateur.
drop policy if exists "Allow all access to kv_store" on kv_store;
create policy "Allow all access to kv_store"
  on kv_store
  for all
  using (true)
  with check (true);

-- Table des critères d'audit par département, modifiables depuis l'écran
-- d'administration de l'application (menu "Gérer les critères").
create table if not exists checklist_items (
  id text primary key,
  department_id text not null,
  category text not null,
  text text not null,
  order_index integer not null default 0,
  updated_at timestamptz default now()
);

alter table checklist_items enable row level security;

drop policy if exists "Allow all access to checklist_items" on checklist_items;
create policy "Allow all access to checklist_items"
  on checklist_items
  for all
  using (true)
  with check (true);

-- Note : cette table se remplit automatiquement au premier lancement de
-- l'application (à partir de la grille par défaut intégrée au code) —
-- aucune insertion manuelle n'est nécessaire ici.
