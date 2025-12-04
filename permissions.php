<?php
/**
 * Gestion des rôles et permissions
 * RHorizon - Système de Gestion des Ressources Humaines
 */

require_once 'config.php';

class PermissionManager {
    private $pdo;
    private $userId;
    private $userRole;

    public function __construct($pdo, $userId) {
        $this->pdo = $pdo;
        $this->userId = $userId;
        $this->loadUserRole();
    }

    /**
     * Charge le rôle de l'utilisateur
     */
    private function loadUserRole() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT roleId FROM Utilisateur WHERE utilisateurId = ?
            ");
            $stmt->execute([$this->userId]);
            $result = $stmt->fetch();
            $this->userRole = $result ? $result['roleId'] : null;
        } catch (PDOException $e) {
            $this->userRole = null;
        }
    }

    /**
     * Vérifie si l'utilisateur a une permission
     */
    public function hasPermission($permissionCode) {
        if (!$this->userRole) {
            return false;
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count FROM RolePermission rp
                INNER JOIN Permission p ON rp.permissionId = p.permissionId
                WHERE rp.roleId = ? AND p.codePermission = ?
            ");
            $stmt->execute([$this->userRole, $permissionCode]);
            $result = $stmt->fetch();
            return $result['count'] > 0;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Vérifie si l'utilisateur a l'un des rôles
     */
    public function hasRole($roleCode) {
        if (!$this->userRole) {
            return false;
        }

        try {
            $stmt = $this->pdo->prepare("
                SELECT COUNT(*) as count FROM Role WHERE roleId = ? AND nomRole = ?
            ");
            $stmt->execute([$this->userRole, $roleCode]);
            $result = $stmt->fetch();
            return $result['count'] > 0;
        } catch (PDOException $e) {
            return false;
        }
    }

    /**
     * Récupère le rôle de l'utilisateur
     */
    public function getUserRole() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT nomRole FROM Role WHERE roleId = ?
            ");
            $stmt->execute([$this->userRole]);
            $result = $stmt->fetch();
            return $result ? $result['nomRole'] : null;
        } catch (PDOException $e) {
            return null;
        }
    }

    /**
     * Vérifie l'accès à un module
     */
    public function canAccessModule($moduleName) {
        $modulePermissions = [
            'EMPLOYEES' => 'EMPLOYEE_MANAGE',
            'PAYROLL' => 'SALARY_MANAGE',
            'LEAVES' => 'LEAVE_MANAGE',
            'ATTENDANCE' => 'ATTENDANCE_MANAGE',
            'SERVICES' => 'SERVICE_MANAGE',
            'CONTRACTS' => 'CONTRACT_MANAGE',
            'USERS' => 'USER_MANAGE',
            'ROLES' => 'ROLE_MANAGE',
            'AUDIT' => 'AUDIT_VIEW',
        ];

        $permission = $modulePermissions[$moduleName] ?? null;
        return $permission ? $this->hasPermission($permission) : false;
    }

    /**
     * Récupère les permissions de l'utilisateur
     */
    public function getUserPermissions() {
        try {
            $stmt = $this->pdo->prepare("
                SELECT p.codePermission, p.description, p.module
                FROM RolePermission rp
                INNER JOIN Permission p ON rp.permissionId = p.permissionId
                WHERE rp.roleId = ?
                ORDER BY p.module, p.codePermission
            ");
            $stmt->execute([$this->userRole]);
            return $stmt->fetchAll();
        } catch (PDOException $e) {
            return [];
        }
    }

    /**
     * Demande l'authentification de l'utilisateur
     * Lève une erreur si pas d'accès
     */
    public static function requireRole($pdo, $userId, $roleCode) {
        $permissionManager = new self($pdo, $userId);
        if (!$permissionManager->hasRole($roleCode)) {
            sendError('Accès refusé. Rôle requis: ' . $roleCode, 403);
        }
        return $permissionManager;
    }

    /**
     * Demande une permission spécifique
     */
    public static function requirePermission($pdo, $userId, $permissionCode) {
        $permissionManager = new self($pdo, $userId);
        if (!$permissionManager->hasPermission($permissionCode)) {
            sendError('Accès refusé. Permission requise: ' . $permissionCode, 403);
        }
        return $permissionManager;
    }
}

/**
 * Fonction helper pour vérifier l'accès
 */
function requirePermission($permissionCode) {
    session_start();
    if (!isset($_SESSION['user_id'])) {
        sendError('Authentification requise', 401);
    }

    $pdo = getDBConnection();
    return PermissionManager::requirePermission($pdo, $_SESSION['user_id'], $permissionCode);
}

?>
