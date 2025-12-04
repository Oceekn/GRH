<?php
/**
 * API pour la gestion des congés
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getLeave($pdo, $id);
        } else {
            getLeaves($pdo);
        }
        break;
    
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        if ($action === 'validate') {
            validateLeave($pdo, $userId);
        } else {
            createLeave($pdo, $userId);
        }
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID congé requis');
        updateLeave($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getLeaves($pdo) {
    $status = $_GET['status'] ?? null;
    $employeId = $_GET['employeId'] ?? null;
    
    $sql = "
        SELECT 
            c.*,
            CONCAT(e.prenom, ' ', e.nom) as nomEmploye,
            e.matricule,
            CONCAT(u.prenom, ' ', u.nom) as nomValidateur
        FROM Conge c
        INNER JOIN Employe e ON c.employeId = e.employeId
        LEFT JOIN Utilisateur u ON c.validateur = u.utilisateurId
    ";
    
    $params = [];
    $conditions = [];
    
    if ($status) {
        $conditions[] = "c.statut = ?";
        $params[] = $status;
    }
    if ($employeId) {
        $conditions[] = "c.employeId = ?";
        $params[] = $employeId;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY c.dateDebut DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $leaves = $stmt->fetchAll();
    
    $formatted = array_map(function($l) {
        return [
            'id' => $l['congeId'],
            'employeId' => $l['employeId'],
            'employeeName' => $l['nomEmploye'],
            'matricule' => $l['matricule'],
            'type' => $l['typeConge'],
            'startDate' => $l['dateDebut'],
            'endDate' => $l['dateFin'],
            'days' => intval($l['nombreJours']),
            'reason' => $l['motif'],
            'status' => strtolower($l['statut']),
            'validator' => $l['nomValidateur'],
            'validationComment' => $l['commentaireValidation'],
            'validatedAt' => $l['dateValidation']
        ];
    }, $leaves);
    
    sendSuccess('Congés récupérés', $formatted);
}

function getLeave($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT c.*, CONCAT(e.prenom, ' ', e.nom) as nomEmploye
        FROM Conge c
        INNER JOIN Employe e ON c.employeId = e.employeId
        WHERE c.congeId = ?
    ");
    $stmt->execute([$id]);
    $l = $stmt->fetch();
    
    if (!$l) sendError('Congé non trouvé', 404);
    
    sendSuccess('Congé récupéré', [
        'id' => $l['congeId'],
        'employeId' => $l['employeId'],
        'employeeName' => $l['nomEmploye'],
        'type' => $l['typeConge'],
        'startDate' => $l['dateDebut'],
        'endDate' => $l['dateFin'],
        'days' => intval($l['nombreJours']),
        'reason' => $l['motif'],
        'status' => strtolower($l['statut'])
    ]);
}

function createLeave($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['employeId']) || !isset($data['startDate']) || !isset($data['endDate'])) {
        sendError('Employé, date début et date fin requis');
    }
    
    // Le nombre de jours sera calculé par trigger
    $stmt = $pdo->prepare("
        INSERT INTO Conge (employeId, typeConge, dateDebut, dateFin, motif, statut)
        VALUES (?, ?, ?, ?, ?, 'EN_ATTENTE')
    ");
    $stmt->execute([
        $data['employeId'],
        $data['type'] ?? 'ANNUEL',
        $data['startDate'],
        $data['endDate'],
        $data['reason'] ?? null
    ]);
    
    $leaveId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Conge', $leaveId);
    getLeave($pdo, $leaveId);
}

function validateLeave($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['congeId']) || !isset($data['decision']) || !isset($data['commentaire'])) {
        sendError('ID congé, décision et commentaire requis');
    }
    
    $decision = strtoupper($data['decision']); // APPROUVE ou REFUSE
    
    // Utiliser la procédure stockée
    try {
        $stmt = $pdo->prepare("CALL ValiderConge(?, ?, ?, ?)");
        $stmt->execute([
            $data['congeId'],
            $userId,
            $decision,
            $data['commentaire']
        ]);
        
        logAudit($pdo, $userId, 'UPDATE', 'Conge', $data['congeId'], [
            'decision' => $decision,
            'commentaire' => $data['commentaire']
        ]);
        
        sendSuccess('Congé ' . ($decision === 'APPROUVE' ? 'approuvé' : 'refusé'));
    } catch (PDOException $e) {
        sendError($e->getMessage());
    }
}

function updateLeave($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $stmt = $pdo->prepare("
        UPDATE Conge SET
            typeConge = ?,
            dateDebut = ?,
            dateFin = ?,
            motif = ?
        WHERE congeId = ?
    ");
    $stmt->execute([
        $data['type'] ?? null,
        $data['startDate'] ?? null,
        $data['endDate'] ?? null,
        $data['reason'] ?? null,
        $id
    ]);
    
    logAudit($pdo, $userId, 'UPDATE', 'Conge', $id);
    getLeave($pdo, $id);
}


