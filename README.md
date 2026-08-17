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
| **Concierge IA** | Assistant multilingue (FR, EN, ES, DE, IT, PT, NL) : Top 5 commerces avec budget estimé, Click & Collect WhatsApp/SMS, itinéraires à pied et notes patrimoine |
| **Signalements civiques** | Propreté, voirie, éclairage, déchets, bruit, stationnement — texte prêt à envoyer vers Allô Mairie ou la Police Municipale |
| **Urgences & évacuation** | Barre d'appel en un geste (15/17/18/112/114), risque de crue de la Garonne, consignes type Plan Communal de Sauvegarde, points de regroupement |

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

## Concierge IA multilingue

L'endpoint `POST /api/concierge` (Express) interroge **OpenAI `gpt-4o-mini`**. La clé reste côté serveur : elle n'est jamais envoyée au navigateur.

```bash
cp server/.env.example server/.env   # puis renseigner OPENAI_API_KEY
npm run dev                          # client + API
```

| Vérification | Commande |
|--------------|----------|
| Clé détectée | `curl localhost:3001/api/concierge/status` |
| Réponse | `curl -X POST localhost:3001/api/concierge -H 'Content-Type: application/json' -d '{"message":"une boulangerie rue Notre-Dame"}'` |

**Garde-fous du prompt** : le modèle ne reçoit que les commerces du quartier issus de `shared/src/data/chartronsPois.ts` et l'histoire des rues de `shared/src/data/chartronsHeritage.ts`. Il ne peut donc pas inventer d'adresse, se limite à 5 recommandations et redirige toute question hors quartier vers une piste locale.

**Sans backend** (build statique GitHub Pages, hors ligne ou clé absente) : le moteur de correspondance de `shared/src/logic/concierge.ts` tourne directement dans le navigateur et produit le même Top 5 avec budgets et notes patrimoine, dans la langue détectée. La réponse est alors marquée « hors ligne ».

Pour brancher une API distante sur le site statique, définir `VITE_CONCIERGE_API_URL` au build.

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
| `npm run deploy` | Build complet puis publication sur la branche `gh-pages` |

---

## Langues

Interface en Français (par défaut) et Anglais — bascule via les boutons **FR / EN** dans le header.

Le concierge IA détecte en plus l'espagnol, l'allemand, l'italien, le portugais et le néerlandais, et répond dans la langue du visiteur (sélecteur « Langue de réponse » ou détection automatique).

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
