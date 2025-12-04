# Guide d'intégration Base de Données MySQL

Ce guide explique comment intégrer la base de données MySQL avec l'application GRH.

## 📋 Prérequis

1. **XAMPP** (ou WAMP/MAMP) installé et démarré
2. **Base de données créée** : Exécuter le fichier `base de donne.sql` dans phpMyAdmin
3. **PHP 7.4+** avec extensions PDO et MySQL

## 🚀 Installation

### 1. Créer la base de données

1. Ouvrir phpMyAdmin (http://localhost/phpmyadmin)
2. Importer le fichier `base de donne.sql`
3. Vérifier que la base `GestionRH_Academic` est créée

### 2. Configurer la connexion

Éditer `config.php` si nécessaire :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'GestionRH_Academic');
define('DB_USER', 'root');
define('DB_PASS', ''); // Mot de passe MySQL si configuré
```

### 3. Tester l'API

Ouvrir dans le navigateur : `http://localhost/GRH/api/auth.php?action=check`

Vous devriez voir une réponse JSON.

## 🔄 Migration depuis localStorage

### Étape 1 : Modifier l'authentification

Dans `app.js`, remplacer `handleLogin` :

```javascript
async function handleLogin(email, password) {
    try {
        const result = await AuthAPI.login(email, password);
        if (result.success) {
            currentUser = result.data.user;
            
            // Masquer page login, afficher app
            document.getElementById('login-page').classList.add('hidden');
            document.getElementById('app').classList.remove('hidden');
            
            // Charger les données
            await loadInitialData();
        }
    } catch (error) {
        alert('Erreur de connexion : ' + error.message);
    }
}
```

### Étape 2 : Modifier le chargement des données

Remplacer `loadInitialData` :

```javascript
async function loadInitialData() {
    try {
        // Charger depuis l'API
        const [employeesRes, servicesRes, contractsRes, leavesRes, attendanceRes, payrollRes] = await Promise.all([
            EmployeesAPI.getAll(),
            ServicesAPI.getAll(),
            ContractsAPI.getAll(),
            LeavesAPI.getAll(),
            AttendanceAPI.getAll(),
            PayrollAPI.getAll()
        ]);
        
        employees = employeesRes.data || [];
        services = servicesRes.data || [];
        contracts = contractsRes.data || [];
        leaves = leavesRes.data || [];
        attendance = attendanceRes.data || [];
        payroll = payrollRes.data || [];
        
        // Rendre les données
        renderEmployees();
        renderServices();
        // ... etc
    } catch (error) {
        console.error('Erreur chargement:', error);
    }
}
```

### Étape 3 : Modifier les fonctions CRUD

**Exemple pour créer un employé :**

```javascript
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeData = {
        lastname: document.getElementById('employee-lastname').value,
        firstname: document.getElementById('employee-firstname').value,
        // ... autres champs
    };
    
    try {
        const result = await EmployeesAPI.create(employeeData);
        if (result.success) {
            await loadInitialData(); // Recharger
            closeAllModals();
        }
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}
```

**Exemple pour mettre à jour :**

```javascript
async function updateEmployee(id, data) {
    try {
        const result = await EmployeesAPI.update(id, data);
        if (result.success) {
            await loadInitialData();
        }
    } catch (error) {
        alert('Erreur : ' + error.message);
    }
}
```

## 📁 Structure des APIs

Toutes les APIs suivent le même pattern :

- **GET** : Récupérer des données
- **POST** : Créer
- **PUT** : Mettre à jour
- **DELETE** : Supprimer

### Endpoints disponibles

- `api/auth.php` - Authentification
- `api/employees.php` - Employés
- `api/services.php` - Services
- `api/contracts.php` - Contrats
- `api/leaves.php` - Congés
- `api/attendance.php` - Présences
- `api/payroll.php` - Paie
- `api/users.php` - Utilisateurs (admin)
- `api/roles.php` - Rôles et permissions (admin)
- `api/audit.php` - Audit log (admin)

## 🔐 Authentification

L'authentification utilise les sessions PHP. Après connexion, les cookies de session sont automatiquement gérés.

Pour vérifier l'authentification :

```javascript
try {
    const result = await AuthAPI.check();
    if (result.success) {
        currentUser = result.data.user;
    }
} catch (error) {
    // Non authentifié, rediriger vers login
    window.location.href = 'index.html';
}
```

## ⚠️ Notes importantes

1. **Sessions PHP** : Les sessions sont gérées automatiquement via cookies
2. **Gestion d'erreurs** : Toujours utiliser try/catch avec les appels API
3. **Chargement asynchrone** : Toutes les fonctions doivent être `async/await`
4. **Permissions** : Certaines APIs nécessitent le rôle administrateur

## 🧪 Test

1. Créer un utilisateur via l'API signup
2. Se connecter
3. Créer un employé
4. Vérifier dans phpMyAdmin que les données sont bien enregistrées

## 📝 Prochaines étapes

1. Modifier progressivement `app.js` pour utiliser les APIs
2. Tester chaque fonctionnalité
3. Supprimer le code localStorage une fois tout migré
4. Ajouter la gestion d'erreurs globale

## 🆘 Dépannage

**Erreur 500** : Vérifier les logs PHP (XAMPP > Apache > Logs)
**Erreur de connexion** : Vérifier config.php et que MySQL est démarré
**CORS** : Les headers CORS sont configurés dans config.php pour le développement


