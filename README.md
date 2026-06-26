# Shopper – Logiciel de Caisse Enregistreuse de Bureau

Shopper est une application de bureau moderne et performante de gestion de caisse et d'inventaire, conçue avec **Electron**, **Vue 3** (via **Vite**), et une base de données embarquée **SQLite** (`better-sqlite3`).

---

## 🚀 Fonctionnalités Clés

- **Gestion de Panier & Caisse** : Encaissement rapide, application de réductions en valeur ou en pourcentage, validation de ventes et gestion de brouillons.
- **Modèle de Données Sécurisé** : Historisation stricte des prix et taux de TVA sur chaque ligne de ticket pour garantir l'exactitude de la comptabilité future.
- **Lecteur de Code-Barres Réseau** : Intégration d'un serveur TCP local permettant d'utiliser un smartphone Android comme lecteur de codes-barres en scannant simplement un QR code de connexion.
- **Intégration OpenFoodFacts** : Recherche en ligne et récupération automatique des données et images des produits par code-barres ou par nom, avec basculement automatique en mode hors-ligne.
- **Rapports Financiers** : Génération et export de rapports mensuels détaillés de ventes au format PDF et CSV, avec ventilation des montants par taux de TVA.
- **Gestion Multilingue & Thèmes** : Prise en charge intégrale du français et de l'anglais, et sélecteur de thème Sombre / Clair persistant.

---

## 🛠️ Prérequis

Avant de commencer, assurez-vous d'avoir installé sur votre machine :

- [Node.js](https://nodejs.org/) (Version 18 ou supérieure recommandée)
- [npm](https://www.npmjs.com/) (généralement installé avec Node.js)
- Un compilateur C++ (requis pour compiler les extensions natives comme `better-sqlite3` si nécessaire ; sous Windows, les outils de build de Visual Studio ou `windows-build-tools` sont recommandés).

---

## 📦 Installation

1. **Cloner le dépôt de l'application** :

   ```bash
   git clone <url-du-depot>
   cd shopper
   ```

2. **Installer les dépendances** :
   Installez tous les modules requis. Le script `postinstall` configurera et compilera automatiquement les dépendances natives (comme `better-sqlite3`) pour la version d'Electron installée :
   ```bash
   npm install
   ```

---

## 💻 Lancement de l'Application

### Mode Développement

Pour lancer l'application en mode développement (avec rechargement à chaud de la partie Vue 3 et ouverture automatique des outils de développement Chrome) :

```bash
npm run electron:dev
```

### Mode Production (Local)

Pour lancer l'application compilée localement en simulant l'environnement de production :

```bash
npm run electron
```

---

## 🧪 Tests et Qualité du Code

### Exécuter les Tests Unitaires

Le projet utilise [Vitest](https://vitest.dev/) pour les tests unitaires. Pour exécuter la suite de tests :

```bash
npm test
```

### Formater le Code

Pour vérifier et formater automatiquement l'ensemble des fichiers du projet selon les règles de style configurées dans Prettier :

- Vérifier le formatage :
  ```bash
  npm run format:check
  ```
- Formater automatiquement :
  ```bash
  npm run format
  ```

---

## 🏗️ Compilation et Packaging

### Application de Bureau (Electron)

Pour distribuer l'application de bureau et générer des installateurs autonomes :

- **Générer le build de production (sans installeur)** :

  ```bash
  npm run build:electron:dir
  ```

- **Créer l'installeur Windows (.exe / NSIS)** :
  ```bash
  npm run build:installer
  ```
  L'exécutable généré sera stocké dans le dossier `dist_electron/`.

### Application Mobile (Scanner Android)

Le projet contient une application compagnon Android (située dans le dossier `scanner_android`) servant à transformer votre téléphone en lecteur de code-barres.

Pour générer le fichier APK :

1. Ouvrez Android Studio.
2. Choisissez **Open** et sélectionnez le dossier `scanner_android`.
3. Attendez la fin de la synchronisation Gradle.
4. Dans le menu du haut, allez dans **Build > Build Bundle(s) / APK(s) > Build APK(s)**.
5. Une notification apparaîtra avec un lien direct vers le fichier APK généré (`app-debug.apk`).

---

## 📂 Structure Principale du Projet

```
├── main.js                 # Point d'entrée du processus principal Electron
├── preload.js              # Pont d'API sécurisé (IPC contextBridge)
├── package.json            # Dépendances et scripts de build/lancement
├── documentation/          # Schémas et dossier de conception
│   └── dossier_de_conception.md
├── src/
│   ├── App.vue             # Composant racine Vue 3
│   ├── main.js             # Initialisation du frontend Vue 3
│   ├── components/         # Composants d'interface (Barres, Boutons, Modales)
│   ├── controllers/        # Contrôleurs du processus principal (Logique métier)
│   ├── database/           # Fichiers de connexion, migrations et données de test (seed)
│   ├── ipc/                # Handlers IPC du processus principal
│   ├── models/             # Modèles d'accès à la base de données SQLite
│   ├── services/           # Services tiers (ex: OpenFoodFacts, Menu système)
│   ├── styles/             # Feuilles de style CSS Vanilla thémées
│   └── utils/              # Fichiers d'aide et de configuration (i18n, logger, etc.)
```
