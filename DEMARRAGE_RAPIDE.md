# 🚀 Guide de Démarrage Rapide

## ⚠️ IMPORTANT : Utiliser un Serveur Web

Cette application **DOIT** être exécutée via un serveur web (XAMPP, WAMP, MAMP, ou serveur PHP intégré). 
**Ne pas ouvrir directement `index.html` dans le navigateur** (file://) car les APIs PHP ne fonctionneront pas.

## 📋 Étapes de Démarrage

### 1. Installer XAMPP

**Télécharger XAMPP :**
- Aller sur : https://www.apachefriends.org/download.html
- Télécharger la version Windows (PHP 8.x)
- Fichier : `xampp-windows-x64-8.x.x-x.x.x-installer.exe`

**Installer :**
- Double-cliquer sur le fichier téléchargé
- Choisir le dossier : `C:\xampp` (par défaut)
- Cocher : Apache, MySQL, phpMyAdmin
- Cliquer "Next" jusqu'à la fin
- ⚠️ Si Windows Defender demande, autoriser XAMPP

### 2. Démarrer les Services

1. Ouvrir **XAMPP Control Panel**
2. Démarrer **Apache** (serveur web)
3. Démarrer **MySQL** (base de données)

### 3. Créer la Base de Données

1. Ouvrir **phpMyAdmin** : http://localhost/phpmyadmin
2. Cliquer sur **"Importer"** (onglet en haut)
3. Sélectionner le fichier **`base de donne.sql`**
4. Cliquer sur **"Exécuter"**
5. Vérifier que la base `GestionRH_Academic` est créée

### 4. Placer les Fichiers

Copier tous les fichiers du projet dans :
```
C:\xampp\htdocs\GRH\
```

Structure attendue :
```
C:\xampp\htdocs\GRH\
├── index.html
├── app.js
├── modules.js
├── style.css
├── config.php
├── api/
│   ├── api.js
│   ├── auth.php
│   ├── employees.php
│   └── ...
└── base de donne.sql
```

### 5. Accéder à l'Application

Ouvrir dans le navigateur :
```
http://localhost/GRH/index.html
```

**OU** si vous utilisez un autre port :
```
http://localhost:8080/GRH/index.html
```

## 🔧 Configuration

### Vérifier la Configuration de la Base de Données

Éditer `config.php` si nécessaire :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'GestionRH_Academic');
define('DB_USER', 'root');
define('DB_PASS', ''); // Laisser vide par défaut sur XAMPP
```

### Tester l'API

Ouvrir dans le navigateur :
```
http://localhost/GRH/api/auth.php?action=check
```

Vous devriez voir une réponse JSON (probablement une erreur d'authentification, c'est normal).

## 🐛 Résolution de Problèmes

### Erreur CORS "Cross origin requests"

**Cause** : Vous ouvrez `index.html` directement (file://) au lieu d'utiliser un serveur web.

**Solution** : Utiliser `http://localhost/GRH/index.html` au lieu de double-cliquer sur le fichier.

### Erreur "Failed to fetch"

**Cause** : Le serveur Apache n'est pas démarré ou les fichiers ne sont pas au bon endroit.

**Solution** :
1. Vérifier que Apache est démarré dans XAMPP
2. Vérifier que les fichiers sont dans `htdocs/GRH/`
3. Vérifier l'URL dans le navigateur (doit commencer par `http://`)

### Erreur de Connexion à la Base de Données

**Cause** : MySQL n'est pas démarré ou la base n'existe pas.

**Solution** :
1. Démarrer MySQL dans XAMPP
2. Vérifier que la base `GestionRH_Academic` existe dans phpMyAdmin
3. Vérifier les identifiants dans `config.php`

### Erreur 404 sur les APIs

**Cause** : Les fichiers API ne sont pas trouvés.

**Solution** :
1. Vérifier que le dossier `api/` existe dans `htdocs/GRH/`
2. Vérifier que tous les fichiers PHP sont présents
3. Vérifier les permissions des fichiers

## 📝 Alternative : Serveur PHP Intégré

Si vous ne voulez pas utiliser XAMPP, vous pouvez utiliser le serveur PHP intégré :

```bash
# Dans le dossier GRH
php -S localhost:8000
```

Puis ouvrir : `http://localhost:8000/index.html`

## ✅ Vérification

Une fois tout configuré :

1. ✅ Apache et MySQL démarrés
2. ✅ Base de données créée
3. ✅ Fichiers dans `htdocs/GRH/`
4. ✅ Accès via `http://localhost/GRH/index.html`
5. ✅ Pas d'erreur CORS dans la console
6. ✅ L'API répond (tester avec l'URL ci-dessus)

## 🎯 Premier Utilisateur

Le premier utilisateur créé via l'inscription sera automatiquement **Administrateur**.

