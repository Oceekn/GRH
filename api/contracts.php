<?php
/**
 * API pour la gestion des contrats
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $employeId = $_GET['employeId'] ?? null;
        if ($id) {
            getContract($pdo, $id);
        } elseif ($employeId) {
            getContractsByEmployee($pdo, $employeId);
        } else {
            getContracts($pdo);
        }
        break;
    
    case 'POST':
        createContract($pdo, $userId);
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID contrat requis');
        updateContract($pdo, $id, $userId);
        break;
    
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID contrat requis');
        deleteContract($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getContracts($pdo) {
    $status = $_GET['status'] ?? null;
    
    $sql = "
        SELECT 
            c.*,
            CONCAT(e.prenom, ' ', e.nom) as nomEmploye,
            e.matricule
        FROM Contrat c
        INNER JOIN Employe e ON c.employeId = e.employeId
    ";
    
    if ($status) {
        $sql .= " WHERE c.statut = ?";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$status]);
    } else {
        $stmt = $pdo->query($sql);
    }
    
    $contracts = $stmt->fetchAll();
    $formatted = array_map(function($c) {
        return [
            'id' => $c['contratId'],
            'numeroContrat' => $c['numeroContrat'],
            'employeId' => $c['employeId'],
            'nomEmploye' => $c['nomEmploye'],
            'matricule' => $c['matricule'],
            'typeContrat' => $c['typeContrat'],
            'dateDebut' => $c['dateDebut'],
            'dateFin' => $c['dateFin'],
            'salaireBase' => floatval($c['salaireBase']),
            'statut' => $c['statut']
        ];
    }, $contracts);
    
    sendSuccess('Contrats récupérés', $formatted);
}

function getContract($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT c.*, CONCAT(e.prenom, ' ', e.nom) as nomEmploye
        FROM Contrat c
        INNER JOIN Employe e ON c.employeId = e.employeId
        WHERE c.contratId = ?
    ");
    $stmt->execute([$id]);
    $c = $stmt->fetch();
    
    if (!$c) sendError('Contrat non trouvé', 404);
    
    sendSuccess('Contrat récupéré', [
        'id' => $c['contratId'],
        'numeroContrat' => $c['numeroContrat'],
        'employeId' => $c['employeId'],
        'nomEmploye' => $c['nomEmploye'],
        'typeContrat' => $c['typeContrat'],
        'dateDebut' => $c['dateDebut'],
        'dateFin' => $c['dateFin'],
        'salaireBase' => floatval($c['salaireBase']),
        'statut' => $c['statut']
    ]);
}

function getContractsByEmployee($pdo, $employeId) {
    $stmt = $pdo->prepare("
        SELECT * FROM Contrat
        WHERE employeId = ?
        ORDER BY dateDebut DESC
    ");
    $stmt->execute([$employeId]);
    $contracts = $stmt->fetchAll();
    
    sendSuccess('Contrats récupérés', $contracts);
}

function createContract($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['employeId']) || !isset($data['dateDebut']) || !isset($data['salaireBase'])) {
        sendError('Employé, date début et salaire requis');
    }
    
    // Le numéro sera généré par trigger
    $stmt = $pdo->prepare("
        INSERT INTO Contrat (employeId, typeContrat, dateDebut, dateFin, salaireBase, statut)
        VALUES (?, ?, ?, ?, ?, 'ACTIF')
    ");
    $stmt->execute([
        $data['employeId'],
        $data['typeContrat'] ?? 'CDI',
        $data['dateDebut'],
        $data['dateFin'] ?? null,
        $data['salaireBase']
    ]);
    
    $contractId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Contrat', $contractId);
    getContract($pdo, $contractId);
}

function updateContract($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $stmt = $pdo->prepare("
        UPDATE Contrat SET
            typeContrat = ?,
            dateDebut = ?,
            dateFin = ?,
            salaireBase = ?,
            statut = ?
        WHERE contratId = ?
    ");
    $stmt->execute([
        $data['typeContrat'] ?? null,
        $data['dateDebut'] ?? null,
        $data['dateFin'] ?? null,
        $data['salaireBase'] ?? null,
        $data['statut'] ?? null,
        $id
    ]);
    
    logAudit($pdo, $userId, 'UPDATE', 'Contrat', $id);
    getContract($pdo, $id);
}

function deleteContract($pdo, $id, $userId) {
    $stmt = $pdo->prepare("UPDATE Contrat SET statut = 'RESILIE' WHERE contratId = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $userId, 'UPDATE', 'Contrat', $id, ['statut' => 'RESILIE']);
    sendSuccess('Contrat résilié');
}


