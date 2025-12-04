<?php
/**
 * API d'authentification
 * Gestion de la connexion et de l'inscription
 */

// Définir les headers JSON IMMÉDIATEMENT pour éviter toute sortie HTML
header('Content-Type: application/json; charset=utf-8');

// Désactiver l'affichage des erreurs (on les capturera)
error_reporting(E_ALL);
ini_set('display_errors', 0);
ini_set('log_errors', 1);

// Fonction pour capturer les erreurs et les renvoyer en JSON
function handleError($errno, $errstr, $errfile, $errline) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $errstr,
        'file' => basename($errfile),
        'line' => $errline
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

function handleException($exception) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $exception->getMessage(),
        'file' => basename($exception->getFile()),
        'line' => $exception->getLine()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Enregistrer les gestionnaires d'erreurs
set_error_handler('handleError');
set_exception_handler('handleException');

// Vérifier le chemin du fichier config
$configPath = __DIR__ . '/../config.php';
if (!file_exists($configPath)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Fichier de configuration introuvable',
        'path' => $configPath
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

// Capturer toute sortie avant le require
ob_start();
require_once $configPath;
$output = ob_get_clean();

// Si config.php a généré une sortie, c'est une erreur
if (!empty($output)) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur de configuration',
        'output' => $output
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$action = $_GET['action'] ?? '';

// Initialiser $pdo seulement si nécessaire
$pdo = null;
try {
    if ($method === 'POST' && ($action === 'login' || $action === 'signup')) {
        $pdo = getDBConnection();
    } elseif ($method === 'POST' && $action === 'logout') {
        // logout ne nécessite pas la DB
    } elseif ($method === 'GET' && $action === 'check') {
        // checkAuth ne nécessite pas la DB
    } else {
        $pdo = getDBConnection();
    }
} catch (Exception $e) {
    error_log("Erreur DB dans auth.php: " . $e->getMessage());
    sendError('Erreur de connexion à la base de données: ' . $e->getMessage(), 500);
} catch (Error $e) {
    // Capturer aussi les erreurs fatales PHP
    error_log("Erreur fatale dans auth.php: " . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Erreur serveur',
        'error' => $e->getMessage()
    ], JSON_UNESCAPED_UNICODE);
    exit;
}

switch ($method) {
    case 'POST':
        if ($action === 'login') {
            handleLogin($pdo);
        } elseif ($action === 'signup') {
            handleSignup($pdo);
        } elseif ($action === 'logout') {
            handleLogout();
        } else {
            sendError('Action non reconnue');
        }
        break;
    
    case 'GET':
        if ($action === 'check') {
            checkAuth();
        } else {
            sendError('Action non reconnue');
        }
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

/**
 * Gère la connexion
 */
function handleLogin($pdo) {
    $data = getJSONInput();
    
    if (!isset($data['email']) || !isset($data['password'])) {
        sendError('Email et mot de passe requis');
    }
    
    $email = trim($data['email']);
    $password = $data['password'];
    
    // Récupérer l'utilisateur
    $stmt = $pdo->prepare("
        SELECT u.*, r.nomRole 
        FROM Utilisateur u
        LEFT JOIN Role r ON u.roleId = r.roleId
        WHERE u.email = ? AND u.statut = 'ACTIF'
    ");
    $stmt->execute([$email]);
    $user = $stmt->fetch();
    
    if (!$user) {
        sendError('Email ou mot de passe incorrect');
    }
    
    // Vérifier le mot de passe (hash bcrypt)
    if (!password_verify($password, $user['motDePasse'])) {
        // Pour compatibilité avec anciens mots de passe non hashés
        if ($user['motDePasse'] !== $password) {
            sendError('Email ou mot de passe incorrect');
        }
    }
    
    // Mettre à jour la dernière connexion
    $ip = getClientIP();
    $stmt = $pdo->prepare("
        UPDATE Utilisateur 
        SET derniereConnexion = NOW(), adresseIp = ?
        WHERE utilisateurId = ?
    ");
    $stmt->execute([$ip, $user['utilisateurId']]);
    
    // Créer la session
    $_SESSION['user_id'] = $user['utilisateurId'];
    $_SESSION['user_email'] = $user['email'];
    $_SESSION['user_name'] = $user['prenom'] . ' ' . $user['nom'];
    $_SESSION['user_role'] = $user['nomRole'] ?? null;
    
    // Logger l'action
    logAudit($pdo, $user['utilisateurId'], 'LOGIN', 'Utilisateur', $user['utilisateurId'], [
        'email' => $email,
        'ip' => $ip
    ]);
    
    sendSuccess('Connexion réussie', [
        'user' => [
            'id' => $user['utilisateurId'],
            'email' => $user['email'],
            'name' => $user['prenom'] . ' ' . $user['nom'],
            'role' => $user['nomRole']
        ]
    ]);
}

/**
 * Gère l'inscription
 */
function handleSignup($pdo) {
    if ($pdo === null) {
        sendError('Erreur de connexion à la base de données', 500);
    }
    
    $data = getJSONInput();
    
    // Validation
    if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
        sendError('Email, mot de passe et nom requis');
    }
    
    $email = trim($data['email']);
    $password = $data['password'];
    $name = trim($data['name']);
    
    if (strlen($password) < 6) {
        sendError('Le mot de passe doit contenir au moins 6 caractères');
    }
    
    // Vérifier si l'email existe déjà
    $stmt = $pdo->prepare("SELECT utilisateurId FROM Utilisateur WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) {
        sendError('Cet email est déjà utilisé');
    }
    
    // Extraire nom et prénom
    $nameParts = explode(' ', $name, 2);
    $prenom = $nameParts[0];
    $nom = isset($nameParts[1]) ? $nameParts[1] : '';
    
    // Hash du mot de passe
    $hashedPassword = password_hash($password, PASSWORD_DEFAULT);
    
    // Déterminer le rôle (premier utilisateur = admin, sinon employé)
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM Utilisateur");
    $count = $stmt->fetch()['count'];
    $roleId = $count === 0 ? 1 : 4; // 1 = ADMIN, 4 = EMPLOYE
    
    // Créer l'utilisateur
    $stmt = $pdo->prepare("
        INSERT INTO Utilisateur (nom, prenom, email, motDePasse, roleId, statut)
        VALUES (?, ?, ?, ?, ?, 'ACTIF')
    ");
    $stmt->execute([$nom, $prenom, $email, $hashedPassword, $roleId]);
    
    $userId = $pdo->lastInsertId();
    
    // Logger l'action
    logAudit($pdo, $userId, 'CREATE', 'Utilisateur', $userId, [
        'email' => $email,
        'roleId' => $roleId
    ]);
    
    sendSuccess('Inscription réussie', [
        'user' => [
            'id' => $userId,
            'email' => $email,
            'name' => $name
        ]
    ]);
}

/**
 * Gère la déconnexion
 */
function handleLogout() {
    if (isset($_SESSION['user_id'])) {
        $userId = $_SESSION['user_id'];
        session_destroy();
        sendSuccess('Déconnexion réussie');
    } else {
        sendError('Aucune session active');
    }
}

/**
 * Vérifie l'état de l'authentification
 */
function checkAuth() {
    session_start();
    if (isset($_SESSION['user_id'])) {
        sendSuccess('Utilisateur connecté', [
            'user' => [
                'id' => $_SESSION['user_id'],
                'email' => $_SESSION['user_email'] ?? '',
                'name' => $_SESSION['user_name'] ?? '',
                'role' => $_SESSION['user_role'] ?? null
            ]
        ]);
    } else {
        sendError('Non authentifié', 401);
    }
}

