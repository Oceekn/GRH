# 🔧 Diagnostic Erreur 500 - Guide Étape par Étape

## ⚠️ L'erreur 500 persiste ? Suivez ces étapes :

### 📍 Étape 1 : Test Ultra-Simple

Ouvrez dans votre navigateur :
```
http://localhost/GRH/api/simple-test.php
```

**Résultats possibles :**

✅ **Si vous voyez "Tous les tests sont passés!"**
→ Le problème vient d'un fichier API spécifique, pas de la configuration de base.

❌ **Si vous voyez une erreur :**
→ Notez le message d'erreur exact et suivez les instructions affichées.

---

### 📍 Étape 2 : Vérifier les Logs Apache

1. Ouvrez **XAMPP Control Panel**
2. Cliquez sur **"Logs"** à côté d'Apache
3. Ouvrez le dernier fichier `error.log`
4. Regardez les **dernières lignes** (les plus récentes)

**Ou directement :**
- Allez dans : `C:\xampp\apache\logs\error.log`
- Ouvrez avec Notepad
- Regardez les dernières lignes

**Copiez l'erreur exacte** que vous voyez.

---

### 📍 Étape 3 : Vérifier MySQL

1. **XAMPP Control Panel** → Vérifiez que **MySQL** a un bouton **vert** (démarré)
2. Si **rouge** → Cliquez sur **"Start"**

---

### 📍 Étape 4 : Vérifier la Base de Données

1. Ouvrez : **http://localhost/phpmyadmin**
2. Dans le menu de gauche, cherchez **`GestionRH_Academic`**
3. Si elle **n'existe pas** :

   **Solution :**
   - Cliquez sur **"Nouvelle base de données"** (ou "New")
   - Nom : `GestionRH_Academic`
   - Interclassement : `utf8mb4_general_ci`
   - Cliquez **"Créer"**
   - Cliquez sur la base créée
   - Onglet **"Importer"**
   - Cliquez **"Choisir un fichier"**
   - Sélectionnez `base de donne.sql`
   - Cliquez **"Exécuter"**

---

### 📍 Étape 5 : Vérifier les Fichiers

Assurez-vous que vos fichiers sont dans :
```
C:\xampp\htdocs\GRH\
```

**Structure attendue :**
```
C:\xampp\htdocs\GRH\
├── config.php
├── index.html
├── app.js
├── modules.js
├── api\
│   ├── auth.php
│   ├── employees.php
│   ├── services.php
│   └── ... (autres fichiers)
└── base de donne.sql
```

---

### 📍 Étape 6 : Test Direct de auth.php

Ouvrez dans le navigateur :
```
http://localhost/GRH/api/auth.php?action=check
```

**Résultats :**

✅ **Si vous voyez du JSON** (même une erreur JSON) :
→ PHP fonctionne, le problème est dans la logique.

❌ **Si vous voyez "Internal Server Error"** :
→ Il y a une erreur PHP. Vérifiez les logs (Étape 2).

---

### 📍 Étape 7 : Vérifier la Syntaxe PHP

Ouvrez PowerShell dans le dossier `C:\xampp\htdocs\GRH\api\` et exécutez :

```powershell
php -l auth.php
```

**Résultats :**

✅ **"No syntax errors"** → Syntaxe OK

❌ **Erreur affichée** → Corrigez l'erreur indiquée

---

## 🐛 Problèmes Courants

### Problème 1 : "Unknown database 'GestionRH_Academic'"

**Solution :** Voir Étape 4 (créer/importer la base)

---

### Problème 2 : "Access denied for user 'root'@'localhost'"

**Solution :**
1. Ouvrez `config.php`
2. Vérifiez que `DB_PASS` est vide : `define('DB_PASS', '');`
3. Si vous avez changé le mot de passe MySQL, mettez-le dans `config.php`

---

### Problème 3 : "Call to undefined function getDBConnection()"

**Solution :**
- Vérifiez que `config.php` est bien chargé
- Vérifiez le chemin dans `api/auth.php` : `require_once __DIR__ . '/../config.php';`

---

### Problème 4 : Erreur de syntaxe PHP

**Solution :**
- Utilisez `php -l nom_fichier.php` pour chaque fichier
- Corrigez les erreurs indiquées

---

## 📞 Informations à Me Fournir

Si l'erreur persiste, donnez-moi :

1. ✅ Le résultat de `http://localhost/GRH/api/simple-test.php`
2. ✅ Les **5 dernières lignes** de `C:\xampp\apache\logs\error.log`
3. ✅ Le résultat de `http://localhost/GRH/api/auth.php?action=check`
4. ✅ L'état de MySQL dans XAMPP (vert/rouge)
5. ✅ Si la base `GestionRH_Academic` existe dans phpMyAdmin

---

## ✅ Checklist Rapide

- [ ] MySQL démarré (bouton vert dans XAMPP)
- [ ] Apache démarré (bouton vert dans XAMPP)
- [ ] Base `GestionRH_Academic` existe dans phpMyAdmin
- [ ] Fichiers dans `C:\xampp\htdocs\GRH\`
- [ ] `simple-test.php` affiche "Tous les tests sont passés"
- [ ] Logs Apache vérifiés

---

## 🚀 Après Correction

Une fois que `simple-test.php` fonctionne :

1. Testez l'application : `http://localhost/GRH/`
2. Essayez de vous connecter
3. Si erreur 500 persiste, vérifiez la console du navigateur (F12) pour voir quelle requête échoue







