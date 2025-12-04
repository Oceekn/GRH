═══════════════════════════════════════════════════════════════
  GUIDE D'INSTALLATION RAPIDE - GRH avec Base de Données
═══════════════════════════════════════════════════════════════

ÉTAPE 1 : INSTALLER XAMPP
─────────────────────────

1. Télécharger XAMPP :
   → https://www.apachefriends.org/download.html
   → Choisir version Windows (PHP 8.x)

2. Installer :
   → Double-cliquer sur le fichier .exe téléchargé
   → Choisir C:\xampp (par défaut)
   → Cocher : Apache, MySQL, phpMyAdmin
   → Installer

3. Ouvrir XAMPP Control Panel :
   → Menu Démarrer → Rechercher "XAMPP"
   → Ouvrir "XAMPP Control Panel"


ÉTAPE 2 : PLACER LES FICHIERS
──────────────────────────────

1. Aller dans : C:\xampp\htdocs\

2. Créer un dossier : GRH

3. Copier TOUS les fichiers du projet dans :
   C:\xampp\htdocs\GRH\


ÉTAPE 3 : DÉMARRER LES SERVICES
────────────────────────────────

Dans XAMPP Control Panel :

1. Cliquer "Start" sur Apache
   → Le bouton devient vert

2. Cliquer "Start" sur MySQL
   → Le bouton devient vert


ÉTAPE 4 : CRÉER LA BASE DE DONNÉES
───────────────────────────────────

1. Ouvrir phpMyAdmin :
   → http://localhost/phpmyadmin
   → Ou cliquer "Admin" à côté de MySQL dans XAMPP

2. Importer la base :
   → Cliquer sur "Importer" (onglet en haut)
   → "Choisir un fichier"
   → Sélectionner : base de donne.sql
   → Cliquer "Exécuter"

3. Vérifier :
   → Dans le menu gauche, voir "GestionRH_Academic"
   → Cliquer dessus pour voir les tables


ÉTAPE 5 : LANCER L'APPLICATION
───────────────────────────────

1. Ouvrir dans le navigateur :
   → http://localhost/GRH/index.html

2. Créer un compte :
   → Cliquer "Inscription"
   → Remplir le formulaire
   → Le premier utilisateur sera Admin automatiquement

3. Se connecter :
   → Utiliser les identifiants créés
   → Accéder au tableau de bord


═══════════════════════════════════════════════════════════════
  IMPORTANT
═══════════════════════════════════════════════════════════════

❌ NE PAS ouvrir index.html directement (double-clic)
✅ TOUJOURS utiliser : http://localhost/GRH/index.html

═══════════════════════════════════════════════════════════════
  PROBLÈMES COURANTS
═══════════════════════════════════════════════════════════════

Problème : Apache ne démarre pas (Port 80 utilisé)
Solution : Fermer Skype ou changer le port dans XAMPP

Problème : Erreur CORS
Solution : Utiliser http://localhost/GRH/index.html (pas file://)

Problème : Erreur de connexion base de données
Solution : Vérifier que MySQL est démarré et la base importée

═══════════════════════════════════════════════════════════════

Pour plus de détails, voir : INSTALLATION_COMPLETE.md


