-- ============================================
-- SYSTÈME DE GESTION DES RESSOURCES HUMAINES
-- VERSION ACADÉMIQUE SÉCURISÉE POUR XAMPP
-- ============================================

-- Désactiver les vérifications FK temporairement
SET @OLD_FOREIGN_KEY_CHECKS = @@FOREIGN_KEY_CHECKS;
SET FOREIGN_KEY_CHECKS = 0;

-- Supprimer les objets existants pour une réinstallation propre
DROP DATABASE IF EXISTS GestionRH_Academic;
CREATE DATABASE GestionRH_Academic 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- SÉLECTIONNER LA BASE IMMÉDIATEMENT - ÉVITE L'ERREUR #1046

USE GestionRH_Academic;

-- ============================================
--  TABLES DE RÉFÉRENCE
-- ============================================

CREATE TABLE Role (
    roleId INT PRIMARY KEY AUTO_INCREMENT,
    nomRole VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_nomRole (nomRole)
) ENGINE=InnoDB;

CREATE TABLE Permission (
    permissionId INT PRIMARY KEY AUTO_INCREMENT,
    codePermission VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    module VARCHAR(50),
    INDEX idx_code (codePermission)
) ENGINE=InnoDB;

CREATE TABLE RolePermission (
    roleId INT NOT NULL,
    permissionId INT NOT NULL,
    PRIMARY KEY (roleId, permissionId),
    FOREIGN KEY (roleId) REFERENCES Role(roleId) ON DELETE CASCADE,
    FOREIGN KEY (permissionId) REFERENCES Permission(permissionId) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================
--  GESTION DES UTILISATEURS
-- ============================================

CREATE TABLE Utilisateur (
    utilisateurId INT PRIMARY KEY AUTO_INCREMENT,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    motDePasse VARCHAR(255) NOT NULL,
    telephone VARCHAR(20),
    roleId INT,
    derniereConnexion DATETIME,
    adresseIp VARCHAR(45),
    statut ENUM('ACTIF', 'INACTIF', 'SUSPENDU') DEFAULT 'ACTIF',
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateModification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (roleId) REFERENCES Role(roleId),
    INDEX idx_email (email),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;

-- ============================================
-- GESTION DES SERVICES
-- ============================================

CREATE TABLE Service (
    serviceId INT PRIMARY KEY AUTO_INCREMENT,
    nomService VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    responsableId INT,
    budget DECIMAL(15,2),
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_nom (nomService),
    INDEX idx_responsable (responsableId)
) ENGINE=InnoDB;

-- ============================================
-- GESTION DES EMPLOYÉS
-- ============================================

CREATE TABLE Employe (
    employeId INT PRIMARY KEY AUTO_INCREMENT,
    utilisateurId INT UNIQUE,
    matricule VARCHAR(20) NOT NULL UNIQUE,
    nom VARCHAR(100) NOT NULL,
    prenom VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    telephone VARCHAR(20),
    adresse TEXT,
    dateNaissance DATE,
    lieuNaissance VARCHAR(100),
    sexe ENUM('M', 'F', 'AUTRE'),
    situationMatrimoniale ENUM('CELIBATAIRE', 'MARIE', 'DIVORCE', 'VEUF'),
    nombreEnfants INT DEFAULT 0,
    
    -- Informations professionnelles
    serviceId INT,
    poste VARCHAR(100),
    typeContrat ENUM('CDI', 'CDD', 'STAGE', 'INTERIM', 'FREELANCE'),
    dateEmbauche DATE NOT NULL DEFAULT (CURDATE()),
    dateDepartEffectif DATE,
    dateFinContrat DATE,
    
    statut ENUM('ACTIF', 'CONGE', 'SUSPENDU', 'DEMISSIONNAIRE', 'LICENCIE', 'RETRAITE') DEFAULT 'ACTIF',
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dateModification TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (utilisateurId) REFERENCES Utilisateur(utilisateurId) ON DELETE SET NULL,
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE SET NULL,
    
    INDEX idx_matricule (matricule),
    INDEX idx_email (email),
    INDEX idx_service (serviceId),
    INDEX idx_statut (statut),
    INDEX idx_nom_prenom (nom, prenom)
) ENGINE=InnoDB;

-- ============================================
--  GESTION DES CONTRATS
-- ============================================

CREATE TABLE Contrat (
    contratId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    numeroContrat VARCHAR(50) UNIQUE NOT NULL,
    typeContrat ENUM('CDI', 'CDD', 'STAGE', 'INTERIM', 'FREELANCE') NOT NULL,
    dateDebut DATE NOT NULL,
    dateFin DATE,
    salaireBase DECIMAL(10,2) NOT NULL,
    deviseMonnaie VARCHAR(10) DEFAULT 'FCFA',
    statut ENUM('ACTIF', 'EXPIRE', 'RESILIE', 'SUSPENDU') DEFAULT 'ACTIF',
    dateSignature DATE,
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    INDEX idx_employe (employeId),
    INDEX idx_numero (numeroContrat),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;

-- ============================================
-- GESTION DE LA PAIE
-- ============================================

CREATE TABLE Salaire (
    salaireId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    mois DATE NOT NULL,
    annee INT NOT NULL,
    salaireBase DECIMAL(10,2) NOT NULL,
    salaireNet DECIMAL(10,2) NOT NULL,
    salaireTotal DECIMAL(10,2) NOT NULL,
    heuresSupplementaires DECIMAL(5,2) DEFAULT 0,
    cotisations DECIMAL(10,2) DEFAULT 0,
    impots DECIMAL(10,2) DEFAULT 0,
    statut ENUM('BROUILLON', 'VALIDE', 'PAYE') DEFAULT 'BROUILLON',
    dateCalcul DATETIME DEFAULT CURRENT_TIMESTAMP,
    datePaiement DATE,
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    UNIQUE KEY uk_employe_mois (employeId, mois),
    INDEX idx_mois_annee (mois, annee),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;

CREATE TABLE BulletinPaie (
    bulletinId INT PRIMARY KEY AUTO_INCREMENT,
    salaireId INT NOT NULL UNIQUE,
    numeroBulletin VARCHAR(50) UNIQUE NOT NULL,
    fichier VARCHAR(255),
    dateGeneration DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (salaireId) REFERENCES Salaire(salaireId) ON DELETE CASCADE,
    INDEX idx_numero (numeroBulletin)
) ENGINE=InnoDB;

CREATE TABLE Prime (
    primeId INT PRIMARY KEY AUTO_INCREMENT,
    salaireId INT NOT NULL,
    typePrime VARCHAR(100) NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    
    FOREIGN KEY (salaireId) REFERENCES Salaire(salaireId) ON DELETE CASCADE,
    INDEX idx_salaire (salaireId)
) ENGINE=InnoDB;

CREATE TABLE Deduction (
    deductionId INT PRIMARY KEY AUTO_INCREMENT,
    salaireId INT NOT NULL,
    typeDeduction VARCHAR(100) NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    description TEXT,
    
    FOREIGN KEY (salaireId) REFERENCES Salaire(salaireId) ON DELETE CASCADE,
    INDEX idx_salaire (salaireId)
) ENGINE=InnoDB;

CREATE TABLE AvanceSalaire (
    avanceId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    montant DECIMAL(10,2) NOT NULL,
    dateAvance DATE NOT NULL,
    moisRemboursement DATE NOT NULL,
    motifRemboursement VARCHAR(255),
    statut ENUM('EN_ATTENTE', 'APPROUVE', 'REMBOURSE') DEFAULT 'EN_ATTENTE',
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    INDEX idx_employe (employeId),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;

-- ============================================
--  GESTION DES PRÉSENCES
-- ============================================

CREATE TABLE Presence (
    presenceId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    datePresence DATE NOT NULL,
    heureArrivee TIME,
    heureDepart TIME,
    heuresSupplementaires TIME,
    retard BOOLEAN DEFAULT FALSE,
    justificationRetard TEXT,
    statut ENUM('PRESENT', 'ABSENT', 'CONGE', 'MALADIE', 'MISSION') DEFAULT 'PRESENT',
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    UNIQUE KEY uk_employe_date (employeId, datePresence),
    INDEX idx_date (datePresence),
    INDEX idx_statut (statut)
) ENGINE=InnoDB;

-- ============================================
--  GESTION DES CONGÉS
-- ============================================

CREATE TABLE Conge (
    congeId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    typeConge ENUM('ANNUEL', 'MALADIE', 'MATERNITE', 'PATERNITE', 'SANS_SOLDE', 'EXCEPTIONNEL') NOT NULL,
    dateDebut DATE NOT NULL,
    dateFin DATE NOT NULL,
    nombreJours INT NOT NULL,
    motif TEXT,
    statut ENUM('EN_ATTENTE', 'APPROUVE', 'REFUSE', 'ANNULE') DEFAULT 'EN_ATTENTE',
    dateCreation TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    validateur INT,
    dateValidation DATETIME,
    commentaireValidation TEXT,
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    FOREIGN KEY (validateur) REFERENCES Utilisateur(utilisateurId) ON DELETE SET NULL,
    INDEX idx_employe (employeId),
    INDEX idx_statut (statut),
    INDEX idx_dates (dateDebut, dateFin)
) ENGINE=InnoDB;

-- ============================================
-- AFFECTATION DE SERVICE (historique)
-- ============================================

CREATE TABLE AffectationService (
    affectationId INT PRIMARY KEY AUTO_INCREMENT,
    employeId INT NOT NULL,
    serviceId INT NOT NULL,
    dateDebut DATE NOT NULL,
    dateFin DATE,
    motif TEXT,
    estActif BOOLEAN DEFAULT TRUE,
    
    FOREIGN KEY (employeId) REFERENCES Employe(employeId) ON DELETE CASCADE,
    FOREIGN KEY (serviceId) REFERENCES Service(serviceId) ON DELETE CASCADE,
    INDEX idx_employe (employeId),
    INDEX idx_service (serviceId),
    INDEX idx_actif (estActif)
) ENGINE=InnoDB;

-- ============================================
--  AUDIT LOG
-- ============================================

CREATE TABLE AuditLog (
    auditId INT PRIMARY KEY AUTO_INCREMENT,
    utilisateurId INT,
    action ENUM('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW') NOT NULL,
    tableConcernee VARCHAR(50),
    enregistrementId INT,
    details JSON,
    ipAddress VARCHAR(45),
    dateAction TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (utilisateurId) REFERENCES Utilisateur(utilisateurId) ON DELETE SET NULL,
    INDEX idx_utilisateur (utilisateurId),
    INDEX idx_action (action),
    INDEX idx_date (dateAction)
) ENGINE=InnoDB;

-- ============================================
-- CRÉATION DES TRIGGERS (SÉCURISÉE)
-- ============================================

DELIMITER $$

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS trg_employe_matricule $$
DROP TRIGGER IF EXISTS trg_employe_audit_insert $$
DROP TRIGGER IF EXISTS trg_employe_audit_update $$
DROP TRIGGER IF EXISTS trg_conge_calcul_jours $$
DROP TRIGGER IF EXISTS trg_contrat_numero $$
DROP TRIGGER IF EXISTS trg_employe_affectation $$
DROP TRIGGER IF EXISTS trg_employe_changement_service $$

-- Trigger : Générer matricule automatiquement
CREATE TRIGGER trg_employe_matricule
BEFORE INSERT ON Employe
FOR EACH ROW
BEGIN
    IF NEW.matricule IS NULL OR NEW.matricule = '' THEN
        SET NEW.matricule = CONCAT('EMP', YEAR(CURDATE()), LPAD(FLOOR(RAND() * 99999), 5, '0'));
    END IF;
END $$

-- Trigger  : Logger création employé
CREATE TRIGGER trg_employe_audit_insert
AFTER INSERT ON Employe
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (utilisateurId, action, tableConcernee, enregistrementId, details)
    VALUES (
        NEW.utilisateurId,
        'CREATE',
        'Employe',
        NEW.employeId,
        JSON_OBJECT('matricule', NEW.matricule, 'nom', NEW.nom, 'prenom', NEW.prenom)
    );
END $$

-- Trigger  : Logger modification employé
CREATE TRIGGER trg_employe_audit_update
AFTER UPDATE ON Employe
FOR EACH ROW
BEGIN
    INSERT INTO AuditLog (utilisateurId, action, tableConcernee, enregistrementId, details)
    VALUES (
        NEW.utilisateurId,
        'UPDATE',
        'Employe',
        NEW.employeId,
        JSON_OBJECT('ancienStatut', OLD.statut, 'nouveauStatut', NEW.statut)
    );
END $$

-- Trigger  : Calculer nombre de jours congé
CREATE TRIGGER trg_conge_calcul_jours
BEFORE INSERT ON Conge
FOR EACH ROW
BEGIN
    SET NEW.nombreJours = DATEDIFF(NEW.dateFin, NEW.dateDebut) + 1;
END $$

-- Trigger : Générer numéro contrat
CREATE TRIGGER trg_contrat_numero
BEFORE INSERT ON Contrat
FOR EACH ROW
BEGIN
    DECLARE v_matricule VARCHAR(20);
    
    IF NEW.numeroContrat IS NULL OR NEW.numeroContrat = '' THEN
        SELECT matricule INTO v_matricule FROM Employe WHERE employeId = NEW.employeId;
        SET NEW.numeroContrat = CONCAT('CTR-', v_matricule, '-', DATE_FORMAT(NOW(), '%Y%m%d'));
    END IF;
END $$

-- Trigger  : Créer affectation service automatiquement
CREATE TRIGGER trg_employe_affectation
AFTER INSERT ON Employe
FOR EACH ROW
BEGIN
    IF NEW.serviceId IS NOT NULL THEN
        INSERT INTO AffectationService (employeId, serviceId, dateDebut, estActif)
        VALUES (NEW.employeId, NEW.serviceId, NEW.dateEmbauche, TRUE);
    END IF;
END $$

-- Trigger  : Historiser changement de service
CREATE TRIGGER trg_employe_changement_service
AFTER UPDATE ON Employe
FOR EACH ROW
BEGIN
    IF NEW.serviceId != OLD.serviceId AND NEW.serviceId IS NOT NULL THEN
        -- Fermer ancienne affectation
        UPDATE AffectationService
        SET dateFin = CURDATE(), estActif = FALSE
        WHERE employeId = NEW.employeId AND estActif = TRUE;
        
        -- Créer nouvelle affectation
        INSERT INTO AffectationService (employeId, serviceId, dateDebut, estActif)
        VALUES (NEW.employeId, NEW.serviceId, CURDATE(), TRUE);
    END IF;
END $$

DELIMITER ;

-- ============================================
--  CRÉATION DES PROCÉDURES (SÉCURISÉE)
-- ============================================

DELIMITER $$

-- Supprimer les procédures existantes
DROP PROCEDURE IF EXISTS CalculerSalaireNet $$
DROP PROCEDURE IF EXISTS GenererBulletinPaie $$
DROP PROCEDURE IF EXISTS CalculerCongesRestants $$
DROP PROCEDURE IF EXISTS ValiderConge $$
DROP PROCEDURE IF EXISTS StatistiquesRH $$
DROP PROCEDURE IF EXISTS DashboardMensuel $$

-- Procédure : Calculer salaire net
CREATE PROCEDURE CalculerSalaireNet(
    IN p_employeId INT,
    IN p_mois DATE,
    OUT p_salaireNet DECIMAL(10,2)
)
BEGIN
    DECLARE v_salaireBase DECIMAL(10,2);
    DECLARE v_totalPrimes DECIMAL(10,2);
    DECLARE v_totalDeductions DECIMAL(10,2);
    DECLARE v_cotisations DECIMAL(10,2);
    DECLARE v_impots DECIMAL(10,2);
    
    -- Récupérer salaire de base
    SELECT salaireBase INTO v_salaireBase
    FROM Contrat
    WHERE employeId = p_employeId AND statut = 'ACTIF'
    ORDER BY dateDebut DESC LIMIT 1;
    
    -- Calculer primes
    SELECT COALESCE(SUM(montant), 0) INTO v_totalPrimes
    FROM Prime p
    INNER JOIN Salaire s ON p.salaireId = s.salaireId
    WHERE s.employeId = p_employeId AND s.mois = p_mois;
    
    -- Calculer déductions
    SELECT COALESCE(SUM(montant), 0) INTO v_totalDeductions
    FROM Deduction d
    INNER JOIN Salaire s ON d.salaireId = s.salaireId
    WHERE s.employeId = p_employeId AND s.mois = p_mois;
    
    -- Cotisations (10% du brut)
    SET v_cotisations = (v_salaireBase + v_totalPrimes) * 0.10;
    
    -- Impôts (15% après cotisations)
    SET v_impots = (v_salaireBase + v_totalPrimes - v_cotisations) * 0.15;
    
    -- Salaire net
    SET p_salaireNet = v_salaireBase + v_totalPrimes - v_totalDeductions - v_cotisations - v_impots;
END $$

-- Procédure : Générer bulletin de paie
CREATE PROCEDURE GenererBulletinPaie(
    IN p_employeId INT,
    IN p_mois DATE
)
BEGIN
    DECLARE v_salaireId INT;
    DECLARE v_salaireNet DECIMAL(10,2);
    DECLARE v_numeroBulletin VARCHAR(50);
    
    -- Vérifier si salaire existe
    SELECT salaireId INTO v_salaireId
    FROM Salaire
    WHERE employeId = p_employeId AND mois = p_mois;
    
    IF v_salaireId IS NULL THEN
        SIGNAL SQLSTATE '45000' 
        SET MESSAGE_TEXT = 'Salaire non trouvé pour cet employé et ce mois';
    END IF;
    
    -- Calculer salaire net
    CALL CalculerSalaireNet(p_employeId, p_mois, v_salaireNet);
    
    -- Mettre à jour salaire
    UPDATE Salaire
    SET salaireNet = v_salaireNet, statut = 'VALIDE'
    WHERE salaireId = v_salaireId;
    
    -- Générer numéro bulletin
    SET v_numeroBulletin = CONCAT('BP-', YEAR(p_mois), LPAD(MONTH(p_mois), 2, '0'), '-', LPAD(p_employeId, 5, '0'));
    
    -- Insérer bulletin
    INSERT INTO BulletinPaie (salaireId, numeroBulletin)
    VALUES (v_salaireId, v_numeroBulletin)
    ON DUPLICATE KEY UPDATE dateGeneration = CURRENT_TIMESTAMP;
    
    SELECT 'Bulletin généré' AS message, v_numeroBulletin AS numeroBulletin;
END $$

-- Procédure : Calculer jours de congés restants
CREATE PROCEDURE CalculerCongesRestants(
    IN p_employeId INT,
    IN p_annee INT,
    OUT p_joursRestants INT
)
BEGIN
    DECLARE v_joursAnnuels INT DEFAULT 30;
    DECLARE v_joursPris INT;
    
    SELECT COALESCE(SUM(nombreJours), 0) INTO v_joursPris
    FROM Conge
    WHERE employeId = p_employeId
    AND YEAR(dateDebut) = p_annee
    AND statut = 'APPROUVE';
    
    SET p_joursRestants = v_joursAnnuels - v_joursPris;
END $$

-- Procédure  : Valider congé
CREATE PROCEDURE ValiderConge(
    IN p_congeId INT,
    IN p_validateurId INT,
    IN p_decision ENUM('APPROUVE', 'REFUSE'),
    IN p_commentaire TEXT
)
BEGIN
    DECLARE v_employeId INT;
    DECLARE v_dateDebut DATE;
    DECLARE v_dateFin DATE;
    DECLARE v_nombreJours INT;
    DECLARE v_joursRestants INT;
    
    -- Récupérer infos congé
    SELECT employeId, dateDebut, dateFin, nombreJours
    INTO v_employeId, v_dateDebut, v_dateFin, v_nombreJours
    FROM Conge
    WHERE congeId = p_congeId;
    
    -- Vérifier solde si approbation
    IF p_decision = 'APPROUVE' THEN
        CALL CalculerCongesRestants(v_employeId, YEAR(v_dateDebut), v_joursRestants);
        
        IF v_joursRestants < v_nombreJours THEN
            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Solde de congés insuffisant';
        END IF;
    END IF;
    
    -- Mettre à jour demande
    UPDATE Conge
    SET statut = p_decision,
        validateur = p_validateurId,
        dateValidation = NOW(),
        commentaireValidation = p_commentaire
    WHERE congeId = p_congeId;
    
    SELECT CONCAT('Congé ', p_decision) AS message;
END $$

-- Procédure  : Statistiques RH
CREATE PROCEDURE StatistiquesRH(
    IN p_annee INT
)
BEGIN
    -- Effectif
    SELECT COUNT(*) AS effectifTotal,
           COUNT(CASE WHEN statut = 'ACTIF' THEN 1 END) AS effectifActif,
           COUNT(CASE WHEN YEAR(dateEmbauche) = p_annee THEN 1 END) AS recrutements,
           COUNT(CASE WHEN dateDepartEffectif IS NOT NULL AND YEAR(dateDepartEffectif) = p_annee THEN 1 END) AS departs
    FROM Employe;
    
    -- Par service
    SELECT s.nomService, COUNT(e.employeId) AS effectif
    FROM Service s
    LEFT JOIN Employe e ON s.serviceId = e.serviceId AND e.statut = 'ACTIF'
    GROUP BY s.serviceId, s.nomService;
    
    -- Masse salariale
    SELECT SUM(salaireTotal) AS masseSalariale,
           AVG(salaireNet) AS salaireMoyen
    FROM Salaire
    WHERE YEAR(mois) = p_annee;
END $$

-- Procédure : Dashboard mensuel
CREATE PROCEDURE DashboardMensuel(
    IN p_annee INT,
    IN p_mois INT
)
BEGIN
    DECLARE v_premierJour DATE;
    DECLARE v_dernierJour DATE;
    
    SET v_premierJour = DATE(CONCAT(p_annee, '-', LPAD(p_mois, 2, '0'), '-01'));
    SET v_dernierJour = LAST_DAY(v_premierJour);
    
    -- Effectif
    SELECT COUNT(*) AS effectif FROM Employe WHERE statut = 'ACTIF';
    
    -- Congés
    SELECT COUNT(*) AS totalDemandes,
           COUNT(CASE WHEN statut = 'EN_ATTENTE' THEN 1 END) AS enAttente
    FROM Conge
    WHERE dateDebut BETWEEN v_premierJour AND v_dernierJour;
    
    -- Présences
    SELECT COUNT(CASE WHEN statut = 'PRESENT' THEN 1 END) AS presents,
           COUNT(CASE WHEN statut = 'ABSENT' THEN 1 END) AS absents
    FROM Presence
    WHERE datePresence BETWEEN v_premierJour AND v_dernierJour;
END $$

DELIMITER ;

-- ============================================
--  CRÉATION DES VUES (SÉCURISÉE)
-- ============================================

-- Supprimer les vues existantes
DROP VIEW IF EXISTS v_employes_actifs;
DROP VIEW IF EXISTS v_conges_a_valider;
DROP VIEW IF EXISTS v_dashboard_salaires;
DROP VIEW IF EXISTS v_presences_jour;
DROP VIEW IF EXISTS v_stats_service;

-- Vue  : Employés actifs
CREATE VIEW v_employes_actifs AS
SELECT 
    e.employeId,
    e.matricule,
    CONCAT(e.prenom, ' ', e.nom) AS nomComplet,
    e.email,
    e.telephone,
    e.poste,
    s.nomService,
    e.dateEmbauche,
    TIMESTAMPDIFF(YEAR, e.dateEmbauche, CURDATE()) AS anciennete,
    c.salaireBase,
    c.typeContrat
FROM Employe e
LEFT JOIN Service s ON e.serviceId = s.serviceId
LEFT JOIN Contrat c ON e.employeId = c.employeId AND c.statut = 'ACTIF'
WHERE e.statut = 'ACTIF';

-- Vue  : Congés à valider
CREATE VIEW v_conges_a_valider AS
SELECT 
    co.congeId,
    CONCAT(e.prenom, ' ', e.nom) AS nomEmploye,
    e.matricule,
    s.nomService,
    co.typeConge,
    co.dateDebut,
    co.dateFin,
    co.nombreJours,
    co.motif,
    DATEDIFF(CURDATE(), co.dateCreation) AS joursAttente
FROM Conge co
INNER JOIN Employe e ON co.employeId = e.employeId
LEFT JOIN Service s ON e.serviceId = s.serviceId
WHERE co.statut = 'EN_ATTENTE';

-- Vue  : Dashboard salaires
CREATE VIEW v_dashboard_salaires AS
SELECT 
    DATE_FORMAT(s.mois, '%Y-%m') AS periode,
    COUNT(DISTINCT s.employeId) AS nombreEmployes,
    SUM(s.salaireBase) AS totalBase,
    SUM(s.salaireNet) AS totalNet,
    SUM(s.salaireTotal) AS totalBrut,
    AVG(s.salaireNet) AS moyenneNet
FROM Salaire s
GROUP BY DATE_FORMAT(s.mois, '%Y-%m');

-- Vue  : Présences du jour
CREATE VIEW v_presences_jour AS
SELECT 
    p.presenceId,
    e.matricule,
    CONCAT(e.prenom, ' ', e.nom) AS nomEmploye,
    s.nomService,
    p.heureArrivee,
    p.heureDepart,
    p.statut,
    p.retard
FROM Presence p
INNER JOIN Employe e ON p.employeId = e.employeId
LEFT JOIN Service s ON e.serviceId = s.serviceId
WHERE DATE(p.datePresence) = CURDATE();

-- Vue : Statistiques par service
CREATE VIEW v_stats_service AS
SELECT 
    s.serviceId,
    s.nomService,
    CONCAT(r.prenom, ' ', r.nom) AS responsable,
    COUNT(e.employeId) AS effectif,
    AVG(TIMESTAMPDIFF(YEAR, e.dateEmbauche, CURDATE())) AS ancienneteMoyenne
FROM Service s
LEFT JOIN Employe e ON s.serviceId = e.serviceId AND e.statut = 'ACTIF'
LEFT JOIN Employe r ON s.responsableId = r.employeId
GROUP BY s.serviceId;

-- ============================================
--  INDEX SUPPLÉMENTAIRES POUR OPTIMISATION
-- ============================================

CREATE INDEX idx_salaire_employe_mois ON Salaire(employeId, mois, statut);
CREATE INDEX idx_conge_employe_dates ON Conge(employeId, dateDebut, dateFin);
CREATE INDEX idx_presence_employe_date ON Presence(employeId, datePresence);

-- ============================================
-- DONNÉES D'EXEMPLE
-- ============================================

-- Rôles
INSERT INTO Role (nomRole, description) VALUES
('ADMIN', 'Administrateur système'),
('RH', 'Responsable RH'),
('MANAGER', 'Manager de service'),
('EMPLOYE', 'Employé standard');

-- Permissions
INSERT INTO Permission (codePermission, description, module) VALUES
('USER_MANAGE', 'Gérer utilisateurs', 'Utilisateurs'),
('EMPLOYEE_MANAGE', 'Gérer employés', 'Employés'),
('SALARY_MANAGE', 'Gérer salaires', 'Paie'),
('LEAVE_APPROVE', 'Approuver congés', 'Congés');

-- Lier permissions à ADMIN
INSERT INTO RolePermission (roleId, permissionId)
SELECT 1, permissionId FROM Permission;

-- Utilisateur admin (mot de passe: Admin123!)
INSERT INTO Utilisateur (nom, prenom, email, motDePasse, roleId, statut) VALUES
('Admin', 'Système', 'admin@gestionrh.local', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 1, 'ACTIF');

-- Services
INSERT INTO Service (nomService, description, budget) VALUES
('Direction Générale', 'Direction de l''entreprise', 500000.00),
('Ressources Humaines', 'Gestion du personnel', 200000.00),
('Informatique', 'SI et infrastructure', 300000.00),
('Finance', 'Comptabilité', 250000.00),
('Commercial', 'Ventes', 400000.00);

-- ============================================
--  RÉACTIVER LES CONTRAINTES ET VÉRIFICATION
-- ============================================

SET FOREIGN_KEY_CHECKS = @OLD_FOREIGN_KEY_CHECKS;

-- Lien Service -> Responsable (doit être fait APRES la création des employés)

ALTER TABLE Service 
ADD CONSTRAINT fk_service_responsable 
FOREIGN KEY (responsableId) REFERENCES Employe(employeId) ON DELETE SET NULL;

-- ============================================
-- . VÉRIFICATION FINALE
-- ============================================

SELECT '✅ Base de données GestionRH_Academic créée avec succès!' AS Status,
(SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = 'GestionRH_Academic') AS Tables,
(SELECT COUNT(*) FROM information_schema.ROUTINES WHERE ROUTINE_SCHEMA = 'GestionRH_Academic' AND ROUTINE_TYPE = 'PROCEDURE') AS Procedures,
(SELECT COUNT(*) FROM information_schema.TRIGGERS WHERE TRIGGER_SCHEMA = 'GestionRH_Academic') AS Triggers,
(SELECT COUNT(*) FROM information_schema.VIEWS WHERE TABLE_SCHEMA = 'GestionRH_Academic') AS Vues;