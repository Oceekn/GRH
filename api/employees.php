<?php
/**
 * API pour la gestion des employés
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getEmployee($pdo, $id);
        } else {
            getEmployees($pdo);
        }
        break;
    
    case 'POST':
        createEmployee($pdo, $userId);
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError('ID employé requis');
        }
        updateEmployee($pdo, $id, $userId);
        break;
    
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) {
            sendError('ID employé requis');
        }
        deleteEmployee($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

/**
 * Récupère tous les employés
 */
function getEmployees($pdo) {
    $status = $_GET['status'] ?? 'ACTIF';
    
    $stmt = $pdo->prepare("
        SELECT 
            e.*,
            s.nomService,
            c.salaireBase,
            c.typeContrat as contratType,
            c.dateDebut as dateDebutContrat,
            c.dateFin as dateFinContrat,
            CONCAT(e.prenom, ' ', e.nom) as nomComplet
        FROM Employe e
        LEFT JOIN Service s ON e.serviceId = s.serviceId
        LEFT JOIN Contrat c ON e.employeId = c.employeId AND c.statut = 'ACTIF'
        WHERE e.statut = ?
        ORDER BY e.nom, e.prenom
    ");
    $stmt->execute([$status]);
    $employees = $stmt->fetchAll();
    
    // Formater les données pour le frontend
    $formatted = array_map(function($emp) {
        return [
            'id' => $emp['employeId'],
            'matricule' => $emp['matricule'],
            'lastname' => $emp['nom'],
            'firstname' => $emp['prenom'],
            'email' => $emp['email'],
            'telephone' => $emp['telephone'],
            'adresse' => $emp['adresse'],
            'dateNaissance' => $emp['dateNaissance'],
            'lieuNaissance' => $emp['lieuNaissance'],
            'sexe' => $emp['sexe'],
            'situationMatrimoniale' => $emp['situationMatrimoniale'],
            'nombreEnfants' => $emp['nombreEnfants'],
            'serviceId' => $emp['serviceId'],
            'serviceName' => $emp['nomService'],
            'position' => $emp['poste'],
            'contract' => $emp['contratType'],
            'salary' => floatval($emp['salaireBase'] ?? 0),
            'hiredate' => $emp['dateEmbauche'],
            'departureDate' => $emp['dateDepartEffectif'],
            'status' => strtolower($emp['statut']),
            'nomComplet' => $emp['nomComplet']
        ];
    }, $employees);
    
    sendSuccess('Employés récupérés', $formatted);
}

/**
 * Récupère un employé par ID
 */
function getEmployee($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT 
            e.*,
            s.nomService,
            c.salaireBase,
            c.typeContrat as contratType
        FROM Employe e
        LEFT JOIN Service s ON e.serviceId = s.serviceId
        LEFT JOIN Contrat c ON e.employeId = c.employeId AND c.statut = 'ACTIF'
        WHERE e.employeId = ?
    ");
    $stmt->execute([$id]);
    $emp = $stmt->fetch();
    
    if (!$emp) {
        sendError('Employé non trouvé', 404);
    }
    
    $formatted = [
        'id' => $emp['employeId'],
        'matricule' => $emp['matricule'],
        'lastname' => $emp['nom'],
        'firstname' => $emp['prenom'],
        'email' => $emp['email'],
        'telephone' => $emp['telephone'],
        'adresse' => $emp['adresse'],
        'dateNaissance' => $emp['dateNaissance'],
        'lieuNaissance' => $emp['lieuNaissance'],
        'sexe' => $emp['sexe'],
        'situationMatrimoniale' => $emp['situationMatrimoniale'],
        'nombreEnfants' => $emp['nombreEnfants'],
        'serviceId' => $emp['serviceId'],
        'serviceName' => $emp['nomService'],
        'position' => $emp['poste'],
        'contract' => $emp['contratType'],
        'salary' => floatval($emp['salaireBase'] ?? 0),
        'hiredate' => $emp['dateEmbauche'],
        'departureDate' => $emp['dateDepartEffectif'],
        'status' => strtolower($emp['statut'])
    ];
    
    sendSuccess('Employé récupéré', $formatted);
}

/**
 * Crée un nouvel employé
 */
function createEmployee($pdo, $userId) {
    $data = getJSONInput();
    
    // Validation des champs requis
    if (!isset($data['lastname']) || !isset($data['firstname']) || !isset($data['hiredate'])) {
        sendError('Nom, prénom et date d\'embauche requis');
    }
    
    // Générer le matricule si non fourni (sera fait par trigger)
    $matricule = $data['matricule'] ?? null;
    
    // Insérer l'employé
    $stmt = $pdo->prepare("
        INSERT INTO Employe (
            matricule, nom, prenom, email, telephone, adresse,
            dateNaissance, lieuNaissance, sexe, situationMatrimoniale, nombreEnfants,
            serviceId, poste, typeContrat, dateEmbauche, dateFinContrat,
            statut
        ) VALUES (
            ?, ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?
        )
    ");
    
    $stmt->execute([
        $matricule,
        $data['lastname'],
        $data['firstname'],
        $data['email'] ?? null,
        $data['telephone'] ?? null,
        $data['adresse'] ?? null,
        $data['dateNaissance'] ?? null,
        $data['lieuNaissance'] ?? null,
        $data['sexe'] ?? null,
        $data['situationMatrimoniale'] ?? null,
        $data['nombreEnfants'] ?? 0,
        $data['serviceId'] ?? null,
        $data['position'] ?? null,
        $data['contract'] ?? 'CDI',
        $data['hiredate'],
        $data['dateFinContrat'] ?? null,
        'ACTIF'
    ]);
    
    $employeId = $pdo->lastInsertId();
    
    // Créer le contrat si salaire fourni
    if (isset($data['salary']) && $data['salary'] > 0) {
        $stmt = $pdo->prepare("
            INSERT INTO Contrat (employeId, typeContrat, dateDebut, salaireBase, statut)
            VALUES (?, ?, ?, ?, 'ACTIF')
        ");
        $stmt->execute([
            $employeId,
            $data['contract'] ?? 'CDI',
            $data['hiredate'],
            $data['salary']
        ]);
    }
    
    // Logger l'action
    logAudit($pdo, $userId, 'CREATE', 'Employe', $employeId, [
        'matricule' => $matricule,
        'nom' => $data['lastname'],
        'prenom' => $data['firstname']
    ]);
    
    // Récupérer l'employé créé
    getEmployee($pdo, $employeId);
}

/**
 * Met à jour un employé
 */
function updateEmployee($pdo, $id, $userId) {
    $data = getJSONInput();
    
    // Récupérer l'employé actuel
    $stmt = $pdo->prepare("SELECT * FROM Employe WHERE employeId = ?");
    $stmt->execute([$id]);
    $oldEmp = $stmt->fetch();
    
    if (!$oldEmp) {
        sendError('Employé non trouvé', 404);
    }
    
    // Mettre à jour l'employé
    $stmt = $pdo->prepare("
        UPDATE Employe SET
            nom = ?,
            prenom = ?,
            email = ?,
            telephone = ?,
            adresse = ?,
            dateNaissance = ?,
            lieuNaissance = ?,
            sexe = ?,
            situationMatrimoniale = ?,
            nombreEnfants = ?,
            serviceId = ?,
            poste = ?,
            typeContrat = ?,
            dateEmbauche = ?,
            dateFinContrat = ?,
            dateDepartEffectif = ?,
            statut = ?
        WHERE employeId = ?
    ");
    
    $stmt->execute([
        $data['lastname'] ?? $oldEmp['nom'],
        $data['firstname'] ?? $oldEmp['prenom'],
        $data['email'] ?? $oldEmp['email'],
        $data['telephone'] ?? $oldEmp['telephone'],
        $data['adresse'] ?? $oldEmp['adresse'],
        $data['dateNaissance'] ?? $oldEmp['dateNaissance'],
        $data['lieuNaissance'] ?? $oldEmp['lieuNaissance'],
        $data['sexe'] ?? $oldEmp['sexe'],
        $data['situationMatrimoniale'] ?? $oldEmp['situationMatrimoniale'],
        $data['nombreEnfants'] ?? $oldEmp['nombreEnfants'],
        $data['serviceId'] ?? $oldEmp['serviceId'],
        $data['position'] ?? $oldEmp['poste'],
        $data['contract'] ?? $oldEmp['typeContrat'],
        $data['hiredate'] ?? $oldEmp['dateEmbauche'],
        $data['dateFinContrat'] ?? $oldEmp['dateFinContrat'],
        $data['departureDate'] ?? $oldEmp['dateDepartEffectif'],
        $data['status'] ?? $oldEmp['statut'],
        $id
    ]);
    
    // Mettre à jour le contrat si salaire fourni
    if (isset($data['salary']) && $data['salary'] > 0) {
        $stmt = $pdo->prepare("
            UPDATE Contrat 
            SET salaireBase = ?, typeContrat = ?
            WHERE employeId = ? AND statut = 'ACTIF'
        ");
        $stmt->execute([$data['salary'], $data['contract'] ?? 'CDI', $id]);
    }
    
    // Logger l'action
    logAudit($pdo, $userId, 'UPDATE', 'Employe', $id, [
        'changements' => $data
    ]);
    
    getEmployee($pdo, $id);
}

/**
 * Supprime ou suspend un employé
 */
function deleteEmployee($pdo, $id, $userId) {
    $action = $_GET['action'] ?? 'suspend';
    
    if ($action === 'delete') {
        // Suppression réelle (cascade)
        $stmt = $pdo->prepare("DELETE FROM Employe WHERE employeId = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, 'DELETE', 'Employe', $id);
        sendSuccess('Employé supprimé');
    } else {
        // Suspension
        $stmt = $pdo->prepare("UPDATE Employe SET statut = 'SUSPENDU' WHERE employeId = ?");
        $stmt->execute([$id]);
        logAudit($pdo, $userId, 'UPDATE', 'Employe', $id, ['statut' => 'SUSPENDU']);
        sendSuccess('Employé suspendu');
    }
}


