# Database Schema — IDÉA CHARTRONS

Schéma TypeScript partagé (`shared/src/types/`). Mode invité intégral : **aucune table Users**, aucun profil, aucune session habitant ou commerçant.

La seule porte d’administration est le code `VITE_ADMIN_PASSCODE` (session navigateur).

## Carnet d’appareil (local)

Les points et le droit d’édition vivent dans le navigateur (`deviceId` + registre d’annonces). Rien n’est rattaché à une identité.

## Posts_Annonces

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `auteurNom` | `string \| null` | Nom d’affichage libre, facultatif |
| `titre` | `string` | Titre de l’annonce |
| `description` | `string` | Description détaillée |
| `type` | `PostType` | `Don` \| `Vente` \| `Service_Aide` \| `Petit_Boulot` |
| `prix` | `number \| null` | Prix en euros (null = gratuit) |
| `statut` | `PostStatus` | `Disponible` \| `Réservé` \| `Dépôt_Local` \| `Clôturé` |
| `photos` | `string[]` | URLs des photos |
| `telephone` | `string \| null` | Contact optionnel |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Local_Relais

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `postId` | `string` | FK → Posts_Annonces |
| `deposantNom` | `string \| null` | Nom laissé au dépôt, sans compte |
| `codeQrValidation` | `string` | Code QR pour validation |
| `dateDepot` | `string` | Date de dépôt |
| `statutRetrait` | `LocalRelaisRetraitStatus` | `En_Attente` \| `Disponible_Au_Local` \| `Récupéré` |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Acteurs_Locaux / POI

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `nomCommerce` | `string` | Nom du commerce |
| `categorie` | `ActeurLocalCategory` | Catégorie large d’annuaire |
| `subcategory` | `ChartronsSubcategory` | Taxonomie unifiée (voir ci-dessous) |
| `specialite` | `string \| null` | Spécialité fine affichée |
| `description` | `string` | Présentation |
| `adresse` | `string` | Adresse physique |
| `photos` | `string[]` | URLs photos vitrine |
| `offreVip` | `string \| null` | Offre fidélité VIP |
| `dailyMenuStatus` | `ArdoiseStatus` | `pending` \| `approved` \| `rejected` |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

### Sous-catégories commerciales

- `artisans`
- `metiers_de_bouche`
- `boutiques`
- `services_proximite`
- `restauration_cafes`
- `patrimoine_tourisme` (musées, hôtels, lieux de culte)

## Civic_Reports

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `subcategoryId` | `ReportSubcategoryId` | Taxonomie Mairie / Police |
| `channel` | `CivicReportChannel` | `mairie` \| `police` |
| `lieu` | `string` | Lieu précis |
| `details` | `string` | Précisions |
| `statut` | `CivicReportStatus` | `nouveau` \| `validé` \| `transmis` \| `rejeté` |
| `langue` | `string` | Langue de rédaction |
| `createdAt` | `string` | ISO 8601 |

### Sous-catégories Mairie

- `voirie_proprete`
- `eclairage_public`
- `espaces_verts_animaux`
- `accessibilite_pmr`

### Sous-catégories Police Municipale

- `nuisances_sonores`
- `tranquillite_publique`
- `stationnement_genant`

## Agenda_Evénements

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `organisateurNom` | `string \| null` | Nom d’organisateur libre |
| `titre` | `string` | Titre de l’événement |
| `description` | `string` | Description |
| `dateDebut` | `string` | ISO 8601 |
| `dateFin` | `string` | ISO 8601 |
| `type` | `EventType` | `Brocante` \| `Animation_Asso` \| `Promo_Flash` \| `Marché` |

## Cartes_Fidélité_Scans

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `deviceId` | `string` | Carnet d’appareil, jamais une personne |
| `commerceId` | `string` | FK → Acteurs_Locaux |
| `pointsGagnes` | `number` | Points attribués |
| `date` | `string` | Date du scan ISO 8601 |

## Relations

```
Posts_Annonces ──< Local_Relais
Acteurs_Locaux ──< Cartes_Fidélité_Scans
Civic_Reports (anonymes, relus en admin)
```

## API Endpoints

| Méthode | Route | Collection |
|---------|-------|------------|
| GET | `/api/health` | Health check |
| GET/POST | `/api/posts` | Posts_Annonces |
| GET/POST | `/api/acteurs` | Acteurs_Locaux |
| GET/POST | `/api/events` | Agenda_Evénements |
| GET | `/api/relais` | Local_Relais |
| GET/POST | `/api/fidelite` | Cartes_Fidélité_Scans |
| GET/POST | `/api/signalements` | Civic_Reports |
| POST | `/api/concierge` | Concierge IA |
