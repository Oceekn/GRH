<?php
/**
 * API pour gérer les rôles des utilisateurs
 * RHorizon - Système de Gestion des Ressources Humaines
 */

require_once '../config.php';
require_once '../permissions.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

PermissionManager::requirePermission($pdo, $userId, 'ROLE_MANAGE');

switch ($method) {
    case 'GET':
        $action = $_GET['action'] ?? null;
        if ($action === 'roles') {
            getAllRoles($pdo);
        } elseif ($action === 'permissions') {
            getAllPermissions($pdo);
        } elseif ($action === 'user-roles') {
            $userId = $_GET['userId'] ?? null;
            if (!$userId) sendError('userId requis');
            getUserRoles($pdo, $userId);
        } else {
            getRoleDetails($pdo);
        }
        break;

    case 'POST':
        $action = $_GET['action'] ?? null;
        if ($action === 'assign') {
            assignRoleToUser($pdo, $userId);
        } else {
            sendError('Action non valide');
        }
        break;

    case 'PUT':
        $action = $_GET['action'] ?? null;
        if ($action === 'role-permissions') {
            updateRolePermissions($pdo, $userId);
        } else {
            sendError('Action non valide');
        }
        break;

    default:
        sendError('Méthode non autorisée', 405);
}

function getAllRoles($pdo) {
    $stmt = $pdo->prepare("
        SELECT r.*, COUNT(rp.permissionId) as permissionsCount
        FROM Role r
        LEFT JOIN RolePermission rp ON r.roleId = rp.roleId
        GROUP BY r.roleId
        ORDER BY r.nomRole
    ");
    $stmt->execute();
    $roles = $stmt->fetchAll();

    sendSuccess('Rôles récupérés', $roles);
}

function getAllPermissions($pdo) {
    $stmt = $pdo->prepare("
        SELECT * FROM Permission
        ORDER BY module, codePermission
    ");
    $stmt->execute();
    $permissions = $stmt->fetchAll();

    sendSuccess('Permissions récupérées', $permissions);
}

function getRoleDetails($pdo) {
    $roleId = $_GET['roleId'] ?? null;
    if (!$roleId) sendError('roleId requis');

    $stmt = $pdo->prepare("
        SELECT r.*, COUNT(rp.permissionId) as permissionsCount
        FROM Role r
        LEFT JOIN RolePermission rp ON r.roleId = rp.roleId
        WHERE r.roleId = ?
        GROUP BY r.roleId
    ");
    $stmt->execute([$roleId]);
    $role = $stmt->fetch();

    if (!$role) sendError('Rôle non trouvé', 404);

    // Récupérer les permissions assignées
    $stmt = $pdo->prepare("
        SELECT p.* FROM Permission p
        INNER JOIN RolePermission rp ON p.permissionId = rp.permissionId
        WHERE rp.roleId = ?
        ORDER BY p.module, p.codePermission
    ");
    $stmt->execute([$roleId]);
    $permissions = $stmt->fetchAll();

    sendSuccess('Détails du rôle', [
        'role' => $role,
        'permissions' => $permissions
    ]);
}

function getUserRoles($pdo, $targetUserId) {
    $stmt = $pdo->prepare("
        SELECT u.utilisateurId, CONCAT(u.prenom, ' ', u.nom) as nomComplet,
               u.email, r.roleId, r.nomRole, r.description
        FROM Utilisateur u
        LEFT JOIN Role r ON u.roleId = r.roleId
        WHERE u.utilisateurId = ?
    ");
    $stmt->execute([$targetUserId]);
    $user = $stmt->fetch();

    if (!$user) sendError('Utilisateur non trouvé', 404);

    sendSuccess('Rôle utilisateur', $user);
}

function assignRoleToUser($pdo, $userId) {
    $data = getJSONInput();

    if (!isset($data['targetUserId']) || !isset($data['roleId'])) {
        sendError('targetUserId et roleId requis');
    }

    // Vérifier que le rôle existe
    $stmt = $pdo->prepare("SELECT roleId FROM Role WHERE roleId = ?");
    $stmt->execute([$data['roleId']]);
    if (!$stmt->fetch()) {
        sendError('Rôle non trouvé', 404);
    }

    // Mettre à jour le rôle de l'utilisateur
    $stmt = $pdo->prepare("
        UPDATE Utilisateur SET roleId = ? WHERE utilisateurId = ?
    ");
    $stmt->execute([$data['roleId'], $data['targetUserId']]);

    logAudit($pdo, $userId, 'UPDATE', 'Utilisateur', $data['targetUserId'], [
        'action' => 'ROLE_CHANGED',
        'roleId' => $data['roleId']
    ]);

    sendSuccess('Rôle assigné avec succès');
}

function updateRolePermissions($pdo, $userId) {
    $data = getJSONInput();

    if (!isset($data['roleId']) || !isset($data['permissionIds'])) {
        sendError('roleId et permissionIds requis');
    }

    try {
        // Vérifier que le rôle existe
        $stmt = $pdo->prepare("SELECT roleId FROM Role WHERE roleId = ?");
        $stmt->execute([$data['roleId']]);
        if (!$stmt->fetch()) {
            sendError('Rôle non trouvé', 404);
        }

        // Supprimer les permissions existantes
        $stmt = $pdo->prepare("DELETE FROM RolePermission WHERE roleId = ?");
        $stmt->execute([$data['roleId']]);

        // Ajouter les nouvelles permissions
        $stmt = $pdo->prepare("
            INSERT INTO RolePermission (roleId, permissionId)
            VALUES (?, ?)
        ");

        foreach ($data['permissionIds'] as $permissionId) {
            $stmt->execute([$data['roleId'], $permissionId]);
        }

        logAudit($pdo, $userId, 'UPDATE', 'Role', $data['roleId'], [
            'action' => 'PERMISSIONS_UPDATED',
            'permissionsCount' => count($data['permissionIds'])
        ]);

        sendSuccess('Permissions mises à jour avec succès');
    } catch (Exception $e) {
        sendError('Erreur lors de la mise à jour: ' . $e->getMessage());
    }
}

?>
