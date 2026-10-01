# DS_e-Drive — Guide de mise en ligne (version sécurisée + carte)

Temps nécessaire : environ 15 minutes. Tout est gratuit.

## Ce qui a changé

1. **Espace admin sécurisé.** Le code `2026`, qui était visible dans le code source de la page, est supprimé. La connexion se fait maintenant par e-mail et mot de passe via **Firebase Authentication** (Google). La vérification a lieu côté serveur, dans les règles Firestore : même quelqu'un qui lit le code du site ne peut rien modifier.
2. **Changement du mot de passe dans le navigateur.** Onglet Admin > **🔒 Sécurité**. Il y a aussi un lien « Mot de passe oublié ? » qui envoie un lien de réinitialisation par e-mail.
3. **Données partagées.** Avant, les chauffeurs approuvés et les candidatures restaient dans *votre* navigateur (localStorage) et les visiteurs ne les voyaient pas. Ils sont maintenant enregistrés dans une base **Firestore**, avec mise à jour en temps réel pour tous.
4. **Carte et itinéraires.** Carte OpenStreetMap avec les fokontany de Diego et 14 localités hors Diego (Ramena, aéroport, Joffreville, Sakaramy, Anivorano, Ambilobe, Ambanja, Vohémar…). Pour chaque trajet : distance et durée par la route, bouton **Google Maps**, bouton **Waze**, partage WhatsApp, bouton « Ma position », et chauffeurs triés du plus proche au plus loin du départ.
5. **Modifiable depuis le navigateur (admin).** Chauffeurs (modifier, disponible/indisponible), lieux de la carte (clic sur la carte pour placer un point), numéro WhatsApp, bandeau d'annonce, **mode du site** (Normal / Maintenance) et liste des administrateurs.
6. **Autres protections.** Failles XSS corrigées (un nom de chauffeur piégé ne peut plus exécuter de code), anti-robot sur le formulaire, déconnexion automatique après 30 minutes, en-têtes de sécurité (fichier `_headers`) et export CSV protégé.

---

## Étape 1 : créer le projet Firebase (5 min)

1. Allez sur <https://console.firebase.google.com> avec **tgewifizone@gmail.com**.
2. Cliquez sur **Créer un projet**, nommez-le `ds-edrive` et désactivez Google Analytics (inutile).
3. Sur la page du projet, cliquez sur l'icône **Web `</>`**, nommez l'appli `site`, ne cochez pas « Hosting », puis **Enregistrer**.
4. Copiez les valeurs de `firebaseConfig` (apiKey, authDomain, projectId…) dans le fichier **`firebase-config.js`**, à la place des `A_REMPLACER`.

## Étape 2 : activer la connexion par e-mail

1. Menu **Build > Authentication > Commencer**.
2. Onglet **Sign-in method** : activez **E-mail/Mot de passe** (pas le « lien par e-mail »).
3. Onglet **Users > Ajouter un utilisateur** : e-mail `tgewifizone@gmail.com` et un mot de passe solide (au moins 12 caractères).
4. Recommandé : dans **Settings > User actions**, décochez **Enable create (sign-up)** pour que personne ne puisse créer de compte depuis le site.
5. Dans **Settings > Authorized domains**, ajoutez `ds-drive.netlify.app` (et votre domaine GitHub Pages si vous l'utilisez).

## Étape 3 : créer la base Firestore et coller les règles

1. Menu **Build > Firestore Database > Créer une base de données**. Emplacement : `eur3 (europe-west)`. Démarrez en **mode production**.
2. Onglet **Règles** : effacez tout, collez le contenu du fichier **`firestore.rules`**, puis cliquez sur **Publier**.

> Pour ajouter un autre administrateur, créez-lui un compte (étape 2.3), puis ajoutez son e-mail dans Admin > Sécurité > « Administrateurs autorisés ».

## Étape 4 : mettre en ligne

Votre compte Netlify indique actuellement : *« production deploys and Agent Runners are paused »* (crédits épuisés pour ce cycle). Le site actuel reste en ligne, mais aucun nouveau déploiement n'est accepté. Deux solutions :

- **A. Netlify, dès le prochain cycle de facturation** : Netlify > projet `ds-drive` > **Deploys**, puis glissez-déposez **tout le dossier** `ds drive` (avec `assets/`, `firebase-config.js`, `_headers`…). Ce site est 100 % statique : il n'utilise ni build ni Functions, donc presque pas de crédits.
- **B. GitHub Pages, tout de suite et sans limite** : sur github.com/tgewifizone-ops/ds-edrive, chargez le contenu du dossier **à la racine du dépôt** (pas dans un sous-dossier), puis **Settings > Pages > Deploy from a branch > main / (root)**. Adresse : `https://tgewifizone-ops.github.io/ds-edrive/`. Pensez à l'ajouter dans les « Authorized domains » Firebase.

## Étape 5 : premier accès

1. Ouvrez le site, cliquez sur **⚙️ Admin** et connectez-vous.
2. Au premier accès, le site demande de **vérifier l'e-mail** : cliquez sur « Envoyer l'e-mail de vérification », ouvrez le lien reçu dans Gmail, puis cliquez sur « J'ai vérifié, réessayer ».
3. Dans **🗺️ Lieux & carte**, cliquez sur **Importer la liste par défaut** pour pouvoir modifier, ajouter ou supprimer des lieux. Complétez la liste avec les fokontany officiels manquants.
4. Dans **⚙️ Paramètres**, indiquez le vrai numéro WhatsApp de l'administration.
5. Dans **🔒 Sécurité**, changez votre mot de passe quand vous le souhaitez.

---

## Remarques

- **Liste des fokontany.** Les 24 quartiers et fokontany proviennent d'OpenStreetMap. Le chiffre officiel de 25 fokontany n'a pas pu être vérifié nom par nom. Vérifiez la liste avec la Commune et corrigez-la dans Admin > Lieux & carte, sans toucher au code.
- **Calcul d'itinéraire.** Il utilise le serveur public gratuit OSRM (données OpenStreetMap). S'il ne répond pas, le site affiche une estimation à vol d'oiseau majorée de 35 %. La navigation GPS réelle se fait avec le bouton Google Maps ou Waze, gratuit et sans clé API.
- **Quotas gratuits Firebase (offre Spark)** : 50 000 lectures et 20 000 écritures par jour, largement suffisant pour démarrer.
- **Modifier le code JavaScript** : directement dans `assets/app.js`, `assets/backend.js` et `assets/places.js` (aucune compilation nécessaire). Firebase et Leaflet sont chargés depuis les CDN officiels (gstatic.com, cdnjs).

## ⚠️ Sécurité GitHub (important)

Le fichier `.git/config` de votre dossier contient un **jeton d'accès GitHub en clair** (`github_pat_…`). Toute personne qui a accès à ce dossier peut modifier votre dépôt. Faites ceci :

1. Sur GitHub, allez dans **Settings > Developer settings > Personal access tokens**, puis **révoquez** ce jeton.
2. Retirez-le de l'URL du dépôt :
   `git remote set-url origin https://github.com/tgewifizone-ops/ds-edrive.git`
   Git redemandera ensuite l'identifiant via le gestionnaire de connexion Windows, qui le stocke de façon sécurisée.
