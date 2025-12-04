<?php
/**
 * API pour la gestion de la paie
 */

require_once '../config.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        if ($id) {
            getPayslip($pdo, $id);
        } else {
            getPayslips($pdo);
        }
        break;
    
    case 'POST':
        $action = $_GET['action'] ?? 'create';
        if ($action === 'validate') {
            validatePayslip($pdo, $userId);
        } else {
            createPayslip($pdo, $userId);
        }
        break;
    
    case 'PUT':
        $id = $_GET['id'] ?? null;
        if (!$id) sendError('ID bulletin requis');
        updatePayslip($pdo, $id, $userId);
        break;
    
    default:
        sendError('Méthode non autorisée', 405);
}

function getPayslips($pdo) {
    $period = $_GET['period'] ?? null;
    $employeId = $_GET['employeId'] ?? null;
    
    $sql = "
        SELECT 
            s.*,
            CONCAT(e.prenom, ' ', e.nom) as nomEmploye,
            e.matricule,
            bp.numeroBulletin,
            (SELECT COALESCE(SUM(montant), 0) FROM Prime WHERE salaireId = s.salaireId) as totalPrimes,
            (SELECT COALESCE(SUM(montant), 0) FROM Deduction WHERE salaireId = s.salaireId) as totalDeductions
        FROM Salaire s
        INNER JOIN Employe e ON s.employeId = e.employeId
        LEFT JOIN BulletinPaie bp ON s.salaireId = bp.salaireId
    ";
    
    $params = [];
    $conditions = [];
    
    if ($period) {
        $conditions[] = "DATE_FORMAT(s.mois, '%Y-%m') = ?";
        $params[] = $period;
    }
    if ($employeId) {
        $conditions[] = "s.employeId = ?";
        $params[] = $employeId;
    }
    
    if (!empty($conditions)) {
        $sql .= " WHERE " . implode(" AND ", $conditions);
    }
    
    $sql .= " ORDER BY s.mois DESC";
    
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $payslips = $stmt->fetchAll();
    
    $formatted = array_map(function($p) {
        return [
            'id' => $p['salaireId'],
            'employeId' => $p['employeId'],
            'employeeName' => $p['nomEmploye'],
            'matricule' => $p['matricule'],
            'period' => date('Y-m', strtotime($p['mois'])),
            'baseSalary' => floatval($p['salaireBase']),
            'netSalary' => floatval($p['salaireNet']),
            'totalSalary' => floatval($p['salaireTotal']),
            'overtimeHours' => floatval($p['heuresSupplementaires']),
            'contributions' => floatval($p['cotisations']),
            'taxes' => floatval($p['impots']),
            'bonus' => floatval($p['totalPrimes']),
            'deduction' => floatval($p['totalDeductions']),
            'status' => $p['statut'],
            'payslipNumber' => $p['numeroBulletin']
        ];
    }, $payslips);
    
    sendSuccess('Bulletins récupérés', $formatted);
}

function getPayslip($pdo, $id) {
    $stmt = $pdo->prepare("
        SELECT s.*, CONCAT(e.prenom, ' ', e.nom) as nomEmploye, bp.numeroBulletin
        FROM Salaire s
        INNER JOIN Employe e ON s.employeId = e.employeId
        LEFT JOIN BulletinPaie bp ON s.salaireId = bp.salaireId
        WHERE s.salaireId = ?
    ");
    $stmt->execute([$id]);
    $p = $stmt->fetch();
    
    if (!$p) sendError('Bulletin non trouvé', 404);
    
    // Récupérer primes et déductions
    $stmt = $pdo->prepare("SELECT * FROM Prime WHERE salaireId = ?");
    $stmt->execute([$id]);
    $primes = $stmt->fetchAll();
    
    $stmt = $pdo->prepare("SELECT * FROM Deduction WHERE salaireId = ?");
    $stmt->execute([$id]);
    $deductions = $stmt->fetchAll();
    
    sendSuccess('Bulletin récupéré', [
        'id' => $p['salaireId'],
        'employeId' => $p['employeId'],
        'employeeName' => $p['nomEmploye'],
        'period' => date('Y-m', strtotime($p['mois'])),
        'baseSalary' => floatval($p['salaireBase']),
        'netSalary' => floatval($p['salaireNet']),
        'totalSalary' => floatval($p['salaireTotal']),
        'overtimeHours' => floatval($p['heuresSupplementaires']),
        'contributions' => floatval($p['cotisations']),
        'taxes' => floatval($p['impots']),
        'status' => $p['statut'],
        'payslipNumber' => $p['numeroBulletin'],
        'primes' => $primes,
        'deductions' => $deductions
    ]);
}

function createPayslip($pdo, $userId) {
    $data = getJSONInput();
    
    if (!isset($data['employeId']) || !isset($data['period']) || !isset($data['baseSalary'])) {
        sendError('Employé, période et salaire de base requis');
    }
    
    // Convertir période en date
    $mois = $data['period'] . '-01';
    
    // Vérifier si existe déjà
    $stmt = $pdo->prepare("SELECT salaireId FROM Salaire WHERE employeId = ? AND mois = ?");
    $stmt->execute([$data['employeId'], $mois]);
    if ($stmt->fetch()) {
        sendError('Un bulletin existe déjà pour cette période');
    }
    
    // Calculer salaire net (utiliser procédure ou calcul direct)
    $bonus = floatval($data['bonus'] ?? 0);
    $deduction = floatval($data['deduction'] ?? 0);
    $overtimeHours = floatval($data['overtimeHours'] ?? 0);
    $advance = floatval($data['advance'] ?? 0);
    
    $baseSalary = floatval($data['baseSalary']);
    $overtimeRate = 1.5;
    $hourlyRate = $baseSalary / 173.33;
    $overtimePay = $hourlyRate * $overtimeHours * $overtimeRate;
    
    $grossSalary = $baseSalary + $bonus + $overtimePay;
    $contributions = $grossSalary * 0.10;
    $taxes = ($grossSalary - $contributions) * 0.15;
    $netSalary = $grossSalary - $contributions - $taxes - $deduction - $advance;
    
    // Insérer salaire
    $stmt = $pdo->prepare("
        INSERT INTO Salaire (employeId, mois, annee, salaireBase, salaireNet, salaireTotal, heuresSupplementaires, cotisations, impots, statut)
        VALUES (?, ?, YEAR(?), ?, ?, ?, ?, ?, ?, 'BROUILLON')
    ");
    $stmt->execute([
        $data['employeId'],
        $mois,
        $mois,
        $baseSalary,
        $netSalary,
        $grossSalary,
        $overtimeHours,
        $contributions,
        $taxes
    ]);
    
    $salaireId = $pdo->lastInsertId();
    
    // Ajouter primes
    if ($bonus > 0) {
        $stmt = $pdo->prepare("INSERT INTO Prime (salaireId, typePrime, montant) VALUES (?, 'Prime', ?)");
        $stmt->execute([$salaireId, $bonus]);
    }
    
    // Ajouter déductions
    if ($deduction > 0) {
        $stmt = $pdo->prepare("INSERT INTO Deduction (salaireId, typeDeduction, montant) VALUES (?, 'Déduction', ?)");
        $stmt->execute([$salaireId, $deduction]);
    }
    
    // Ajouter avance si applicable
    if ($advance > 0) {
        $stmt = $pdo->prepare("
            INSERT INTO AvanceSalaire (employeId, montant, dateAvance, moisRemboursement, statut)
            VALUES (?, ?, CURDATE(), ?, 'APPROUVE')
        ");
        $stmt->execute([$data['employeId'], $advance, $mois]);
    }
    
    logAudit($pdo, $userId, 'CREATE', 'Salaire', $salaireId);
    getPayslip($pdo, $salaireId);
}

function validatePayslip($pdo, $userId) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('ID bulletin requis');
    
    // Générer bulletin
    $stmt = $pdo->prepare("
        SELECT employeId, mois FROM Salaire WHERE salaireId = ?
    ");
    $stmt->execute([$id]);
    $salaire = $stmt->fetch();
    
    if (!$salaire) sendError('Salaire non trouvé', 404);
    
    try {
        $stmt = $pdo->prepare("CALL GenererBulletinPaie(?, ?)");
        $stmt->execute([$salaire['employeId'], $salaire['mois']]);
        
        logAudit($pdo, $userId, 'UPDATE', 'Salaire', $id, ['action' => 'VALIDATE']);
        sendSuccess('Bulletin validé et généré');
    } catch (PDOException $e) {
        sendError($e->getMessage());
    }
}

function updatePayslip($pdo, $id, $userId) {
    $data = getJSONInput();
    
    if (isset($data['status'])) {
        $stmt = $pdo->prepare("UPDATE Salaire SET statut = ? WHERE salaireId = ?");
        $stmt->execute([$data['status'], $id]);
        logAudit($pdo, $userId, 'UPDATE', 'Salaire', $id);
    }
    
    getPayslip($pdo, $id);
}


