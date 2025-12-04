<?php
/**
 * API pour la gestion des rôles et permissions
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

$type = $_GET['type'] ?? 'roles';

switch ($type) {
    case 'roles':
        handleRoles($pdo, $method, $userId);
        break;
    case 'permissions':
        handlePermissions($pdo, $method, $userId);
        break;
    case 'role-permissions':
        handleRolePermissions($pdo, $method, $userId);
        break;
    default:
        sendError('Type non reconnu');
}

function handleRoles($pdo, $method, $userId) {
    switch ($method) {
        case 'GET':
            $id = $_GET['id'] ?? null;
            if ($id) {
                getRole($pdo, $id);
            } else {
                getRoles($pdo);
            }
            break;
        
        case 'POST':
            createRole($pdo, $userId);
            break;
        
        case 'PUT':
            $id = $_GET['id'] ?? null;
            if (!$id) sendError('ID rôle requis');
            updateRole($pdo, $id, $userId);
            break;
        
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) sendError('ID rôle requis');
            deleteRole($pdo, $id, $userId);
            break;
    }
}

function getRoles($pdo) {
    $stmt = $pdo->query("
        SELECT r.*, COUNT(rp.permissionId) as nombrePermissions
        FROM Role r
        LEFT JOIN RolePermission rp ON r.roleId = rp.roleId
        GROUP BY r.roleId
        ORDER BY r.nomRole
    ");
    
    $roles = $stmt->fetchAll();
    $formatted = array_map(function($r) {
        return [
            'id' => $r['roleId'],
            'name' => $r['nomRole'],
            'description' => $r['description'],
            'nombrePermissions' => intval($r['nombrePermissions'])
        ];
    }, $roles);
    
    sendSuccess('Rôles récupérés', $formatted);
}

function getRole($pdo, $id) {
    $stmt = $pdo->prepare("SELECT * FROM Role WHERE roleId = ?");
    $stmt->execute([$id]);
    $r = $stmt->fetch();
    
    if (!$r) sendError('Rôle non trouvé', 404);
    
    // Récupérer les permissions
    $stmt = $pdo->prepare("
        SELECT p.* FROM Permission p
        INNER JOIN RolePermission rp ON p.permissionId = rp.permissionId
        WHERE rp.roleId = ?
    ");
    $stmt->execute([$id]);
    $permissions = $stmt->fetchAll();
    
    sendSuccess('Rôle récupéré', [
        'id' => $r['roleId'],
        'name' => $r['nomRole'],
        'description' => $r['description'],
        'permissions' => $permissions
    ]);
}

function createRole($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['name'])) {
        sendError('Nom du rôle requis');
    }
    
    $stmt = $pdo->prepare("INSERT INTO Role (nomRole, description) VALUES (?, ?)");
    $stmt->execute([$data['name'], $data['description'] ?? null]);
    
    $roleId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Role', $roleId);
    getRole($pdo, $roleId);
}

function updateRole($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $stmt = $pdo->prepare("UPDATE Role SET nomRole = ?, description = ? WHERE roleId = ?");
    $stmt->execute([$data['name'] ?? null, $data['description'] ?? null, $id]);
    
    logAudit($pdo, $userId, 'UPDATE', 'Role', $id);
    getRole($pdo, $id);
}

function deleteRole($pdo, $id, $userId) {
    $stmt = $pdo->prepare("DELETE FROM Role WHERE roleId = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $userId, 'DELETE', 'Role', $id);
    sendSuccess('Rôle supprimé');
}

function handlePermissions($pdo, $method, $userId) {
    switch ($method) {
        case 'GET':
            getPermissions($pdo);
            break;
        
        case 'POST':
            createPermission($pdo, $userId);
            break;
        
        case 'DELETE':
            $id = $_GET['id'] ?? null;
            if (!$id) sendError('ID permission requis');
            deletePermission($pdo, $id, $userId);
            break;
    }
}

function getPermissions($pdo) {
    $stmt = $pdo->query("SELECT * FROM Permission ORDER BY codePermission");
    $permissions = $stmt->fetchAll();
    
    $formatted = array_map(function($p) {
        return [
            'id' => $p['permissionId'],
            'name' => $p['codePermission'],
            'description' => $p['description'],
            'module' => $p['module']
        ];
    }, $permissions);
    
    sendSuccess('Permissions récupérées', $formatted);
}

function createPermission($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['name'])) {
        sendError('Code permission requis');
    }
    
    $stmt = $pdo->prepare("INSERT INTO Permission (codePermission, description, module) VALUES (?, ?, ?)");
    $stmt->execute([$data['name'], $data['description'] ?? null, $data['module'] ?? null]);
    
    $permissionId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Permission', $permissionId);
    sendSuccess('Permission créée', ['id' => $permissionId]);
}

function deletePermission($pdo, $id, $userId) {
    $stmt = $pdo->prepare("DELETE FROM Permission WHERE permissionId = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $userId, 'DELETE', 'Permission', $id);
    sendSuccess('Permission supprimée');
}

function handleRolePermissions($pdo, $method, $userId) {
    switch ($method) {
        case 'GET':
            $roleId = $_GET['roleId'] ?? null;
            if (!$roleId) sendError('ID rôle requis');
            
            $stmt = $pdo->prepare("
                SELECT p.* FROM Permission p
                INNER JOIN RolePermission rp ON p.permissionId = rp.permissionId
                WHERE rp.roleId = ?
            ");
            $stmt->execute([$roleId]);
            $permissions = $stmt->fetchAll();
            sendSuccess('Permissions du rôle récupérées', $permissions);
            break;
        
        case 'POST':
            $data = getJSONInput();
            if (!isset($data['roleId']) || !isset($data['permissionIds'])) {
                sendError('ID rôle et permissions requis');
            }
            
            // Supprimer les anciennes permissions
            $stmt = $pdo->prepare("DELETE FROM RolePermission WHERE roleId = ?");
            $stmt->execute([$data['roleId']]);
            
            // Ajouter les nouvelles permissions
            $stmt = $pdo->prepare("INSERT INTO RolePermission (roleId, permissionId) VALUES (?, ?)");
            foreach ($data['permissionIds'] as $permId) {
                $stmt->execute([$data['roleId'], $permId]);
            }
            
            logAudit($pdo, $userId, 'UPDATE', 'RolePermission', $data['roleId']);
            sendSuccess('Permissions assignées au rôle');
            break;
    }
}


