# Servio — Cahier des charges

> Planning d'équipe et gestion de stock pour la restauration.
> Version 1.4 — 5 novembre 2026 — Thibault Charron

---

## Sommaire

1. [Présentation](#1-présentation)
2. [Utilisateurs et rôles](#2-utilisateurs-et-rôles)
3. [Fonctionnalités](#3-fonctionnalités)
4. [Règles de planification](#4-règles-de-planification)
5. [Modèle de données](#5-modèle-de-données)
6. [Architecture et contraintes techniques](#6-architecture-et-contraintes-techniques)
7. [Sécurité](#7-sécurité)
8. [Qualité du code](#8-qualité-du-code)
9. [Design](#9-design)
10. [Landing page et démo](#10-landing-page-et-démo)
11. [Feuille de route](#11-feuille-de-route)
12. [Livrables](#12-livrables)
13. [Hors périmètre](#13-hors-périmètre)

---

## 1. Présentation

### Contexte

Servio est né d'une expérience de manager en restauration. Dans la plupart des restaurants, le planning se fait encore sur Excel ou sur papier, l'inventaire est long et source d'erreurs, et la traçabilité HACCP (lots, DLC) repose sur des classeurs et des étiquettes conservées à la main.

### Objectifs

- **Planning** : construire la semaine rapidement, la publier à l'équipe, l'imprimer ou l'exporter, et être averti quand une règle de planification fixée par l'établissement n'est pas respectée.
- **Inventaire** : suivre le stock, faire les comptages sur mobile et être alerté quand un produit passe sous son seuil.
- **Traçabilité HACCP** : enregistrer les lots et les DLC à partir d'une photo, et recevoir des alertes avant expiration.
- **Portfolio** : un projet complet, propre et démontrable en ligne.

### Périmètre de départ

- Un seul établissement au lancement. Le modèle de données prévoit plusieurs établissements, pour ne rien avoir à refaire plus tard.
- Servio n'est pas un outil RH et ne sert pas de référence en matière de droit du travail : les règles de planification sont fixées par l'établissement, sous sa responsabilité.

---

## 2. Utilisateurs et rôles

### Les rôles

| Rôle | Qui | Résumé |
|---|---|---|
| `ROLE_ADMIN` | Le gérant | Gère l'établissement, les comptes, les règles de planification. A tous les droits. |
| `ROLE_MANAGER` | Un responsable d'équipe (chef de cuisine, responsable de salle…) | Gère le planning **des postes qui lui sont rattachés**, gère le stock, valide les inventaires. |
| `ROLE_EMPLOYE` | Un membre de l'équipe | Consulte le planning, l'exporte, saisit des comptages et des réceptions. |

Hiérarchie : `ROLE_ADMIN` hérite de `ROLE_MANAGER`, qui hérite de `ROLE_EMPLOYE`.

### Responsables par équipe

Chaque manager est rattaché à un ou plusieurs **postes** (`Position`) : Cuisine, Salle, Plonge… Il ne peut créer, modifier ou supprimer que les créneaux de ces postes. L'admin peut tout modifier.

Exemple : le chef de cuisine gère les postes Cuisine et Plonge, le responsable de salle gère le poste Salle.

### Tableau des droits

| Action | Employé | Manager | Admin |
|---|:-:|:-:|:-:|
| Voir le planning de toute l'équipe | ✅ lecture seule | ✅ | ✅ |
| Exporter ou imprimer le planning | ✅ | ✅ | ✅ |
| Créer, modifier, supprimer des créneaux | ❌ | ✅ ses postes | ✅ tous |
| Publier une semaine | ❌ | ✅ | ✅ |
| Voir les contrats et compteurs d'heures | ❌ | ✅ ses postes | ✅ |
| Saisir des comptages d'inventaire | ✅ | ✅ | ✅ |
| Enregistrer une réception (photo, lot, DLC) | ✅ | ✅ | ✅ |
| Valider une session d'inventaire | ❌ | ✅ | ✅ |
| Gérer produits, catégories, fournisseurs | ❌ | ✅ | ✅ |
| Voir prix et valeur du stock | ❌ | ✅ | ✅ |
| Gérer les règles de planification | ❌ | ❌ | ✅ |
| Gérer les comptes et les postes | ❌ | ❌ | ✅ |

Les règles fines (« seulement ses postes ») sont portées par des **Voters** Symfony.

---

## 3. Fonctionnalités

Chaque fonctionnalité est marquée **MVP** (première version) ou **Évolution** (après le MVP).

### 3.1 Authentification — MVP

- Connexion par email et mot de passe.
- Mot de passe **hashé** avec le `PasswordHasher` de Symfony (algorithme `auto`), jamais stocké en clair.
- Authentification par **session** avec le SecurityBundle de Symfony (`json_login`) : React et l'API sont servis depuis le même domaine.
- Un compte peut être désactivé sans être supprimé : l'accès est coupé immédiatement.
- Les comptes sont créés par l'admin : pas d'inscription publique.
- **Évolution** : réinitialisation du mot de passe par email, invitation d'un employé par email, option « rester connecté ».

### 3.2 Équipe — MVP

- Gestion des postes : nom et couleur (utilisée dans le planning).
- Fiche employé : poste principal, type de contrat (CDI, CDD, extra, apprenti), heures prévues par semaine, date d'embauche.
- Rattachement des managers à leurs postes.

### 3.3 Planning — MVP

- **Vue semaine** : grille employés × jours, créneaux en pastilles colorées par poste.
- La ligne de l'utilisateur connecté est surlignée.
- Création, modification et suppression de créneaux (jour, heure de début et de fin, poste, pause, note). Les services qui finissent après minuit sont gérés.
- **Brouillon puis publication** : les employés ne voient une semaine qu'une fois publiée.
- Un créneau modifié après publication affiche un badge « modifié ».
- **Compteur d'heures** par employé et par semaine, avec alerte en cas de dépassement du contrat.
- **Contrôle des règles de planification** (voir section 4) : avertissements affichés au manager, sans bloquer la saisie.
- **Impression** : feuille de style `@media print` dédiée.
- **Export** : PDF (Dompdf) et Excel (PhpSpreadsheet).
- **Mobile** : sur téléphone, le planning s'affiche en liste jour par jour.

**Évolutions :**
- Dupliquer la semaine précédente.
- Indisponibilités et congés posés par les employés, validés par le manager.
- Notification par email lors de la publication ou d'une modification.

### 3.4 Inventaire — MVP

- **Produits** : nom, catégorie, unité (kg, L, pièce), prix unitaire, fournisseur, seuil minimum.
- **Catégories** et **fournisseurs**.
- **Mouvements de stock** : entrée (livraison), sortie, perte ou casse, ajustement. Chaque mouvement garde son auteur et sa date.
- **Session d'inventaire** :
  1. Un manager ouvre la session : le stock théorique de chaque produit est figé.
  2. Les employés saisissent les quantités comptées, depuis leur téléphone.
  3. Le manager consulte les écarts, puis valide.
  4. La validation crée un mouvement d'ajustement pour chaque écart et met le stock à jour.
- **Alertes** : produits sous leur seuil.
- Les prix et la valeur du stock sont masqués aux employés.

**Évolutions :**
- Bon de commande généré à partir des produits sous le seuil.
- Export de l'inventaire en PDF et Excel.
- Tableaux de bord : valeur du stock dans le temps, pertes par catégorie.
- Fiches techniques (recettes) et coût matière des plats.

### 3.5 Traçabilité HACCP et lecture d'étiquettes — Évolution prioritaire

**Le parcours :**
1. À la livraison, l'employé photographie l'étiquette ou le bon de livraison depuis son téléphone.
2. React redimensionne l'image (environ 1 500 px sur le plus grand côté) et l'envoie à l'API.
3. Symfony transmet l'image à une API de vision (LLM), qui renvoie un JSON : produit, lot, DLC, quantité.
4. L'employé **vérifie et corrige** le formulaire prérempli, puis valide.
5. Servio crée le lot et le mouvement d'entrée. La photo reste attachée pour la traçabilité.

**Alertes DLC** : une tâche planifiée signale les lots qui expirent dans les 48 heures (délai paramétrable).

**Garde-fous :**
- **Validation humaine obligatoire** : l'IA propose, l'employé décide.
- La clé API reste uniquement côté Symfony, dans une variable d'environnement.
- Limite d'analyses par compte et par jour (Rate Limiter de Symfony).
- Plafond de dépense mensuel configuré chez le fournisseur de l'API.
- **Mode démo** : les comptes de démonstration reçoivent des réponses préenregistrées, sans appel à l'API.
- Chaque analyse est enregistrée (réponse de l'IA et corrections de l'employé) pour mesurer la fiabilité.

### 3.6 Planning selon l'activité — Évolution

- Le manager saisit le nombre de couverts prévus par service (midi, soir).
- Un ratio par poste (par exemple 1 serveur pour 20 couverts) donne le besoin en personnel.
- La grille affiche l'écart : « Samedi soir : 4 serveurs nécessaires, 3 planifiés ».
- Pas de prédiction automatique : les prévisions sont saisies par le manager.

### 3.7 Assistant de commande (serveur MCP) — Évolution

- Un serveur MCP expose quelques outils en lecture : stock, seuils, consommation moyenne, DLC.
- Un agent IA s'en sert pour répondre à des questions comme « Qu'est-ce que je dois commander pour demain ? ».
- Il s'appuie d'abord sur une logique simple, sans IA (produits sous le seuil plus consommation prévue), testée séparément.

---

## 4. Règles de planification

### Principe

- Servio propose quelques **contrôles simples** sur le planning.
- **C'est l'admin qui saisit les valeurs** de son établissement. Servio ne fournit aucune valeur légale et n'affirme rien sur la loi : il applique les réglages choisis.
- Chaque contrôle peut être **activé ou désactivé**. Sans valeur saisie, le contrôle est inactif.
- Une valeur peut être **ajustée pour un employé** (par exemple un apprenti qui a des horaires particuliers).
- Un dépassement produit un **avertissement**, jamais un blocage : le manager garde la main.

### Contrôles proposés

| Contrôle | Ce que Servio vérifie |
|---|---|
| Repos entre deux services | Le temps entre la fin d'une journée et le début de la suivante est au moins égal à la valeur saisie |
| Amplitude maximale | Le temps entre le début du premier service et la fin du dernier, coupure incluse, ne dépasse pas la valeur saisie |
| Jours de repos par semaine | L'employé a au moins le nombre de jours sans créneau saisi (option : jours consécutifs) |
| Durée maximale par jour | Le total des créneaux d'une journée ne dépasse pas la valeur saisie |
| Heures du contrat | Le total de la semaine ne dépasse pas les heures prévues au contrat de l'employé |

L'écran de réglage rappelle que les valeurs relèvent de la responsabilité de l'établissement (Code du travail, convention collective, accords d'entreprise).

### Stockage

Les durées sont stockées en **minutes** (11 h = 660) pour simplifier les calculs et éviter les erreurs d'arrondi.

---

## 5. Modèle de données

### Vue d'ensemble

```
Establishment ─┬─< User ── Employee >── Position
               │     └──<>── Position   (postes gérés par un manager)
               ├─< PlanningWeek ─< Shift >── Employee
               ├─< PlanningRule ─< RuleOverride >── Employee
               ├─< ServiceForecast
               ├─< Category ─< Product >── Supplier
               │                 ├─< StockLot ─< LabelScan
               │                 └─< StockMovement
               └─< InventorySession ─< InventoryLine >── Product
```

`─<` : un vers plusieurs. `<>` : plusieurs vers plusieurs.

### Entités

**Établissement et équipe**

| Entité | Champs principaux |
|---|---|
| `Establishment` | name, address, createdAt |
| `User` | email (unique), password (hashé), roles, firstName, lastName, isActive, lastLoginAt, establishment, **managedPositions** (ManyToMany Position) |
| `Position` | name, color, establishment |
| `Employee` | user (OneToOne), position, contractType (enum), weeklyHours, hiredAt, isActive |

**Planning**

| Entité | Champs principaux |
|---|---|
| `PlanningWeek` | establishment, startDate (un lundi, unique par établissement), status (`draft`, `published`), publishedAt, publishedBy |
| `Shift` | planningWeek, employee, position, startAt, endAt, breakMinutes, note, modifiedAfterPublish, createdBy, updatedAt |
| `PlanningRule` | establishment, code (enum), value (nullable), unit (`minutes`, `days`), isEnabled, options (json, par exemple jours consécutifs) |
| `RuleOverride` | employee, rule, value |
| `ServiceForecast` | establishment, date, service (`lunch`, `dinner`), expectedCovers |

**Inventaire et HACCP**

| Entité | Champs principaux |
|---|---|
| `Category` | name, establishment |
| `Supplier` | name, email, phone, establishment |
| `Product` | name, category, supplier, unit (enum), unitPrice, minThreshold, currentStock, isActive |
| `StockMovement` | product, type (`in`, `out`, `loss`, `adjustment`), quantity, comment, stockLot, inventorySession, createdBy, createdAt |
| `StockLot` | product, lotNumber, expiryDate, receivedQty, remainingQty, photo, receivedAt, receivedBy |
| `LabelScan` | stockLot, photo, rawResponse (json), corrections (json), createdBy, createdAt |
| `InventorySession` | establishment, status (`open`, `submitted`, `validated`), startedAt, validatedAt, validatedBy |
| `InventoryLine` | session, product, expectedQty, countedQty, countedBy, countedAt |

### Mécanismes clés

- **Stock** : `currentStock` est mis à jour à chaque mouvement. La table `StockMovement` reste la référence et permet de recalculer le stock.
- **Écart d'inventaire** : calculé (compté − attendu), jamais stocké.
- **Prix masqués** : groupes de sérialisation selon le rôle.
- **Contrôle des règles** : un service dédié lit les règles et les ajustements de l'employé, puis renvoie la liste des avertissements pour une semaine.

---

## 6. Architecture et contraintes techniques

### Stack

| Couche | Technologie |
|---|---|
| Back | Symfony 7.4 (LTS), PHP 8.3 (Symfony 8 demande PHP 8.4) |
| API | **API Platform** (REST, JSON-LD ou JSON) |
| Base de données | MySQL 8.4 (LTS) avec Doctrine ORM |
| Authentification | SecurityBundle de Symfony, session et `json_login` |
| Sécurité HTTP | En-têtes de sécurité (CSP, HSTS…) |
| Front | React (JavaScript, Vite), React Router |
| Exports | Dompdf (PDF), PhpSpreadsheet (Excel) |
| Tâches planifiées | Symfony Scheduler |
| Environnement local | Symfony CLI (`symfony serve`), serveur de développement Vite, MySQL 8.4 installé dans WSL |

### Même domaine pour le front et l'API

La session repose sur un cookie : React et l'API doivent être servis depuis la même origine.

- **En développement** : le serveur Vite redirige les appels `/api` vers le serveur Symfony (option `proxy` de Vite). Le navigateur ne voit qu'une seule origine.
- **En production** : le serveur web sert l'application React construite et transmet `/api` à Symfony, sur le même domaine.
- Conséquence : pas de configuration CORS nécessaire.
- **Contrainte de déploiement** : héberger le front et l'API sur des domaines différents imposerait CORS et des cookies `SameSite=None`, ce qui affaiblirait la protection CSRF. C'est à éviter, sauf décision documentée (par exemple l'ajout d'une application mobile ou d'une API publique).

### API Platform

- Les opérations standard (lecture, création, modification, suppression) sont déclarées sur les ressources.
- La sécurité de chaque opération passe par l'attribut `security` et par les Voters.
- La logique métier vit dans des **State Processors** et des **services**, jamais dans les entités.
- Les **groupes de sérialisation** contrôlent ce que chaque rôle voit.
- Les actions qui ne sont pas du CRUD ont leur propre opération :
  - `POST /planning_weeks/{id}/publish` : publier une semaine
  - `POST /planning_weeks/{id}/duplicate` : dupliquer une semaine
  - `GET /planning_weeks/{id}/export.pdf` et `export.xlsx`
  - `GET /planning_weeks/{id}/warnings` : avertissements des règles de planification
  - `POST /inventory_sessions/{id}/validate` : valider un inventaire
  - `POST /label_scans` : analyser une photo d'étiquette

La sécurité fait l'objet de la section 7.

---

## 7. Sécurité

La sécurité est une exigence de premier rang. Servio suit les recommandations de l'**OWASP** (Top 10 et ASVS niveau 2 comme référence). Aucun système n'est invulnérable : l'objectif est d'appliquer systématiquement les bonnes pratiques, de les vérifier automatiquement et de les tester.

### 7.1 Principes

- **Refus par défaut** : tout est interdit, sauf ce qui est explicitement autorisé.
- **Ne jamais faire confiance au client** : toute donnée venant de React, d'un fichier ou de l'IA est validée côté serveur.
- **Moindre privilège** : chaque rôle, chaque compte de base de données, chaque clé n'a que les droits nécessaires.
- **Défense en profondeur** : plusieurs protections indépendantes plutôt qu'une seule.
- **Minimisation des données** : on ne collecte que ce qui sert.

### 7.2 Protection des données sensibles

**Mots de passe**
- Hashés avec le `PasswordHasher` de Symfony (algorithme `auto`, donc argon2id ou bcrypt).
- Jamais renvoyés par l'API, jamais écrits dans les logs.
- Longueur minimale de 12 caractères, et refus des mots de passe connus pour avoir fuité (contrainte `NotCompromisedPassword`).

**Secrets**
- Secret de l'application (`APP_SECRET`), clé de l'API de vision, identifiants de base de données : dans des variables d'environnement, et dans le **coffre de secrets de Symfony** en production.
- `.env.local` et les clés privées ne sont jamais versionnés. Un scan de secrets (gitleaks) tourne dans la CI.
- La clé de l'API de vision n'existe que côté Symfony, jamais dans le code React.

**Données exposées par l'API**
- Des **groupes de sérialisation** définissent précisément les champs renvoyés pour chaque rôle. Rien n'est exposé par défaut.
- Les employés ne voient ni les prix, ni la valeur du stock, ni les contrats et compteurs d'heures des collègues.
- **Isolation par établissement** : une extension API Platform filtre automatiquement toutes les requêtes sur l'établissement de l'utilisateur connecté.
- **Identifiants UUID** (v7) au lieu d'identifiants qui se suivent (1, 2, 3…), pour empêcher de deviner les ressources. C'est une protection en plus des Voters, pas à leur place. MySQL n'ayant pas de type UUID natif, ils sont stockés en `BINARY(16)` par le type `uuid` de Doctrine.

**Erreurs et logs**
- En production (`APP_DEBUG=0`), les erreurs renvoient un message générique, sans trace technique.
- Les logs ne contiennent ni mot de passe, ni jeton, ni clé.
- Les événements de sécurité sont journalisés : connexions échouées, changements de rôle, désactivation de compte.

**Transport et stockage**
- HTTPS obligatoire, avec en-tête HSTS.
- L'utilisateur de base de données de l'application n'a pas les droits d'administration (pas de création ni de suppression de tables en production).
- Les sauvegardes sont chiffrées.

**Données personnelles (RGPD)**
- Seules les données utiles sont collectées (nom, email, poste, contrat).
- Un employé qui quitte l'établissement est désactivé, puis ses données sont anonymisées après une durée définie.
- Les photos d'étiquettes ne contiennent pas de données personnelles : les métadonnées (EXIF, dont la position GPS) sont supprimées.

### 7.3 Authentification et sessions

- **Session Symfony** ouverte par `json_login` sur `/api/login`, fermée par `/api/logout`.
- Cookie de session **`HttpOnly`, `Secure`, `SameSite=Lax`** : un script malveillant ne peut pas le lire, et il n'est pas envoyé par les requêtes venant d'autres sites. Rien d'autre n'est stocké côté navigateur pour l'authentification (ni jeton, ni `localStorage`).
- **Protection CSRF** : en plus de `SameSite`, l'API vérifie l'en-tête `Origin` sur chaque requête qui modifie des données (ou utilise la protection CSRF de Symfony).
- **Régénération de l'identifiant de session** à la connexion, contre la fixation de session (comportement par défaut de Symfony).
- **Expiration** de la session après une période d'inactivité (par exemple 2 heures).
- **Limitation des tentatives de connexion** (`login_throttling` de Symfony).
- Le message d'erreur de connexion est identique que l'email existe ou non, pour ne pas révéler les comptes existants.
- Désactiver un compte ou changer son mot de passe met fin à ses sessions : l'utilisateur est vérifié à chaque requête.
- Réinitialisation du mot de passe (évolution) : jeton à usage unique, qui expire en moins d'une heure (symfonycasts/reset-password-bundle).

### 7.4 Contrôle des accès

- `access_control` : toute route `/api` exige d'être connecté, sauf la connexion.
- Chaque opération API Platform déclare sa règle avec l'attribut `security`.
- Les règles fines (manager limité à ses postes, employé limité à la lecture) sont dans des **Voters**.
- **Protection contre l'affectation de masse** : les groupes de dénormalisation listent les champs modifiables. Un utilisateur ne peut jamais envoyer `roles`, `establishment` ou `createdBy` : ces champs sont fixés côté serveur.
- Les champs inconnus envoyés à l'API sont refusés.

### 7.5 Injections SQL

- Tous les accès à la base passent par **Doctrine** (ORM, QueryBuilder ou DQL) avec des **paramètres liés** (`setParameter`).
- **Interdit** : concaténer une valeur venant de l'utilisateur dans une requête, ou écrire du SQL brut avec des valeurs non liées.
- Les filtres d'API Platform (recherche, tri, dates) sont paramétrés par le framework.
- Les noms de colonnes utilisés pour un tri viennent d'une liste autorisée, jamais directement de la requête.

### 7.6 Scripts malveillants (XSS)

- React échappe automatiquement tout ce qu'il affiche.
- **Interdit** : `dangerouslySetInnerHTML` (règle ESLint `react/no-danger`) et `eval`.
- Les liens construits à partir de données sont vérifiés (seulement `https:` et `mailto:`, jamais `javascript:`).
- Les gabarits Twig des exports PDF gardent l'**échappement automatique**. Dompdf est configuré sans chargement de ressources distantes ni exécution de PHP.
- **Content Security Policy** stricte : scripts uniquement depuis le domaine de Servio, aucun script en ligne, aucun `iframe` externe.
- **Injection dans les exports Excel** : toute cellule qui commence par `=`, `+`, `-` ou `@` est neutralisée, pour éviter qu'un nom de produit malveillant ne s'exécute comme une formule dans Excel.

### 7.7 Formulaires et validation

- **Double validation** : côté React pour le confort de l'utilisateur, et **côté Symfony pour la sécurité**. Seule la seconde fait foi.
- Chaque champ a des **contraintes Symfony** : type, longueur maximale, plage de valeurs, format (email, date).
- Des **contraintes métier** : un créneau finit après son début, une quantité n'est jamais négative, une DLC est une date valide.
- Taille maximale des requêtes limitée.
- Les messages d'erreur de validation n'exposent aucun détail technique.

### 7.8 Envoi de fichiers (photos d'étiquettes)

- Formats acceptés : JPEG, PNG, WebP. Le type est vérifié **à partir du contenu réel du fichier**, pas de son extension.
- Taille maximale : 10 Mo.
- L'image est **réencodée** côté serveur, ce qui supprime tout contenu caché et les métadonnées.
- Le fichier est renommé avec un identifiant aléatoire et stocké **hors du dossier public**.
- Les photos sont servies par une route protégée, qui vérifie les droits de l'utilisateur.

### 7.9 Sécurité de la lecture par IA

- La réponse de l'IA est traitée comme une **donnée non fiable** : elle est validée par les mêmes contraintes qu'une saisie manuelle.
- La réponse est imposée au format JSON par un schéma strict. Tout ce qui n'est pas conforme est rejeté.
- Un texte piégé sur une étiquette (« ignore tes instructions… ») ne peut rien déclencher : l'IA ne fait que **préremplir un formulaire**, elle n'a accès à aucune action.
- Validation humaine obligatoire avant tout enregistrement.
- Limite d'analyses par compte et par jour, plafond de dépense mensuel.

### 7.10 En-têtes et configuration HTTP

| En-tête | Rôle |
|---|---|
| `Content-Security-Policy` | Bloque les scripts et ressources non autorisés |
| `Strict-Transport-Security` | Impose HTTPS |
| `X-Content-Type-Options: nosniff` | Empêche le navigateur de deviner le type d'un fichier |
| `Referrer-Policy: strict-origin-when-cross-origin` | Limite les informations transmises aux autres sites |
| `Permissions-Policy` | Autorise l'appareil photo pour Servio uniquement, bloque le reste (micro, géolocalisation…) |
| `frame-ancestors 'none'` (dans la CSP) | Empêche d'afficher Servio dans un cadre (protection contre le clickjacking) |

- **Pas de CORS** : le front et l'API partagent la même origine, aucune autre origine n'est autorisée.
- **Limitation de débit** (Rate Limiter de Symfony) sur la connexion, l'analyse d'étiquettes et l'API en général.

### 7.11 Dépendances et intégration continue

- `composer audit` et `npm audit` dans la CI : une faille connue dans une dépendance bloque la fusion.
- **Dependabot** propose les mises à jour de sécurité.
- **gitleaks** vérifie qu'aucun secret n'est commité.
- PHPStan et ESLint (avec des règles de sécurité) bloquent les pratiques dangereuses.
- Analyse automatique **OWASP ZAP** sur l'environnement de démo (évolution).

### 7.12 Tests de sécurité

Des tests automatisés vérifient chaque protection :
- **Droits par rôle** : chaque route est testée avec un employé, un manager et un admin.
- **Isolation** : un utilisateur de l'établissement A ne peut ni lire ni modifier les données de l'établissement B.
- **Manager limité** : un responsable de salle ne peut pas modifier un créneau de cuisine.
- **Affectation de masse** : un employé qui envoie `roles: ["ROLE_ADMIN"]` reste employé.
- **Injections** : des valeurs piégées (`' OR 1=1 --`, `<script>alert(1)</script>`) sont enregistrées comme du texte inoffensif et affichées sans s'exécuter.
- **Fichiers** : un faux fichier image (un script renommé en `.jpg`) est refusé.
- **Exports** : un nom de produit commençant par `=` n'est pas interprété comme une formule.

### 7.13 Démo en ligne

- Les comptes de démo ne peuvent pas changer leur mot de passe ni gérer les comptes.
- Les données de démo sont fictives et remises à zéro régulièrement.
- La lecture d'étiquettes en démo utilise des réponses préenregistrées.

---

## 8. Qualité du code

Le code doit être **clair, propre, factorisé et cohérent**. C'est une exigence au même titre que les fonctionnalités.

### Principes

- **Lisibilité d'abord** : des noms explicites, des fonctions courtes qui font une seule chose.
- **Le code en anglais**, la documentation et l'interface en français. Les noms de classes, de variables et de routes sont en anglais (`PlanningWeek`, `publishedAt`), les textes affichés sont en français.
- **Pas de code mort**, pas de code commenté laissé « au cas où ».
- **Des commentaires utiles** : ils expliquent le *pourquoi*, pas le *quoi*. Une règle métier non évidente est commentée avec sa source.
- **Pas de valeur magique** : les constantes, les enums et les paramètres ont un nom.

### Back (Symfony)

- `declare(strict_types=1);` dans chaque fichier, types sur toutes les propriétés, paramètres et retours.
- **Enums PHP** pour les statuts et les types (`ShiftStatus`, `ContractType`, `MovementType`…).
- Contrôleurs et processors **fins** : la logique métier est dans des services testables.
- Une classe, une responsabilité : `PlanningRuleChecker`, `InventoryValidator`, `LabelScanner`…
- Style **PSR-12**, vérifié par **PHP-CS-Fixer**.
- Analyse statique avec **PHPStan** (niveau 8 visé).

### Front (React)

- **JavaScript** moderne (fichiers `.jsx`). TypeScript pourra être adopté plus tard, fichier par fichier.
- Les données reçues de l'API sont vérifiées et transformées dans la couche dédiée aux appels, pour que les composants reçoivent toujours des données au format attendu.
- Composants courts, organisés par fonctionnalité (`features/planning`, `features/inventory`…).
- Les appels à l'API sont regroupés dans une couche dédiée, jamais dispersés dans les composants.
- La logique réutilisable passe par des **hooks** personnalisés (`usePlanningWeek`, `useAuth`…).
- **ESLint** et **Prettier** pour un style uniforme.

### Tests

- **PHPUnit** : tests unitaires des services métier (règles de planification, validation d'inventaire, calcul de stock) et tests fonctionnels de l'API (droits par rôle).
- **Vitest** et **React Testing Library** pour les composants et hooks importants.
- Priorité aux tests sur les règles métier et la sécurité, là où une erreur coûte le plus cher.

### Git et intégration continue

- Une branche par fonctionnalité, fusionnée par pull request.
- Messages de commit au format **Conventional Commits** (`feat:`, `fix:`, `refactor:`…).
- **GitHub Actions** lance à chaque push : PHP-CS-Fixer, PHPStan, PHPUnit, ESLint et les tests React.
- Une fusion n'a lieu que si tout est vert.

---

## 9. Design

### Style

Épuré et minimaliste : beaucoup d'espace, une seule couleur d'accent, une typographie simple.

- **Police** : Inter, ou la police système.
- **Couleurs** : fond blanc et gris clair, texte noir doux, accent vert sauge.
- **Couleurs fonctionnelles** : vert (validé, publié), orange (avertissement, stock bas, DLC proche), rouge (erreur, rupture).
- **Couleurs par poste** dans le planning, définies par l'admin.
- Coins arrondis, ombres très légères, cartes plutôt que tableaux lourds.

### Mode jour et mode nuit

**Fonctionnement :**
- Un interrupteur **Jour / Nuit** dans l'en-tête, accessible à tous les rôles.
- Au premier lancement, Servio suit le réglage de l'appareil (`prefers-color-scheme`).
- Le choix de l'utilisateur est ensuite retenu sur son appareil (`localStorage`). Ce réglage n'a rien de sensible : aucune donnée personnelle n'y est stockée.
- Le thème est appliqué avant le premier affichage, pour éviter un flash blanc au chargement en mode nuit.

**Palette :**

| Élément | Jour | Nuit |
|---|---|---|
| Fond | blanc `#FFFFFF` | presque noir `#141416` (pas un noir pur, plus reposant) |
| Panneaux | gris très clair `#F6F6F4` | gris foncé `#1E1E21` |
| Texte principal | noir doux `#1D1D1F` | blanc cassé `#F5F5F7` |
| Texte secondaire | gris `#6E6E73` | gris clair `#A1A1A6` |
| Accent | vert sauge `#5E7D63` | vert sauge éclairci `#8FB394` |
| Couleurs des postes et alertes | teintes claires, texte foncé | teintes sombres, texte clair |

**Implémentation :**
- Toutes les couleurs sont des **variables CSS** (`--bg`, `--text`, `--accent`…), définies une fois pour chaque mode. Aucune couleur n'est écrite en dur dans les composants.
- Le changement de mode modifie seulement l'attribut `data-theme` sur la racine de l'application.
- Un hook `useTheme` gère le choix, la détection du réglage de l'appareil et la mémorisation.
- Chaque combinaison texte et fond respecte un **contraste suffisant** (WCAG AA) dans les deux modes.
- Les exports PDF et l'impression restent toujours en mode jour, plus lisible sur papier.

### Mobile d'abord pour les employés

- Planning en liste jour par jour sur téléphone.
- Comptages d'inventaire avec de grands champs faciles à toucher.
- Prise de photo d'étiquette directement depuis l'appareil photo.
- Le manager et l'admin travaillent surtout sur ordinateur (grille semaine complète).

### Maquettes réalisées

- Écran planning, vue manager (grille semaine, avertissement d'amplitude, actions)
- Écran planning en mode jour et mode nuit
- Landing page
- Écran « Règles de planification » (contrôles activables, valeurs saisies par l'admin)
- Mobile employé : planning de la semaine, saisie d'inventaire, réception d'une livraison par photo

Toutes les maquettes existent en mode jour et en mode nuit, sauf la landing page.

---

## 10. Landing page et démo

### Landing page

Une page publique qui présente Servio :

1. En-tête : logo, « Fonctionnalités », « Se connecter »
2. Accroche : « Le planning et le stock de votre restaurant, enfin simples », avec un aperçu du planning
3. Mention « Conçu par un ancien manager de restauration »
4. Les fonctionnalités en 4 cartes
5. « Prêt en trois étapes »
6. Accès à la démo
7. Pied de page : auteur, GitHub, contact

La landing page est réalisée **à la fin**, avec de vraies captures d'écran.

### Démo en ligne

- Deux comptes de démonstration : **manager** et **employé**, accessibles en un clic.
- Données fictives réalistes (équipe, semaines de planning, produits, lots).
- Mode démo pour la lecture d'étiquettes : réponses préenregistrées, aucun appel payant.
- Remise à zéro régulière des données de démo.

---

## 11. Feuille de route

| Étape | Contenu | Statut |
|---|---|---|
| 1. Socle | Projet Symfony et React, proxy Vite, CI (avec audits de sécurité), authentification par session, rôles, Voters, isolation par établissement, en-têtes de sécurité, équipe et postes | À faire |
| 2. Planning | Grille semaine, créneaux, brouillon et publication, règles de planification, impression, exports | À faire |
| 3. Inventaire | Produits, catégories, fournisseurs, mouvements, sessions, alertes de seuil | À faire |
| 4. HACCP | Lots, DLC, lecture d'étiquettes, alertes DLC | À faire |
| 5. Activité | Couverts prévus et besoin en personnel | À faire |
| 6. Assistant | Serveur MCP pour les suggestions de commande | À faire |
| 7. Présentation | Landing page, démo en ligne, finalisation du README, vidéo | Au fil de l'eau |

Chaque étape doit être **terminée et utilisable** avant de passer à la suivante. Les étapes 1 à 4 constituent le cœur du projet.

---

## 12. Livrables

- **Code source** sur GitHub, avec un historique de commits propre.
- **README** soigné :
  - capture ou GIF en tête
  - le problème en deux phrases
  - les fonctionnalités
  - la stack et l'architecture
  - l'installation en local (Symfony CLI, MySQL 8.4, Node)
  - les comptes de démo
  - les choix techniques (Voters, règles de planification paramétrables, validation humaine de l'OCR…)
- **Démo en ligne** avec comptes de démonstration.
- **Vidéo** de 1 à 2 minutes : construire une semaine, recevoir un avertissement, publier, photographier une livraison et voir la DLC enregistrée.

---

## 13. Hors périmètre

Ce que Servio ne fait volontairement pas :

- La paie et le calcul des salaires.
- La prédiction automatique de l'activité.
- La caisse et la prise de commande en salle.
- La gestion de plusieurs établissements dans l'interface (le modèle de données le permet, mais l'interface n'est pas prévue au MVP).
- Une application mobile native : Servio est une application web adaptée au mobile.
- Le conseil juridique : Servio ne fournit aucune valeur légale, c'est l'établissement qui saisit ses propres règles.
