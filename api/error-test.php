<?php
/**
 * Test qui affiche les erreurs directement
 * Utilisez ce fichier pour voir l'erreur exacte
 */

// Activer TOUTES les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);

echo "<h1>Test d'Erreur - Affiche tout</h1>";
echo "<pre>";

try {
    echo "1. Chargement config.php...\n";
    $configPath = __DIR__ . '/../config.php';
    require_once $configPath;
    echo "   ✅ Config chargé\n\n";
    
    echo "2. Test getDBConnection()...\n";
    $pdo = getDBConnection();
    echo "   ✅ Connexion réussie\n\n";
    
    echo "3. Test requête simple...\n";
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    echo "   ✅ Requête OK: " . $result['test'] . "\n\n";
    
    echo "4. Test auth.php (simulation)...\n";
    $_SERVER['REQUEST_METHOD'] = 'GET';
    $_GET['action'] = 'check';
    
    // Capturer les erreurs
    ob_start();
    try {
        include __DIR__ . '/auth.php';
    } catch (Throwable $e) {
        echo "   ❌ ERREUR: " . $e->getMessage() . "\n";
        echo "   Fichier: " . $e->getFile() . "\n";
        echo "   Ligne: " . $e->getLine() . "\n";
        echo "   Trace:\n" . $e->getTraceAsString() . "\n";
    }
    $output = ob_get_clean();
    
    if (empty($output)) {
        echo "   ⚠️ Aucune sortie (normal pour check sans session)\n";
    } else {
        echo "   Sortie: " . htmlspecialchars($output) . "\n";
    }
    
    echo "\n✅ Tous les tests de base sont OK!\n";
    echo "\nSi vous voyez ce message, le problème vient peut-être d'une requête spécifique.\n";
    echo "Vérifiez la console du navigateur (F12) pour voir quelle requête échoue.\n";
    
} catch (Throwable $e) {
    echo "\n❌ ERREUR FATALE:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "\nTrace complète:\n";
    echo $e->getTraceAsString() . "\n";
}

echo "</pre>";







