<?php
/**
 * Fichier de test pour vérifier la configuration
 */

// Afficher les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test de Configuration RHorizon</h1>";

// Test 1: Vérifier PHP
echo "<h2>1. Version PHP</h2>";
echo "Version PHP: " . phpversion() . "<br>";
echo "Extensions chargées: " . implode(", ", get_loaded_extensions()) . "<br>";

// Test 2: Vérifier PDO
echo "<h2>2. Extension PDO</h2>";
if (extension_loaded('pdo')) {
    echo "✅ PDO est chargé<br>";
    if (extension_loaded('pdo_mysql')) {
        echo "✅ PDO MySQL est chargé<br>";
    } else {
        echo "❌ PDO MySQL n'est PAS chargé<br>";
    }
} else {
    echo "❌ PDO n'est PAS chargé<br>";
}

// Test 3: Vérifier le fichier config
echo "<h2>3. Fichier config.php</h2>";
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    echo "✅ Fichier config.php trouvé: $configPath<br>";
    require_once $configPath;
    echo "✅ Fichier config.php chargé<br>";
    echo "DB_HOST: " . DB_HOST . "<br>";
    echo "DB_NAME: " . DB_NAME . "<br>";
    echo "DB_USER: " . DB_USER . "<br>";
} else {
    echo "❌ Fichier config.php introuvable: $configPath<br>";
    exit;
}

// Test 4: Tester la connexion MySQL
echo "<h2>4. Connexion MySQL</h2>";
try {
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    echo "✅ Connexion MySQL réussie<br>";
    
    // Vérifier si la base existe
    $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
    if ($stmt->rowCount() > 0) {
        echo "✅ Base de données '" . DB_NAME . "' existe<br>";
        
        // Tester la connexion à la base
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
        $pdo = new PDO($dsn, DB_USER, DB_PASS);
        echo "✅ Connexion à la base '" . DB_NAME . "' réussie<br>";
        
        // Compter les tables
        $stmt = $pdo->query("SHOW TABLES");
        $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
        echo "✅ Nombre de tables: " . count($tables) . "<br>";
        echo "Tables: " . implode(", ", $tables) . "<br>";
        
    } else {
        echo "❌ Base de données '" . DB_NAME . "' n'existe PAS<br>";
        echo "👉 Veuillez importer le fichier 'base de donne.sql' dans phpMyAdmin<br>";
    }
    
} catch (PDOException $e) {
    echo "❌ Erreur de connexion MySQL: " . $e->getMessage() . "<br>";
    echo "👉 Vérifiez que MySQL est démarré dans XAMPP<br>";
}

// Test 5: Vérifier les fichiers API
echo "<h2>5. Fichiers API</h2>";
$apiFiles = ['auth.php', 'employees.php', 'services.php', 'contracts.php', 'leaves.php', 'attendance.php', 'payroll.php'];
foreach ($apiFiles as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        echo "✅ $file<br>";
    } else {
        echo "❌ $file manquant<br>";
    }
}

echo "<hr>";
echo "<p><strong>Si tous les tests sont ✅, l'application devrait fonctionner.</strong></p>";
echo "<p>Si vous voyez des ❌, suivez les instructions indiquées.</p>";


