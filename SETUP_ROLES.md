# Setup du Système de Rôles et Permissions

## Introduction

Le système a été mis à jour avec:
- **Système de rôles et permissions** basé sur la base de données
- **Trois rôles principaux**: ADMIN, COMPTABLE, RH
- **Envoi d'emails automatique** quand un bulletin est marqué comme PAYÉ
- **Bulletin de paie amélioré** avec meilleure présentation

## Rôles et Permissions

### 1. ADMIN (Administrateur)
- Accès complet à tous les modules
- Gestion des utilisateurs et rôles
- Consultation des logs d'audit
- Gestion de la paie complète

**Permissions**: USER_MANAGE, ROLE_MANAGE, EMPLOYEE_MANAGE, SALARY_MANAGE, LEAVE_MANAGE, ATTENDANCE_MANAGE, SERVICE_MANAGE, CONTRACT_MANAGE, AUDIT_VIEW

### 2. COMPTABLE (Comptable)
- Gestion de la paie uniquement
- Création et validation des bulletins
- Téléchargement des bulletins

**Permissions**: SALARY_MANAGE, SALARY_VIEW, SALARY_DOWNLOAD

### 3. RH (Responsable RH)
- Gestion complète du personnel
- Gestion des employés
- Gestion des congés et présences
- Consultation des salaires
- Gestion des contrats et services
- **SANS accès à**: Rôles et Audit

**Permissions**: EMPLOYEE_MANAGE, SALARY_VIEW, SALARY_DOWNLOAD, LEAVE_MANAGE, LEAVE_APPROVE, ATTENDANCE_MANAGE, SERVICE_MANAGE, CONTRACT_MANAGE

## Étapes d'initialisation

### 1. Initialiser les rôles et permissions

Accédez à:
```
http://localhost/votre-app/api/roles-init.php
```

Cette endpoint créera/réinitialisera:
- 5 rôles (ADMIN, COMPTABLE, RH, MANAGER, EMPLOYE)
- 16 permissions
- Les associations rôle-permission

**Réponse attendue**:
```json
{
  "success": true,
  "message": "Rôles et permissions initialisés avec succès",
  "data": {
    "roles": 5,
    "permissions": 16
  }
}
```

### 2. Assigner des rôles aux utilisateurs

Via l'API `/api/user-roles.php`:

```bash
POST /api/user-roles.php?action=assign
Content-Type: application/json

{
  "targetUserId": 2,
  "roleId": 1  // 1 = ADMIN, 2 = COMPTABLE, 3 = RH, etc.
}
```

### 3. Configurer les emails

Voir le fichier `GMAIL_SETUP.md` pour:
- Activer SMTP sur Gmail
- Configurer le mot de passe d'application
- Modifier `mail.php` avec vos identifiants

## Utilisation

### Télécharger un bulletin payé (envoie un email)

```bash
GET /api/payroll.php?action=download&id=SALAIRE_ID
```

**Comportement**:
- Si statut = "PAYE": Envoie l'email + télécharge le PDF
- Si statut = "BROUILLON" ou "VALIDE": Télécharge juste le PDF

### Marquer un bulletin comme payé

```bash
POST /api/payroll.php?action=pay&id=SALAIRE_ID
```

Met à jour le statut à "PAYE" et enregistre la date de paiement.

### Gestion des rôles (Admin uniquement)

Récupérer tous les rôles:
```bash
GET /api/user-roles.php?action=roles
```

Récupérer les permissions d'un rôle:
```bash
GET /api/user-roles.php?action=roles&roleId=3
```

Modifier les permissions d'un rôle:
```bash
PUT /api/user-roles.php?action=role-permissions
Content-Type: application/json

{
  "roleId": 3,
  "permissionIds": [1, 2, 3, 4, 5]
}
```

## Structure des fichiers

### Nouveaux fichiers ajoutés:
- `mail.php` - Classe d'envoi d'emails
- `permissions.php` - Gestion des rôles et permissions
- `api/roles-init.php` - Initialisation des rôles
- `api/user-roles.php` - API de gestion des rôles
- `GMAIL_SETUP.md` - Guide de configuration Gmail
- `SETUP_ROLES.md` - Ce fichier

### Fichiers modifiés:
- `api/payroll.php` - Ajout des fonctions de téléchargement et d'envoi d'emails
- `api/users.php` - Utilisation du système de permissions

## Notes importantes

1. **Sécurité**: Les identifiants Gmail ne doivent pas être en dur en production
2. **Permissions**: Utilisez `requirePermission()` dans les APIs pour vérifier les droits
3. **Audit**: Toutes les actions importantes sont loggées dans AuditLog
4. **Email**: Actuellement utilise `mail()` PHP. Pour production, utilisez PHPMailer

## Dépannage

### "Accès refusé" pour une action
Vérifiez que l'utilisateur a la bonne permission assignée via son rôle.

### Les emails ne s'envoient pas
1. Vérifiez la configuration Gmail dans `mail.php`
2. Vérifiez les logs PHP dans `php_errors.log`
3. Assurez-vous que la fonction `mail()` est configurée

### Erreur lors de l'initialisation des rôles
L'endpoint `roles-init.php` peut être appelé plusieurs fois sans danger - il réinitialise juste les permissions.

## Support

Pour plus d'informations, consultez:
- Base de données: `base de donne.sql`
- Configuration: `config.php`
- Authentification: `api/auth.php`
