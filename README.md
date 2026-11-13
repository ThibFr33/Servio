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

Créez ensuite `backend/.env.local` (jamais commité) avec vos propres valeurs :

```bash
DATABASE_URL="mysql://servio:VOTRE_MOT_DE_PASSE@127.0.0.1:3306/servio?serverVersion=8.4&charset=utf8mb4"
```

Puis générez un `APP_SECRET` propre à votre machine dans `backend/.env.dev` (également ignoré par Git) :

```bash
echo "APP_SECRET=$(php -r 'echo bin2hex(random_bytes(32));')" > .env.dev
```

`APP_SECRET` signe les jetons CSRF et les liens sécurisés : il doit rester secret et être différent sur chaque machine.

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
