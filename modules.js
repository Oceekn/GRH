// === Modules avancés RHorizon ===
// Fichier JavaScript pour les nouvelles fonctionnalités

// === Fonction d'audit (à appeler pour chaque action) ===
function logAudit(action, table, details, userId = null) {
    const log = {
        id: Date.now().toString(),
        userId: userId || (currentUser ? currentUser.email : 'system'),
        action: action, // create, update, delete, login, logout
        table: table,
        details: details,
        timestamp: new Date().toISOString(),
        ip: '127.0.0.1' // En production, récupérer l'IP réelle
    };
    auditLogs.push(log);
    saveData('auditLogs', auditLogs);
}

// === MODULE 1: RÔLES & PERMISSIONS ===

/**
 * Initialise le module Rôles & Permissions
 */
function initRolesModule() {
    const addRoleBtn = document.getElementById('add-role-btn');
    if (addRoleBtn) {
        addRoleBtn.addEventListener('click', () => openModal('role-modal', 'add'));
    }

    const addPermissionBtn = document.getElementById('add-permission-btn');
    if (addPermissionBtn) {
        addPermissionBtn.addEventListener('click', () => openModal('permission-modal', 'add'));
    }

    const roleForm = document.getElementById('role-form');
    if (roleForm) {
        roleForm.addEventListener('submit', handleRoleSubmit);
    }

    const permissionForm = document.getElementById('permission-form');
    if (permissionForm) {
        permissionForm.addEventListener('submit', handlePermissionSubmit);
    }
}

/**
 * Gère la soumission du formulaire rôle
 */
function handleRoleSubmit(e) {
    e.preventDefault();
    const roleId = document.getElementById('role-id').value;
    const roleData = {
        name: document.getElementById('role-name').value,
        description: document.getElementById('role-description').value,
        permissions: getSelectedPermissions()
    };

    if (roleId) {
        updateRole(roleId, roleData);
    } else {
        addRole(roleData);
    }

    closeAllModals();
    renderRoles();
    renderPermissions();
}

/**
 * Gère la soumission du formulaire permission
 */
function handlePermissionSubmit(e) {
    e.preventDefault();
    const permissionId = document.getElementById('permission-id').value;
    const permissionData = {
        name: document.getElementById('permission-name').value,
        description: document.getElementById('permission-description').value
    };

    if (permissionId) {
        updatePermission(permissionId, permissionData);
    } else {
        addPermission(permissionData);
    }

    closeAllModals();
    renderPermissions();
}

/**
 * Ajoute un rôle
 */
function addRole(data) {
    const newRole = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString()
    };
    roles.push(newRole);
    saveData('roles', roles);
    logAudit('create', 'roles', `Rôle créé: ${data.name}`, currentUser?.email);
}

/**
 * Met à jour un rôle
 */
function updateRole(id, data) {
    const index = roles.findIndex(r => r.id === id);
    if (index !== -1) {
        roles[index] = { ...roles[index], ...data };
        saveData('roles', roles);
        logAudit('update', 'roles', `Rôle modifié: ${data.name}`, currentUser?.email);
    }
}

/**
 * Supprime un rôle
 */
function deleteRole(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
        const role = roles.find(r => r.id === id);
        roles = roles.filter(r => r.id !== id);
        saveData('roles', roles);
        renderRoles();
        logAudit('delete', 'roles', `Rôle supprimé: ${role?.name}`, currentUser?.email);
    }
}

/**
 * Ajoute une permission
 */
function addPermission(data) {
    const newPermission = {
        id: Date.now().toString(),
        ...data,
        createdAt: new Date().toISOString()
    };
    permissions.push(newPermission);
    saveData('permissions', permissions);
    logAudit('create', 'permissions', `Permission créée: ${data.name}`, currentUser?.email);
}

/**
 * Met à jour une permission
 */
function updatePermission(id, data) {
    const index = permissions.findIndex(p => p.id === id);
    if (index !== -1) {
        permissions[index] = { ...permissions[index], ...data };
        saveData('permissions', permissions);
        logAudit('update', 'permissions', `Permission modifiée: ${data.name}`, currentUser?.email);
    }
}

/**
 * Supprime une permission
 */
function deletePermission(id) {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette permission ?')) {
        const permission = permissions.find(p => p.id === id);
        permissions = permissions.filter(p => p.id !== id);
        saveData('permissions', permissions);
        renderPermissions();
        logAudit('delete', 'permissions', `Permission supprimée: ${permission?.name}`, currentUser?.email);
    }
}

/**
 * Récupère les permissions sélectionnées dans le formulaire rôle
 */
function getSelectedPermissions() {
    const checkboxes = document.querySelectorAll('#role-permissions-list input[type="checkbox"]:checked');
    return Array.from(checkboxes).map(cb => cb.value);
}

/**
 * Rend la liste des rôles
 */
function renderRoles() {
    const tbody = document.getElementById('roles-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    roles.forEach(role => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${role.name}</td>
            <td>${role.description || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editRole('${role.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteRole('${role.id}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * Rend la liste des permissions
 */
function renderPermissions() {
    const tbody = document.getElementById('permissions-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    permissions.forEach(permission => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${permission.name}</td>
            <td>${permission.description || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editPermission('${permission.id}')">Modifier</button>
                    <button class="btn btn-danger btn-sm" onclick="deletePermission('${permission.id}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour la liste des permissions dans le formulaire rôle
    updateRolePermissionsList();
}

/**
 * Met à jour la liste des permissions dans le formulaire rôle
 */
function updateRolePermissionsList() {
    const container = document.getElementById('role-permissions-list');
    if (!container) return;

    container.innerHTML = '';

    permissions.forEach(permission => {
        const div = document.createElement('div');
        div.style.cssText = 'display: flex; align-items: center; gap: 8px; padding: 8px;';
        div.innerHTML = `
            <input type="checkbox" id="perm-${permission.id}" value="${permission.id}">
            <label for="perm-${permission.id}" style="margin: 0; cursor: pointer;">${permission.name}</label>
        `;
        container.appendChild(div);
    });
}

/**
 * Édite un rôle
 */
function editRole(id) {
    const role = roles.find(r => r.id === id);
    if (role) {
        document.getElementById('role-id').value = role.id;
        document.getElementById('role-name').value = role.name;
        document.getElementById('role-description').value = role.description || '';
        document.getElementById('role-modal-title').textContent = 'Modifier un rôle';
        
        // Sélectionner les permissions du rôle
        updateRolePermissionsList();
        setTimeout(() => {
            if (role.permissions) {
                role.permissions.forEach(permId => {
                    const checkbox = document.getElementById(`perm-${permId}`);
                    if (checkbox) checkbox.checked = true;
                });
            }
        }, 100);
        
        openModal('role-modal', 'edit', role);
    }
}

/**
 * Édite une permission
 */
function editPermission(id) {
    const permission = permissions.find(p => p.id === id);
    if (permission) {
        document.getElementById('permission-id').value = permission.id;
        document.getElementById('permission-name').value = permission.name;
        document.getElementById('permission-description').value = permission.description || '';
        document.getElementById('permission-modal-title').textContent = 'Modifier une permission';
        openModal('permission-modal', 'edit', permission);
    }
}

// === MODULE 2: UTILISATEURS ===

/**
 * Initialise le module Utilisateurs
 */
function initUsersModule() {
    const addUserBtn = document.getElementById('add-user-btn');
    if (addUserBtn) {
        addUserBtn.addEventListener('click', () => openModal('user-modal', 'add'));
    }

    const userForm = document.getElementById('user-form');
    if (userForm) {
        userForm.addEventListener('submit', handleUserSubmit);
    }
}

/**
 * Gère la soumission du formulaire utilisateur
 */
function handleUserSubmit(e) {
    e.preventDefault();
    const userId = document.getElementById('user-id').value;
    const userData = {
        name: document.getElementById('user-name').value,
        email: document.getElementById('user-email').value,
        password: document.getElementById('user-password').value,
        roleId: document.getElementById('user-role').value,
        status: document.getElementById('user-status').value
    };

    if (userId) {
        // Modification - ne pas changer le mot de passe si vide
        if (!userData.password) {
            delete userData.password;
        }
        updateUser(userId, userData);
    } else {
        if (!userData.password) {
            alert('Le mot de passe est requis pour un nouvel utilisateur');
            return;
        }
        addUser(userData);
    }

    closeAllModals();
    renderUsers();
}

/**
 * Ajoute un utilisateur
 */
function addUser(data) {
    const newUser = {
        id: Date.now().toString(),
        ...data,
        lastLogin: null,
        lastIp: null,
        loginHistory: [],
        createdAt: new Date().toISOString()
    };
    users.push(newUser);
    saveData('users', users);
    logAudit('create', 'users', `Utilisateur créé: ${data.email}`, currentUser?.email);
}

/**
 * Met à jour un utilisateur
 */
function updateUser(id, data) {
    const index = users.findIndex(u => u.id === id);
    if (index !== -1) {
        users[index] = { ...users[index], ...data };
        saveData('users', users);
        logAudit('update', 'users', `Utilisateur modifié: ${data.email}`, currentUser?.email);
    }
}

/**
 * Suspend/Active un utilisateur
 */
function toggleUserStatus(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        const newStatus = user.status === 'SUSPENDU' ? 'ACTIF' : 'SUSPENDU';
        user.status = newStatus;
        saveData('users', users);
        renderUsers();
        logAudit('update', 'users', `Statut utilisateur changé: ${user.email} -> ${newStatus}`, currentUser?.email);
    }
}

/**
 * Rend la liste des utilisateurs
 */
function renderUsers() {
    const tbody = document.getElementById('users-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    users.forEach(user => {
        const role = roles.find(r => r.id === user.roleId);
        const statusBadge = getStatusBadge(user.status);
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${role ? role.name : '-'}</td>
            <td>${statusBadge}</td>
            <td>${user.lastLogin ? formatDateTime(user.lastLogin) : 'Jamais'}</td>
            <td>${user.lastIp || '-'}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editUser('${user.id}')">Modifier</button>
                    <button class="btn btn-info btn-sm" onclick="showUserHistory('${user.id}')">Historique</button>
                    <button class="btn btn-${user.status === 'SUSPENDU' ? 'success' : 'warning'} btn-sm" onclick="toggleUserStatus('${user.id}')">
                        ${user.status === 'SUSPENDU' ? 'Activer' : 'Suspendre'}
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour les selects de rôles
    updateRoleSelects();
}

/**
 * Génère un badge de statut
 */
function getStatusBadge(status) {
    const badges = {
        'ACTIF': '<span class="badge badge-success">ACTIF</span>',
        'INACTIF': '<span class="badge badge-warning">INACTIF</span>',
        'SUSPENDU': '<span class="badge badge-danger">SUSPENDU</span>'
    };
    return badges[status] || status;
}

/**
 * Met à jour les selects de rôles
 */
function updateRoleSelects() {
    const selects = ['user-role'];
    selects.forEach(selectId => {
        const select = document.getElementById(selectId);
        if (!select) return;

        const currentValue = select.value;
        select.innerHTML = '<option value="">Sélectionner un rôle</option>';
        roles.forEach(role => {
            const option = document.createElement('option');
            option.value = role.id;
            option.textContent = role.name;
            if (role.id === currentValue) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    });
}

/**
 * Édite un utilisateur
 */
function editUser(id) {
    const user = users.find(u => u.id === id);
    if (user) {
        document.getElementById('user-id').value = user.id;
        document.getElementById('user-name').value = user.name;
        document.getElementById('user-email').value = user.email;
        document.getElementById('user-password').value = '';
        document.getElementById('user-role').value = user.roleId || '';
        document.getElementById('user-status').value = user.status;
        document.getElementById('user-modal-title').textContent = 'Modifier un utilisateur';
        updateRoleSelects();
        setTimeout(() => {
            document.getElementById('user-role').value = user.roleId || '';
        }, 100);
        openModal('user-modal', 'edit', user);
    }
}

/**
 * Affiche l'historique de connexion d'un utilisateur
 */
function showUserHistory(id) {
    const user = users.find(u => u.id === id);
    if (!user) return;
    
    const historyBody = document.getElementById('user-history-table-body');
    if (!historyBody) return;
    
    historyBody.innerHTML = '';
    
    if (user.loginHistory && user.loginHistory.length > 0) {
        user.loginHistory
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .forEach(entry => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${formatDateTime(entry.date)}</td>
                    <td>${entry.ip || '-'}</td>
                `;
                historyBody.appendChild(row);
            });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = '<td colspan="2" style="text-align: center; color: var(--text-secondary);">Aucun historique de connexion</td>';
        historyBody.appendChild(row);
    }
    
    document.getElementById('user-history-name').textContent = user.name;
    document.getElementById('user-history-email').textContent = user.email;
    openModal('user-history-modal');
}

/**
 * Formate une date/heure
 */
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleString('fr-FR');
}

// === MODULE 3: SERVICES ===

/**
 * Initialise le module Services
 */
function initServicesModule() {
    const addServiceBtn = document.getElementById('add-service-btn');
    if (addServiceBtn) {
        addServiceBtn.addEventListener('click', () => openModal('service-modal', 'add'));
    }

    const serviceForm = document.getElementById('service-form');
    if (serviceForm) {
        serviceForm.addEventListener('submit', handleServiceSubmit);
    }
}

/**
 * Gère la soumission du formulaire service
 */
async function handleServiceSubmit(e) {
    e.preventDefault();
    const serviceId = document.getElementById('service-id').value;
    const payload = {
        name: document.getElementById('service-name').value,
        responsableId: document.getElementById('service-manager').value || null,
        budget: parseFloat(document.getElementById('service-budget').value) || 0
    };
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, serviceId ? 'Mise à jour...' : 'Enregistrement...');

    try {
        if (serviceId) {
            await ServicesAPI.update(serviceId, payload);
        } else {
            await ServicesAPI.create(payload);
        }
        await refreshServices();
        closeAllModals();
        alert('Service enregistré avec succès.');
    } catch (error) {
        console.error('Erreur service:', error);
        alert(error?.message ? `Impossible d'enregistrer le service : ${error.message}` : 'Impossible d\'enregistrer le service.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Ajoute un service
 */
async function addService(data) {
    await ServicesAPI.create(data);
}

/**
 * Met à jour un service
 */
async function updateService(id, data) {
    await ServicesAPI.update(id, data);
}

/**
 * Supprime un service
 */
async function deleteService(id) {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) return;
    try {
        await ServicesAPI.delete(id);
        await refreshServices();
        alert('Service supprimé.');
    } catch (error) {
        console.error('Erreur suppression service:', error);
        alert(error?.message ? `Impossible de supprimer le service : ${error.message}` : 'Impossible de supprimer le service.');
    }
}

/**
 * Rend la liste des services
 */
function renderServices() {
    const tbody = document.getElementById('services-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    services.forEach(service => {
        const manager = service.managerId ? employees.find(e => e.id === service.managerId) : null;
        const managerName = manager ? `${manager.firstname} ${manager.lastname}` : '-';
        const serviceEmployees = employees.filter(e => e.serviceId === service.id && e.status === 'active');
        const effectif = serviceEmployees.length;
        const avgSeniority = calculateAverageSeniority(service.id);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${service.name}</td>
            <td>${managerName}</td>
            <td>${formatCurrency(service.budget || 0)}</td>
            <td>${effectif}</td>
            <td>${avgSeniority.toFixed(1)} mois</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editService('${service.id}')">Modifier</button>
                    <button class="btn btn-info btn-sm" onclick="showServiceStats('${service.id}')">Stats</button>
                    <button class="btn btn-danger btn-sm" onclick="deleteService('${service.id}')">Supprimer</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour le select des responsables
    updateManagerSelect();
}

/**
 * Met à jour le select des responsables
 */
function updateManagerSelect() {
    const select = document.getElementById('service-manager');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Sélectionner un responsable</option>';
    employees.filter(e => e.status === 'active').forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.firstname} ${emp.lastname}`;
        if (emp.id === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Calcule l'ancienneté moyenne d'un service
 */
function calculateAverageSeniority(serviceId) {
    const serviceEmployees = employees.filter(e => e.serviceId === serviceId && e.status === 'active');
    if (serviceEmployees.length === 0) return 0;
    
    const today = new Date();
    const totalMonths = serviceEmployees.reduce((sum, emp) => {
        const hireDate = new Date(emp.hiredate);
        const months = (today - hireDate) / (1000 * 60 * 60 * 24 * 30);
        return sum + months;
    }, 0);
    
    return totalMonths / serviceEmployees.length;
}

/**
 * Affiche les statistiques d'un service
 */
function showServiceStats(serviceId) {
    const service = services.find(s => s.id === serviceId);
    if (!service) return;
    
    const serviceEmployees = employees.filter(e => e.serviceId === serviceId && e.status === 'active');
    const avgSeniority = calculateAverageSeniority(serviceId);
    const totalBudget = service.budget || 0;
    const budgetPerEmployee = serviceEmployees.length > 0 ? totalBudget / serviceEmployees.length : 0;
    
    // Statistiques des congés du service
    const serviceLeaves = leaves.filter(l => {
        const emp = employees.find(e => e.id === l.employeeId);
        return emp && emp.serviceId === serviceId;
    });
    const pendingLeaves = serviceLeaves.filter(l => l.status === 'pending').length;
    
    // Afficher dans une modale ou alert
    const statsHtml = `
        <div style="padding: 20px;">
            <h3 style="margin-bottom: 16px;">Statistiques - ${service.name}</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Effectif</strong>
                    <div style="font-size: 24px; margin-top: 8px;">${serviceEmployees.length}</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Ancienneté moyenne</strong>
                    <div style="font-size: 24px; margin-top: 8px;">${avgSeniority.toFixed(1)} mois</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Budget total</strong>
                    <div style="font-size: 24px; margin-top: 8px;">${formatCurrency(totalBudget)}</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 8px;">
                    <strong>Budget par employé</strong>
                    <div style="font-size: 24px; margin-top: 8px;">${formatCurrency(budgetPerEmployee)}</div>
                </div>
                <div style="padding: 12px; background: #f8f9fa; border-radius: 8px; grid-column: 1 / -1;">
                    <strong>Congés en attente</strong>
                    <div style="font-size: 24px; margin-top: 8px;">${pendingLeaves}</div>
                </div>
            </div>
        </div>
    `;
    
    // Créer une modale temporaire pour afficher les stats
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 600px;">
            <div class="modal-header">
                <h2>Statistiques - ${service.name}</h2>
                <button class="modal-close" onclick="this.closest('.modal').remove()">&times;</button>
            </div>
            <div class="modal-body">
                ${statsHtml}
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Fermer en cliquant en dehors
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

/**
 * Édite un service
 */
function editService(id) {
    const service = services.find(s => s.id === id);
    if (service) {
        document.getElementById('service-id').value = service.id;
        document.getElementById('service-name').value = service.name;
        document.getElementById('service-manager').value = service.managerId || '';
        document.getElementById('service-budget').value = service.budget || 0;
        document.getElementById('service-modal-title').textContent = 'Modifier un service';
        updateManagerSelect();
        setTimeout(() => {
            document.getElementById('service-manager').value = service.managerId || '';
        }, 100);
        openModal('service-modal', 'edit', service);
    }
}

// === MODULE 4: CONTRATS ===

/**
 * Génère un numéro de contrat automatique
 */
function generateContractNumber() {
    const year = new Date().getFullYear();
    const count = contracts.filter(c => c.number && c.number.startsWith(`CONT-${year}`)).length;
    return `CONT-${year}-${String(count + 1).padStart(4, '0')}`;
}

/**
 * Initialise le module Contrats
 */
function initContractsModule() {
    const addContractBtn = document.getElementById('add-contract-btn');
    if (addContractBtn) {
        addContractBtn.addEventListener('click', () => openModal('contract-modal', 'add'));
    }

    const contractForm = document.getElementById('contract-form');
    if (contractForm) {
        contractForm.addEventListener('submit', handleContractSubmit);
    }
}

/**
 * Gère la soumission du formulaire contrat
 */
async function handleContractSubmit(e) {
    e.preventDefault();
    const contractId = document.getElementById('contract-id').value;
    const contractData = {
        employeId: document.getElementById('contract-employee').value,
        typeContrat: document.getElementById('contract-type').value,
        dateDebut: document.getElementById('contract-start-date').value,
        dateFin: document.getElementById('contract-end-date').value || null,
        salaireBase: parseFloat(document.getElementById('contract-base-salary').value)
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    setButtonLoading(submitBtn, true, contractId ? 'Mise à jour...' : 'Enregistrement...');

    try {
        if (contractId) {
            await ContractsAPI.update(contractId, contractData);
        } else {
            await ContractsAPI.create(contractData);
        }
        await refreshContracts();
        closeAllModals();
        alert('Contrat enregistré avec succès.');
    } catch (error) {
        console.error('Erreur contrat:', error);
        alert(error?.message ? `Impossible d'enregistrer le contrat : ${error.message}` : 'Impossible d\'enregistrer le contrat.');
    } finally {
        setButtonLoading(submitBtn, false);
    }
}

/**
 * Ajoute un contrat
 */
async function addContract(data) {
    await ContractsAPI.create(data);
}

/**
 * Met à jour un contrat
 */
async function updateContract(id, data) {
    await ContractsAPI.update(id, data);
}

/**
 * Résilie un contrat
 */
async function terminateContract(id) {
    if (!confirm('Êtes-vous sûr de vouloir résilier ce contrat ?')) return;
    try {
        await ContractsAPI.delete(id);
        await refreshContracts();
        alert('Contrat résilié.');
    } catch (error) {
        console.error('Erreur résiliation contrat:', error);
        alert(error?.message ? `Impossible de résilier le contrat : ${error.message}` : 'Impossible de résilier le contrat.');
    }
}

/**
 * Rend la liste des contrats
 */
function renderContracts() {
    const tbody = document.getElementById('contracts-table-body');
    if (!tbody) return;

    tbody.innerHTML = '';

    contracts.forEach(contract => {
        const employee = employees.find(e => e.id === contract.employeeId);
        const employeeName = employee ? `${employee.firstname} ${employee.lastname}` : 'Inconnu';
        const statusBadge = contract.status === 'ACTIF' 
            ? '<span class="badge badge-success">ACTIF</span>'
            : '<span class="badge badge-danger">RÉSILIÉ</span>';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${contract.number || '-'}</td>
            <td>${employeeName}</td>
            <td>${contract.type}</td>
            <td>${formatDate(contract.startDate)}</td>
            <td>${contract.endDate ? formatDate(contract.endDate) : '-'}</td>
            <td>${formatCurrency(contract.baseSalary)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="table-actions">
                    <button class="btn btn-primary btn-sm" onclick="editContract('${contract.id}')">Modifier</button>
                    ${contract.status === 'ACTIF' ? `<button class="btn btn-danger btn-sm" onclick="terminateContract('${contract.id}')">Résilier</button>` : ''}
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour le select des employés
    updateContractEmployeeSelect();
}

/**
 * Met à jour le select des employés dans le formulaire contrat
 */
function updateContractEmployeeSelect() {
    const select = document.getElementById('contract-employee');
    if (!select) return;

    const currentValue = select.value;
    select.innerHTML = '<option value="">Sélectionner un employé</option>';
    employees.filter(e => e.status === 'active').forEach(emp => {
        const option = document.createElement('option');
        option.value = emp.id;
        option.textContent = `${emp.firstname} ${emp.lastname}`;
        if (emp.id === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

/**
 * Édite un contrat
 */
function editContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
        document.getElementById('contract-id').value = contract.id;
        document.getElementById('contract-employee').value = contract.employeeId;
        document.getElementById('contract-type').value = contract.type;
        document.getElementById('contract-start-date').value = contract.startDate;
        document.getElementById('contract-end-date').value = contract.endDate || '';
        document.getElementById('contract-base-salary').value = contract.baseSalary;
        document.getElementById('contract-modal-title').textContent = 'Modifier un contrat';
        updateContractEmployeeSelect();
        setTimeout(() => {
            document.getElementById('contract-employee').value = contract.employeeId;
        }, 100);
        openModal('contract-modal', 'edit', contract);
    }
}

// === MODULE 5: AUDIT LOG ===

/**
 * Initialise le module Audit Log
 */
function initAuditModule() {
    const userFilter = document.getElementById('audit-filter-user');
    const actionFilter = document.getElementById('audit-filter-action');

    if (userFilter) {
        userFilter.addEventListener('change', renderAuditLogs);
    }

    if (actionFilter) {
        actionFilter.addEventListener('change', renderAuditLogs);
    }
}

/**
 * Rend les logs d'audit
 */
function renderAuditLogs() {
    const tbody = document.getElementById('audit-table-body');
    if (!tbody) return;

    const userFilter = document.getElementById('audit-filter-user')?.value || '';
    const actionFilter = document.getElementById('audit-filter-action')?.value || '';

    let filteredLogs = [...auditLogs].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    if (userFilter) {
        filteredLogs = filteredLogs.filter(log => log.userId === userFilter);
    }

    if (actionFilter) {
        filteredLogs = filteredLogs.filter(log => log.action === actionFilter);
    }

    tbody.innerHTML = '';

    filteredLogs.forEach(log => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formatDateTime(log.timestamp)}</td>
            <td>${log.userId}</td>
            <td><span class="badge badge-info">${log.action.toUpperCase()}</span></td>
            <td>${log.table}</td>
            <td>${log.details || '-'}</td>
        `;
        tbody.appendChild(row);
    });

    // Mettre à jour le select des utilisateurs
    updateAuditUserFilter();
}

/**
 * Met à jour le filtre des utilisateurs dans l'audit
 */
function updateAuditUserFilter() {
    const select = document.getElementById('audit-filter-user');
    if (!select) return;

    const currentValue = select.value;
    const uniqueUsers = [...new Set(auditLogs.map(log => log.userId))];

    select.innerHTML = '<option value="">Tous les utilisateurs</option>';
    uniqueUsers.forEach(userId => {
        const option = document.createElement('option');
        option.value = userId;
        option.textContent = userId;
        if (userId === currentValue) {
            option.selected = true;
        }
        select.appendChild(option);
    });
}

// === Initialisation des modules ===

/**
 * Initialise tous les nouveaux modules
 */
function initNewModules() {
    initRolesModule();
    initUsersModule();
    initServicesModule();
    initContractsModule();
    initAuditModule();
}

// === MODULE 6: AMÉLIORATION EMPLOYÉS (Matricule auto, situation familiale, historique) ===

/**
 * Génère un matricule automatique
 */
function generateEmployeeMatricule() {
    const year = new Date().getFullYear();
    const count = employees.filter(e => e.matricule && e.matricule.startsWith(`EMP-${year}`)).length;
    return `EMP-${year}-${String(count + 1).padStart(4, '0')}`;
}

// Améliorer la fonction addEmployee dans app.js
// (sera modifié dans app.js)

// === MODULE 7: AMÉLIORATION PAIE (Primes, déductions, cotisations, avances, statuts) ===

/**
 * Calcule les cotisations sociales
 */
function calculateSocialContributions(baseSalary) {
    // Exemple de calcul (à adapter selon les règles locales)
    const cnss = baseSalary * 0.05; // 5% CNSS
    const retraite = baseSalary * 0.06; // 6% Retraite
    return {
        cnss: cnss,
        retraite: retraite,
        total: cnss + retraite
    };
}

/**
 * Calcule les impôts
 */
function calculateTaxes(grossSalary) {
    // Exemple de calcul progressif (à adapter)
    let tax = 0;
    if (grossSalary > 5000000) {
        tax = (grossSalary - 5000000) * 0.30 + 1500000 * 0.20 + 1000000 * 0.10;
    } else if (grossSalary > 3500000) {
        tax = (grossSalary - 3500000) * 0.20 + 1000000 * 0.10;
    } else if (grossSalary > 2500000) {
        tax = (grossSalary - 2500000) * 0.10;
    }
    return tax;
}

// === MODULE 8: AMÉLIORATION CONGÉS (Validation avec commentaire, solde) ===

/**
 * Calcule le solde de congés restant pour un employé
 */
function calculateLeaveBalance(employeeId) {
    const employee = employees.find(e => e.id === employeeId);
    if (!employee) return 0;

    const hireDate = new Date(employee.hiredate);
    const today = new Date();
    const monthsWorked = (today - hireDate) / (1000 * 60 * 60 * 24 * 30);
    const earnedDays = Math.floor(monthsWorked * 2.5); // 2.5 jours par mois

    const usedDays = leaves
        .filter(l => l.employeeId === employeeId && l.status === 'approved')
        .reduce((sum, l) => sum + (l.days || 0), 0);

    return Math.max(0, earnedDays - usedDays);
}

// === MODULE 9: AMÉLIORATION PRÉSENCES (Retard, justification) ===

/**
 * Calcule le retard en minutes
 */
function calculateDelay(timeIn, expectedTime = '08:00') {
    const [inH, inM] = timeIn.split(':').map(Number);
    const [expH, expM] = expectedTime.split(':').map(Number);
    const inMinutes = inH * 60 + inM;
    const expMinutes = expH * 60 + expM;
    return Math.max(0, inMinutes - expMinutes);
}

// === MODULE 10: AFFECTATIONS DE SERVICE ===

/**
 * Change un employé de service
 */
function changeEmployeeService(employeeId, newServiceId) {
    // Clôturer l'ancienne affectation
    const activeAssignment = serviceAssignments.find(
        sa => sa.employeeId === employeeId && !sa.endDate
    );
    
    if (activeAssignment) {
        activeAssignment.endDate = new Date().toISOString().split('T')[0];
    }

    // Créer la nouvelle affectation
    const newAssignment = {
        id: Date.now().toString(),
        employeeId: employeeId,
        serviceId: newServiceId,
        startDate: new Date().toISOString().split('T')[0],
        endDate: null,
        createdAt: new Date().toISOString()
    };

    serviceAssignments.push(newAssignment);
    saveData('serviceAssignments', serviceAssignments);
    logAudit('create', 'serviceAssignments', `Affectation service changée pour employé ${employeeId}`, currentUser?.email);
}

/**
 * Rend l'historique des affectations d'un employé
 */
function getEmployeeServiceHistory(employeeId) {
    return serviceAssignments
        .filter(sa => sa.employeeId === employeeId)
        .sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
}

// === MODULE 11: STATISTIQUES DASHBOARD ===

/**
 * Calcule les statistiques mensuelles
 */
function getMonthlyStats() {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    // Effectif total
    const totalEmployees = employees.length;
    
    // Effectif actif
    const activeEmployees = employees.filter(e => e.status === 'active').length;

    // Recrutements ce mois
    const recruitments = employees.filter(e => {
        const hireDate = new Date(e.hiredate);
        return hireDate >= firstDay && hireDate <= lastDay;
    }).length;

    // Départs ce mois
    const departures = employees.filter(e => {
        if (!e.departureDate) return false;
        const depDate = new Date(e.departureDate);
        return depDate >= firstDay && depDate <= lastDay;
    }).length;

    // Absences mensuelles
    const monthlyAbsences = leaves.filter(l => {
        const startDate = new Date(l.startDate);
        return l.status === 'approved' && startDate >= firstDay && startDate <= lastDay;
    }).length;

    // Congés en attente
    const pendingLeaves = leaves.filter(l => l.status === 'pending').length;

    // Présences du jour
    const todayStr = today.toISOString().split('T')[0];
    const todayPresences = attendance.filter(a => a.date === todayStr).length;

    // Masse salariale mensuelle
    const monthlyPayroll = payroll
        .filter(p => {
            const [year, month] = p.period.split('-');
            return year == today.getFullYear() && month == String(today.getMonth() + 1).padStart(2, '0');
        })
        .reduce((sum, p) => sum + (p.netSalary || 0), 0);

    return {
        totalEmployees,
        activeEmployees,
        recruitments,
        departures,
        monthlyAbsences,
        pendingLeaves,
        todayPresences,
        monthlyPayroll
    };
}

/**
 * Met à jour le dashboard avec les nouvelles statistiques
 */
function updateAdvancedDashboard() {
    const stats = getMonthlyStats();
    
    // Mettre à jour les stats existantes
    if (document.getElementById('stat-employees')) {
        document.getElementById('stat-employees').textContent = stats.activeEmployees;
    }

    // Ajouter de nouvelles cartes de stats si nécessaire
    // (peut être étendu dans le HTML)
}

// Appeler l'initialisation quand le DOM est prêt
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNewModules);
} else {
    initNewModules();
}

