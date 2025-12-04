<?php
/**
 * Initialisation des rôles et permissions
 * À exécuter une fois pour configurer le système
 */

require_once '../config.php';

$pdo = getDBConnection();

try {
    // Démarrer une transaction
    $pdo->beginTransaction();

    // Supprimer les données existantes pour réinitialiser
    $pdo->exec("DELETE FROM RolePermission");
    $pdo->exec("DELETE FROM Permission");
    $pdo->exec("DELETE FROM Role WHERE nomRole NOT IN ('ADMIN', 'RH', 'MANAGER', 'EMPLOYE')");

    // ===== CRÉER LES RÔLES =====

    // Vérifier si les rôles existent déjà
    $stmt = $pdo->prepare("SELECT roleId FROM Role WHERE nomRole = ?");

    $roleIds = [];

    // Créer ou récupérer les rôles
    $roles = [
        'ADMIN' => 'Administrateur - Accès complet au système',
        'COMPTABLE' => 'Comptable - Gestion de la paie uniquement',
        'RH' => 'Responsable RH - Gestion du personnel',
        'MANAGER' => 'Manager - Gestion de son équipe',
        'EMPLOYE' => 'Employé - Accès limité à ses données'
    ];

    foreach ($roles as $roleName => $roleDesc) {
        $stmt->execute([$roleName]);
        $existing = $stmt->fetch();

        if ($existing) {
            $roleIds[$roleName] = $existing['roleId'];
        } else {
            $stmt = $pdo->prepare("INSERT INTO Role (nomRole, description) VALUES (?, ?)");
            $stmt->execute([$roleName, $roleDesc]);
            $roleIds[$roleName] = $pdo->lastInsertId();
        }
    }

    // ===== CRÉER LES PERMISSIONS =====

    $permissions = [
        // Gestion des utilisateurs et rôles
        'USER_MANAGE' => ['description' => 'Gérer les utilisateurs', 'module' => 'Utilisateurs'],
        'ROLE_MANAGE' => ['description' => 'Gérer les rôles et permissions', 'module' => 'Administration'],

        // Gestion du personnel
        'EMPLOYEE_MANAGE' => ['description' => 'Gérer les employés', 'module' => 'Employés'],
        'EMPLOYEE_VIEW' => ['description' => 'Consulter les employés', 'module' => 'Employés'],

        // Gestion de la paie
        'SALARY_MANAGE' => ['description' => 'Gérer la paie et les bulletins', 'module' => 'Paie'],
        'SALARY_VIEW' => ['description' => 'Consulter la paie', 'module' => 'Paie'],
        'SALARY_DOWNLOAD' => ['description' => 'Télécharger les bulletins', 'module' => 'Paie'],

        // Gestion des congés
        'LEAVE_MANAGE' => ['description' => 'Gérer les congés', 'module' => 'Congés'],
        'LEAVE_VIEW' => ['description' => 'Consulter les congés', 'module' => 'Congés'],
        'LEAVE_APPROVE' => ['description' => 'Approuver les congés', 'module' => 'Congés'],

        // Gestion des présences
        'ATTENDANCE_MANAGE' => ['description' => 'Gérer les présences', 'module' => 'Présences'],
        'ATTENDANCE_VIEW' => ['description' => 'Consulter les présences', 'module' => 'Présences'],

        // Gestion des services
        'SERVICE_MANAGE' => ['description' => 'Gérer les services', 'module' => 'Services'],

        // Gestion des contrats
        'CONTRACT_MANAGE' => ['description' => 'Gérer les contrats', 'module' => 'Contrats'],

        // Audit
        'AUDIT_VIEW' => ['description' => 'Consulter les logs d\'audit', 'module' => 'Audit'],
    ];

    $permissionIds = [];
    foreach ($permissions as $code => $data) {
        $stmt = $pdo->prepare("SELECT permissionId FROM Permission WHERE codePermission = ?");
        $stmt->execute([$code]);
        $existing = $stmt->fetch();

        if ($existing) {
            $permissionIds[$code] = $existing['permissionId'];
        } else {
            $stmt = $pdo->prepare("
                INSERT INTO Permission (codePermission, description, module)
                VALUES (?, ?, ?)
            ");
            $stmt->execute([$code, $data['description'], $data['module']]);
            $permissionIds[$code] = $pdo->lastInsertId();
        }
    }

    // ===== ASSIGNER LES PERMISSIONS AUX RÔLES =====

    $rolePermissions = [
        'ADMIN' => [
            'USER_MANAGE', 'ROLE_MANAGE',
            'EMPLOYEE_MANAGE', 'EMPLOYEE_VIEW',
            'SALARY_MANAGE', 'SALARY_VIEW', 'SALARY_DOWNLOAD',
            'LEAVE_MANAGE', 'LEAVE_VIEW', 'LEAVE_APPROVE',
            'ATTENDANCE_MANAGE', 'ATTENDANCE_VIEW',
            'SERVICE_MANAGE',
            'CONTRACT_MANAGE',
            'AUDIT_VIEW'
        ],
        'COMPTABLE' => [
            'SALARY_MANAGE', 'SALARY_VIEW', 'SALARY_DOWNLOAD'
        ],
        'RH' => [
            'EMPLOYEE_MANAGE', 'EMPLOYEE_VIEW',
            'SALARY_VIEW', 'SALARY_DOWNLOAD',
            'LEAVE_MANAGE', 'LEAVE_VIEW', 'LEAVE_APPROVE',
            'ATTENDANCE_MANAGE', 'ATTENDANCE_VIEW',
            'SERVICE_MANAGE',
            'CONTRACT_MANAGE'
        ],
        'MANAGER' => [
            'EMPLOYEE_VIEW',
            'LEAVE_VIEW', 'LEAVE_APPROVE',
            'ATTENDANCE_VIEW'
        ],
        'EMPLOYE' => [
            'SALARY_VIEW', 'SALARY_DOWNLOAD',
            'LEAVE_VIEW'
        ]
    ];

    // Supprimer les associations existantes pour réinitialiser
    $pdo->exec("DELETE FROM RolePermission");

    foreach ($rolePermissions as $roleName => $permCodes) {
        $roleId = $roleIds[$roleName];

        foreach ($permCodes as $permCode) {
            if (isset($permissionIds[$permCode])) {
                $stmt = $pdo->prepare("
                    INSERT INTO RolePermission (roleId, permissionId)
                    VALUES (?, ?)
                ");
                $stmt->execute([$roleId, $permissionIds[$permCode]]);
            }
        }
    }

    // Valider la transaction
    $pdo->commit();

    sendSuccess('Rôles et permissions initialisés avec succès', [
        'roles' => count($roleIds),
        'permissions' => count($permissionIds)
    ]);

} catch (Exception $e) {
    // Annuler la transaction en cas d'erreur
    $pdo->rollBack();
    sendError('Erreur lors de l\'initialisation: ' . $e->getMessage(), 500);
}

?>
