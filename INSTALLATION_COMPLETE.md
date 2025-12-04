# 📦 Guide d'Installation Complète - GRH avec Base de Données

## 🎯 Vue d'ensemble

Ce guide vous explique comment installer et lancer l'application GRH avec base de données MySQL.

## 📋 Étape 1 : Installer XAMPP

### Option A : XAMPP (Recommandé - Windows)

1. **Télécharger XAMPP**
   - Aller sur : https://www.apachefriends.org/download.html
   - Télécharger la version pour Windows (PHP 8.x recommandé)
   - Fichier : `xampp-windows-x64-8.x.x-x.x.x-installer.exe`

2. **Installer XAMPP**
   - Double-cliquer sur le fichier téléchargé
   - Choisir le dossier d'installation : `C:\xampp` (par défaut)
   - Cocher : Apache, MySQL, phpMyAdmin
   - Cliquer sur "Next" jusqu'à la fin
   - ⚠️ Si Windows Defender ou antivirus demande, autoriser XAMPP

3. **Vérifier l'installation**
   - Ouvrir le **XAMPP Control Panel** depuis le menu Démarrer
   - Vous devriez voir Apache et MySQL dans la liste

### Option B : WAMP (Alternative Windows)

1. Télécharger depuis : https://www.wampserver.com/
2. Installer en suivant les instructions
3. Le dossier sera : `C:\wamp64\www\`

### Option C : MAMP (Alternative Mac)

1. Télécharger depuis : https://www.mamp.info/
2. Installer en suivant les instructions
3. Le dossier sera : `/Applications/MAMP/htdocs/`

---

## 📁 Étape 2 : Placer les Fichiers du Projet

### Pour XAMPP :

1. **Localiser le dossier htdocs**
   - Chemin : `C:\xampp\htdocs\`

2. **Créer le dossier GRH**
   - Dans `C:\xampp\htdocs\`, créer un dossier nommé `GRH`

3. **Copier tous les fichiers du projet**
   - Copier TOUS les fichiers de votre projet dans `C:\xampp\htdocs\GRH\`
   
   Structure finale attendue :
   ```
   C:\xampp\htdocs\GRH\
   ├── index.html
   ├── app.js
   ├── modules.js
   ├── style.css
   ├── config.php
   ├── .htaccess
   ├── base de donne.sql
   ├── api/
   │   ├── api.js
   │   ├── auth.php
   │   ├── employees.php
   │   ├── services.php
   │   ├── contracts.php
   │   ├── leaves.php
   │   ├── attendance.php
   │   ├── payroll.php
   │   ├── users.php
   │   ├── roles.php
   │   └── audit.php
   └── (autres fichiers...)
   ```

### Pour WAMP :

- Copier dans : `C:\wamp64\www\GRH\`

### Pour MAMP :

- Copier dans : `/Applications/MAMP/htdocs/GRH/`

---

## 🗄️ Étape 3 : Créer la Base de Données

### 3.1 Démarrer les Services

1. **Ouvrir XAMPP Control Panel**
   - Menu Démarrer → Rechercher "XAMPP" → XAMPP Control Panel

2. **Démarrer Apache**
   - Cliquer sur le bouton **"Start"** à côté d'Apache
   - Le bouton devient vert, "Running" apparaît

3. **Démarrer MySQL**
   - Cliquer sur le bouton **"Start"** à côté de MySQL
   - Le bouton devient vert, "Running" apparaît

### 3.2 Ouvrir phpMyAdmin

1. **Ouvrir dans le navigateur**
   - Aller sur : http://localhost/phpmyadmin
   - Ou cliquer sur "Admin" à côté de MySQL dans XAMPP Control Panel

2. **Vérifier la connexion**
   - Vous devriez voir l'interface phpMyAdmin
   - Si erreur, vérifier que MySQL est bien démarré

### 3.3 Importer la Base de Données

1. **Dans phpMyAdmin**
   - Cliquer sur l'onglet **"Importer"** (en haut)

2. **Sélectionner le fichier**
   - Cliquer sur **"Choisir un fichier"**
   - Naviguer vers : `C:\xampp\htdocs\GRH\base de donne.sql`
   - Sélectionner le fichier

3. **Importer**
   - Laisser les options par défaut
   - Cliquer sur **"Exécuter"** en bas de la page
   - Attendre quelques secondes

4. **Vérifier**
   - Dans le menu de gauche, vous devriez voir **"GestionRH_Academic"**
   - Cliquer dessus pour voir les tables créées

---

## ⚙️ Étape 4 : Configurer l'Application

### 4.1 Vérifier config.php

1. **Ouvrir le fichier**
   - `C:\xampp\htdocs\GRH\config.php`

2. **Vérifier les paramètres** (normalement déjà corrects) :
   ```php
   define('DB_HOST', 'localhost');
   define('DB_NAME', 'GestionRH_Academic');
   define('DB_USER', 'root');
   define('DB_PASS', '');  // Vide par défaut sur XAMPP
   ```

3. **Si vous avez changé le mot de passe MySQL**
   - Modifier `DB_PASS` avec votre mot de passe

### 4.2 Tester l'API

1. **Ouvrir dans le navigateur**
   ```
   http://localhost/GRH/api/auth.php?action=check
   ```

2. **Résultat attendu**
   - Vous devriez voir du JSON (probablement une erreur d'authentification, c'est normal)
   - Si vous voyez une erreur PHP, vérifier que les fichiers sont bien placés

---

## 🚀 Étape 5 : Lancer l'Application

### 5.1 Ouvrir l'Application

1. **Dans votre navigateur** (Chrome, Firefox, Edge...)
   - Aller sur : **http://localhost/GRH/index.html**

2. **Vérifier**
   - La page de connexion/inscription devrait s'afficher
   - Pas d'erreur dans la console (F12 → Console)

### 5.2 Créer le Premier Utilisateur (Admin)

1. **Cliquer sur "Inscription"**
2. **Remplir le formulaire**
   - Email : `admin@grh.local` (ou votre email)
   - Nom complet : `Administrateur`
   - Mot de passe : `Admin123!` (ou votre choix, min 6 caractères)
   - Confirmer le mot de passe

3. **S'inscrire**
   - Cliquer sur "S'inscrire"
   - Message de succès devrait apparaître

4. **Se connecter**
   - Utiliser les mêmes identifiants
   - Cliquer sur "Se connecter"
   - Vous devriez accéder au tableau de bord

---

## ✅ Vérification Finale

### Checklist :

- [ ] XAMPP installé
- [ ] Apache démarré (bouton vert dans XAMPP)
- [ ] MySQL démarré (bouton vert dans XAMPP)
- [ ] Fichiers copiés dans `htdocs/GRH/`
- [ ] Base de données importée (visible dans phpMyAdmin)
- [ ] Application accessible sur `http://localhost/GRH/index.html`
- [ ] Premier utilisateur créé et connecté
- [ ] Pas d'erreur dans la console du navigateur (F12)

---

## 🐛 Résolution de Problèmes

### Problème 1 : Apache ne démarre pas

**Erreur** : "Port 80 already in use"

**Solution** :
1. Fermer Skype ou autres applications utilisant le port 80
2. Ou changer le port Apache dans XAMPP :
   - XAMPP Control Panel → Config (Apache) → httpd.conf
   - Chercher `Listen 80` et changer en `Listen 8080`
   - Redémarrer Apache
   - Utiliser : `http://localhost:8080/GRH/index.html`

### Problème 2 : MySQL ne démarre pas

**Erreur** : "Port 3306 already in use"

**Solution** :
1. Vérifier qu'aucun autre MySQL n'est en cours
2. Ou changer le port MySQL dans XAMPP :
   - XAMPP Control Panel → Config (MySQL) → my.ini
   - Chercher `port=3306` et changer en `port=3307`
   - Modifier aussi `config.php` : `DB_HOST` → `localhost:3307`

### Problème 3 : Erreur "Access Denied" MySQL

**Solution** :
1. Dans XAMPP, MySQL n'a pas de mot de passe par défaut
2. Vérifier que `config.php` a bien `DB_PASS` vide : `''`

### Problème 4 : Erreur 404 sur les APIs

**Solution** :
1. Vérifier que le dossier `api/` existe dans `htdocs/GRH/`
2. Vérifier que tous les fichiers PHP sont présents
3. Vérifier les permissions (Windows devrait être OK)

### Problème 5 : Erreur CORS

**Solution** :
1. **IMPORTANT** : Ne pas ouvrir `index.html` directement
2. Toujours utiliser : `http://localhost/GRH/index.html`
3. Vérifier que l'URL commence bien par `http://`

### Problème 6 : Page blanche ou erreur PHP

**Solution** :
1. Vérifier les logs d'erreur :
   - XAMPP Control Panel → Apache → Logs → error.log
2. Vérifier la version PHP (doit être 7.4+)
3. Vérifier que les extensions PDO et MySQL sont activées

---

## 📝 Commandes Utiles

### Démarrer XAMPP
- Menu Démarrer → XAMPP Control Panel
- Cliquer "Start" sur Apache et MySQL

### Arrêter XAMPP
- XAMPP Control Panel → "Stop" sur Apache et MySQL

### Vider le Cache du Navigateur
- `Ctrl + Shift + Delete` (Chrome/Edge)
- Ou `Ctrl + F5` pour forcer le rechargement

### Ouvrir la Console du Navigateur
- `F12` ou `Ctrl + Shift + I`
- Onglet "Console" pour voir les erreurs JavaScript

---

## 🎓 Structure des URLs

Une fois installé, voici les URLs importantes :

- **Application** : http://localhost/GRH/index.html
- **phpMyAdmin** : http://localhost/phpmyadmin
- **Test API Auth** : http://localhost/GRH/api/auth.php?action=check

---

## 💡 Astuces

1. **Créer un raccourci** sur le bureau vers `http://localhost/GRH/index.html`
2. **Démarrer XAMPP au démarrage** : XAMPP Control Panel → Config → Autostart
3. **Sauvegarder la base** : phpMyAdmin → Exporter → Exécuter

---

## 📞 Besoin d'Aide ?

Si vous rencontrez un problème :

1. Vérifier la checklist ci-dessus
2. Vérifier les logs d'erreur (Apache et navigateur)
3. Vérifier que tous les fichiers sont bien présents
4. Vérifier que les services sont démarrés

---

## 🎉 Félicitations !

Si tout fonctionne, vous devriez maintenant :
- ✅ Voir la page de connexion
- ✅ Pouvoir créer un compte
- ✅ Vous connecter
- ✅ Accéder au tableau de bord
- ✅ Voir les données depuis la base MySQL

Bon développement ! 🚀


