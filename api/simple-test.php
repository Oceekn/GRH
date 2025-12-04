<?php
/**
 * Test ultra-simple pour identifier l'erreur 500
 */

// Activer TOUTES les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "Test 1: PHP fonctionne<br>";

// Test 2: Charger config
echo "Test 2: Chargement config.php...<br>";
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    echo "✅ Fichier config trouvé<br>";
    try {
        require_once $configPath;
        echo "✅ Config chargé<br>";
    } catch (Exception $e) {
        die("❌ Erreur config: " . $e->getMessage());
    }
} else {
    die("❌ Config introuvable: $configPath");
}

// Test 3: Connexion DB
echo "Test 3: Connexion DB...<br>";
try {
    $pdo = getDBConnection();
    echo "✅ Connexion DB réussie<br>";
} catch (Exception $e) {
    die("❌ Erreur DB: " . $e->getMessage() . "<br><br>👉 Vérifiez:<br>1. MySQL est démarré dans XAMPP<br>2. La base 'GestionRH_Academic' existe (importer base de donne.sql)<br>3. Les identifiants dans config.php sont corrects");
}

echo "<br>✅ Tous les tests sont passés!<br>";
echo "<br>Si vous voyez ce message, le problème vient peut-être d'un fichier API spécifique.";







