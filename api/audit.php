<?php
/**
 * API pour l'audit log
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

if ($method !== 'GET') {
    sendError('Méthode non autorisée', 405);
}

// Récupérer les logs d'audit
$userFilter = $_GET['userId'] ?? null;
$actionFilter = $_GET['action'] ?? null;
$tableFilter = $_GET['table'] ?? null;
$limit = intval($_GET['limit'] ?? 100);

$sql = "
    SELECT 
        a.*,
        CONCAT(u.prenom, ' ', u.nom) as nomUtilisateur,
        u.email as emailUtilisateur
    FROM AuditLog a
    LEFT JOIN Utilisateur u ON a.utilisateurId = u.utilisateurId
    WHERE 1=1
";

$params = [];

if ($userFilter) {
    $sql .= " AND a.utilisateurId = ?";
    $params[] = $userFilter;
}

if ($actionFilter) {
    $sql .= " AND a.action = ?";
    $params[] = strtoupper($actionFilter);
}

if ($tableFilter) {
    $sql .= " AND a.tableConcernee = ?";
    $params[] = $tableFilter;
}

$sql .= " ORDER BY a.dateAction DESC LIMIT ?";
$params[] = $limit;

$stmt = $pdo->prepare($sql);
$stmt->execute($params);
$logs = $stmt->fetchAll();

$formatted = array_map(function($l) {
    $details = null;
    if ($l['details']) {
        $details = json_decode($l['details'], true);
    }
    
    return [
        'id' => $l['auditId'],
        'userId' => $l['utilisateurId'],
        'userName' => $l['nomUtilisateur'],
        'userEmail' => $l['emailUtilisateur'],
        'action' => strtolower($l['action']),
        'table' => $l['tableConcernee'],
        'recordId' => $l['enregistrementId'],
        'details' => $details,
        'ipAddress' => $l['ipAddress'],
        'dateAction' => $l['dateAction']
    ];
}, $logs);

sendSuccess('Logs d\'audit récupérés', $formatted);


