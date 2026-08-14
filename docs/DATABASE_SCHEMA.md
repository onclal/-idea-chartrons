# Database Schema — IDÉA CHARTRONS

Schéma de données TypeScript partagé entre client et serveur (`shared/src/types/`).

## Users

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `nom` | `string` | Nom complet |
| `email` | `string` | Adresse email |
| `role` | `UserRole` | `Habitant` \| `Commerçant` \| `Admin` |
| `badgeVerifie` | `boolean` | Badge de confiance quartier |
| `adresse` | `string` | Adresse dans les Chartrons |
| `languePreferee` | `PreferredLanguage` | `fr` \| `en` |
| `pointsFidelite` | `number` | Points cumulés |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Posts_Annonces

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `auteurId` | `string` | FK → Users |
| `titre` | `string` | Titre de l'annonce |
| `description` | `string` | Description détaillée |
| `type` | `PostType` | `Don` \| `Vente` \| `Service_Aide` \| `Petit_Boulot` |
| `prix` | `number \| null` | Prix en euros (null = gratuit) |
| `statut` | `PostStatus` | `Disponible` \| `Réservé` \| `Dépôt_Local` \| `Clôturé` |
| `photos` | `string[]` | URLs des photos |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Local_Relais

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `postId` | `string` | FK → Posts_Annonces |
| `codeQrValidation` | `string` | Code QR pour validation |
| `dateDepot` | `string` | Date de dépôt |
| `statutRetrait` | `LocalRelaisRetraitStatus` | `En_Attente` \| `Inspecté_Et_Validé` \| `Récupéré` |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Acteurs_Locaux

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `userId` | `string` | FK → Users |
| `nomCommerce` | `string` | Nom du commerce |
| `categorie` | `ActeurLocalCategory` | Voir enum |
| `description` | `string` | Présentation |
| `adresse` | `string` | Adresse physique |
| `photos` | `string[]` | URLs photos vitrine |
| `offreVip` | `string \| null` | Offre fidélité VIP |
| `qrCodeVitrine` | `string` | QR code vitrine |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

### ActeurLocalCategory

- `Commerçant`
- `Brocanteur_Rue_Notre_Dame`
- `Artisan`
- `Libéral`
- `Association`

## Agenda_Evénements

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `organisateurId` | `string` | FK → Users |
| `titre` | `string` | Titre de l'événement |
| `description` | `string` | Description |
| `dateDebut` | `string` | ISO 8601 |
| `dateFin` | `string` | ISO 8601 |
| `image` | `string \| null` | URL image |
| `type` | `EventType` | `Brocante` \| `Animation_Asso` \| `Promo_Flash` |
| `createdAt` | `string` | ISO 8601 |
| `updatedAt` | `string` | ISO 8601 |

## Cartes_Fidélité_Scans

| Champ | Type | Description |
|-------|------|-------------|
| `id` | `string` | Identifiant unique |
| `userId` | `string` | FK → Users |
| `commerceId` | `string` | FK → Acteurs_Locaux |
| `pointsGagnes` | `number` | Points attribués |
| `date` | `string` | Date du scan ISO 8601 |

## Relations

```
Users ──┬──< Posts_Annonces
        ├──< Acteurs_Locaux
        ├──< Agenda_Evénements (organisateur)
        └──< Cartes_Fidélité_Scans

Posts_Annonces ──< Local_Relais

Acteurs_Locaux ──< Cartes_Fidélité_Scans
```

## API Endpoints

| Méthode | Route | Collection |
|---------|-------|------------|
| GET | `/api/health` | Health check |
| GET | `/api/users` | Users |
| GET | `/api/users/:id` | User |
| GET | `/api/posts` | Posts_Annonces |
| GET | `/api/posts/:id` | Post |
| GET | `/api/acteurs` | Acteurs_Locaux |
| GET | `/api/acteurs/:id` | Acteur |
| GET | `/api/events` | Agenda_Evénements |
| GET | `/api/events/:id` | Event |
| GET | `/api/relais` | Local_Relais |
| GET | `/api/fidelite` | Cartes_Fidélité_Scans |
