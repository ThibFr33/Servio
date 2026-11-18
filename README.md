# Servio
Planning d'équipe et gestion de stock pour la restauration : planning hebdomadaire, inventaire, traçabilité HACCP avec lecture d'étiquettes. Symfony, API Platform et React.

Projet en cours de développement.

## Fonctionnalités prévues

- Planning hebdomadaire avec impression et export (PDF, Excel)
- Contrôle des règles de planification fixées par l'établissement
- Inventaire et alertes de stock bas
- Traçabilité HACCP : lots, DLC, lecture d'étiquettes par photo

## Stack

Symfony · API Platform · React · MySQL

## Installation locale

Prérequis : PHP 8.3, Composer, Symfony CLI, MySQL 8.4, Node 22.

### Back

```bash
cd backend
composer install
```

Définissez `DATABASE_URL` (connexion à votre base MySQL) dans `backend/.env.local`, et `APP_SECRET` (une chaîne aléatoire propre à votre machine) dans `backend/.env.dev`. Ces deux fichiers sont ignorés par Git.

Lancez l'API :

```bash
symfony serve --no-tls
```

### Front

Dans un second terminal :

```bash
cd frontend
npm install
npm run dev
```

L'application est disponible sur http://localhost:5173. Vite redirige les appels `/api` vers Symfony (`127.0.0.1:8000`) : le front et l'API partagent la même origine.

### Créer un compte

Il n'y a pas d'inscription publique. Le premier compte se crée en ligne de commande (le mot de passe est demandé de façon masquée) :

```bash
cd backend
php bin/console app:user:create vous@exemple.fr Prénom Nom --role=admin --establishment="Mon restaurant"
```

### Tester l'API avec Postman

Toute requête qui modifie des données (`POST`, `PUT`, `PATCH`, `DELETE`) doit porter un en-tête `Origin` égal à l'adresse appelée, sinon l'API répond 403 (protection CSRF). Pour appeler directement `http://127.0.0.1:8000`, ajoutez l'en-tête :

```
Origin: http://127.0.0.1:8000
```

Postman conserve ensuite le cookie de session après `POST /api/login`, comme un navigateur.
