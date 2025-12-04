# 🔧 Résolution de l'Erreur 500 (Internal Server Error)

## 🔍 Diagnostic

L'erreur 500 signifie qu'il y a un problème côté serveur (PHP). Voici comment la résoudre :

## 📋 Étapes de Diagnostic

### 1. Vérifier les Logs d'Erreur

**Dans XAMPP :**
1. Ouvrir **XAMPP Control Panel**
2. Cliquer sur **"Logs"** à côté d'Apache
3. Ouvrir le dernier fichier `error.log`
4. Chercher les erreurs récentes

**Ou directement :**
- Aller dans : `C:\xampp\apache\logs\error.log`
- Ouvrir avec un éditeur de texte
- Voir les dernières lignes

### 2. Tester la Configuration

Ouvrir dans le navigateur :
```
http://localhost/GRH/api/test.php
```

Ce fichier va tester :
- ✅ Version PHP
- ✅ Extensions PDO
- ✅ Fichier config.php
- ✅ Connexion MySQL
- ✅ Base de données
- ✅ Fichiers API

## 🐛 Problèmes Courants et Solutions

### Problème 1 : Base de Données N'Existe Pas

**Erreur typique :**
```
SQLSTATE[HY000] [1049] Unknown database 'GestionRH_Academic'
```

**Solution :**
1. Ouvrir phpMyAdmin : http://localhost/phpmyadmin
2. Cliquer sur "Importer"
3. Sélectionner `base de donne.sql`
4. Cliquer "Exécuter"
5. Vérifier que la base `GestionRH_Academic` apparaît dans le menu gauche

### Problème 2 : MySQL N'Est Pas Démarré

**Erreur typique :**
```
SQLSTATE[HY000] [2002] No connection could be made
```

**Solution :**
1. Ouvrir XAMPP Control Panel
2. Vérifier que MySQL est démarré (bouton vert)
3. Si non, cliquer "Start" sur MySQL
4. Attendre que le bouton devienne vert

### Problème 3 : Extension PDO Non Chargée

**Erreur typique :**
```
Call to undefined function PDO()
```

**Solution :**
1. Ouvrir : `C:\xampp\php\php.ini`
2. Chercher : `;extension=pdo_mysql`
3. Enlever le `;` pour décommenter : `extension=pdo_mysql`
4. Redémarrer Apache dans XAMPP

### Problème 4 : Chemin de Fichier Incorrect

**Erreur typique :**
```
require_once(): Failed opening '../config.php'
```

**Solution :**
1. Vérifier que tous les fichiers sont dans `C:\xampp\htdocs\GRH\`
2. Vérifier que le dossier `api/` existe
3. Vérifier que `config.php` est à la racine de `GRH/`

### Problème 5 : Permissions

**Solution :**
1. Clic droit sur le dossier `C:\xampp\htdocs\GRH\`
2. Propriétés → Sécurité
3. Vérifier que "Utilisateurs" a les droits de lecture

## ✅ Vérification Rapide

### Checklist :

1. **XAMPP démarré**
   - [ ] Apache : bouton vert
   - [ ] MySQL : bouton vert

2. **Fichiers en place**
   - [ ] Fichiers dans `C:\xampp\htdocs\GRH\`
   - [ ] Dossier `api/` existe
   - [ ] Fichier `config.php` existe

3. **Base de données**
   - [ ] Base `GestionRH_Academic` existe dans phpMyAdmin
   - [ ] Tables visibles dans phpMyAdmin

4. **Test**
   - [ ] http://localhost/GRH/api/test.php fonctionne
   - [ ] Tous les tests sont ✅

## 🔧 Correction Automatique

J'ai créé un fichier `api/test.php` qui va diagnostiquer automatiquement les problèmes.

**Utilisation :**
1. Ouvrir : http://localhost/GRH/api/test.php
2. Lire les résultats
3. Suivre les instructions pour chaque ❌

## 📝 Modifications Apportées

J'ai aussi modifié :
- `config.php` : Meilleure gestion des erreurs
- `api/auth.php` : Vérification du chemin et gestion d'erreurs améliorée

## 🆘 Si Rien Ne Fonctionne

1. **Vérifier les logs Apache** (voir étape 1)
2. **Tester avec test.php** (voir étape 2)
3. **Vérifier la version PHP** : http://localhost/GRH/api/test.php
4. **Réinstaller XAMPP** si nécessaire

## 💡 Astuce

Pour voir les erreurs PHP directement :
- Les erreurs sont maintenant affichées grâce à `error_reporting(E_ALL)` dans `config.php`
- Vérifier la console du navigateur (F12) pour les erreurs JavaScript
- Vérifier les logs Apache pour les erreurs PHP


