# EMB Consulting — Audit Qualité

Application d'audit qualité pour hôtels et restaurants (13 départements, 7 pôles), avec IA pour les préconisations, scores, rapports et export PDF.

Ce dossier est un vrai projet web, prêt à être hébergé pour être utilisable depuis un téléphone, une tablette ou un ordinateur, avec les mêmes données partout.

---

## Ce qu'il faut mettre en place (une seule fois, ~20-30 minutes)

Il y a 3 comptes gratuits à créer si tu ne les as pas déjà : **GitHub**, **Supabase**, **Vercel**, et une **clé API Anthropic**.

### 1. Créer la base de données (Supabase — gratuit)

1. Va sur [supabase.com](https://supabase.com) → crée un compte → **New project**.
2. Une fois le projet créé, va dans **SQL Editor** → **New query**.
3. Colle le contenu du fichier `supabase-schema.sql` (fourni dans ce dossier) → **Run**.
4. Va dans **Project Settings → API** : note ton **Project URL** et ta clé **anon public**. Tu en auras besoin à l'étape 3.

### 2. Créer une clé API Anthropic (pour l'analyse IA)

1. Va sur [console.anthropic.com](https://console.anthropic.com) → **API Keys** → crée une clé.
2. Garde-la de côté, tu ne la mettras que dans Vercel (jamais dans le code, jamais visible des utilisateurs).

### 3. Mettre le code sur GitHub

1. Crée un compte sur [github.com](https://github.com) si besoin.
2. Crée un nouveau dépôt (repository), par exemple `emb-consulting-audit`.
3. Mets tout le contenu de ce dossier dedans (upload direct depuis l'interface GitHub, ou via `git` si tu es à l'aise).

### 4. Héberger le site (Vercel — gratuit)

1. Va sur [vercel.com](https://vercel.com) → connecte-toi avec ton compte GitHub.
2. **Add New → Project** → sélectionne ton dépôt `emb-consulting-audit`.
3. Dans **Environment Variables**, ajoute :
   - `VITE_SUPABASE_URL` → l'URL notée à l'étape 1
   - `VITE_SUPABASE_ANON_KEY` → la clé anon notée à l'étape 1
   - `ANTHROPIC_API_KEY` → la clé créée à l'étape 2
4. Clique **Deploy**. Après 1-2 minutes, Vercel te donne une adresse du type `https://emb-consulting-audit.vercel.app`.

C'est fait : l'application est en ligne, accessible depuis n'importe quel appareil, avec des données partagées et une IA fonctionnelle.

---

## Installer l'app sur ton téléphone (icône sur l'écran d'accueil)

**iPhone (Safari)** : ouvre le lien Vercel → bouton Partager (carré avec flèche) → **Sur l'écran d'accueil**.

**Android (Chrome)** : ouvre le lien Vercel → menu ⋮ → **Ajouter à l'écran d'accueil** (ou une bannière d'installation apparaît automatiquement).

**Ordinateur (Chrome/Edge)** : une icône d'installation apparaît dans la barre d'adresse → cliquer pour installer comme une application.

Une fois installée, l'app s'ouvre en plein écran avec sa propre icône, sans passer par le navigateur.

---

## Mises à jour futures

Pour modifier les critères d'audit, les couleurs ou ajouter des fonctionnalités : modifier le code dans ce dépôt et le renvoyer sur GitHub (`git push`). Vercel republie automatiquement la nouvelle version en 1-2 minutes. Les audits déjà réalisés ne sont jamais affectés par une mise à jour des critères, car chaque audit conserve une copie figée des questions posées ce jour-là.

---

## Développement local (optionnel, si tu as un développeur)

```bash
npm install
cp .env.example .env   # puis renseigner les valeurs Supabase
npm run dev
```

L'analyse IA (`/api/analyze`) ne fonctionne qu'une fois déployée sur Vercel (ou via `vercel dev` en local), car c'est une fonction serveur.

---

## Limites actuelles à connaître

- **Accès** : il n'y a pas encore de système de connexion (login). Toute personne ayant le lien peut voir et modifier les données. Pour un usage avec plusieurs auditeurs ou clients, il faudra ajouter une authentification (Supabase Auth le permet facilement).
- **Photos** : stockées telles quelles (non compressées) — pour un usage intensif avec beaucoup de photos, prévoir un stockage dédié (Supabase Storage).
- **Export PDF** : utilise l'impression du navigateur. Pour un PDF avec une mise en page 100% maîtrisée, une librairie dédiée pourrait être ajoutée plus tard.
