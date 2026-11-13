# Servio

Application web de planning d'équipe et de gestion de stock pour la restauration.
La référence fonctionnelle et technique est [CAHIER_DES_CHARGES.md](CAHIER_DES_CHARGES.md) : lis la section concernée avant de travailler sur une fonctionnalité.

## Façon de travailler

Ce projet est un projet de portfolio : je dois comprendre et pouvoir expliquer chaque ligne. Pas de « vibe coding ».

- **Plan d'abord** : pour toute tâche qui touche plus d'un fichier, propose un plan (approche, fichiers créés ou modifiés, points discutables) et attends mon accord avant de coder.
- **Petites étapes** : une tâche à la fois, un changement relisible en quelques minutes. Ne fais pas plus que ce qui est demandé.
- **Explique tes choix** : pour chaque décision non évidente, dis pourquoi, et mentionne l'alternative principale.
- **Demande avant** d'ajouter une dépendance, de modifier la configuration de sécurité, de changer le modèle de données ou de s'écarter du cahier des charges.
- **Le cahier des charges fait foi** : si une décision le contredit, signale-le et propose la mise à jour du document plutôt que de l'ignorer.
- **Ne commite jamais sans mon accord**, et ne pousse jamais.
- Réponds en français.

## Stack

- Back : Symfony 7.4 LTS, PHP 8.3, API Platform, Doctrine, MySQL 8.4
- Authentification : SecurityBundle de Symfony, session et `json_login` (cookie de session `HttpOnly`)
- Front : React (JavaScript, fichiers `.jsx`), Vite, React Router
- Exports : Dompdf, PhpSpreadsheet
- Environnement : Symfony CLI, Vite (avec `proxy` vers l'API, même origine), MySQL 8.4 dans WSL. Pas de Docker, pas de CI : les vérifications se lancent en local.

## Structure

```
backend/                 API Symfony
  src/                   code de l'application (namespace App\)
  src/Service/<Domaine>/ logique métier
  tests/Factory/         outils qui créent des données de test (pas des tests)
  tests/                 tests PHPUnit (namespace App\Tests\)
  config/                configuration Symfony
frontend/                application React
  src/api/               appels à l'API (seul endroit où l'on utilise fetch)
  src/features/<nom>/    une fonctionnalité : composants, hooks, styles, tests
  src/test/              configuration des tests
docs/                    documentation et décisions (docs/decisions.md)
```

## Commandes

Les commandes Node se lancent dans le shell zsh de l'utilisateur (Node 22 via `.nvmrc`), pas avec le Node 18 du système.

**Back** (dans `backend/`)
- `symfony serve --no-tls` : lancer l'API sur `127.0.0.1:8000`
- `composer check` : toutes les vérifications (style, PHPStan, tests, audit des dépendances)
- `composer test` : tests PHPUnit (base `servio_test`)
- `composer stan` : PHPStan niveau 8
- `composer cs` : vérifier le style ; `composer cs:fix` : le corriger

**Front** (dans `frontend/`)
- `npm run dev` : lancer l'application sur `localhost:5173` (proxy `/api` vers Symfony)
- `npm run check` : toutes les vérifications (ESLint, Prettier, tests, build, audit des dépendances de production)
- `npm test` : tests Vitest
- `npm run lint` : ESLint
- `npm run format:check` : vérifier le style Prettier ; `npm run format` : le corriger
- `npm run build` : construire l'application

**Fichiers locaux, jamais commités** (dans `backend/`) : `.env`, `.env.local`, `.env.dev`, `.env.test.local`. Ne jamais lire ni afficher leurs valeurs.

## Conventions de code

- **Code en anglais** (classes, variables, routes, commentaires), **interface et documentation en français**.
- Lisibilité d'abord : noms explicites, fonctions courtes, une responsabilité par classe.
- Pas de code mort ni de code commenté. Les commentaires expliquent le *pourquoi*, pas le *quoi*.
- Pas de valeur magique : constantes, enums ou paramètres nommés.

**Back**
- `declare(strict_types=1);` partout, types sur toutes les propriétés, paramètres et retours.
- Enums PHP pour les statuts et les types.
- Logique métier dans des services, rangés par domaine dans `src/Service/<Domaine>/` (`Service/User/UserCreator`, plus tard `Service/Planning/…`). State Processors, contrôleurs et commandes restent fins : ils lisent l'entrée, appellent un service et renvoient le résultat. Entités sans logique métier.
- Une donnée invalide refusée par un service lève une exception dédiée (`src/Exception/`), que l'appelant transforme en message.
- PSR-12 (PHP-CS-Fixer), PHPStan niveau 8.

**Front**
- JavaScript moderne (ES modules, `const`/`let`, fonctions fléchées), pas de TypeScript.
- Composants fonctionnels et hooks uniquement.
- Organisation par fonctionnalité (`features/planning`, `features/inventory`…).
- Appels à l'API regroupés dans une couche dédiée, jamais dans les composants.
- Logique réutilisable dans des hooks (`useAuth`, `useTheme`…).
- Couleurs uniquement via les variables CSS du thème (mode jour et nuit).
- ESLint et Prettier.

## Sécurité (non négociable)

Détails dans la section 7 du cahier des charges.

- Jamais de secret dans le code ni dans le dépôt : variables d'environnement uniquement.
- Requêtes SQL uniquement via Doctrine avec paramètres liés, jamais de concaténation.
- Jamais de `dangerouslySetInnerHTML` ni d'`eval`.
- Chaque opération API déclare sa règle `security` ; les règles fines vont dans des Voters ; refus par défaut.
- Groupes de sérialisation explicites en lecture et en écriture : `roles`, `establishment`, `createdBy` ne sont jamais modifiables par l'utilisateur.
- Toutes les données sont filtrées par l'établissement de l'utilisateur connecté.
- Toute entrée (formulaire, fichier, réponse de l'IA) est validée côté serveur avec des contraintes Symfony.
- Rien d'authentifiant côté navigateur en dehors du cookie de session : ni jeton, ni `localStorage`.
- Chaque requête qui modifie des données est protégée contre le CSRF (`SameSite` et vérification de l'en-tête `Origin`).

## Tests

- Toute règle métier et toute règle d'accès est couverte par des tests (PHPUnit côté back, Vitest et React Testing Library côté front).
- Pour une règle métier, commence par proposer les cas de test.
- Lance les tests et les outils d'analyse avant de dire qu'une tâche est terminée, et donne le résultat réel.

## Git

- Une branche par tâche : `feat/…`, `fix/…`, `refactor/…`, `docs/…`, `chore/…`.
- Messages de commit en anglais, au format Conventional Commits (`feat: add shift voter`).
- Fusion par pull request vers `main`, uniquement si `composer check` (dans `backend/`) et `npm run check` (dans `frontend/`) passent. Lance-les avant de proposer un commit ou une fusion, et donne le résultat réel.
