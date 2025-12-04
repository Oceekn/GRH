<?php
/**
 * Script de débogage simple
 * Affiche toutes les erreurs PHP
 */

// Activer l'affichage des erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "<h1>🔍 Diagnostic RHorizon</h1>";
echo "<style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .success { color: green; }
    .error { color: red; }
    .warning { color: orange; }
    pre { background: #f5f5f5; padding: 10px; border-left: 3px solid #ccc; }
</style>";

// Test 1: PHP
echo "<h2>1. Version PHP</h2>";
echo "<p class='success'>✅ PHP " . phpversion() . "</p>";

// Test 2: Extensions
echo "<h2>2. Extensions PHP</h2>";
$required = ['pdo', 'pdo_mysql', 'json', 'session'];
foreach ($required as $ext) {
    if (extension_loaded($ext)) {
        echo "<p class='success'>✅ $ext</p>";
    } else {
        echo "<p class='error'>❌ $ext - MANQUANT</p>";
    }
}

// Test 3: Fichier config
echo "<h2>3. Fichier config.php</h2>";
$configPath = __DIR__ . '/../config.php';
if (file_exists($configPath)) {
    echo "<p class='success'>✅ Fichier trouvé: $configPath</p>";
    try {
        require_once $configPath;
        echo "<p class='success'>✅ Fichier chargé avec succès</p>";
        echo "<pre>DB_HOST: " . DB_HOST . "\nDB_NAME: " . DB_NAME . "\nDB_USER: " . DB_USER . "</pre>";
    } catch (Exception $e) {
        echo "<p class='error'>❌ Erreur lors du chargement: " . $e->getMessage() . "</p>";
    }
} else {
    echo "<p class='error'>❌ Fichier introuvable: $configPath</p>";
    echo "<p>Chemin actuel: " . __DIR__ . "</p>";
    exit;
}

// Test 4: Connexion MySQL
echo "<h2>4. Connexion MySQL</h2>";
try {
    // Test connexion sans base
    $dsn = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
    $pdo = new PDO($dsn, DB_USER, DB_PASS);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    echo "<p class='success'>✅ Connexion MySQL réussie</p>";
    
    // Vérifier si la base existe
    $stmt = $pdo->query("SHOW DATABASES LIKE '" . DB_NAME . "'");
    if ($stmt->rowCount() > 0) {
        echo "<p class='success'>✅ Base de données '" . DB_NAME . "' existe</p>";
        
        // Tester la connexion à la base
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
            $pdo = new PDO($dsn, DB_USER, DB_PASS);
            $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            echo "<p class='success'>✅ Connexion à la base '" . DB_NAME . "' réussie</p>";
            
            // Compter les tables
            $stmt = $pdo->query("SHOW TABLES");
            $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
            echo "<p class='success'>✅ Nombre de tables: " . count($tables) . "</p>";
            if (count($tables) > 0) {
                echo "<pre>" . implode("\n", $tables) . "</pre>";
            }
        } catch (PDOException $e) {
            echo "<p class='error'>❌ Erreur connexion base: " . $e->getMessage() . "</p>";
        }
    } else {
        echo "<p class='error'>❌ Base de données '" . DB_NAME . "' N'EXISTE PAS</p>";
        echo "<p class='warning'>👉 Solution: Importer 'base de donne.sql' dans phpMyAdmin</p>";
    }
} catch (PDOException $e) {
    echo "<p class='error'>❌ Erreur connexion MySQL: " . $e->getMessage() . "</p>";
    echo "<p class='warning'>👉 Vérifiez que MySQL est démarré dans XAMPP</p>";
}

// Test 5: Fonction getDBConnection
echo "<h2>5. Test getDBConnection()</h2>";
try {
    $pdo = getDBConnection();
    echo "<p class='success'>✅ getDBConnection() fonctionne</p>";
} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur getDBConnection(): " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

// Test 6: Fichiers API
echo "<h2>6. Fichiers API</h2>";
$apiFiles = ['auth.php', 'employees.php', 'services.php', 'contracts.php', 'leaves.php', 'attendance.php', 'payroll.php'];
foreach ($apiFiles as $file) {
    $path = __DIR__ . '/' . $file;
    if (file_exists($path)) {
        // Vérifier la syntaxe
        $output = [];
        $return = 0;
        exec("php -l \"$path\" 2>&1", $output, $return);
        if ($return === 0) {
            echo "<p class='success'>✅ $file (syntaxe OK)</p>";
        } else {
            echo "<p class='error'>❌ $file - Erreur de syntaxe:</p>";
            echo "<pre>" . implode("\n", $output) . "</pre>";
        }
    } else {
        echo "<p class='warning'>⚠️ $file - Fichier manquant</p>";
    }
}

// Test 7: Test auth.php directement
echo "<h2>7. Test auth.php (simulation)</h2>";
try {
    // Simuler une requête GET
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET['action'] = 'check';
    
    // Capturer la sortie
    ob_start();
    include __DIR__ . '/auth.php';
    $output = ob_get_clean();
    
    echo "<p class='success'>✅ auth.php s'exécute sans erreur fatale</p>";
    echo "<pre>Sortie: " . htmlspecialchars($output) . "</pre>";
} catch (Exception $e) {
    echo "<p class='error'>❌ Erreur dans auth.php: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
} catch (Error $e) {
    echo "<p class='error'>❌ Erreur fatale dans auth.php: " . $e->getMessage() . "</p>";
    echo "<pre>" . $e->getTraceAsString() . "</pre>";
}

echo "<hr>";
echo "<h2>📝 Résumé</h2>";
echo "<p>Si vous voyez des ❌, suivez les instructions indiquées.</p>";
echo "<p>Si tout est ✅, l'erreur 500 peut venir d'une requête spécifique.</p>";



