# RHorizon - Gestion des Ressources Humaines

Application frontend complète pour la gestion des ressources humaines, développée en HTML5, CSS3 et JavaScript pur (sans framework).

## 🎯 Fonctionnalités

### ✅ Modules implémentés

1. **Page de connexion**
   - Authentification simple avec email et mot de passe
   - Interface moderne et épurée

2. **Tableau de bord (Dashboard)**
   - Statistiques en temps réel :
     - Nombre d'employés
     - Absences en cours
     - Heures supplémentaires
     - Alertes RH
   - Liste des alertes importantes (congés à valider, contrats expirant)

3. **Gestion des employés**
   - Liste complète des employés
   - Ajout d'un nouvel employé avec formulaire
   - Modification des informations
   - Suspension d'employés
   - Informations : nom, prénom, poste, salaire de base, type de contrat, date d'embauche

4. **Gestion des postes**
   - Liste des postes disponibles
   - Ajout/modification de postes
   - Informations : intitulé, département, salaire min/max
   - Comptage automatique du nombre d'employés par poste

5. **Gestion des congés / absences**
   - Liste des demandes de congés
   - Formulaire de demande de congé
   - Validation/refus des demandes par le responsable RH
   - Types de congés : payés, maladie, personnel, formation, maternité/paternité
   - Calcul automatique du nombre de jours

6. **Gestion des heures et pointage**
   - Pointage d'arrivée/départ
   - Tableau des heures travaillées
   - Calcul automatique des heures supplémentaires (> 8h/jour)
   - Affichage de l'heure actuelle en temps réel

7. **Gestion des salaires**
   - Génération de bulletins de paie
   - Gestion des primes et retenues
   - Calcul des heures supplémentaires
   - Calcul automatique du salaire net
   - Fonction de téléchargement PDF (simulation)

## 🚀 Installation et utilisation

### Prérequis
- Un navigateur web moderne (Chrome, Firefox, Safari, Edge)
- Aucune dépendance externe requise

### Lancement
1. Téléchargez ou clonez les fichiers :
   - `index.html`
   - `style.css`
   - `app.js`

2. Ouvrez `index.html` dans votre navigateur web

3. Connectez-vous :
   - Email : n'importe quelle adresse email
   - Mot de passe : n'importe quel mot de passe
   - (L'authentification est simulée, pas de validation réelle)

## 📁 Structure des fichiers

```
GRH/
├── index.html      # Structure HTML de l'application
├── style.css       # Styles CSS (design moderne et responsive)
├── app.js          # Logique JavaScript de l'application
└── README.md       # Documentation
```

##  Design

- **Couleurs** : Palette douce (bleu primaire #4a90e2, gris neutres)
- **Style** : Moderne, épuré, professionnel
- **Responsive** : Adapté aux écrans desktop, tablette et mobile
- **Composants** :
  - Cards avec bordures arrondies
  - Boutons avec effets hover et transitions
  - Modales pour les formulaires
  - Tableaux lisibles et bien espacés
  - Menu latéral fixe

## 💾 Stockage des données

Les données sont stockées localement dans le navigateur via **localStorage**. Cela signifie :
- ✅ Pas de backend requis
- ✅ Données persistantes entre les sessions
- ⚠️ Données limitées au navigateur utilisé
- ⚠️ Données effacées si le cache du navigateur est vidé

### Données stockées
- Employés
- Postes
- Congés/Absences
- Pointages
- Bulletins de paie

##  Architecture technique

### Architecture SPA (Single Page Application)
- Navigation entre les sections sans rechargement de page
- Affichage/masquage des sections via JavaScript
- Gestion d'état côté client

### Structure JavaScript
- Variables globales pour les données
- Fonctions modulaires et commentées
- Gestion des événements
- Manipulation du DOM
- Persistance des données (localStorage)

##  Responsive Design

L'application s'adapte automatiquement à différentes tailles d'écran :
- **Desktop** : Menu latéral fixe + contenu principal
- **Tablette** : Menu latéral réduit (icônes uniquement)
- **Mobile** : Menu adaptatif, tableaux avec scroll horizontal

##  Données d'exemple

L'application inclut des données d'exemple au premier chargement :
- 2 employés (Jean Dupont, Sophie Martin)
- 3 postes (Développeur Full Stack, Chef de projet, Responsable RH)

Ces données peuvent être modifiées ou supprimées depuis l'interface.

##  Sécurité

⚠️ **Important** : Cette application est une **maquette frontend** uniquement. Il n'y a pas de :
- Authentification réelle
- Validation côté serveur
- Protection contre les injections
- Chiffrement des données

Pour une utilisation en production, il est **fortement recommandé** d'ajouter :
- Un backend sécurisé
- Une authentification réelle (JWT, OAuth, etc.)
- Une base de données
- Des validations serveur
- HTTPS

##  Fonctionnalités futures possibles

- Export des données en CSV/Excel
- Génération réelle de PDF pour les bulletins
- Graphiques et statistiques avancées
- Notifications en temps réel
- Recherche et filtres avancés
- Historique des modifications
- Calendrier des congés

##  Dépannage

### Les données ne persistent pas
- Vérifiez que les cookies/localStorage ne sont pas désactivés dans votre navigateur

### L'application ne se charge pas
- Vérifiez que tous les fichiers sont dans le même dossier
- Ouvrez la console du navigateur (F12) pour voir les erreurs

### Le design est cassé
- Vérifiez que `style.css` est bien chargé
- Videz le cache du navigateur (Ctrl+F5)

##  Licence

Ce projet est fourni à titre d'exemple et peut être utilisé librement.

##  Développement

Application développée avec :
- HTML5 sémantique
- CSS3 avec variables CSS et Flexbox/Grid
- JavaScript ES6+ (pas de framework)
- localStorage pour la persistance

---

**Bonne utilisation ! **







