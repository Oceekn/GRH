<?php
/**
 * API pour la gestion des services
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getService($pdo, $id);
        } else {
            getServices($pdo);
        }
        break;
    
    case 'POST':
        createService($pdo, $userId);
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID service requis');
        updateService($pdo, $id, $userId);
        break;
    
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID service requis');
        deleteService($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getServices($pdo) {
    $stmt = $pdo->query("
        SELECT 
            s.*,
            CONCAT(e.prenom, ' ', e.nom) as responsableNom,
            COUNT(emp.employeId) as effectif,
            AVG(TIMESTAMPDIFF(YEAR, emp.dateEmbauche, CURDATE())) as ancienneteMoyenne
        FROM Service s
        LEFT JOIN Employe e ON s.responsableId = e.employeId
        LEFT JOIN Employe emp ON s.serviceId = emp.serviceId AND emp.statut = 'ACTIF'
        GROUP BY s.serviceId
        ORDER BY s.nomService
    ");
    
    $services = $stmt->fetchAll();
    $formatted = array_map(function($s) {
        return [
            'id' => $s['serviceId'],
            'name' => $s['nomService'],
            'description' => $s['description'],
            'responsableId' => $s['responsableId'],
            'responsableNom' => $s['responsableNom'],
            'budget' => floatval($s['budget'] ?? 0),
            'effectif' => intval($s['effectif']),
            'ancienneteMoyenne' => round(floatval($s['ancienneteMoyenne'] ?? 0), 2)
        ];
    }, $services);
    
    sendSuccess('Services récupérés', $formatted);
}

function getService($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT 
            s.*,
            CONCAT(e.prenom, ' ', e.nom) as responsableNom
        FROM Service s
        LEFT JOIN Employe e ON s.responsableId = e.employeId
        WHERE s.serviceId = ?
    ");
    $stmt->execute([$id]);
    $s = $stmt->fetch();
    
    if (!$s) sendError('Service non trouvé', 404);
    
    sendSuccess('Service récupéré', [
        'id' => $s['serviceId'],
        'name' => $s['nomService'],
        'description' => $s['description'],
        'responsableId' => $s['responsableId'],
        'responsableNom' => $s['responsableNom'],
        'budget' => floatval($s['budget'] ?? 0)
    ]);
}

function createService($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['name'])) {
        sendError('Nom du service requis');
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO Service (nomService, description, responsableId, budget)
        VALUES (?, ?, ?, ?)
    ");
    $stmt->execute([
        $data['name'],
        $data['description'] ?? null,
        $data['responsableId'] ?? null,
        $data['budget'] ?? null
    ]);
    
    $serviceId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Service', $serviceId);
    getService($pdo, $serviceId);
}

function updateService($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $stmt = $pdo->prepare("
        UPDATE Service SET
            nomService = ?,
            description = ?,
            responsableId = ?,
            budget = ?
        WHERE serviceId = ?
    ");
    $stmt->execute([
        $data['name'] ?? null,
        $data['description'] ?? null,
        $data['responsableId'] ?? null,
        $data['budget'] ?? null,
        $id
    ]);
    
    logAudit($pdo, $userId, 'UPDATE', 'Service', $id);
    getService($pdo, $id);
}

function deleteService($pdo, $id, $userId) {
    $stmt = $pdo->prepare("DELETE FROM Service WHERE serviceId = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $userId, 'DELETE', 'Service', $id);
    sendSuccess('Service supprimé');
}


