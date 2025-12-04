// === Application RHorizon - Gestion des Ressources Humaines ===
// Fichier JavaScript principal pour la gestion de l'interface

// === Variables globales ===
let currentUser = null;
let employees = [];
let positions = [];
let leaves = [];
let attendance = [];
let payroll = [];
// Nouvelles structures de données
let roles = [];
let permissions = [];
let rolePermissions = []; // Association rôle-permission
let users = [];
let services = [];
let contracts = [];
let serviceAssignments = []; // Affectations de service
let auditLogs = [];

/**
 * Bascule entre les onglets Connexion et Inscription
 * Déclaré AVANT DOMContentLoaded pour être accessible immédiatement
 */
function switchAuthTab(tab) {
    console.log('switchAuthTab appelé avec:', tab);
    
    const loginTab = document.getElementById('login-tab');
    const signupTab = document.getElementById('signup-tab');
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (!loginTab || !signupTab || !loginForm || !signupForm) {
        console.error('Éléments non trouvés');
        // Réessayer après un court délai
        setTimeout(function() {
            switchAuthTab(tab);
        }, 100);
        return;
    }

    if (tab === 'login') {
        loginTab.classList.add('active');
        signupTab.classList.remove('active');
        loginForm.classList.add('active');
        signupForm.classList.remove('active');
        console.log('Onglet Connexion activé');
    } else if (tab === 'signup') {
        signupTab.classList.add('active');
        loginTab.classList.remove('active');
        signupForm.classList.add('active');
        loginForm.classList.remove('active');
        console.log('Onglet Inscription activé');
    }
}

/**
 * Gère le clic sur le bouton de connexion
 */
function handleLoginClick() {
    console.log('handleLoginClick appelé');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    
    if (!emailInput || !passwordInput) {
        alert('Erreur: Les champs de connexion ne sont pas disponibles');
        return;
    }
    
    const email = emailInput.value.trim();
    const password = passwordInput.value;

    if (!email || !password) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    handleLogin(email, password);
}

/**
 * Gère le clic sur le bouton d'inscription
 */
function handleSignupClick() {
    console.log('handleSignupClick appelé');
    const emailInput = document.getElementById('signup-email');
    const nameInput = document.getElementById('signup-name');
    const passwordInput = document.getElementById('signup-password');
    const passwordConfirmInput = document.getElementById('signup-password-confirm');
    
    if (!emailInput || !nameInput || !passwordInput || !passwordConfirmInput) {
        alert('Erreur: Les champs d\'inscription ne sont pas disponibles');
        return;
    }
    
    const email = emailInput.value.trim();
    const name = nameInput.value.trim();
    const password = passwordInput.value;
    const passwordConfirm = passwordConfirmInput.value;

    // Validation
    if (!email || !name || !password || !passwordConfirm) {
        alert('Veuillez remplir tous les champs');
        return;
    }

    if (password.length < 6) {
        alert('Le mot de passe doit contenir au moins 6 caractères');
        return;
    }

    if (password !== passwordConfirm) {
        alert('Les mots de passe ne correspondent pas');
        return;
    }

    handleSignup(email, name, password);
}

/**
 * Ouvre/ferme le menu paramètres (déclaré tôt pour être accessible)
 */
function toggleSettingsMenu() {
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu) {
        settingsMenu.classList.toggle('hidden');
    }
}

/**
 * Ferme le menu paramètres (déclaré tôt pour être accessible)
 */
function closeSettingsMenu() {
    const settingsMenu = document.getElementById('settings-menu');
    if (settingsMenu) {
        settingsMenu.classList.add('hidden');
    }
}

// Rendre les fonctions globales immédiatement
window.switchAuthTab = switchAuthTab;
window.handleLoginClick = handleLoginClick;
window.handleSignupClick = handleSignupClick;
window.toggleSettingsMenu = toggleSettingsMenu;
window.closeSettingsMenu = closeSettingsMenu;
window.showPage = showPage;
window.refreshEmployees = refreshEmployees;
window.refreshServices = refreshServices;
window.refreshContracts = refreshContracts;
window.refreshLeaves = refreshLeaves;
window.refreshAttendance = refreshAttendance;
window.refreshPayroll = refreshPayroll;

// === Initialisation ===
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

/**
 * Initialise l'application
 */
function initializeApp() {
    // Gestion de la connexion via Enter dans les champs
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');
    if (emailInput && passwordInput) {
        [emailInput, passwordInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleLoginClick();
                }
            });
        });
    }

    // Gestion de l'inscription via Enter dans les champs
    const signupEmailInput = document.getElementById('signup-email');
    const signupNameInput = document.getElementById('signup-name');
    const signupPasswordInput = document.getElementById('signup-password');
    const signupPasswordConfirmInput = document.getElementById('signup-password-confirm');
    if (signupEmailInput && signupNameInput && signupPasswordInput && signupPasswordConfirmInput) {
        [signupEmailInput, signupNameInput, signupPasswordInput, signupPasswordConfirmInput].forEach(input => {
            input.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSignupClick();
                }
            });
        });
    }

    // Gestion de la déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }

    // Fermer le menu paramètres en cliquant en dehors
    document.addEventListener('click', function(e) {
        const settingsDropdown = document.getElementById('settings-dropdown');
        const settingsBtn = document.getElementById('settings-btn');
        const settingsMenu = document.getElementById('settings-menu');
        
        if (settingsDropdown && settingsMenu && !settingsDropdown.contains(e.target)) {
            closeSettingsMenu();
        }
    });

    // Navigation dans le menu
    setupNavigation();

    // Gestion des modales
    setupModals();

    // Gestion des formulaires
    setupForms();

    // Chargement des données initiales (si utilisateur connecté)
    if (currentUser) {
        loadInitialData();
    }
    
    // Configuration des validations de dates
    setupDateValidations();
    
    // Mettre à jour le titre de la page initiale
    const activePage = document.querySelector('.page-content.active');
    if (activePage) {
        updatePageTitle(activePage.id);
    }

    // Mise à jour de l'heure en temps réel
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000);
}


/**
 * Gère la connexion
 */
async function handleLogin(email, password) {
    try {
        const result = await AuthAPI.login(email, password);
        
        if (result.success && result.data && result.data.user) {
            const user = result.data.user;
            currentUser = { 
                email: user.email, 
                name: user.name, 
                id: user.id,
                role: user.role
            };
            
            const loginPage = document.getElementById('login-page');
            const app = document.getElementById('app');
            
            if (loginPage) {
                loginPage.classList.remove('active');
                loginPage.classList.add('hidden');
            }
            if (app) {
                app.classList.remove('hidden');
            }
            
            // Mettre à jour les informations utilisateur dans le header
            updateUserInfo();
            updateSettingsMenuVisibility();
            
            // Charger les données après connexion
            await loadInitialData();
            
            // Réinitialiser le formulaire
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            if (emailInput) emailInput.value = '';
            if (passwordInput) passwordInput.value = '';
        }
    } catch (error) {
        alert('Erreur de connexion : ' + (error.message || 'Email ou mot de passe incorrect'));
    }
}


/**
 * Gère l'inscription
 */
async function handleSignup(email, name, password) {
    try {
        const result = await AuthAPI.signup(email, password, name);
        
        if (result.success) {
            alert('Inscription réussie ! Vous pouvez maintenant vous connecter.');
            
            // Bascule vers l'onglet connexion
            switchAuthTab('login');
            
            // Pré-remplir l'email dans le formulaire de connexion
            const emailLoginInput = document.getElementById('email');
            if (emailLoginInput) {
                emailLoginInput.value = email;
            }
            
            // Réinitialiser le formulaire d'inscription
            const signupForm = document.getElementById('signup-form');
            if (signupForm) {
                signupForm.reset();
            }
        }
    } catch (error) {
        alert('Erreur d\'inscription : ' + (error.message || 'Une erreur est survenue'));
    }
}

/**
 * Gère la déconnexion
 */
async function handleLogout() {
    if (confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
        try {
            await AuthAPI.logout();
        } catch (error) {
            console.error('Erreur déconnexion:', error);
        }
        
        currentUser = null;
        document.getElementById('app').classList.add('hidden');
        document.getElementById('login-page').classList.remove('hidden');
        document.getElementById('login-page').classList.add('active');
        document.getElementById('email').value = '';
        document.getElementById('password').value = '';
    }
}

/**
 * Configure la navigation entre les pages
 */
function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const targetPage = this.getAttribute('data-page');
            showPage(targetPage);
            
            // Mise à jour de l'état actif du menu
            navItems.forEach(nav => nav.classList.remove('active'));
            this.classList.add('active');
        });
    });
}

/**
 * Affiche une page spécifique
 */
function showPage(pageId) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(page => page.classList.remove('active'));
    
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
    }
    
    // Mettre à jour le titre de la page dans le header
    updatePageTitle(pageId);
    
    // Fermer le menu paramètres si ouvert
    closeSettingsMenu();
}

/**
 * Met à jour le titre de la page dans le header
 */
function updatePageTitle(pageId) {
    const pageTitles = {
        'dashboard': 'Tableau de bord',
        'services': 'Services',
        'employees': 'Employés',
        'contracts': 'Contrats',
        'positions': 'Postes',
        'leaves': 'Congés',
        'attendance': 'Présences',
        'payroll': 'Paie',
        'users': 'Utilisateurs',
        'roles': 'Rôles & Permissions',
        'audit': 'Audit Log'
    };
    
    const titleElement = document.getElementById('current-page-title');
    if (titleElement) {
        titleElement.textContent = pageTitles[pageId] || 'RHorizon';
    }
}

/**
 * Vérifie si l'utilisateur actuel est administrateur
 */
function isAdmin() {
    if (!currentUser) return false;
    
    // Vérifier le rôle depuis l'objet utilisateur
    const role = currentUser.role;
    if (role && (role === 'ADMIN' || role === 'Administrateur' || role.toLowerCase().includes('admin'))) {
        return true;
    }
    
    return false;
}

/**
 * Met à jour l'affichage du menu paramètres selon les droits
 */
function updateSettingsMenuVisibility() {
    const settingsDropdown = document.getElementById('settings-dropdown');
    if (settingsDropdown) {
        if (isAdmin()) {
            settingsDropdown.style.display = 'block';
        } else {
            settingsDropdown.style.display = 'none';
        }
    }
}

/**
 * Met à jour le nom de l'utilisateur dans le header
 */
function updateUserInfo() {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && currentUser) {
        userNameElement.textContent = currentUser.name || currentUser.email;
    }
}

/**
 * Applique un état de chargement sur un bouton
 */
function setButtonLoading(button, isLoading, loadingText = 'Patientez...') {
    if (!button) return;
    
    if (isLoading) {
        if (!button.dataset.originalText) {
            button.dataset.originalText = button.textContent;
        }
        button.textContent = loadingText;
        button.disabled = true;
        button.classList.add('is-loading');
    } else {
        if (button.dataset.originalText) {
            button.textContent = button.dataset.originalText;
        }
        button.disabled = false;
        button.classList.remove('is-loading');
    }
}

/**
 * Configure les modales
 */
function setupModals() {
    // Fermeture des modales
    document.querySelectorAll('.modal-close, .modal-cancel').forEach(btn => {
        btn.addEventListener('click', function() {
            closeAllModals();
        });
    });

    // Fermer en cliquant en dehors
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeAllModals();
            }
        });
    });

    // Boutons d'ouverture des modales
    const addEmployeeBtn = document.getElementById('add-employee-btn');
    if (addEmployeeBtn) {
        addEmployeeBtn.addEventListener('click', () => openModal('employee-modal', 'add'));
    }

    const addPositionBtn = document.getElementById('add-position-btn');
    if (addPositionBtn) {
        addPositionBtn.addEventListener('click', () => openModal('position-modal', 'add'));
    }

    const requestLeaveBtn = document.getElementById('request-leave-btn');
    if (requestLeaveBtn) {
        requestLeaveBtn.addEventListener('click', () => openModal('leave-modal'));
    }

    const generatePayslipBtn = document.getElementById('generate-payslip-btn');
    if (generatePayslipBtn) {
        generatePayslipBtn.addEventListener('click', () => {
            updateEmployeeSelects();
            openModal('payslip-modal');
        });
    }

    // Bouton d'ajout de pointage
    const addAttendanceBtn = document.getElementById('add-attendance-btn');
    if (addAttendanceBtn) {
        addAttendanceBtn.addEventListener('click', () => {
            updateEmployeeSelects();
            openModal('attendance-modal', 'add');
        });
    }
}

/**
 * Ouvre une modale
 */
function openModal(modalId, mode = 'add', data = null) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Mettre à jour les listes d'employés pour certaines modales
        if (modalId === 'payslip-modal' || modalId === 'leave-modal' || modalId === 'attendance-modal') {
            updateEmployeeSelects();
        }
        
        // Pré-remplir les formulaires si en mode édition
        if (mode === 'edit' && data) {
            fillModalForm(modalId, data);
        } else {
            clearModalForm(modalId);
        }
    }
}

/**
 * Ferme toutes les modales
 */
function closeAllModals() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
}

/**
 * Vide un formulaire de modale
 */
function clearModalForm(modalId) {
    const form = document.querySelector(`#${modalId} form`);
    if (form) {
        form.reset();
        // Réinitialiser les champs cachés
        const hiddenInputs = form.querySelectorAll('input[type="hidden"]');
        hiddenInputs.forEach(input => input.value = '');
    }
    
    // Réinitialiser les titres des modales
    if (modalId === 'employee-modal') {
        document.getElementById('employee-modal-title').textContent = 'Ajouter un employé';
    } else if (modalId === 'position-modal') {
        document.getElementById('position-modal-title').textContent = 'Ajouter un poste';
    } else if (modalId === 'attendance-modal') {
        document.getElementById('attendance-modal-title').textContent = 'Ajouter un pointage';
    }
}

/**
 * Remplit un formulaire de modale avec des données
 */
function fillModalForm(modalId, data) {
    if (modalId === 'employee-modal') {
        document.getElementById('employee-id').value = data.id || '';
        document.getElementById('employee-lastname').value = data.lastname || '';
        document.getElementById('employee-firstname').value = data.firstname || '';
        document.getElementById('employee-position').value = data.position || '';
        document.getElementById('employee-service').value = data.serviceId || '';
        document.getElementById('employee-salary').value = data.salary || '';
        document.getElementById('employee-contract').value = data.contract || '';
        document.getElementById('employee-hiredate').value = data.hiredate || '';
        document.getElementById('employee-departure-date').value = data.departureDate || '';
        document.getElementById('employee-birthplace').value = data.birthplace || '';
        document.getElementById('employee-marital-status').value = data.maritalStatus || '';
        document.getElementById('employee-children').value = data.childrenCount || 0;
        document.getElementById('employee-matricule').value = data.matricule || '';
        document.getElementById('employee-modal-title').textContent = 'Modifier un employé';
        
        // Mettre à jour les selects
        updateEmployeeServiceSelect();
        setTimeout(() => {
            document.getElementById('employee-service').value = data.serviceId || '';
        }, 100);
    } else if (modalId === 'position-modal') {
        document.getElementById('position-id').value = data.id || '';
        document.getElementById('position-title').value = data.title || '';
        document.getElementById('position-department').value = data.department || '';
        document.getElementById('position-salary-min').value = data.salaryMin || '';
        document.getElementById('position-salary-max').value = data.salaryMax || '';
        document.getElementById('position-modal-title').textContent = 'Modifier un poste';
    } else if (modalId === 'attendance-modal') {
        document.getElementById('attendance-id').value = data.id || '';
        document.getElementById('attendance-employee').value = data.employeeId || '';
        document.getElementById('attendance-date').value = data.date || '';
        document.getElementById('attendance-time-in').value = data.timeIn || '';
        document.getElementById('attendance-time-out').value = data.timeOut || '';
        document.getElementById('attendance-modal-title').textContent = 'Modifier un pointage';
    } else if (modalId === 'employee-modal') {
        // Générer le matricule si nouveau
        if (!data.id && typeof generateEmployeeMatricule === 'function') {
            document.getElementById('employee-matricule').value = generateEmployeeMatricule();
        }
    }
}

/**
 * Configure la validation des dates (griser les dates invalides)
 */
function setupDateValidations() {
    // Validation pour employés : date de départ >= date d'embauche
    const employeeHiredate = document.getElementById('employee-hiredate');
    const employeeDepartureDate = document.getElementById('employee-departure-date');
    
    if (employeeHiredate && employeeDepartureDate) {
        employeeHiredate.addEventListener('change', function() {
            if (this.value) {
                employeeDepartureDate.setAttribute('min', this.value);
            } else {
                employeeDepartureDate.removeAttribute('min');
            }
        });
        
        employeeDepartureDate.addEventListener('change', function() {
            if (employeeHiredate.value && this.value && this.value < employeeHiredate.value) {
                alert('La date de départ ne peut pas être antérieure à la date d\'embauche.');
                this.value = '';
            }
        });
    }
    
    // Validation pour contrats : date de fin >= date de début
    const contractStartDate = document.getElementById('contract-start-date');
    const contractEndDate = document.getElementById('contract-end-date');
    
    if (contractStartDate && contractEndDate) {
        contractStartDate.addEventListener('change', function() {
            if (this.value) {
                contractEndDate.setAttribute('min', this.value);
            } else {
                contractEndDate.removeAttribute('min');
            }
        });
        
        contractEndDate.addEventListener('change', function() {
            if (contractStartDate.value && this.value && this.value < contractStartDate.value) {
                alert('La date de fin ne peut pas être antérieure à la date de début.');
                this.value = '';
            }
        });
    }
    
    // Validation pour congés : date de fin >= date de début
    const leaveStartDate = document.getElementById('leave-start');
    const leaveEndDate = document.getElementById('leave-end');
    
    if (leaveStartDate && leaveEndDate) {
        leaveStartDate.addEventListener('change', function() {
            if (this.value) {
                leaveEndDate.setAttribute('min', this.value);
            } else {
                leaveEndDate.removeAttribute('min');
            }
        });
        
        leaveEndDate.addEventListener('change', function() {
            if (leaveStartDate.value && this.value && this.value < leaveStartDate.value) {
                alert('La date de fin ne peut pas être antérieure à la date de début.');
                this.value = '';
            }
        });
    }
}

/**
 * Configure les formulaires
 */
function setupForms() {
    // Formulaire employé
    const employeeForm = document.getElementById('employee-form');
    if (employeeForm) {
        employeeForm.addEventListener('submit', handleEmployeeSubmit);
    }
    
    // Configuration des validations de dates
    setupDateValidations();

    // Formulaire poste
    const positionForm = document.getElementById('position-form');
    if (positionForm) {
        positionForm.addEventListener('submit', handlePositionSubmit);
    }

    // Formulaire congé
    const leaveForm = document.getElementById('leave-form');
    if (leaveForm) {
        leaveForm.addEventListener('submit', handleLeaveSubmit);
    }

    // Formulaire bulletin de paie
    const payslipForm = document.getElementById('payslip-form');
    if (payslipForm) {
        payslipForm.addEventListener('submit', handlePayslipSubmit);
    }

    // Formulaire pointage
    const attendanceForm = document.getElementById('attendance-form');
    if (attendanceForm) {
        attendanceForm.addEventListener('submit', handleAttendanceSubmit);
        
        // Calculer le retard en temps réel
        const timeInInput = document.getElementById('attendance-time-in');
        if (timeInInput) {
            timeInInput.addEventListener('change', function() {
                const timeIn = this.value;
                if (timeIn && typeof calculateDelay === 'function') {
                    const delay = calculateDelay(timeIn);
                    const delayInfo = document.getElementById('attendance-delay-info');
                    const delayValue = document.getElementById('attendance-delay-value');
                    if (delay > 0 && delayInfo && delayValue) {
                        delayInfo.style.display = 'block';
                        delayValue.textContent = delay;
                    } else if (delayInfo) {
                        delayInfo.style.display = 'none';
                    }
                }
            });
        }
    }
    
    // Formulaire validation congé
    const leaveValidationForm = document.getElementById('leave-validation-form');
    if (leaveValidationForm) {
        leaveValidationForm.addEventListener('submit', handleLeaveValidation);
    }
    
    const leaveRejectBtn = document.getElementById('leave-reject-btn');
    if (leaveRejectBtn) {
        leaveRejectBtn.addEventListener('click', handleLeaveRejection);
    }
    
    // Afficher le solde de congés quand un employé est sélectionné
    const leaveEmployeeSelect = document.getElementById('leave-employee');
    if (leaveEmployeeSelect) {
        leaveEmployeeSelect.addEventListener('change', function() {
            const employeeId = this.value;
            if (employeeId && typeof calculateLeaveBalance === 'function') {
                const balance = calculateLeaveBalance(employeeId);
                const balanceInfo = document.getElementById('leave-balance-info');
                const balanceValue = document.getElementById('leave-balance-value');
                if (balanceInfo && balanceValue) {
                    balanceInfo.style.display = 'block';
                    balanceValue.textContent = balance;
                }
            }
        });
    }
    
    // Calculer le salaire net en temps réel dans le formulaire paie
    const payslipFormForPreview = document.getElementById('payslip-form');
    if (payslipFormForPreview) {
        const inputs = ['payslip-employee', 'payslip-bonus', 'payslip-deduction', 'payslip-overtime', 'payslip-advance'];
        inputs.forEach(inputId => {
            const input = document.getElementById(inputId);
            if (input) {
                input.addEventListener('change', calculatePayslipPreview);
            }
        });
    }
}

/**
 * Calcule l'aperçu du bulletin de paie
 */
function calculatePayslipPreview() {
    const employeeId = document.getElementById('payslip-employee').value;
    if (!employeeId) return;
    
    const employee = employees.find(emp => (emp.id || emp.employeId) == employeeId);
    if (!employee) return;
    
    const bonus = parseFloat(document.getElementById('payslip-bonus').value) || 0;
    const deduction = parseFloat(document.getElementById('payslip-deduction').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('payslip-overtime').value) || 0;
    const advance = parseFloat(document.getElementById('payslip-advance').value) || 0;
    
    const overtimeRate = 1.5;
    const baseSalary = employee.salary || employee.salaireBase || 0;
    const hourlyRate = baseSalary / 173.33;
    const overtimePay = hourlyRate * overtimeHours * overtimeRate;
    const grossSalary = baseSalary + bonus + overtimePay;
    
    const contributions = typeof calculateSocialContributions === 'function'
        ? calculateSocialContributions(baseSalary)
        : { total: baseSalary * 0.11 };
    
    const taxes = typeof calculateTaxes === 'function'
        ? calculateTaxes(grossSalary)
        : 0;
    
    const netSalary = grossSalary - contributions.total - taxes - deduction - advance;
    
    // Mettre à jour l'aperçu
    const contributionsEl = document.getElementById('payslip-contributions');
    const taxesEl = document.getElementById('payslip-taxes');
    const netEl = document.getElementById('payslip-net-preview');
    
    if (contributionsEl) contributionsEl.textContent = formatCurrency(contributions.total);
    if (taxesEl) taxesEl.textContent = formatCurrency(taxes);
    if (netEl) netEl.textContent = formatCurrency(netSalary);
}

/**
 * Gère la soumission du formulaire employé
 */
async function handleEmployeeSubmit(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('employee-id').value;
    const employeeData = {
        lastname: document.getElementById('employee-lastname').value,
        firstname: document.getElementById('employee-firstname').value,
        position: document.getElementById('employee-position').value,
        serviceId: document.getElementById('employee-service').value || null,
        salary: parseFloat(document.getElementById('employee-salary').value),
        contract: document.getElementById('employee-contract').value,
        hiredate: document.getElementById('employee-hiredate').value,
        departureDate: document.getElementById('employee-departure-date').value || null,
        birthplace: document.getElementById('employee-birthplace').value || null,
        maritalStatus: document.getElementById('employee-marital-status').value || null,
        childrenCount: parseInt(document.getElementById('employee-children').value) || 0
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, employeeId ? 'Mise à jour...' : 'Enregistrement...');
    
    try {
        if (employeeId) {
            await updateEmployee(employeeId, employeeData);
        } else {
            await addEmployee(employeeData);
        }
        
        await refreshEmployees(false);
        await refreshServices(false);
        await refreshContracts(false);
        
        closeAllModals();
        alert('Employé enregistré avec succès.');
    } catch (error) {
        console.error('Erreur lors de l\'enregistrement de l\'employé:', error);
        alert(error?.message ? `Impossible d'enregistrer l'employé : ${error.message}` : 'Impossible d\'enregistrer l\'employé.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Ajoute un employé
 */
async function addEmployee(data) {
    const payload = { ...data };
    if (!payload.matricule && typeof generateEmployeeMatricule === 'function') {
        payload.matricule = generateEmployeeMatricule();
    }
    await EmployeesAPI.create(payload);
}

/**
 * Met à jour un employé
 */
async function updateEmployee(id, data) {
    await EmployeesAPI.update(id, data);
}

/**
 * Gère la soumission du formulaire poste
 */
function handlePositionSubmit(e) {
    e.preventDefault();
    
    const positionId = document.getElementById('position-id').value;
    const positionData = {
        title: document.getElementById('position-title').value,
        department: document.getElementById('position-department').value,
        salaryMin: parseFloat(document.getElementById('position-salary-min').value),
        salaryMax: parseFloat(document.getElementById('position-salary-max').value)
    };

    if (positionId) {
        updatePosition(positionId, positionData);
    } else {
        addPosition(positionData);
    }

    closeAllModals();
    renderPositions();
    updateEmployeePositionSelect();
    updateDashboard();
}

/**
 * Ajoute un poste
 */
function addPosition(data) {
    const newPosition = {
        id: Date.now().toString(),
        ...data,
        employeeCount: 0
    };
    positions.push(newPosition);
    saveData('positions', positions);
    updateEmployeePositionSelect();
}

/**
 * Met à jour un poste
 */
function updatePosition(id, data) {
    const index = positions.findIndex(pos => pos.id === id);
    if (index !== -1) {
        positions[index] = { ...positions[index], ...data };
        saveData('positions', positions);
        updateEmployeePositionSelect();
    }
}

/**
 * Gère la soumission du formulaire congé
 */
async function handleLeaveSubmit(e) {
    e.preventDefault();
    
    const startValue = document.getElementById('leave-start').value;
    const endValue = document.getElementById('leave-end').value;
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    const daysDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const leaveData = {
        employeId: document.getElementById('leave-employee').value,
        type: document.getElementById('leave-type').value,
        startDate: startValue,
        endDate: endValue,
        reason: document.getElementById('leave-reason').value,
        days: daysDiff
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Enregistrement...');

    try {
        await LeavesAPI.create(leaveData);
        await refreshLeaves();
        closeAllModals();
        alert('La demande de congé a été enregistrée.');
    } catch (error) {
        console.error('Erreur lors de la création du congé:', error);
        alert(error?.message ? `Impossible d'enregistrer le congé : ${error.message}` : 'Impossible d\'enregistrer le congé.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Gère la soumission du formulaire bulletin de paie
 */
function handlePayslipSubmit(e) {
    e.preventDefault();
    
    const employeeId = document.getElementById('payslip-employee').value;
    const employee = employees.find(emp => (emp.id || emp.employeId) == employeeId);
    if (!employee) {
        alert('Employé non trouvé. Veuillez sélectionner un employé valide.');
        return;
    }

    const bonus = parseFloat(document.getElementById('payslip-bonus').value) || 0;
    const deduction = parseFloat(document.getElementById('payslip-deduction').value) || 0;
    const overtimeHours = parseFloat(document.getElementById('payslip-overtime').value) || 0;
    const advance = parseFloat(document.getElementById('payslip-advance').value) || 0;
    const status = document.getElementById('payslip-status').value;
    
    const overtimeRate = 1.5; // Taux heures supplémentaires
    const baseSalary = employee.salary || employee.salaireBase || 0;
    const hourlyRate = baseSalary / 173.33; // 173.33h = moyenne mensuelle
    const overtimePay = hourlyRate * overtimeHours * overtimeRate;
    
    // Calculer les cotisations
    const contributions = typeof calculateSocialContributions === 'function'
        ? calculateSocialContributions(baseSalary)
        : { total: baseSalary * 0.11 }; // 11% par défaut
    
    // Calculer les impôts
    const grossSalary = baseSalary + bonus + overtimePay;
    const taxes = typeof calculateTaxes === 'function'
        ? calculateTaxes(grossSalary)
        : 0;
    
    const netSalary = grossSalary - contributions.total - taxes - deduction - advance;

    // Générer le numéro de bulletin
    const period = document.getElementById('payslip-period').value;
    const year = period.split('-')[0];
    const month = period.split('-')[1];
    const count = payroll.filter(p => p.period === period).length;
    const payslipNumber = `BULL-${year}${month}-${String(count + 1).padStart(4, '0')}`;

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Génération...');
    
    try {
        const response = await PayrollAPI.create({
            employeId: employeeId,
            period,
            baseSalary,
            bonus,
            deduction,
            overtimeHours,
            advance,
            status
        });
        
        const created = response?.data;
        await refreshPayroll(false);
        closeAllModals();
        
        const pdfPayslip = created ? {
            employeeId: created.employeId || employeeId,
            employeeName: created.employeeName || `${employee.firstname || employee.prenom || ''} ${employee.lastname || employee.nom || ''}`.trim(),
            period: created.period || period,
            payslipNumber: created.payslipNumber || payslipNumber,
            baseSalary: created.baseSalary ?? baseSalary,
            bonus: created.bonus ?? bonus,
            deduction: created.deduction ?? deduction,
            advance: created.advance ?? advance,
            overtimeHours: created.overtimeHours ?? overtimeHours,
            overtimePay: created.overtimePay ?? overtimePay,
            contributions: created.contributions ?? contributions.total,
            taxes: created.taxes ?? taxes,
            grossSalary: created.grossSalary ?? grossSalary,
            netSalary: created.netSalary ?? netSalary,
            status: created.status || status
        } : {
            employeeId,
            employeeName: `${employee.firstname || employee.prenom || ''} ${employee.lastname || employee.nom || ''}`.trim(),
            period,
            payslipNumber,
            baseSalary,
            bonus,
            deduction,
            advance,
            overtimeHours,
            overtimePay,
            contributions: contributions.total,
            taxes,
            grossSalary,
            netSalary,
            status
        };
        
        generatePayslipPDF(pdfPayslip, employee);
        alert('Bulletin généré avec succès.');
    } catch (error) {
        console.error('Erreur paie:', error);
        alert(error?.message ? `Impossible de créer le bulletin : ${error.message}` : 'Impossible de créer le bulletin.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Gère la soumission du formulaire de pointage
 */
async function handleAttendanceSubmit(e) {
    e.preventDefault();
    
    const attendanceId = document.getElementById('attendance-id').value;
    const employeeId = document.getElementById('attendance-employee').value;
    const date = document.getElementById('attendance-date').value;
    const timeIn = document.getElementById('attendance-time-in').value;
    const timeOut = document.getElementById('attendance-time-out').value;
    const delayJustification = document.getElementById('attendance-delay-justification').value || null;

    // Calculer les heures travaillées
    const timeInParts = timeIn.split(':');
    const timeOutParts = timeOut.split(':');
    const inMinutes = parseInt(timeInParts[0]) * 60 + parseInt(timeInParts[1]);
    const outMinutes = parseInt(timeOutParts[0]) * 60 + parseInt(timeOutParts[1]);
    const totalMinutes = outMinutes - inMinutes;
    
    if (totalMinutes < 0) {
        alert('L\'heure de départ doit être après l\'heure d\'arrivée');
        return;
    }

    const hoursWorked = (totalMinutes / 60).toFixed(2);
    const overtimeHours = Math.max(0, parseFloat(hoursWorked) - 8).toFixed(2);

    // Calculer le retard
    const delayMinutes = typeof calculateDelay === 'function' 
        ? calculateDelay(timeIn, '08:00') 
        : 0;

    // Récupérer le nom de l'employé
    const employee = employees.find(emp => emp.id === employeeId);
    const employeeName = employee ? `${employee.firstname} ${employee.lastname}` : 'Inconnu';

    const payload = {
        employeId: employeeId,
        date: date,
        timeIn: timeIn,
        timeOut: timeOut,
        justification: delayJustification,
        hoursWorked: parseFloat(hoursWorked),
        overtimeHours: parseFloat(overtimeHours),
        delayMinutes: delayMinutes
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, attendanceId ? 'Mise à jour...' : 'Enregistrement...');

    try {
        if (attendanceId) {
            await AttendanceAPI.update(attendanceId, payload);
        } else {
            await AttendanceAPI.create(payload);
        }
        
        await refreshAttendance();
        closeAllModals();
        alert('Pointage enregistré avec succès.');
    } catch (error) {
        console.error('Erreur pointage:', error);
        alert(error?.message ? `Impossible d'enregistrer le pointage : ${error.message}` : 'Impossible d\'enregistrer le pointage.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Met à jour l'heure actuelle
 */
function updateCurrentTime() {
    const timeElement = document.getElementById('current-time');
    if (timeElement) {
        const now = new Date();
        timeElement.textContent = now.toLocaleTimeString('fr-FR');
    }
}


/**
 * Charge les données initiales
 */
async function loadInitialData() {
    try {
        // Charger depuis les APIs
        const [employeesRes, servicesRes, contractsRes, leavesRes, attendanceRes, payrollRes] = await Promise.all([
            EmployeesAPI.getAll('ACTIF').catch(() => ({ success: true, data: [] })),
            ServicesAPI.getAll().catch(() => ({ success: true, data: [] })),
            ContractsAPI.getAll('ACTIF').catch(() => ({ success: true, data: [] })),
            LeavesAPI.getAll().catch(() => ({ success: true, data: [] })),
            AttendanceAPI.getAll().catch(() => ({ success: true, data: [] })),
            PayrollAPI.getAll().catch(() => ({ success: true, data: [] }))
        ]);
        
        applyEmployeesData(employeesRes.data || []);
        applyServicesData(servicesRes.data || []);
        applyContractsData(contractsRes.data || []);
        applyLeavesData(leavesRes.data || []);
        applyAttendanceData(attendanceRes.data || []);
        applyPayrollData(payrollRes.data || []);
        
        // Charger les postes depuis localStorage (temporaire, à migrer si nécessaire)
        positions = loadData('positions') || getDefaultPositions();
        renderPositions();
        
        // Générer le matricule pour le formulaire employé
        const employeeModal = document.getElementById('employee-modal');
        if (employeeModal) {
            const addBtn = document.getElementById('add-employee-btn');
            if (addBtn) {
                addBtn.addEventListener('click', function() {
                    if (typeof generateEmployeeMatricule === 'function') {
                        setTimeout(() => {
                            const matriculeField = document.getElementById('employee-matricule');
                            if (matriculeField && !matriculeField.value) {
                                matriculeField.value = generateEmployeeMatricule();
                            }
                        }, 100);
                    }
                });
            }
        }
    } catch (error) {
        console.error('Erreur lors du chargement des données:', error);
        // Fallback sur localStorage si API échoue
        applyEmployeesData(loadData('employees') || getDefaultEmployees());
        positions = loadData('positions') || getDefaultPositions();
        renderPositions();
        applyLeavesData(loadData('leaves') || []);
        applyAttendanceData(loadData('attendance') || []);
        applyPayrollData(loadData('payroll') || []);
        applyServicesData(loadData('services') || []);
        applyContractsData(loadData('contracts') || []);
    }
}

function applyEmployeesData(list = []) {
    employees = list;
    saveData('employees', employees);
    renderEmployees();
    updateEmployeePositionSelect();
    updateEmployeeServiceSelect();
    updateEmployeeSelects();
    updateDashboard();
}

function applyServicesData(list = []) {
    services = (list || []).map(service => ({
        id: service.id || service.serviceId,
        name: service.name || service.nomService,
        description: service.description || '',
        managerId: service.managerId || service.responsableId || null,
        managerName: service.responsableNom || '',
        budget: parseFloat(service.budget ?? 0),
        effectif: service.effectif ?? 0,
        ancienneteMoyenne: service.ancienneteMoyenne ?? 0
    }));
    saveData('services', services);
    if (typeof renderServices === 'function') renderServices();
}

function applyContractsData(list = []) {
    contracts = (list || []).map(contract => ({
        id: contract.id || contract.contratId,
        number: contract.number || contract.numeroContrat,
        employeeId: contract.employeeId || contract.employeId,
        employeeName: contract.employeeName || contract.nomEmploye,
        type: contract.type || contract.typeContrat,
        startDate: contract.startDate || contract.dateDebut,
        endDate: contract.endDate || contract.dateFin,
        baseSalary: parseFloat(contract.baseSalary ?? contract.salaireBase ?? 0),
        status: contract.status || contract.statut || 'ACTIF'
    }));
    saveData('contracts', contracts);
    if (typeof renderContracts === 'function') renderContracts();
}

function applyLeavesData(list = []) {
    const statusMap = {
        'pending': 'pending',
        'en_attente': 'pending',
        'en attente': 'pending',
        'approved': 'approved',
        'approuve': 'approved',
        'valide': 'approved',
        'rejected': 'rejected',
        'refuse': 'rejected'
    };
    leaves = (list || []).map(leave => ({
        id: leave.id || leave.congeId,
        employeeId: leave.employeeId || leave.employeId,
        employeeName: leave.employeeName || leave.nomEmploye,
        type: leave.type || leave.typeConge || 'ANNUEL',
        startDate: leave.startDate || leave.dateDebut,
        endDate: leave.endDate || leave.dateFin,
        days: leave.days ?? leave.nombreJours ?? 0,
        reason: leave.reason || leave.motif || '',
        status: statusMap[(leave.status || leave.statut || '').toLowerCase()] || 'pending',
        validator: leave.validator || leave.nomValidateur || null,
        validationComment: leave.validationComment || leave.commentaireValidation || '',
        validatedAt: leave.validatedAt || leave.dateValidation || null
    }));
    saveData('leaves', leaves);
    renderLeaves();
    updateDashboard();
}

function applyAttendanceData(list = []) {
    attendance = (list || []).map(record => ({
        id: record.id || record.presenceId,
        employeeId: record.employeeId || record.employeId,
        employeeName: record.employeeName || record.nomEmploye,
        date: record.date || record.datePresence,
        timeIn: record.timeIn || record.heureArrivee,
        timeOut: record.timeOut || record.heureDepart,
        hoursWorked: parseFloat(record.hoursWorked ?? record.heuresTravaillees ?? 0),
        overtimeHours: parseFloat(record.overtimeHours ?? record.heuresSupplementaires ?? 0),
        delayMinutes: parseInt(record.delayMinutes ?? record.retardMinutes ?? 0, 10),
        delayJustification: record.delayJustification || record.justification || record.justificationRetard || '',
        status: record.status || record.statut || 'PRESENT'
    }));
    saveData('attendance', attendance);
    renderAttendance();
    updateDashboard();
}

function applyPayrollData(list = []) {
    payroll = (list || []).map(item => ({
        id: item.id || item.salaireId,
        employeeId: item.employeeId || item.employeId,
        employeeName: item.employeeName || item.nomEmploye,
        period: item.period || item.mois || '',
        baseSalary: parseFloat(item.baseSalary ?? item.salaireBase ?? 0),
        netSalary: parseFloat(item.netSalary ?? item.salaireNet ?? 0),
        grossSalary: parseFloat(item.grossSalary ?? item.salaireTotal ?? 0),
        bonus: parseFloat(item.bonus ?? item.totalPrimes ?? 0),
        deduction: parseFloat(item.deduction ?? item.totalDeductions ?? 0),
        overtimeHours: parseFloat(item.overtimeHours ?? item.heuresSupplementaires ?? 0),
        contributions: parseFloat(item.contributions ?? item.cotisations ?? 0),
        taxes: parseFloat(item.taxes ?? item.impots ?? 0),
        status: item.status || item.statut || 'BROUILLON',
        payslipNumber: item.payslipNumber || item.numeroBulletin || '',
        createdAt: item.createdAt || null
    }));
    saveData('payroll', payroll);
    renderPayroll();
    updateDashboard();
}

async function refreshEmployees(showError = true) {
    try {
        const response = await EmployeesAPI.getAll('ACTIF');
        applyEmployeesData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des employés:', error);
        if (showError) alert('Impossible de rafraîchir la liste des employés.');
        return false;
    }
}

async function refreshServices(showError = true) {
    try {
        const response = await ServicesAPI.getAll();
        applyServicesData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des services:', error);
        if (showError) alert('Impossible de rafraîchir la liste des services.');
        return false;
    }
}

async function refreshContracts(showError = true) {
    try {
        const response = await ContractsAPI.getAll('ACTIF');
        applyContractsData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des contrats:', error);
        if (showError) alert('Impossible de rafraîchir la liste des contrats.');
        return false;
    }
}

async function refreshLeaves(showError = true) {
    try {
        const response = await LeavesAPI.getAll();
        applyLeavesData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des congés:', error);
        if (showError) alert('Impossible de rafraîchir la liste des congés.');
        return false;
    }
}

async function refreshAttendance(showError = true) {
    try {
        const response = await AttendanceAPI.getAll();
        applyAttendanceData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement des pointages:', error);
        if (showError) alert('Impossible de rafraîchir les pointages.');
        return false;
    }
}

async function refreshPayroll(showError = true) {
    try {
        const response = await PayrollAPI.getAll();
        applyPayrollData(response.data || []);
        return true;
    } catch (error) {
        console.error('Erreur lors du rafraîchissement de la paie:', error);
        if (showError) alert('Impossible de rafraîchir les bulletins de paie.');
        return false;
    }
}

/**
 * Données d'exemple pour les rôles
 */
function getDefaultRoles() {
    return [
        {
            id: '1',
            name: 'Administrateur',
            description: 'Accès complet au système',
            permissions: [],
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            name: 'Responsable RH',
            description: 'Gestion des ressources humaines',
            permissions: [],
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Données d'exemple pour les permissions
 */
function getDefaultPermissions() {
    return [
        {
            id: '1',
            name: 'employees.create',
            description: 'Créer un employé',
            createdAt: new Date().toISOString()
        },
        {
            id: '2',
            name: 'employees.update',
            description: 'Modifier un employé',
            createdAt: new Date().toISOString()
        },
        {
            id: '3',
            name: 'employees.delete',
            description: 'Supprimer un employé',
            createdAt: new Date().toISOString()
        },
        {
            id: '4',
            name: 'payroll.create',
            description: 'Créer un bulletin de paie',
            createdAt: new Date().toISOString()
        },
        {
            id: '5',
            name: 'leaves.validate',
            description: 'Valider les congés',
            createdAt: new Date().toISOString()
        }
    ];
}

/**
 * Données d'exemple pour les employés
 */
function getDefaultEmployees() {
    return [
        {
            id: '1',
            lastname: 'K.N',
            firstname: 'Oceane',
            position: 'Développeur Full Stack',
            salary: 2000000,
            contract: 'CDI',
            hiredate: '2022-01-15',
            status: 'active'
        },
        {
            id: '2',
            lastname: 'Maka',
            firstname: 'Reina',
            position: 'Chef de projet',
            salary: 2500000,
            contract: 'CDI',
            hiredate: '2021-03-20',
            status: 'active'
        }
    ];
}

/**
 * Données d'exemple pour les postes
 */
function getDefaultPositions() {
    return [
        {
            id: '1',
            title: 'Développeur Full Stack',
            department: 'IT',
            salaryMin: 1800000,
            salaryMax: 2500000,
            employeeCount: 1
        },
        {
            id: '2',
            title: 'Chef de projet',
            department: 'Management',
            salaryMin: 2200000,
            salaryMax: 3000000,
            employeeCount: 1
        },
        {
            id: '3',
            title: 'Responsable RH',
            department: 'RH',
            salaryMin: 2000000,
            salaryMax: 2800000,
            employeeCount: 0
        }
    ];
}

/**
 * Rend la liste des employés
 */
function renderEmployees() {
    const tbody = document.getElementById('employees-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    employees.forEach(employee => {
        if (employee.status === 'suspended') return; // Ne pas afficher les employés suspendus

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${employee.lastname}</td>
            <td>${employee.firstname}</td>
            <td>${employee.position}</td>
            <td>${formatCurrency(employee.salary)}</td>
            <td><span class="badge badge-info">${employee.contract}</span></td>
            <td>${formatDate(employee.hiredate)}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editEmployee('${employee.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="suspendEmployee('${employee.id}')">Suspendre</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Rend la liste des postes
 */
function renderPositions() {
    const tbody = document.getElementById('positions-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    positions.forEach(position => {
        // Compter les employés pour ce poste
        const empCount = employees.filter(emp => emp.position === position.title && emp.status === 'active').length;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${position.title}</td>
            <td>${position.department}</td>
            <td>${formatCurrency(position.salaryMin)}</td>
            <td>${formatCurrency(position.salaryMax)}</td>
            <td>${empCount}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editPosition('${position.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePosition('${position.id}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Rend la liste des congés
 */
function renderLeaves() {
    const tbody = document.getElementById('leaves-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    leaves.forEach(leave => {
        const statusBadge = getLeaveStatusBadge(leave.status);
        
        const row = document.createElement('tr');
        const validatorInfo = leave.validator 
            ? `<small style="display: block; color: var(--text-secondary); font-size: 11px;">Validé par: ${leave.validator}</small>`
            : '';
        
        row.innerHTML = `
            <td>${leave.employeeName}</td>
            <td>${leave.type}</td>
            <td>${formatDate(leave.startDate)}</td>
            <td>${formatDate(leave.endDate)}</td>
            <td>${leave.days} jour(s)</td>
            <td>${statusBadge}${validatorInfo}</td>
            <td>
                <div class="table-actions">
                    ${leave.status === 'pending' ? `
                        <button class="btn btn-success btn-sm" onclick="approveLeave('${leave.id}')">Valider</button>
                        <button class="btn btn-danger btn-sm" onclick="rejectLeave('${leave.id}')">Refuser</button>
                    ` : leave.status === 'approved' && leave.validationComment ? `
                        <button class="btn btn-info btn-sm" onclick="showLeaveComment('${leave.id}')">Voir commentaire</button>
                    ` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Affiche le commentaire de validation d'un congé
 */
function showLeaveComment(id) {
    const leave = leaves.find(l => l.id === id);
    if (leave && leave.validationComment) {
        alert(`Commentaire de validation:\n\n${leave.validationComment}\n\nValidé par: ${leave.validator || 'N/A'}\nDate: ${leave.validatedAt ? formatDateTime(leave.validatedAt) : 'N/A'}`);
    }
}

/**
 * Rend la liste des pointages
 */
function renderAttendance() {
    const tbody = document.getElementById('attendance-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Trier par date décroissante
    const sortedAttendance = [...attendance].sort((a, b) => new Date(b.date) - new Date(a.date));

    sortedAttendance.forEach(att => {
        const row = document.createElement('tr');
        const delayBadge = att.delayMinutes > 0 
            ? `<span class="badge badge-warning">${att.delayMinutes} min</span>`
            : '<span class="badge badge-success">À l\'heure</span>';
        
        row.innerHTML = `
            <td>${formatDate(att.date)}</td>
            <td>${att.employeeName || 'Inconnu'}</td>
            <td>${att.timeIn || '-'}</td>
            <td>${att.timeOut || '-'}</td>
            <td>${delayBadge}</td>
            <td>${att.hoursWorked > 0 ? att.hoursWorked.toFixed(2) + 'h' : '-'}</td>
            <td>${att.overtimeHours > 0 ? att.overtimeHours.toFixed(2) + 'h' : '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editAttendance('${att.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteAttendance('${att.id}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Rend la liste des bulletins de paie
 */
function renderPayroll() {
    const tbody = document.getElementById('payroll-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Trier par période décroissante
    const sortedPayroll = [...payroll].sort((a, b) => b.period.localeCompare(a.period));

    sortedPayroll.forEach(payslip => {
        const statusBadge = getPayslipStatusBadge(payslip.status || 'BROUILLON');
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${payslip.employeeName}</td>
            <td>${formatPeriod(payslip.period)}</td>
            <td>${formatCurrency(payslip.baseSalary)}</td>
            <td>${formatCurrency(payslip.bonus || 0)}</td>
            <td>${formatCurrency(payslip.deduction || 0)}</td>
            <td>${payslip.overtimeHours || 0}h</td>
            <td><strong>${formatCurrency(payslip.netSalary)}</strong></td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="downloadPayslip('${payslip.id}')">Télécharger PDF</button>
                    ${payslip.status === 'BROUILLON' ? `<button class="btn btn-success btn-sm" onclick="validatePayslip('${payslip.id}')">Valider</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Génère un badge de statut pour les bulletins
 */
function getPayslipStatusBadge(status) {
    const badges = {
        'BROUILLON': '<span class="badge badge-warning">BROUILLON</span>',
        'VALIDE': '<span class="badge badge-info">VALIDE</span>',
        'PAYE': '<span class="badge badge-success">PAYE</span>'
    };
    return badges[status] || status;
}

/**
 * Valide un bulletin de paie
 */
async function validatePayslip(id) {
    try {
        await PayrollAPI.validate(id);
        await refreshPayroll();
        alert('Bulletin validé.');
    } catch (error) {
        console.error('Erreur validation paie:', error);
        alert(error?.message ? `Impossible de valider le bulletin : ${error.message}` : 'Impossible de valider le bulletin.');
    }
}

/**
 * Met à jour le tableau de bord
 */
function updateDashboard() {
    // Nombre d'employés
    const activeEmployees = employees.filter(emp => emp.status === 'active').length;
    document.getElementById('stat-employees').textContent = activeEmployees;

    // Absences en cours
    const today = new Date().toISOString().split('T')[0];
    const activeAbsences = leaves.filter(leave => {
        return leave.status === 'approved' && 
               leave.startDate <= today && 
               leave.endDate >= today;
    }).length;
    document.getElementById('stat-absences').textContent = activeAbsences;

    // Heures supplémentaires
    const totalOvertime = attendance.reduce((sum, att) => sum + (att.overtimeHours || 0), 0);
    document.getElementById('stat-overtime').textContent = totalOvertime.toFixed(1) + 'h';

    // Alertes RH
    const alerts = getAlerts();
    document.getElementById('stat-alerts').textContent = alerts.length;
    renderAlerts(alerts);
    
    // Mettre à jour avec les statistiques avancées si disponible
    if (typeof getMonthlyStats === 'function') {
        const stats = getMonthlyStats();
        // Les stats peuvent être utilisées pour enrichir le dashboard
        // Par exemple, afficher la masse salariale mensuelle, etc.
    }
}

/**
 * Affiche la modale avec la liste des employés
 */
function showEmployeesModal() {
    const tbody = document.getElementById('employees-detail-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    const activeEmployeesList = employees.filter(emp => emp.status === 'active');
    
    if (activeEmployeesList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 24px; color: var(--text-secondary);">Aucun employé actif</td></tr>';
    } else {
        activeEmployeesList.forEach(employee => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${employee.lastname}</td>
                <td>${employee.firstname}</td>
                <td>${employee.position}</td>
                <td>${formatCurrency(employee.salary)}</td>
                <td><span class="badge badge-info">${employee.contract}</span></td>
                <td>${formatDate(employee.hiredate)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    openModal('employees-detail-modal');
}

/**
 * Affiche la modale avec les absences en cours
 */
function showAbsencesModal() {
    const content = document.getElementById('absences-detail-content');
    if (!content) return;

    const today = new Date().toISOString().split('T')[0];
    const activeAbsencesList = leaves.filter(leave => {
        return leave.status === 'approved' && 
               leave.startDate <= today && 
               leave.endDate >= today;
    });

    if (activeAbsencesList.length === 0) {
        content.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-secondary);">Aucune absence en cours</p>';
    } else {
        let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
        activeAbsencesList.forEach(leave => {
            html += `
                <div style="padding: 16px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid var(--primary-color);">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                        <div>
                            <strong style="font-size: 16px; color: var(--text-primary);">${leave.employeeName}</strong>
                            <p style="margin: 4px 0; color: var(--text-secondary); font-size: 14px;">${leave.type}</p>
                        </div>
                        <span class="badge badge-success">En cours</span>
                    </div>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 12px; font-size: 14px;">
                        <div>
                            <strong>Date début :</strong> ${formatDate(leave.startDate)}
                        </div>
                        <div>
                            <strong>Date fin :</strong> ${formatDate(leave.endDate)}
                        </div>
                        <div style="grid-column: 1 / -1;">
                            <strong>Durée :</strong> ${leave.days} jour(s)
                        </div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
        content.innerHTML = html;
    }

    openModal('absences-detail-modal');
}

/**
 * Affiche la modale avec les détails des heures supplémentaires
 */
function showOvertimeModal() {
    const tbody = document.getElementById('overtime-detail-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    // Filtrer les pointages avec heures supplémentaires
    const overtimeList = attendance.filter(att => att.overtimeHours > 0);
    
    if (overtimeList.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center; padding: 24px; color: var(--text-secondary);">Aucune heure supplémentaire enregistrée</td></tr>';
    } else {
        // Trier par date décroissante
        const sortedOvertime = [...overtimeList].sort((a, b) => new Date(b.date) - new Date(a.date));
        
        sortedOvertime.forEach(att => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${formatDate(att.date)}</td>
                <td>${att.employeeName || 'Inconnu'}</td>
                <td>${att.hoursWorked > 0 ? att.hoursWorked.toFixed(2) + 'h' : '-'}</td>
                <td><strong style="color: var(--warning-color);">${att.overtimeHours.toFixed(2)}h</strong></td>
            `;
            tbody.appendChild(row);
        });

        // Ajouter une ligne de total
        const totalOvertime = overtimeList.reduce((sum, att) => sum + (att.overtimeHours || 0), 0);
        const totalRow = document.createElement('tr');
        totalRow.style.cssText = 'background: rgba(255, 193, 7, 0.1); font-weight: 600;';
        totalRow.innerHTML = `
            <td colspan="3" style="text-align: right; padding: 16px;"><strong>Total :</strong></td>
            <td style="padding: 16px;"><strong style="color: var(--warning-color);">${totalOvertime.toFixed(2)}h</strong></td>
        `;
        tbody.appendChild(totalRow);
    }

    openModal('overtime-detail-modal');
}

/**
 * Affiche la modale avec les détails des alertes RH
 */
function showAlertsModal() {
    const content = document.getElementById('alerts-detail-content');
    if (!content) return;

    const alerts = getAlerts();

    if (alerts.length === 0) {
        content.innerHTML = '<p style="text-align: center; padding: 24px; color: var(--text-secondary);">Aucune alerte pour le moment</p>';
    } else {
        let html = '<div style="display: flex; flex-direction: column; gap: 16px;">';
        alerts.forEach(alert => {
            const alertClass = `alert-item ${alert.type}`;
            html += `
                <div class="${alertClass}" style="padding: 16px; border-radius: 8px;">
                    <div class="alert-item-content">
                        <div class="alert-item-title" style="font-size: 16px; font-weight: 600; margin-bottom: 8px;">${alert.title}</div>
                        <div class="alert-item-date" style="font-size: 14px; color: var(--text-secondary);">Date : ${alert.date}</div>
                        ${alert.description ? `<div style="margin-top: 8px; font-size: 14px; color: var(--text-primary);">${alert.description}</div>` : ''}
                    </div>
                </div>
            `;
        });
        html += '</div>';
        content.innerHTML = html;
    }

    openModal('alerts-detail-modal');
}

/**
 * Génère les alertes RH
 */
function getAlerts() {
    const alerts = [];
    const today = new Date();
    const nextMonth = new Date(today);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    // Congés en attente de validation
    const pendingLeaves = leaves.filter(leave => leave.status === 'pending');
    if (pendingLeaves.length > 0) {
        const leavesDetail = pendingLeaves.map(leave => `${leave.employeeName}`).join(', ');
        alerts.push({
            type: 'warning',
            title: `${pendingLeaves.length} demande(s) de congé en attente`,
            date: today.toLocaleDateString('fr-FR'),
            description: `Employés concernés : ${leavesDetail}`
        });
    }

    // Contrats expirant (exemple : CDD)
    employees.forEach(emp => {
        if (emp.contract === 'CDD') {
            const hireDate = new Date(emp.hiredate);
            const contractEnd = new Date(hireDate);
            contractEnd.setMonth(contractEnd.getMonth() + 6); // Exemple : CDD de 6 mois
            
            if (contractEnd >= today && contractEnd <= nextMonth) {
                const daysLeft = Math.ceil((contractEnd - today) / (1000 * 60 * 60 * 24));
                alerts.push({
                    type: 'danger',
                    title: `Contrat de ${emp.firstname} ${emp.lastname} expire bientôt`,
                    date: contractEnd.toLocaleDateString('fr-FR'),
                    description: `Date d'expiration : ${contractEnd.toLocaleDateString('fr-FR')} (${daysLeft} jour(s) restant(s))`
                });
            }
        }
    });

    // Employés avec beaucoup d'heures supplémentaires
    const employeeOvertime = {};
    attendance.forEach(att => {
        if (att.overtimeHours > 0 && att.employeeId) {
            if (!employeeOvertime[att.employeeId]) {
                employeeOvertime[att.employeeId] = { name: att.employeeName, total: 0 };
            }
            employeeOvertime[att.employeeId].total += att.overtimeHours;
        }
    });

    Object.keys(employeeOvertime).forEach(empId => {
        if (employeeOvertime[empId].total > 20) { // Plus de 20h d'heures sup
            alerts.push({
                type: 'info',
                title: `${employeeOvertime[empId].name} a beaucoup d'heures supplémentaires`,
                date: today.toLocaleDateString('fr-FR'),
                description: `Total : ${employeeOvertime[empId].total.toFixed(2)}h - À vérifier pour la paie`
            });
        }
    });

    return alerts;
}

/**
 * Rend les alertes
 */
function renderAlerts(alerts) {
    const alertsList = document.getElementById('alerts-list');
    if (!alertsList) return;

    alertsList.innerHTML = '';

    if (alerts.length === 0) {
        alertsList.innerHTML = '<p style="color: var(--text-secondary); padding: 16px;">Aucune alerte pour le moment</p>';
        return;
    }

    alerts.forEach(alert => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert-item ${alert.type}`;
        alertDiv.innerHTML = `
            <div class="alert-item-content">
                <div class="alert-item-title">${alert.title}</div>
                <div class="alert-item-date">${alert.date}</div>
            </div>
        `;
        alertsList.appendChild(alertDiv);
    });
}

/**
 * Met à jour les selects d'employés dans les formulaires
 */
function updateEmployeeSelects() {
    const employeeSelects = ['leave-employee', 'payslip-employee', 'attendance-employee'];
    
    employeeSelects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Garder la valeur sélectionnée
        const currentValue = select.value;
        
        // Vider et remplir avec les employés actifs
        select.innerHTML = '<option value="">Sélectionner un employé</option>';
        
        // Filtrer les employés actifs (gérer différents formats de statut)
        const activeEmployees = employees.filter(emp => {
            const status = (emp.status || '').toUpperCase();
            return status === 'ACTIVE' || status === 'ACTIF' || status === 'ACTIF' || emp.status === 'active';
        });
        
        if (activeEmployees.length === 0) {
            // Si aucun employé actif, afficher tous les employés
            employees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id || emp.employeId;
                option.textContent = `${emp.firstname || emp.prenom || ''} ${emp.lastname || emp.nom || ''}`.trim();
                if ((emp.id || emp.employeId) === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        } else {
            activeEmployees.forEach(emp => {
                const option = document.createElement('option');
                option.value = emp.id || emp.employeId;
                option.textContent = `${emp.firstname || emp.prenom || ''} ${emp.lastname || emp.nom || ''}`.trim();
                if ((emp.id || emp.employeId) === currentValue) {
                    option.selected = true;
                }
                select.appendChild(option);
            });
        }
    });
}

/**
 * Met à jour le select des postes dans le formulaire employé
 */
function updateEmployeePositionSelect() {
    const select = document.getElementById('employee-position');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Sélectionner un poste</option>';
    
    positions.forEach(position => {
        const option = document.createElement('option');
        option.value = position.title;
        option.textContent = position.title;
        if (position.title === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Met à jour le select des services dans le formulaire employé
 */
function updateEmployeeServiceSelect() {
    const select = document.getElementById('employee-service');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Sélectionner un service</option>';
    
    if (typeof services !== 'undefined' && services.length > 0) {
        services.forEach(service => {
            const option = document.createElement('option');
            option.value = service.id;
            option.textContent = service.name;
            if (service.id === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    }
}

/**
 * Édite un employé
 */
function editEmployee(id) {
    const employee = employees.find(emp => emp.id === id);
    if (employee) {
        openModal('employee-modal', 'edit', employee);
    }
}

/**
 * Suspend un employé
 */
function suspendEmployee(id) {
    const action = prompt('Choisir une action:\n1 - Suspendre\n2 - Licencier\n3 - Démission\n\nEntrez le numéro:');
    const employee = employees.find(emp => emp.id === id);
    if (!employee) return;

    if (action === '1') {
        if (confirm('Êtes-vous sûr de vouloir suspendre cet employé ?')) {
            employee.status = 'suspended';
            saveData('employees', employees);
            renderEmployees();
            updateDashboard();
            if (typeof logAudit === 'function') {
                logAudit('update', 'employees', `Employé suspendu: ${employee.firstname} ${employee.lastname}`, currentUser?.email);
            }
        }
    } else if (action === '2') {
        if (confirm('Êtes-vous sûr de vouloir licencier cet employé ?')) {
            employee.status = 'terminated';
            employee.departureDate = new Date().toISOString().split('T')[0];
            employee.departureReason = 'Licenciement';
            saveData('employees', employees);
            renderEmployees();
            updateDashboard();
            if (typeof logAudit === 'function') {
                logAudit('update', 'employees', `Employé licencié: ${employee.firstname} ${employee.lastname}`, currentUser?.email);
            }
        }
    } else if (action === '3') {
        if (confirm('Êtes-vous sûr de vouloir enregistrer la démission de cet employé ?')) {
            employee.status = 'resigned';
            employee.departureDate = new Date().toISOString().split('T')[0];
            employee.departureReason = 'Démission';
            saveData('employees', employees);
            renderEmployees();
            updateDashboard();
            if (typeof logAudit === 'function') {
                logAudit('update', 'employees', `Démission enregistrée: ${employee.firstname} ${employee.lastname}`, currentUser?.email);
            }
        }
    }
}

/**
 * Édite un poste
 */
function editPosition(id) {
    const position = positions.find(pos => pos.id === id);
    if (position) {
        openModal('position-modal', 'edit', position);
    }
}

/**
 * Supprime un poste
 */
function deletePosition(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce poste ?')) {
        positions = positions.filter(pos => pos.id !== id);
        saveData('positions', positions);
        renderPositions();
        updateEmployeePositionSelect();
        updateDashboard();
    }
}

/**
 * Approuve une demande de congé
 */
function approveLeave(id) {
    const leave = leaves.find(l => l.id === id);
    if (leave) {
        // Ouvrir la modale de validation avec commentaire
        document.getElementById('leave-validation-id').value = leave.id;
        document.getElementById('leave-validation-employee').value = leave.employeeName;
        document.getElementById('leave-validation-type').value = leave.type;
        document.getElementById('leave-validation-period').value = `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`;
        document.getElementById('leave-validation-title').textContent = 'Valider un congé';
        document.getElementById('leave-validation-comment').value = '';
        
        // Cacher le bouton refuser et montrer valider
        const rejectBtn = document.getElementById('leave-reject-btn');
        const validateBtn = document.getElementById('leave-validation-form').querySelector('button[type="submit"]');
        if (rejectBtn) rejectBtn.style.display = 'none';
        if (validateBtn) {
            validateBtn.style.display = 'inline-flex';
            validateBtn.textContent = 'Valider';
        }
        
        openModal('leave-validation-modal');
    }
}

/**
 * Refuse une demande de congé
 */
function rejectLeave(id) {
    const leave = leaves.find(l => l.id === id);
    if (leave) {
        // Ouvrir la modale de validation avec commentaire
        document.getElementById('leave-validation-id').value = leave.id;
        document.getElementById('leave-validation-employee').value = leave.employeeName;
        document.getElementById('leave-validation-type').value = leave.type;
        document.getElementById('leave-validation-period').value = `${formatDate(leave.startDate)} - ${formatDate(leave.endDate)}`;
        document.getElementById('leave-validation-title').textContent = 'Refuser un congé';
        document.getElementById('leave-validation-comment').value = '';
        
        // Montrer le bouton refuser et cacher valider
        const rejectBtn = document.getElementById('leave-reject-btn');
        const validateBtn = document.getElementById('leave-validation-form').querySelector('button[type="submit"]');
        if (rejectBtn) rejectBtn.style.display = 'inline-flex';
        if (validateBtn) validateBtn.style.display = 'none';
        
        openModal('leave-validation-modal');
    }
}

/**
 * Gère la validation/refus de congé avec commentaire
 */
async function handleLeaveValidation(e) {
    e.preventDefault();
    const leaveId = document.getElementById('leave-validation-id').value;
    const comment = document.getElementById('leave-validation-comment').value?.trim();
    
    if (!comment) {
        alert('Veuillez ajouter un commentaire pour valider ce congé.');
        return;
    }
    
    const submitBtn = document.querySelector('#leave-validation-form button[type="submit"]');
    setButtonLoading(submitBtn, true, 'Validation...');
    
    try {
        await LeavesAPI.validate(leaveId, 'APPROUVE', comment);
        
        const refreshed = await refreshLeaves(false);
        if (!refreshed) {
            updateLeaveStatusLocally(leaveId, 'approved', comment);
        }
        
        closeAllModals();
        alert('Le congé a été validé avec succès.');
    } catch (error) {
        console.error('Erreur lors de la validation du congé:', error);
        alert(error?.message ? `Erreur lors de la validation : ${error.message}` : 'Erreur lors de la validation du congé.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Gère le refus de congé avec commentaire
 */
async function handleLeaveRejection(e) {
    if (e) e.preventDefault();
    const leaveId = document.getElementById('leave-validation-id').value;
    const comment = document.getElementById('leave-validation-comment').value?.trim();
    
    if (!comment) {
        alert('Veuillez ajouter un commentaire pour justifier le refus.');
        return;
    }
    
    const rejectBtn = document.getElementById('leave-reject-btn');
    setButtonLoading(rejectBtn, true, 'Refus...');
    
    try {
        await LeavesAPI.validate(leaveId, 'REFUSE', comment);
        
        const refreshed = await refreshLeaves(false);
        if (!refreshed) {
            updateLeaveStatusLocally(leaveId, 'rejected', comment);
        }
        
        closeAllModals();
        alert('Le congé a été refusé.');
    } catch (error) {
        console.error('Erreur lors du refus du congé:', error);
        alert(error?.message ? `Erreur lors du refus : ${error.message}` : 'Erreur lors du refus du congé.');
    } finally {
        setButtonLoading(rejectBtn, false);
    }
}

/**
 * Met à jour localement le statut d'un congé
 */
function updateLeaveStatusLocally(leaveId, status, comment) {
    const leave = leaves.find(l => String(l.id || l.congeId) === String(leaveId));
    if (leave) {
        leave.status = status;
        leave.validator = currentUser?.email || leave.validator || 'system';
        leave.validationComment = comment;
        leave.validatedAt = new Date().toISOString();
        saveData('leaves', leaves);
        renderLeaves();
        updateDashboard();
        
        if (typeof logAudit === 'function') {
            logAudit('update', 'leaves', `Congé ${status === 'approved' ? 'validé' : 'refusé'}: ${leave.employeeName}`, currentUser?.email);
        }
    }
}

/**
 * Génère un badge de statut pour les congés
 */
function getLeaveStatusBadge(status) {
    const badges = {
        'pending': '<span class="badge badge-warning">En attente</span>',
        'approved': '<span class="badge badge-success">Approuvé</span>',
        'rejected': '<span class="badge badge-danger">Refusé</span>'
    };
    return badges[status] || status;
}

/**
 * Formate un montant pour le PDF (sans caractères spéciaux)
 */
function formatCurrencyForPDF(amount) {
    const num = Math.round(parseFloat(amount || 0));
    // Formater manuellement avec des espaces normaux pour éviter les problèmes d'encodage
    const numStr = num.toString();
    let formatted = '';
    let count = 0;
    
    // Ajouter les chiffres de droite à gauche avec des espaces tous les 3 chiffres
    for (let i = numStr.length - 1; i >= 0; i--) {
        if (count > 0 && count % 3 === 0) {
            formatted = ' ' + formatted;
        }
        formatted = numStr[i] + formatted;
        count++;
    }
    
    return formatted + ' FCFA';
}

/**
 * Génère un PDF du bulletin de paie
 */
function generatePayslipPDF(payslipData, employee) {
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF n\'est pas chargé');
        alert('Erreur: La bibliothèque PDF n\'est pas disponible');
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Configuration
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    let yPos = margin;
    
    // Couleurs
    const primaryColor = [74, 144, 226]; // #4a90e2
    const darkColor = [50, 50, 50];
    const lightGray = [240, 240, 240];
    
    // En-tête
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('RHorizon', margin, 25);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Bulletin de Paie', pageWidth - margin, 25, { align: 'right' });
    
    yPos = 50;
    doc.setTextColor(...darkColor);
    
    // Informations employé
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORMATIONS EMPLOYÉ', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const employeeName = `${employee.firstname || employee.prenom || ''} ${employee.lastname || employee.nom || ''}`.trim();
    doc.text(`Nom: ${employeeName}`, margin, yPos);
    yPos += 6;
    doc.text(`Matricule: ${employee.matricule || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Poste: ${employee.position || employee.poste || 'N/A'}`, margin, yPos);
    yPos += 6;
    doc.text(`Période: ${formatPeriod(payslipData.period)}`, margin, yPos);
    yPos += 6;
    doc.text(`Numéro de bulletin: ${payslipData.payslipNumber}`, margin, yPos);
    yPos += 15;
    
    // Détails du salaire
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('DÉTAILS DU SALAIRE', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    
    // Tableau des gains
    const gains = [
        ['Salaire de base', formatCurrencyForPDF(payslipData.baseSalary)],
        ['Primes', formatCurrencyForPDF(payslipData.bonus)],
        ['Heures supplémentaires', `${payslipData.overtimeHours}h - ${formatCurrencyForPDF(payslipData.overtimePay)}`]
    ];
    
    let tableY = yPos;
    gains.forEach(([label, value]) => {
        doc.text(label, margin, tableY);
        doc.text(value, pageWidth - margin, tableY, { align: 'right' });
        tableY += 6;
    });
    
    tableY += 2;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, tableY, pageWidth - margin, tableY);
    tableY += 4;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Salaire brut', margin, tableY);
    doc.text(formatCurrencyForPDF(payslipData.grossSalary), pageWidth - margin, tableY, { align: 'right' });
    tableY += 8;
    
    // Tableau des retenues
    doc.setFont('helvetica', 'normal');
    const deductions = [
        ['Cotisations sociales', formatCurrencyForPDF(payslipData.contributions)],
        ['Impôts', formatCurrencyForPDF(payslipData.taxes)],
        ['Retenues diverses', formatCurrencyForPDF(payslipData.deduction)],
        ['Avances sur salaire', formatCurrencyForPDF(payslipData.advance)]
    ];
    
    deductions.forEach(([label, value]) => {
        doc.text(label, margin, tableY);
        doc.text(value, pageWidth - margin, tableY, { align: 'right' });
        tableY += 6;
    });
    
    tableY += 2;
    doc.line(margin, tableY, pageWidth - margin, tableY);
    tableY += 4;
    
    // Salaire net
    doc.setFillColor(...lightGray);
    doc.rect(margin, tableY - 4, pageWidth - 2 * margin, 8, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('SALAIRE NET À PAYER', margin, tableY);
    doc.text(formatCurrencyForPDF(payslipData.netSalary), pageWidth - margin, tableY, { align: 'right' });
    
    // Pied de page
    const footerY = doc.internal.pageSize.getHeight() - 20;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, margin, footerY);
    doc.text(`Statut: ${payslipData.status}`, pageWidth - margin, footerY, { align: 'right' });
    
    // Télécharger le PDF
    const lastName = employee.lastname || employee.nom || 'Employe';
    const firstName = employee.firstname || employee.prenom || '';
    const fileName = `Bulletin_${payslipData.payslipNumber}_${lastName}_${firstName}.pdf`.replace(/\s+/g, '_');
    doc.save(fileName);
}

/**
 * Télécharge un bulletin de paie existant
 */
function downloadPayslip(id) {
    const payslip = payroll.find(p => p.id === id);
    if (payslip) {
        const employee = employees.find(emp => emp.id === payslip.employeeId);
        if (employee) {
            // S'assurer que toutes les propriétés nécessaires sont présentes
            const completePayslip = {
                ...payslip,
                baseSalary: payslip.baseSalary || employee.salary || 0,
                bonus: payslip.bonus || 0,
                deduction: payslip.deduction || 0,
                advance: payslip.advance || 0,
                overtimeHours: payslip.overtimeHours || 0,
                overtimePay: payslip.overtimePay || 0,
                contributions: payslip.contributions || 0,
                taxes: payslip.taxes || 0,
                grossSalary: payslip.grossSalary || payslip.baseSalary || employee.salary || 0,
                netSalary: payslip.netSalary || payslip.baseSalary || employee.salary || 0,
                period: payslip.period || new Date().toISOString().substring(0, 7),
                payslipNumber: payslip.payslipNumber || `BULL-${Date.now()}`,
                status: payslip.status || 'BROUILLON'
            };
            generatePayslipPDF(completePayslip, employee);
        } else {
            alert('Employé non trouvé pour ce bulletin');
        }
    } else {
        alert('Bulletin de paie non trouvé');
    }
}

/**
 * Sauvegarde des données dans localStorage
 */
function saveData(key, data) {
    try {
        localStorage.setItem(`grh_${key}`, JSON.stringify(data));
    } catch (e) {
        console.error('Erreur lors de la sauvegarde:', e);
    }
}

/**
 * Charge des données depuis localStorage
 */
function loadData(key) {
    try {
        const data = localStorage.getItem(`grh_${key}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error('Erreur lors du chargement:', e);
        return null;
    }
}

/**
 * Formate une date
 */
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('fr-FR');
}

/**
 * Formate une période (YYYY-MM)
 */
function formatPeriod(period) {
    if (!period) return '-';
    const [year, month] = period.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
}

/**
 * Formate une devise en Franc CFA
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('fr-FR', {
        style: 'decimal',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount || 0) + ' FCFA';
}

/**
 * Édite un pointage
 */
function editAttendance(id) {
    const att = attendance.find(a => a.id === id);
    if (att) {
        // Mettre à jour les selects avant d'ouvrir la modale
        updateEmployeeSelects();
        // Attendre un peu pour que le DOM soit mis à jour
        setTimeout(() => {
            openModal('attendance-modal', 'edit', att);
        }, 50);
    }
}

/**
 * Supprime un pointage
 */
function deleteAttendance(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce pointage ?')) {
        attendance = attendance.filter(att => att.id !== id);
        saveData('attendance', attendance);
        renderAttendance();
        updateDashboard();
    }
}

// S'assurer que toutes les fonctions importantes sont globales (après leur déclaration)
// Cela permet de les appeler depuis onclick dans le HTML
if (typeof window !== 'undefined') {
    window.switchAuthTab = switchAuthTab;
    window.handleLoginClick = handleLoginClick;
    window.handleSignupClick = handleSignupClick;
}

