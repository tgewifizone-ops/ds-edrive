# DS_e-Drive — Diego Suarez (Antsiranana)

Plateforme web moderne de mise en relation directe entre passagers et chauffeurs (motos, tricycles/Bajaj, voitures) pour la commune urbaine de Diego Suarez et ses environs (Ramena, Sakaramy, Joffreville).

---

## 👨‍💼 Administration Principale

- **Administrateur en chef :** `Tgewifizone@gmail.com`
- **Accès :** bouton **⚙️ Admin** dans l'en-tête (ou `?admin=1` dans l'adresse).
- **Connexion sécurisée :** e-mail + mot de passe (Firebase Authentication), vérifiée côté serveur par `firestore.rules`. Il n'y a plus de code PIN dans le code source.
- **Mot de passe :** modifiable dans Admin > 🔒 Sécurité, avec un lien « Mot de passe oublié ? ».
- **Mise en service :** voir **GUIDE-MISE-EN-LIGNE.md**.

### Fonctionnalités de l'espace administrateur
1. **Chauffeurs :** ajout, modification, disponible / indisponible, suppression, export CSV.
2. **Candidatures :** reçues en base (visibles depuis tout appareil) et par e-mail (FormSubmit). Approuver les publie immédiatement.
3. **Lieux & carte :** fokontany et localités hors Diego, à ajouter ou déplacer d'un clic sur la carte.
4. **Paramètres :** numéro WhatsApp, bandeau d'annonce, mode Normal / Maintenance.
5. **Sécurité :** changement de mot de passe, liste des administrateurs, déconnexion automatique après 30 min.

## 🗺️ Carte & itinéraires
- Carte OpenStreetMap (Leaflet via cdnjs), itinéraire routier via OSRM (gratuit, sans clé).
- Boutons **Google Maps** / **Waze** / partage WhatsApp, géolocalisation « Ma position ».
- Chauffeurs triés par distance depuis le point de départ.

## 🚀 Options de Déploiement en Ligne (100% Gratuit)

Le site est entièrement autonome (HTML5, CSS3, JavaScript Vanilla). Il ne nécessite aucune base de données payante ni serveur lourd.

### Option 1 : Déploiement en 30 secondes via Netlify Drop (Recommandé)
1. Rendez-vous sur : [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glissez-déposez le dossier `ds drive` complet (`index.html`, `assets/`, `firebase-config.js`, `_headers`).
3. Netlify vous attribue instantanément une URL publique sécurisée en HTTPS (ex: `https://ds-edrive.netlify.app`).
4. Le formulaire et l'espace admin fonctionneront immédiatement !

### Option 2 : Déploiement via GitHub Pages
Votre configuration Git locale est déjà pré-configurée avec :
- `user.name = tgewifizone-ops`
- `user.email = tgewifizone@gmail.com`

Pour publier sur GitHub Pages :
```bash
git init
git add index.html assets firebase-config.js firestore.rules _headers netlify.toml robots.txt README.md GUIDE-MISE-EN-LIGNE.md
git commit -m "Déploiement initial DS_e-Drive Diego Suarez"
git branch -M main
# Créez le dépôt 'ds-edrive' sur votre compte GitHub, puis :
git remote add origin https://github.com/tgewifizone-ops/ds-edrive.git
git push -u origin main
```
Puis dans les paramètres du dépôt GitHub : **Settings > Pages > Deploy from a branch > main** pour obtenir votre site en ligne sur `https://tgewifizone-ops.github.io/ds-edrive`.

### Option 3 : Déploiement via Vercel
1. Rendez-vous sur [vercel.com](https://vercel.com).
2. Cliquez sur *Add New Project* et importez le dossier ou le dépôt GitHub.

---

## 💻 Test et Exécution Locale

Pour lancer le site localement sur votre ordinateur :

Dans le dossier `c:\Users\Admin\Desktop\ds drive` :
```bash
python -m http.server 8080
```
Puis ouvrez votre navigateur sur : [http://localhost:8080](http://localhost:8080)

---

## 🛡️ Données & Confidentialité
- Les chauffeurs, candidatures, lieux et paramètres sont stockés dans Firestore (offre gratuite Spark), protégés par `firestore.rules`.
- Toute notification de nouvelle candidature est automatiquement acheminée vers **Tgewifizone@gmail.com**.
- Aucun mot de passe bancaire ou intermédiaire de paiement n'est requis : les passagers négocient et règlent directement les chauffeurs.
