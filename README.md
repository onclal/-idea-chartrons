# IDÉA CHARTRONS

**Le village numérique du quartier des Chartrons** — plateforme hyper-locale PWA pour Bordeaux.

Application de démonstration qui connecte habitants, commerçants et bénévoles du quartier : annonces de quartier, Local Relais physique, fidélité commerçants, agenda des brocantes et événements.

---

## Fonctionnalités

| Module | Description |
|--------|-------------|
| **Annonces & Entraide** | Dons, ventes, services, petits boulots — filtres, recherche, création avec photo |
| **Local Relais** | Réservation de créneaux dépôt/retrait, statuts dynamiques, QR codes, alertes pickup |
| **Commerces & Fidélité** | Fiches commerçants rue Notre-Dame, scanner QR, points VIP déblocables |
| **Agenda** | Brocantes, animations, promos — tri chronologique, export `.ics` |
| **Profil** | Switch utilisateur de test, historique fidélité, réinitialisation des données démo |

> **Persistance** : toutes les données sont stockées dans le **LocalStorage** du navigateur (mode mock autonome, sans backend requis en production).

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19, Vite 6, TailwindCSS v4, React Router 7, i18next |
| Données | LocalStorage (mock) + logique métier partagée |
| Types | `@idea-chartrons/shared` (monorepo workspace) |
| PWA | vite-plugin-pwa (installable, cache offline) |
| Backend *(optionnel)* | Node.js, Express — API REST pour dev avancé |

---

## Charte graphique

Inspirée de l'ambiance du quartier des Chartrons :

| Couleur | Hex | Usage |
|---------|-----|-------|
| Vert Chartrons | `#1F4D3A` | Header, titres, CTA, icônes actives |
| Vert Chartrons clair | `#2D6650` | Hover, dégradés |
| Vert sauge | `#3A6B55` | Accents secondaires, badges brocante |
| Pierre / Beige | `#F5F0E8` / `#E8DFD0` | Fonds, cartes |
| Vert olive | `#5C6B4A` | Accents tertiaires, statuts positifs |
| Laiton | `#C4A35A` | Fidélité, VIP |

Typographies : **Playfair Display** (titres) + **DM Sans** (corps).

---

## Structure du projet

```
idea-chartrons/
├── client/              # App React PWA → client/dist (déploiement)
│   ├── public/          # Assets statiques + _redirects Netlify
│   └── src/
│       ├── lib/localDb.ts   # Persistance LocalStorage
│       ├── context/         # Auth, Toast, Search
│       └── pages/           # Écrans de l'application
├── server/              # API Express (optionnelle, port 3001)
├── shared/              # Types, enums, logique métier, seed
├── vercel.json          # Config déploiement Vercel
├── netlify.toml         # Config déploiement Netlify
└── package.json         # Scripts monorepo
```

---

## Prérequis

- **Node.js** ≥ 18 (recommandé : 20 LTS)
- **npm** ≥ 9

---

## Lancer en local

```bash
# 1. Cloner et installer les dépendances
git clone <votre-repo>
cd idea-chartrons
npm install

# 2. Lancer l'application (client seul — suffisant grâce au LocalStorage)
npm run dev:client
```

Ouvrir **http://localhost:5173**

### Mode complet (client + API Express)

```bash
npm run dev
```

- Frontend : http://localhost:5173
- API : http://localhost:3001/api/health

### Utilisateurs de démo

| Utilisateur | Rôle | ID |
|-------------|------|----|
| Marie Dupont | Habitant | `user-1` |
| Thomas Martin | Commerçant | `user-2` |
| Sophie Bernard | Bénévol Local Relais | `user-3` |

Changer d'utilisateur via **Profil → Changer d'utilisateur de test**.

---

## Build de production

```bash
# Build complet (shared + server + client)
npm run build

# Build client uniquement (déploiement statique)
npm run build:client

# Prévisualiser le build localement
npm run preview
```

Le dossier de sortie est **`client/dist/`**.

Vérification TypeScript + Vite :

```bash
npm run build:client
# ✓ tsc -b && vite build — sans erreur
```

---

## Déploiement en ligne (gratuit)

L'application est une **SPA statique** : seul le build client est nécessaire. Les fichiers `vercel.json` et `netlify.toml` sont déjà configurés (rewrites SPA, cache assets).

### Option A — Vercel (recommandé)

1. Pousser le code sur **GitHub** / GitLab / Bitbucket.
2. Créer un compte sur [vercel.com](https://vercel.com).
3. **Add New Project** → importer le repository.
4. Vercel détecte automatiquement `vercel.json` :
   - **Build Command** : `npm run build:client`
   - **Output Directory** : `client/dist`
   - **Install Command** : `npm install`
5. Cliquer **Deploy** — URL générée en ~1 min (`*.vercel.app`).

> Les routes React (`/posts`, `/relais`, `/acteurs`…) sont redirigées vers `index.html` via les rewrites SPA.

### Option B — Netlify

1. Pousser le code sur un dépôt Git.
2. Créer un compte sur [netlify.com](https://netlify.com).
3. **Add new site → Import an existing project**.
4. Netlify lit `netlify.toml` automatiquement :
   - **Build command** : `npm run build:client`
   - **Publish directory** : `client/dist`
5. **Deploy site** — URL générée (`*.netlify.app`).

> Fallback SPA supplémentaire dans `client/public/_redirects`.

### Option C — GitHub Pages / autre hébergeur statique

```bash
npm run build:client
# Uploader le contenu de client/dist/
# Configurer une règle : toute route inconnue → index.html (HTTP 200)
```

---

## Scripts disponibles

| Commande | Description |
|----------|-------------|
| `npm run dev` | Frontend + API en parallèle |
| `npm run dev:client` | Frontend seul (recommandé) |
| `npm run dev:server` | API Express seule |
| `npm run build` | Build production complet |
| `npm run build:client` | Build client pour déploiement |
| `npm run preview` | Prévisualiser `client/dist` |
| `npm start` | Démarrer l'API compilée |

---

## Langues

Français (par défaut) et Anglais — bascule via les boutons **FR / EN** dans le header.

---

## Modèles de données

Voir [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) pour le schéma complet.

- **Users** — Habitants, commerçants, bénévoles relais
- **Posts_Annonces** — Dons, ventes, services, petits boulots
- **Local_Relais** — Dépôts/retraits, créneaux, QR codes
- **Acteurs_Locaux** — Commerces, brocanteurs, artisans
- **Agenda_Evénements** — Brocantes, animations, promos
- **Cartes_Fidélité_Scans** — Historique points fidélité

---

## Licence

Projet de démonstration — quartier des Chartrons, Bordeaux.
