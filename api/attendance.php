<?php
/**
 * API pour la gestion des présences/pointages
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getAttendance($pdo, $id);
        } else {
            getAttendances($pdo);
        }
        break;
    
    case 'POST':
        createAttendance($pdo, $userId);
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID présence requis');
        updateAttendance($pdo, $id, $userId);
        break;
    
    case 'DELETE':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID présence requis');
        deleteAttendance($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getAttendances($pdo) {
    $date = $_GET['date'] ?? null;
    $employeId = $_GET['employeId'] ?? null;
    
    $sql = "
        SELECT 
            p.*,
            CONCAT(e.prenom, ' ', e.nom) as nomEmploye,
            e.matricule,
            TIMESTAMPDIFF(HOUR, p.heureArrivee, p.heureDepart) as heuresTravaillees,
            CASE 
                WHEN TIMESTAMPDIFF(HOUR, p.heureArrivee, p.heureDepart) > 8 
                THEN TIMESTAMPDIFF(HOUR, p.heureArrivee, p.heureDepart) - 8
                ELSE 0
            END as heuresSupplementaires,
            CASE 
                WHEN TIME(p.heureArrivee) > '08:00:00' 
                THEN TIMESTAMPDIFF(MINUTE, '08:00:00', TIME(p.heureArrivee))
                ELSE 0
            END as retardMinutes
        FROM Presence p
        INNER JOIN Employe e ON p.employeId = e.employeId
    ";
    
    $params = [];
    $conditions = [];
    
    if ($date) {
        $conditions[] = "DATE(p.datePresence) = ?";
        $params[] = $date;
    }
    if ($employeId) {
        $conditions[] = "p.employeId = ?";
        $params[] = $employeId;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY p.datePresence DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $attendances = $stmt->fetchAll();
    
    $formatted = array_map(function($a) {
        return [
            'id' => $a['presenceId'],
            'employeId' => $a['employeId'],
            'employeeName' => $a['nomEmploye'],
            'date' => $a['datePresence'],
            'timeIn' => $a['heureArrivee'],
            'timeOut' => $a['heureDepart'],
            'hoursWorked' => floatval($a['heuresTravaillees'] ?? 0),
            'overtimeHours' => floatval($a['heuresSupplementaires'] ?? 0),
            'delayMinutes' => intval($a['retardMinutes'] ?? 0),
            'justification' => $a['justificationRetard'],
            'status' => $a['statut']
        ];
    }, $attendances);
    
    sendSuccess('Présences récupérées', $formatted);
}

function getAttendance($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT p.*, CONCAT(e.prenom, ' ', e.nom) as nomEmploye
        FROM Presence p
        INNER JOIN Employe e ON p.employeId = e.employeId
        WHERE p.presenceId = ?
    ");
    $stmt->execute([$id]);
    $a = $stmt->fetch();
    
    if (!$a) sendError('Présence non trouvée', 404);
    
    sendSuccess('Présence récupérée', [
        'id' => $a['presenceId'],
        'employeId' => $a['employeId'],
        'employeeName' => $a['nomEmploye'],
        'date' => $a['datePresence'],
        'timeIn' => $a['heureArrivee'],
        'timeOut' => $a['heureDepart'],
        'justification' => $a['justificationRetard'],
        'status' => $a['statut']
    ]);
}

function createAttendance($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['employeId']) || !isset($data['date']) || !isset($data['timeIn']) || !isset($data['timeOut'])) {
        sendError('Employé, date, heure arrivée et heure départ requis');
    }
    
    // Calculer le retard
    $retard = false;
    $retardMinutes = 0;
    if ($data['timeIn'] > '08:00:00') {
        $retard = true;
        $time1 = new DateTime($data['date'] . ' ' . '08:00:00');
        $time2 = new DateTime($data['date'] . ' ' . $data['timeIn']);
        $diff = $time1->diff($time2);
        $retardMinutes = ($diff->h * 60) + $diff->i;
    }
    
    $stmt = $pdo->prepare("
        INSERT INTO Presence (employeId, datePresence, heureArrivee, heureDepart, retard, justificationRetard, statut)
        VALUES (?, ?, ?, ?, ?, ?, 'PRESENT')
    ");
    $stmt->execute([
        $data['employeId'],
        $data['date'],
        $data['timeIn'],
        $data['timeOut'],
        $retard ? 1 : 0,
        $data['justification'] ?? null
    ]);
    
    $attendanceId = $pdo->lastInsertId();
    logAudit($pdo, $userId, 'CREATE', 'Presence', $attendanceId);
    getAttendance($pdo, $attendanceId);
}

function updateAttendance($pdo, $id, $userId) {
    $data = getJSONInput();
    
    $retard = false;
    if (isset($data['timeIn']) && $data['timeIn'] > '08:00:00') {
        $retard = true;
    }
    
    $stmt = $pdo->prepare("
        UPDATE Presence SET
            datePresence = ?,
            heureArrivee = ?,
            heureDepart = ?,
            retard = ?,
            justificationRetard = ?,
            statut = ?
        WHERE presenceId = ?
    ");
    $stmt->execute([
        $data['date'] ?? null,
        $data['timeIn'] ?? null,
        $data['timeOut'] ?? null,
        $retard ? 1 : 0,
        $data['justification'] ?? null,
        $data['status'] ?? null,
        $id
    ]);
    
    logAudit($pdo, $userId, 'UPDATE', 'Presence', $id);
    getAttendance($pdo, $id);
}

function deleteAttendance($pdo, $id, $userId) {
    $stmt = $pdo->prepare("DELETE FROM Presence WHERE presenceId = ?");
    $stmt->execute([$id]);
    logAudit($pdo, $userId, 'DELETE', 'Presence', $id);
    sendSuccess('Présence supprimée');
}


