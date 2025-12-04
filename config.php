<?php
/**
 * Configuration de la base de données
 * RHorizon - Système de Gestion des Ressources Humaines
 */

// Configuration de la base de données
define('DB_HOST', 'localhost');
define('DB_NAME', 'GestionRH_Academic');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_CHARSET', 'utf8mb4');

// Configuration de l'application
define('APP_NAME', 'RHorizon');
define('APP_VERSION', '1.0.0');

// Gestion des erreurs (désactiver en production)
error_reporting(E_ALL);
ini_set('display_errors', 0); // Ne pas afficher dans les réponses JSON
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/php_errors.log');

/**
 * Connexion à la base de données
 */
function getDBConnection() {
    static $pdo = null;
    
    if ($pdo === null) {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES   => false,
            ];
            
            $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
            
        } catch (PDOException $e) {
            // Ne pas envoyer de réponse JSON ici, laisser l'appelant gérer
            throw new Exception('Erreur de connexion à la base de données: ' . $e->getMessage());
        }
    }
    
    return $pdo;
}

/**
 * Envoie une réponse JSON
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Envoie une réponse de succès
 */
function sendSuccess($message, $data = null) {
    $response = ['success' => true, 'message' => $message];
    if ($data !== null) {
        $response['data'] = $data;
    }
    sendJSON($response);
}

/**
 * Envoie une réponse d'erreur
 */
function sendError($message, $statusCode = 400) {
    sendJSON([
        'success' => false,
        'message' => $message
    ], $statusCode);
}

/**
 * Récupère les données JSON de la requête
 */
function getJSONInput() {
    $json = file_get_contents('php://input');
    return json_decode($json, true);
}

/**
 * Valide que l'utilisateur est connecté
 */
function requireAuth() {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendError('Authentification requise', 401);
    }
    return $_SESSION['user_id'];
}

/**
 * Récupère l'IP du client
 */
function getClientIP() {
    if (!empty($_SERVER['HTTP_CLIENT_IP'])) {
        return $_SERVER['HTTP_CLIENT_IP'];
    } elseif (!empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        return $_SERVER['HTTP_X_FORWARDED_FOR'];
    } else {
        return $_SERVER['REMOTE_ADDR'] ?? '127.0.0.1';
    }
}

/**
 * Log une action dans l'audit
 */
function logAudit($pdo, $userId, $action, $table, $recordId = null, $details = null) {
    try {
        $stmt = $pdo->prepare("
            INSERT INTO AuditLog (utilisateurId, action, tableConcernee, enregistrementId, details, ipAddress)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        
        $detailsJson = $details ? json_encode($details, JSON_UNESCAPED_UNICODE) : null;
        $stmt->execute([
            $userId,
            $action,
            $table,
            $recordId,
            $detailsJson,
            getClientIP()
        ]);
    } catch (PDOException $e) {
        // Ne pas bloquer l'application si l'audit échoue
        error_log("Erreur audit: " . $e->getMessage());
    }
}

// Démarrer la session pour l'authentification
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Gestion CORS (pour développement)
// Ne définir les headers CORS que si aucun header Content-Type n'a été défini
// Cela permet aux fichiers API de définir leur propre header JSON en premier
if (!headers_sent()) {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, Authorization');
    
    if (isset($_SERVER['REQUEST_METHOD']) && $_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit;
    }
}

