# Dossier de Conception – Shopper

Ce document présente les choix d'architecture, le modèle de données et les décisions techniques prises pour la conception de l'application **Shopper**, un logiciel de caisse enregistreuse de bureau moderne et performant.

---

## 1. Choix d'Architecture Globale

Shopper est conçu comme une application de bureau hybride reposant sur le framework **Electron**, avec une interface utilisateur développée en **Vue 3** (via **Vite**) et un moteur de base de données embarqué **SQLite**.

### Schéma de l'Architecture Multi-Processus

L'application respecte la séparation stricte imposée par Electron entre le processus principal (_Main Process_) et le processus de rendu (_Renderer Process_) :

```
┌─────────────────────────────────────────────────────────────┐
│             Processus de Rendu (Renderer)                   │
│                    Vue 3 / Vite                             │
└──────────────┬──────────────────────────────▲───────────────┘
               │                              │
               │ (Appels API)                 │ (Événements)
               │ via preload.js (IPC)         │ via ipcRenderer
               ▼                              │
┌─────────────────────────────────────────────┴───────────────┐
│             Processus Principal (Main)                      │
│                    Electron / Node.js                       │
├──────────────────────┬──────────────────────┬───────────────┤
│    Contrôleurs       │  Réseau / OFF API    │ Serveur TCP   │
│   & Modèles SQL      │ (OpenFoodFacts Service)│ (Scanner mobile)│
└──────────┬───────────┴──────────────────────┴───────┬───────┘
           │                                          │
           ▼                                          ▼
┌──────────────────────┐                  ┌───────────────────┐
│ Base de Données      │                  │  Application      │
│ SQLite (Local File)  │                  │  Android Scanner  │
└──────────────────────┘                  └───────────────────┘
```

### Rôles et Responsabilités

1. **Processus Principal (Main - Node.js)** :
   - Initialise la base de données SQLite, applique les migrations de schéma et injecte les données initiales (seeds).
   - Héberge la logique métier (contrôleurs) et l'accès aux données (modèles).
   - Démarre et gère le serveur de socket TCP local pour l'intégration du lecteur de code-barres mobile.
   - Effectue les requêtes réseau vers OpenFoodFacts et surveille l'état de la connexion.
   - Génère les exports physiques (PDF, CSV) sur le système de fichiers.
2. **Processus de Rendu (Renderer - Vue 3)** :
   - Reçoit l'état et les données du processus principal.
   - Gère le rendu dynamique de l'interface utilisateur, la réactivité du panier, l'affichage du catalogue, le tableau de bord et le basculement de thème.
3. **Pont de Sécurité (Preload.js)** :
   - Expose de manière sécurisée les fonctions IPC nécessaires au processus de rendu via un namespace unique `window.electronAPI` (`contextBridge`).
   - Bloque toute exposition directe des modules Node.js au frontend, garantissant la conformité avec la politique de sécurité des contenus (CSP).

---

## 2. Modèle de Données (Base de Données SQLite)

Le choix de **SQLite** (via le pilote synchrone et ultra-performant `better-sqlite3`) est justifié par le besoin d'une base de données locale autonome, n'exigeant aucune installation de serveur tiers chez le commerçant.

Le schéma de base de données est structuré de façon relationnelle et intègre des mécanismes d'historisation pour garantir la cohérence des données comptables en cas de modification de l'inventaire.

### Schéma Relationnel

Les tables principales de l'application sont :

- **TVA** : Stocke les différents taux de taxe applicables (ex. : 20%, 5.5%).
- **Category** : Gère l'arborescence récursive des rayons et catégories de produits.
- **Product** : Référence les articles de l'inventaire avec leur code-barres, nom, prix d'achat HT/TTC, catégorie et liaison TVA.
- **Customer** : Enregistre les clients pour le suivi de fidélité.
- **Ticket** : Représente chaque transaction de vente validée avec les montants globaux.
- **TicketLine** : Lignes individuelles de chaque ticket détaillant les articles vendus.
- **DeliveryOrder** : Module optionnel pour le suivi des livraisons associées à des ventes.
- **Type** : Types de produits spécifiques à OpenFoodFacts.

### Justifications des Choix de Conception du Modèle

1. **Historisation Comptable dans `TicketLine`** :
   - _Problématique_ : Si le prix d'un produit ou son taux de TVA change dans la table `Product`, ou si le produit est supprimé, l'historique des anciennes ventes (les tickets passés) serait faussé ou corrompu.
   - _Solution_ : Lors de la validation d'une vente, nous figeons dans `TicketLine` le prix d'origine (`original_unit_price_ht`, `original_unit_price_ttc`), le taux de TVA appliqué (`applied_tva_rate`) et le prix final après réduction (`final_unit_price_ht`, `final_unit_price_ttc`). Ainsi, le chiffre d'affaires et la TVA collectée restent exacts à vie, peu importent les modifications futures du catalogue.
2. **Suppression Douce (_Soft Delete_)** :
   - Les tables `Product`, `Customer` et `TVA` disposent de colonnes (`deleted_at` ou `is_active`). La suppression d'un produit ou d'un client ne le retire pas physiquement de la base de données, préservant l'intégrité référentielle des tickets de caisse existants.
3. **Relations de Catégories Récursives** :
   - La table `Category` possède une auto-référence `parent_id` pour permettre une organisation sous forme de rayons principaux et de sous-rayons (arborescence multiniveau).

---

## 3. Justifications des Choix Technologiques

### A. Pile Technique

- **better-sqlite3** : Contrairement au module `sqlite3` asynchrone par défaut de Node.js, `better-sqlite3` exécute les requêtes de manière synchrone sur le thread principal d'Electron. SQLite étant une base de données locale dans un fichier, la latence est négligeable (fraction de milliseconde) et l'absence de promesses simplifie grandement l'écriture des transactions SQL fiables. Le mode WAL (Write-Ahead Log) est également activé pour autoriser des lectures simultanées sans bloquer l'application.
- **Vue 3 (Composition API) & Vite** : Offre une réactivité instantanée pour l'affichage du panier d'achat et le calcul dynamique des prix. Vite garantit un temps de rechargement à chaud (HMR) immédiat pendant le développement.
- **CSS Vanilla (modulaire)** : Les fichiers CSS sont segmentés par composants métiers (`basket.css`, `catalogue.css`, etc.) et importés directement dans le point d'entrée. Cela évite la lourdeur d'un framework CSS comme Tailwind tout en garantissant des performances d'affichage maximales et une maintenance aisée.

### B. Fonctionnalités Innovantes

- **Lecteur Code-barres Local Réseau (TCP)** :
  - _Choix_ : Plutôt que de contraindre le commerçant à acheter une douchette USB coûteuse, Shopper intègre un serveur TCP brut (`BarcodeServerController`) qui écoute sur le réseau local.
  - _Fonctionnement_ : L'interface génère un code QR contenant l'adresse IP locale et le port de ce serveur. Une application Android compagnon scanne le QR code pour s'y connecter et transmet instantanément chaque code-barres scanné via le réseau local. Un mécanisme d'exclusion mutuelle assure qu'un seul scanner à la fois reste connecté.
- **Mode Hybride Hors-Ligne (Offline/Online Web Services)** :
  - L'application intègre un détecteur de connectivité lié à l'API **OpenFoodFacts**. En ligne, l'application enrichit automatiquement les fiches produits via des requêtes HTTP directes. Si la connexion Internet tombe, l'application bascule automatiquement en mode purement local sans aucun blocage pour l'encaissement et planifie un cycle de test de connectivité toutes les 60 secondes.
- **Générateur de Rapports PDF & CSV intégrés** :
  - Utilise les capacités internes de rendu de documents pour exporter des bilans comptables mensuels avec ventilation des ventes par taux de TVA, facilitant la comptabilité du commerçant.
