# Configuration de Gmail pour l'envoi d'emails

## Étapes pour activer SMTP Gmail

### 1. Activer l'authentification 2FA sur votre compte Google
1. Allez à [myaccount.google.com](https://myaccount.google.com)
2. Cliquez sur "Sécurité" dans le menu de gauche
3. Activez la **Vérification en deux étapes** si ce n'est pas déjà fait

### 2. Créer un mot de passe d'application
1. Allez à [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Sélectionnez:
   - **Appareil**: Sélectionnez "Mail"
   - **Système d'exploitation**: Sélectionnez "Windows" ou "Mac/Linux"
3. Google vous génèrera un **mot de passe d'application** (16 caractères)
4. Copiez ce mot de passe

### 3. Configurer le fichier mail.php
1. Ouvrez `/api/../mail.php`
2. Remplacez les valeurs suivantes:

```php
const SMTP_USERNAME = 'votre_email@gmail.com';        // Votre adresse Gmail
const SMTP_PASSWORD = 'mot_de_passe_16_caracteres';   // Le mot de passe généré
const FROM_EMAIL = 'votre_email@gmail.com';            // Votre adresse Gmail
```

### 4. Vérifier la configuration PHP
Assurez-vous que votre serveur XAMPP a les extensions PHP nécessaires:
- `php_openssl.dll` (activé dans php.ini)
- `php_sockets.dll` (activé dans php.ini)

Si vous utilisez XAMPP:
1. Ouvrez `xampp/php/php.ini`
2. Assurez-vous que ces lignes ne sont pas commentées:
   ```ini
   extension=openssl
   extension=sockets
   ```
3. Redémarrez Apache

### 5. Tester l'envoi d'email
Créez un fichier `test-email.php` à la racine du projet:

```php
<?php
require_once 'mail.php';

$mailer = new Mailer();
$result = $mailer->send(
    'votre_email@example.com',
    'Test RHorizon',
    'Ceci est un email de test de RHorizon'
);

echo json_encode($result);
?>
```

Accédez à `http://localhost/rhorizon/test-email.php`

## Important
- Ne commitez **jamais** vos identifiants Gmail dans Git
- Utilisez des variables d'environnement en production
- Pour la production, considérez une plateforme d'envoi dédiée (SendGrid, AWS SES, etc.)

## Dépannage
- **Erreur "Connection refused"**: Vérifiez que Gmail SMTP est activé
- **Erreur "Authentication failed"**: Vérifiez le mot de passe d'application
- **Erreur "OpenSSL"**: Activez l'extension OpenSSL dans php.ini
