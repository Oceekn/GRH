/**
 * Helper JavaScript pour les appels API
 * Remplace les appels localStorage par des appels API REST
 */

// Détecter l'URL de base automatiquement
function getApiBaseUrl() {
    // Si on est sur un serveur web (http/https)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        // Utiliser le chemin actuel + /api
        const path = window.location.pathname;
        // Extraire le chemin de base (ex: /GRH/)
        // Si on est sur /GRH/index.html, on veut /GRH/api
        // Si on est sur /GRH/, on veut /GRH/api
        let basePath = path;
        if (basePath.endsWith('.html')) {
            basePath = basePath.substring(0, basePath.lastIndexOf('/'));
        }
        if (basePath.endsWith('/')) {
            basePath = basePath.substring(0, basePath.length - 1);
        }
        // Si basePath est vide ou juste '/', utiliser '/GRH'
        if (!basePath || basePath === '/') {
            basePath = '/GRH';
        }
        // S'assurer que le chemin commence par /
        if (!basePath.startsWith('/')) {
            basePath = '/' + basePath;
        }
        return basePath + '/api';
    }
    // Sinon, utiliser localhost par défaut (pour développement)
    return 'http://localhost/GRH/api';
}

const API_BASE_URL = getApiBaseUrl();

/**
 * Effectue une requête API
 */
async function apiRequest(endpoint, method = 'GET', data = null, params = {}) {
    let url;
    
    // Séparer le fichier des paramètres existants dans endpoint
    let endpointFile = endpoint;
    let existingParams = {};
    if (endpoint.includes('?')) {
        const parts = endpoint.split('?');
        endpointFile = parts[0];
        const queryString = parts[1];
        // Parser les paramètres existants
        queryString.split('&').forEach(param => {
            const [key, value] = param.split('=');
            if (key) existingParams[decodeURIComponent(key)] = decodeURIComponent(value || '');
        });
    }
    
    // Construire l'URL correctement selon le protocole
    if (window.location.protocol === 'file:') {
        // Si ouvert depuis file://, utiliser localhost
        url = new URL(`http://localhost/GRH/api/${endpointFile}`);
    } else {
        // Construire l'URL complète
        if (API_BASE_URL.startsWith('http')) {
            // URL absolue (déjà complète)
            url = new URL(`${API_BASE_URL}/${endpointFile}`);
        } else {
            // URL relative - construire avec origin + chemin
            // API_BASE_URL est déjà du type "/GRH/api"
            const fullPath = `${API_BASE_URL}/${endpointFile}`;
            url = new URL(fullPath, window.location.origin);
        }
    }
    
    // Fusionner les paramètres existants avec les nouveaux
    const allParams = { ...existingParams, ...params };
    
    // Ajouter les paramètres de requête
    Object.keys(allParams).forEach(key => {
        if (allParams[key] !== null && allParams[key] !== undefined) {
            url.searchParams.set(key, allParams[key]);
        }
    });
    
    // Debug: afficher l'URL construite
    console.log('API Request:', method, url.toString());
    
    const options = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include' // Pour les sessions PHP
    };
    
    if (data && (method === 'POST' || method === 'PUT')) {
        options.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(url, options);
        const result = await response.json();
        
        if (!result.success) {
            throw new Error(result.message || 'Erreur API');
        }
        
        return result;
    } catch (error) {
        console.error('Erreur API:', error);
        throw error;
    }
}

/**
 * API Authentication
 */
const AuthAPI = {
    login: (email, password) => apiRequest('auth.php?action=login', 'POST', { email, password }),
    signup: (email, password, name) => apiRequest('auth.php?action=signup', 'POST', { email, password, name }),
    logout: () => apiRequest('auth.php?action=logout', 'POST'),
    check: () => apiRequest('auth.php?action=check', 'GET')
};

/**
 * API Employees
 */
const EmployeesAPI = {
    getAll: (status = 'ACTIF') => apiRequest('employees.php', 'GET', null, { status }),
    get: (id) => apiRequest('employees.php', 'GET', null, { id }),
    create: (data) => apiRequest('employees.php', 'POST', data),
    update: (id, data) => apiRequest('employees.php', 'PUT', data, { id }),
    delete: (id, action = 'suspend') => apiRequest('employees.php', 'DELETE', null, { id, action })
};

/**
 * API Services
 */
const ServicesAPI = {
    getAll: () => apiRequest('services.php', 'GET'),
    get: (id) => apiRequest('services.php', 'GET', null, { id }),
    create: (data) => apiRequest('services.php', 'POST', data),
    update: (id, data) => apiRequest('services.php', 'PUT', data, { id }),
    delete: (id) => apiRequest('services.php', 'DELETE', null, { id })
};

/**
 * API Contracts
 */
const ContractsAPI = {
    getAll: (status = null) => apiRequest('contracts.php', 'GET', null, status ? { status } : {}),
    get: (id) => apiRequest('contracts.php', 'GET', null, { id }),
    getByEmployee: (employeId) => apiRequest('contracts.php', 'GET', null, { employeId }),
    create: (data) => apiRequest('contracts.php', 'POST', data),
    update: (id, data) => apiRequest('contracts.php', 'PUT', data, { id }),
    delete: (id) => apiRequest('contracts.php', 'DELETE', null, { id })
};

/**
 * API Leaves
 */
const LeavesAPI = {
    getAll: (status = null, employeId = null) => {
        const params = {};
        if (status) params.status = status;
        if (employeId) params.employeId = employeId;
        return apiRequest('leaves.php', 'GET', null, params);
    },
    get: (id) => apiRequest('leaves.php', 'GET', null, { id }),
    create: (data) => apiRequest('leaves.php', 'POST', data),
    validate: (congeId, decision, commentaire) => apiRequest('leaves.php?action=validate', 'POST', {
        congeId,
        decision,
        commentaire
    }),
    update: (id, data) => apiRequest('leaves.php', 'PUT', data, { id })
};

/**
 * API Attendance
 */
const AttendanceAPI = {
    getAll: (date = null, employeId = null) => {
        const params = {};
        if (date) params.date = date;
        if (employeId) params.employeId = employeId;
        return apiRequest('attendance.php', 'GET', null, params);
    },
    get: (id) => apiRequest('attendance.php', 'GET', null, { id }),
    create: (data) => apiRequest('attendance.php', 'POST', data),
    update: (id, data) => apiRequest('attendance.php', 'PUT', data, { id }),
    delete: (id) => apiRequest('attendance.php', 'DELETE', null, { id })
};

/**
 * API Payroll
 */
const PayrollAPI = {
    getAll: (period = null, employeId = null) => {
        const params = {};
        if (period) params.period = period;
        if (employeId) params.employeId = employeId;
        return apiRequest('payroll.php', 'GET', null, params);
    },
    get: (id) => apiRequest('payroll.php', 'GET', null, { id }),
    create: (data) => apiRequest('payroll.php', 'POST', data),
    validate: (id) => apiRequest('payroll.php?action=validate', 'POST', null, { id }),
    update: (id, data) => apiRequest('payroll.php', 'PUT', data, { id })
};

/**
 * API Audit
 */
const AuditAPI = {
    getAll: (userId = null, action = null, table = null, limit = 100) => {
        const params = { limit };
        if (userId) params.userId = userId;
        if (action) params.action = action;
        if (table) params.table = table;
        return apiRequest('audit.php', 'GET', null, params);
    }
};

// Exporter pour utilisation globale
window.AuthAPI = AuthAPI;
window.EmployeesAPI = EmployeesAPI;
window.ServicesAPI = ServicesAPI;
window.ContractsAPI = ContractsAPI;
window.LeavesAPI = LeavesAPI;
window.AttendanceAPI = AttendanceAPI;
window.PayrollAPI = PayrollAPI;
window.AuditAPI = AuditAPI;
window.apiRequest = apiRequest;

