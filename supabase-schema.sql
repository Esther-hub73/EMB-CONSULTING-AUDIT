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
create policy "Allow all access to kv_store"
  on kv_store
  for all
  using (true)
  with check (true);
