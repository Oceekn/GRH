<?php
/**
 * API pour la gestion de la paie
 * RHorizon - Système de Gestion des Ressources Humaines
 */

require_once '../config.php';
require_once '../permissions.php';
require_once '../mail.php';

$pdo = getDBConnection();
$method = $_SERVER['REQUEST_METHOD'];
$userId = requireAuth();

switch ($method) {
    case 'GET':
        $id = $_GET['id'] ?? null;
        $action = $_GET['action'] ?? null;

        if ($action === 'download') {
            downloadPayslip($pdo, $id, $userId);
        } elseif ($id) {
            getPayslip($pdo, $id);
        } else {
            getPayslips($pdo);
        }
        break;

    case 'POST':
        $action = $_GET['action'] ?? 'create';
        if ($action === 'validate') {
            validatePayslip($pdo, $userId);
        } elseif ($action === 'pay') {
            payPayslip($pdo, $userId);
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

function downloadPayslip($pdo, $id, $userId) {
    if (!$id) sendError('ID bulletin requis');

    $stmt = $pdo->prepare("
        SELECT s.*, CONCAT(e.prenom, ' ', e.nom) as nomEmploye, e.email, e.matricule, bp.numeroBulletin
        FROM Salaire s
        INNER JOIN Employe e ON s.employeId = e.employeId
        LEFT JOIN BulletinPaie bp ON s.salaireId = bp.salaireId
        WHERE s.salaireId = ?
    ");
    $stmt->execute([$id]);
    $payslip = $stmt->fetch();

    if (!$payslip) sendError('Bulletin non trouvé', 404);

    // Récupérer primes et déductions
    $stmt = $pdo->prepare("SELECT * FROM Prime WHERE salaireId = ?");
    $stmt->execute([$id]);
    $primes = $stmt->fetchAll();

    $stmt = $pdo->prepare("SELECT * FROM Deduction WHERE salaireId = ?");
    $stmt->execute([$id]);
    $deductions = $stmt->fetchAll();

    // Générer le PDF du bulletin
    $pdfContent = generatePayslipPDF($payslip, $primes, $deductions);

    // Si statut est PAYÉ, envoyer l'email
    if ($payslip['statut'] === 'PAYE') {
        $mailer = new Mailer();
        $payslipData = [
            'period' => date('F Y', strtotime($payslip['mois'])),
            'baseSalary' => floatval($payslip['salaireBase']),
            'netSalary' => floatval($payslip['salaireNet']),
            'bonus' => floatval(array_sum(array_column($primes, 'montant'))),
            'contributions' => floatval($payslip['cotisations']),
            'taxes' => floatval($payslip['impots']),
            'deduction' => floatval(array_sum(array_column($deductions, 'montant')))
        ];

        $mailer->sendPayslip($payslip['email'], $payslip['nomEmploye'], $payslipData, '');
        logAudit($pdo, $userId, 'VIEW', 'BulletinPaie', $id, ['action' => 'DOWNLOAD_AND_SEND_EMAIL']);
    } else {
        logAudit($pdo, $userId, 'VIEW', 'BulletinPaie', $id, ['action' => 'DOWNLOAD']);
    }

    // Envoyer le PDF
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="bulletin_' . $payslip['matricule'] . '_' . date('Y-m', strtotime($payslip['mois'])) . '.pdf"');
    echo $pdfContent;
    exit;
}

function payPayslip($pdo, $userId) {
    $id = $_GET['id'] ?? null;
    if (!$id) sendError('ID bulletin requis');

    // Vérifier les permissions
    requirePermission('SALARY_MANAGE');

    $stmt = $pdo->prepare("
        SELECT s.*, e.email, CONCAT(e.prenom, ' ', e.nom) as nomEmploye
        FROM Salaire s
        INNER JOIN Employe e ON s.employeId = e.employeId
        WHERE s.salaireId = ?
    ");
    $stmt->execute([$id]);
    $payslip = $stmt->fetch();

    if (!$payslip) sendError('Bulletin non trouvé', 404);

    if ($payslip['statut'] !== 'VALIDE') {
        sendError('Seuls les bulletins validés peuvent être payés');
    }

    // Mettre à jour le statut à PAYÉ et ajouter la date de paiement
    $stmt = $pdo->prepare("
        UPDATE Salaire
        SET statut = 'PAYE', datePaiement = CURDATE()
        WHERE salaireId = ?
    ");
    $stmt->execute([$id]);

    logAudit($pdo, $userId, 'UPDATE', 'Salaire', $id, ['action' => 'PAYMENT_MARKED']);

    // Récupérer le bulletin mis à jour
    getPayslip($pdo, $id);
}

function generatePayslipPDF($payslip, $primes, $deductions) {
    // Utiliser une bibliothèque comme TCPDF ou FPDF pour générer le PDF
    // Pour simplifier, on retourne du HTML pour le moment
    // En production, utiliser TCPDF ou mPDF

    $totalPrimes = array_sum(array_column($primes, 'montant'));
    $totalDeductions = array_sum(array_column($deductions, 'montant'));

    $html = "
    <html>
    <head>
        <meta charset='UTF-8'>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { border-bottom: 3px solid #2c3e50; padding-bottom: 20px; text-align: center; }
            .title { font-size: 24px; font-weight: bold; }
            .subtitle { font-size: 14px; color: #666; }
            .section { margin-top: 20px; }
            .section-title { font-size: 14px; font-weight: bold; background-color: #2c3e50; color: white; padding: 5px; }
            .detail { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #ddd; }
            .total { font-weight: bold; font-size: 16px; }
        </style>
    </head>
    <body>
        <div class='header'>
            <div class='title'>BULLETIN DE PAIE</div>
            <div class='subtitle'>RHorizon - Système de Gestion des Ressources Humaines</div>
        </div>

        <div class='section'>
            <div class='section-title'>INFORMATIONS EMPLOYÉ</div>
            <div class='detail'>
                <span>Nom:</span>
                <span>" . htmlspecialchars($payslip['nomEmploye']) . "</span>
            </div>
            <div class='detail'>
                <span>Matricule:</span>
                <span>" . htmlspecialchars($payslip['matricule']) . "</span>
            </div>
            <div class='detail'>
                <span>Période:</span>
                <span>" . date('F Y', strtotime($payslip['mois'])) . "</span>
            </div>
        </div>

        <div class='section'>
            <div class='section-title'>SALAIRE ET RÉMUNÉRATIONS</div>
            <div class='detail'>
                <span>Salaire de base:</span>
                <span>" . number_format($payslip['salaireBase'], 2, ',', ' ') . " FCFA</span>
            </div>
            <div class='detail'>
                <span>Heures supplémentaires:</span>
                <span>" . $payslip['heuresSupplementaires'] . " h</span>
            </div>";

    if ($totalPrimes > 0) {
        $html .= "<div class='detail'>
                <span>Primes:</span>
                <span>" . number_format($totalPrimes, 2, ',', ' ') . " FCFA</span>
            </div>";
    }

    $html .= "
        </div>

        <div class='section'>
            <div class='section-title'>RETENUES ET DÉDUCTIONS</div>
            <div class='detail'>
                <span>Cotisations:</span>
                <span>- " . number_format($payslip['cotisations'], 2, ',', ' ') . " FCFA</span>
            </div>
            <div class='detail'>
                <span>Impôts:</span>
                <span>- " . number_format($payslip['impots'], 2, ',', ' ') . " FCFA</span>
            </div>";

    if ($totalDeductions > 0) {
        $html .= "<div class='detail'>
                <span>Déductions:</span>
                <span>- " . number_format($totalDeductions, 2, ',', ' ') . " FCFA</span>
            </div>";
    }

    $html .= "
        </div>

        <div class='section'>
            <div class='section-title total'>RÉSUMÉ</div>
            <div class='detail'>
                <span>Salaire Brut:</span>
                <span>" . number_format($payslip['salaireTotal'], 2, ',', ' ') . " FCFA</span>
            </div>
            <div class='detail total'>
                <span>Salaire Net:</span>
                <span>" . number_format($payslip['salaireNet'], 2, ',', ' ') . " FCFA</span>
            </div>
            <div class='detail'>
                <span>Statut:</span>
                <span>" . htmlspecialchars($payslip['statut']) . "</span>
            </div>
        </div>
    </body>
    </html>
    ";

    return $html;
}


