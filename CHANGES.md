# Résumé des changements - RHorizon v1.1

## 1. Système de Rôles et Permissions

### Implémentation
- Classe `PermissionManager` pour contrôler l'accès basé sur les rôles
- Trois rôles principaux: **ADMIN**, **COMPTABLE**, **RH**
- 16 permissions granulaires par module

### Rôles
| Rôle | Modules accessibles | Notes |
|------|-------------------|-------|
| **ADMIN** | Tous | Gestion complète du système, rôles, audit |
| **COMPTABLE** | Paie | Accès uniquement au module de paie |
| **RH** | Employés, Congés, Présences, Paie*, Contrats, Services | Pas accès aux rôles ni audit |
| **MANAGER** | Équipe (congés, présences) | Gestion basique de l'équipe |
| **EMPLOYE** | Consultation (paie, congés) | Accès limité à ses données |

### Fichiers ajoutés
- `/permissions.php` - Classe PermissionManager
- `/api/user-roles.php` - API de gestion des rôles
- `/api/roles-init.php` - Initialisation des rôles en BD

## 2. Système d'Envoi d'Emails

### Configuration
- Intégration Gmail SMTP
- Classe `Mailer` pour simplifier l'envoi
- Configuration centralisée dans `mail.php`

### Fonctionnalités
- Email automatique si bulletin = "PAYÉ"
- Pas d'email si bulletin = "BROUILLON" ou "VALIDE"
- Format HTML professionnel
- Support des primes et déductions

### Fichiers ajoutés
- `/mail.php` - Classe Mailer et configuration
- `/GMAIL_SETUP.md` - Guide de configuration Gmail

## 3. Amélioration du Bulletin de Paie

### Nouvelle présentation
- Section "Informations Employé" (nom, matricule, période)
- Section "Salaire et Rémunérations" (base, heures supp, primes)
- Section "Retenues et Déductions" (cotisations, impôts, déductions)
- Section "Résumé" avec salaire net en évidence

### Format
- HTML structuré et lisible
- Formatage des montants en FCFA
- Séparation claire des sections

### Fonction
- `generatePayslipPDF()` - Génère le bulletin au format HTML
- Prêt pour une conversion PDF avec TCPDF/mPDF

## 4. Modifications de l'API Paie

### Nouvelle action: `download`
```
GET /api/payroll.php?action=download&id=SALAIRE_ID
```
- Télécharge le bulletin en PDF
- Envoie email si statut = "PAYÉ"
- Enregistre l'action en audit

### Nouvelle action: `pay`
```
POST /api/payroll.php?action=pay&id=SALAIRE_ID
```
- Marque le bulletin comme "PAYÉ"
- Enregistre la date de paiement
- Nécessite permission SALARY_MANAGE

### Améliorations
- Vérification des permissions avant chaque action
- Logging d'audit complet
- Meilleure gestion des erreurs

## 5. Modifications des APIs existantes

### `/api/users.php`
- Utilisation de `PermissionManager` au lieu de vérification directe du rôle
- Centralisation de la logique de permission
- Plus flexible et maintenable

## 6. Documentation

### Nouveaux fichiers
- `/SETUP_ROLES.md` - Guide complet de setup
- `/GMAIL_SETUP.md` - Configuration Gmail step-by-step
- `/CHANGES.md` - Ce fichier (résumé des changements)

## Utilisation Rapide

### 1. Initialiser les rôles
```
GET http://localhost/rhorizon/api/roles-init.php
```

### 2. Configurer Gmail
- Créer mot de passe d'application Google
- Modifier `/mail.php` ligne 10-11
- Voir `/GMAIL_SETUP.md`

### 3. Assigner un rôle à un utilisateur
```
POST /api/user-roles.php?action=assign
{
  "targetUserId": 2,
  "roleId": 2  // 2 = COMPTABLE
}
```

### 4. Télécharger bulletin (envoie email si payé)
```
GET /api/payroll.php?action=download&id=5
```

## Accès par Rôle

### COMPTABLE
- ✅ Créer bulletin
- ✅ Valider bulletin
- ✅ Marquer comme payé
- ✅ Télécharger bulletin
- ❌ Gérer employés
- ❌ Gérer congés

### RH
- ✅ Gérer employés
- ✅ Gérer congés/présences
- ✅ Consulter paie
- ✅ Télécharger bulletins
- ✅ Gérer contrats
- ❌ Gérer rôles
- ❌ Voir audit

### ADMIN
- ✅ TOUT
- ✅ Gérer utilisateurs
- ✅ Gérer rôles & permissions
- ✅ Voir logs d'audit

## Notes de Sécurité

1. **Permissions**: Implémentez `requirePermission()` dans les nouvelles APIs
2. **Email**: Gardez les credentials Gmail sécurisés (env variables en production)
3. **Audit**: Toutes les actions sensibles sont loggées
4. **Session**: `requireAuth()` doit être appelé au début de chaque API

## Prochaines Étapes (optionnelles)

1. Installer PHPMailer pour l'envoi d'emails robuste
2. Convertir les bulletins en vrai PDF avec TCPDF
3. Ajouter une page d'administration des rôles dans le frontend
4. Implémenter la gestion des permissions dans l'UI
5. Ajouter des webhooks pour les événements RH
