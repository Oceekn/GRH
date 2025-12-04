<?php
/**
 * Test direct de l'inscription pour voir l'erreur exacte
 */

// Activer toutes les erreurs
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>Test Inscription</h1>";
echo "<pre>";

// Simuler une requête POST
$_SERVER['REQUEST_METHOD'] = 'POST';
$_GET['action'] = 'signup';

// Simuler des données JSON
$testData = [
    'email' => 'test@example.com',
    'password' => 'test123',
    'name' => 'Test User'
];

// Capturer la sortie
ob_start();
try {
    // Inclure auth.php
    include __DIR__ . '/auth.php';
    $output = ob_get_clean();
    
    echo "Sortie reçue:\n";
    echo $output . "\n\n";
    
    // Essayer de décoder en JSON
    $json = json_decode($output, true);
    if ($json === null) {
        echo "❌ ERREUR: La sortie n'est pas du JSON valide!\n";
        echo "Erreur JSON: " . json_last_error_msg() . "\n";
        echo "Premiers caractères: " . substr($output, 0, 200) . "\n";
    } else {
        echo "✅ JSON valide:\n";
        print_r($json);
    }
    
} catch (Throwable $e) {
    $output = ob_get_clean();
    echo "❌ EXCEPTION:\n";
    echo "Message: " . $e->getMessage() . "\n";
    echo "Fichier: " . $e->getFile() . "\n";
    echo "Ligne: " . $e->getLine() . "\n";
    echo "\nSortie capturée:\n" . $output . "\n";
}

echo "</pre>";







