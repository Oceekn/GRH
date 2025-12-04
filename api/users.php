<?php
/**
 * API pour la gestion des utilisateurs
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

// Vérifier que l'utilisateur est admin
$stmt = $pdo->prepare("
    SELECT r.nomRole FROM Utilisateur u
    LEFT JOIN Role r ON u.roleId = r.roleId
    WHERE u.utilisateurId = ?
");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user || ($user['nomRole'] !== 'ADMIN' && $user['nomRole'] !== 'Administrateur')) {
    sendError('Accès refusé - Administrateur requis', 403);
}

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getUser($pdo, $id);
        } else {
            getUsers($pdo);
        }
        break;
    
    case 'POST':
        createUser($pdo, $userId);
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID utilisateur requis');
        updateUser($pdo, $id, $userId);
        break;
    
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID utilisateur requis');
        deleteUser($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getUsers($pdo) {
    $stmt = $pdo->query("
        SELECT 
            u.*,
            r.nomRole,
            (SELECT COUNT(*) FROM AuditLog WHERE utilisateurId = u.utilisateurId AND action = 'LOGIN') as nombreConnexions
        FROM Utilisateur u
        LEFT JOIN Role r ON u.roleId = r.roleId
        ORDER BY u.nom, u.prenom
    ");
    
    $users = $stmt->fetchAll();
    $formatted = array_map(function($u) {
        return [
            'id' => $u['utilisateurId'],
            'name' => $u['prenom'] . ' ' . $u['nom'],
            'email' => $u['email'],
            'telephone' => $u['telephone'],
            'roleId' => $u['roleId'],
            'roleName' => $u['nomRole'],
            'status' => strtolower($u['statut']),
            'lastLogin' => $u['derniereConnexion'],
            'lastIp' => $u['adresseIp'],
            'nombreConnexions' => intval($u['nombreConnexions'])
        ];
    }, $users);
    
    sendSuccess('Utilisateurs récupérés', $formatted);
}

function getUser($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT u.*, r.nomRole
        FROM Utilisateur u
        LEFT JOIN Role r ON u.roleId = r.roleId
        WHERE u.utilisateurId = ?
    ");
    $stmt->execute([$id]);
    $u = $stmt->fetch();
    
    if (!$u) sendError('Utilisateur non trouvé', 404);
    
    // Récupérer l'historique de connexion
    $stmt = $pdo->prepare("
        SELECT dateAction as date, ipAddress as ip
        FROM AuditLog
        WHERE utilisateurId = ? AND action = 'LOGIN'
        ORDER BY dateAction DESC
        LIMIT 10
    ");
    $stmt->execute([$id]);
    $history = $stmt->fetchAll();
    
    sendSuccess('Utilisateur récupéré', [
        'id' => $u['utilisateurId'],
        'name' => $u['prenom'] . ' ' . $u['nom'],
        'email' => $u['email'],
        'telephone' => $u['telephone'],
        'roleId' => $u['roleId'],
        'roleName' => $u['nomRole'],
        'status' => strtolower($u['statut']),
        'lastLogin' => $u['derniereConnexion'],
        'lastIp' => $u['adresseIp'],
        'loginHistory' => $history
    ]);
}

function createUser($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['email']) || !isset($data['password']) || !isset($data['name'])) {
        sendError('Email, mot de passe et nom requis');
    }
    
    // Vérifier si email existe
    $stmt = $pdo->prepare("SELECT utilisateurId FROM Utilisateur WHERE email = ?");
    $stmt->execute([$data['email']]);
    if ($stmt->fetch()) {
        sendError('Cet email est déjà utilisé');
    }
    
    $nameParts = explode(' ', $data['name'], 2);
    $prenom = $nameParts[0];
    $nom = isset($nameParts[1]) ? $nameParts[1] : '';
    
    $hashedPassword = password_hash($data['password'], PASSWORD_DEFAULT);
    
    $stmt = $pdo->prepare("
        INSERT INTO Utilisateur (nom, prenom, email, motDePasse, roleId, statut, telephone)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $nom,
        $prenom,
        $data['email'],
        $hashedPassword,
        $data['roleId'] ?? 4,
        $data['status'] ?? 'ACTIF',
        $data['telephone'] ?? null
    ]);
    
    $newUserId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Utilisateur', $newUserId);
    getUser($pdo, $newUserId);
}

function updateUser($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $updates = [];
    $params = [];
    
    if (isset($data['name'])) {
        $nameParts = explode(' ', $data['name'], 2);
        $updates[] = "prenom = ?";
        $updates[] = "nom = ?";
        $params[] = $nameParts[0];
        $params[] = isset($nameParts[1]) ? $nameParts[1] : '';
    }
    
    if (isset($data['email'])) {
        $updates[] = "email = ?";
        $params[] = $data['email'];
    }
    
    if (isset($data['password'])) {
        $updates[] = "motDePasse = ?";
        $params[] = password_hash($data['password'], PASSWORD_DEFAULT);
    }
    
    if (isset($data['roleId'])) {
        $updates[] = "roleId = ?";
        $params[] = $data['roleId'];
    }
    
    if (isset($data['status'])) {
        $updates[] = "statut = ?";
        $params[] = strtoupper($data['status']);
    }
    
    if (isset($data['telephone'])) {
        $updates[] = "telephone = ?";
        $params[] = $data['telephone'];
    }
    
    if (empty($updates)) {
        sendError('Aucune donnée à mettre à jour');
    }
    
    $params[] = $id;
    $sql = "UPDATE Utilisateur SET " . implode(", ", $updates) . " WHERE utilisateurId = ?";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    logAudit($pdo, $userId, 'UPDATE', 'Utilisateur', $id);
    getUser($pdo, $id);
}

function deleteUser($pdo, $id, $userId) {
    if ($id == $userId) {
        sendError('Vous ne pouvez pas supprimer votre propre compte');
    }
    
    $action = $_GET['action'] ?? 'suspend';
    
    if ($action === 'delete') {
        $stmt = $pdo->prepare("DELETE FROM Utilisateur WHERE utilisateurId = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, 'DELETE', 'Utilisateur', $id);
        sendSuccess('Utilisateur supprimé');
    } else {
        $stmt = $pdo->prepare("UPDATE Utilisateur SET statut = 'SUSPENDU' WHERE utilisateurId = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, 'UPDATE', 'Utilisateur', $id, ['statut' => 'SUSPENDU']);
        sendSuccess('Utilisateur suspendu');
    }
}


