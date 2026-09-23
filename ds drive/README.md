# DS_e-Drive — Diego Suarez (Antsiranana)

Plateforme web moderne de mise en relation directe entre passagers et chauffeurs (motos, tricycles/Bajaj, voitures) pour la commune urbaine de Diego Suarez et ses environs (Ramena, Sakaramy, Joffreville).

---

## 👨‍💼 Administration Principale

- **Administrateur en chef :** `Tgewifizone@gmail.com`
- **Réception des candidatures :** Transmises directement par email via le service FormSubmit sécurisé et sauvegardées localement.
- **Accès Espace Administration :**
  - Sur le site web, cliquez sur le bouton **⚙️ Admin** dans l'en-tête (ou **Espace Administration** en bas de page).
  - Vous pouvez également ouvrir directement : `index.html?admin=1` ou `https://<votre-domaine>/?admin=1`.
  - **Code d'accès PIN par défaut :** `2026`

### Fonctionnalités de l'Espace Administrateur :
1. **Gestion de la flotte en direct :**
   - Consultation des chauffeurs actuellement visibles par les clients.
   - Suppression en 1 clic d'un chauffeur.
   - Ajout direct d'un chauffeur sans passer par le formulaire public.
   - Export de la liste complète des chauffeurs au format **CSV** compatible Excel.
2. **Gestion des candidatures :**
   - Réception et examen des demandes envoyées depuis la section *"Devenir chauffeur"*.
   - Bouton **✓ Approuver** : transforme immédiatement le candidat en chauffeur public actif sur la carte et la recherche du site.
   - Bouton **✕ Refuser** : supprime la candidature.
3. **Paramètres & Réinitialisation :**
   - Bouton de restauration de la flotte initiale de démonstration (6 chauffeurs).

---

## 🚀 Options de Déploiement en Ligne (100% Gratuit)

Le site est entièrement autonome (HTML5, CSS3, JavaScript Vanilla). Il ne nécessite aucune base de données payante ni serveur lourd.

### Option 1 : Déploiement en 30 secondes via Netlify Drop (Recommandé)
1. Rendez-vous sur : [app.netlify.com/drop](https://app.netlify.com/drop)
2. Glissez-déposez le dossier `ds drive` contenant `index.html`.
3. Netlify vous attribue instantanément une URL publique sécurisée en HTTPS (ex: `https://ds-edrive.netlify.app`).
4. Le formulaire et l'espace admin fonctionneront immédiatement !

### Option 2 : Déploiement via GitHub Pages
Votre configuration Git locale est déjà pré-configurée avec :
- `user.name = tgewifizone-ops`
- `user.email = tgewifizone@gmail.com`

Pour publier sur GitHub Pages :
```bash
git init
git add index.html README.md
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
- Les données des chauffeurs et candidatures sont stockées de façon réactive dans le navigateur via `localStorage`.
- Toute notification de nouvelle candidature est automatiquement acheminée vers **Tgewifizone@gmail.com**.
- Aucun mot de passe bancaire ou intermédiaire de paiement n'est requis : les passagers négocient et règlent directement les chauffeurs.
