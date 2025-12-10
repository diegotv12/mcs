// Configuración de Supabase - Base de Datos 1
const supabaseUrl = 'https://auokdrhbpyyjsszadvsc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF1b2tkcmhicHl5anNzemFkdnNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMzUyMzYsImV4cCI6MjA4MDkxMTIzNn0.kJxv7R7_xhHC8PtyiqGVeAfRUqPZcFVyu2Q00payaeU';

// Configuración de Supabase - Base de Datos 2 (para datos extendidos)
const supabaseUrl2 = 'https://kbhxsiibxgwsomzstrvi.supabase.co';
const supabaseAnonKey2 = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtiaHhzaWlieGd3c29tenN0cnZpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyODA3OTAsImV4cCI6MjA4MDg1Njc5MH0.g1Znyk4uZZ7yIWcuxk7eW3HmUxmOf0bdrQllfS6wK-0';

// Crear clientes de Supabase
let supabase;
let supabase2;
let currentUser = null;

// Inicialización
document.addEventListener('DOMContentLoaded', async () => {
    // Cargar Supabase dinámicamente
    await loadSupabase();
    
    // Crear fondo de estrellas
    createStars();
    
    // Verificar autenticación
    await checkAuth();
    
    // Actualizar navegación
    updateNavAuth();
    
    // Cargar datos específicos de la página
    loadPageData();
    
    // Setup de eventos
    setupEventListeners();
    
    // Verificar redirección admin si es necesario
    redirectToAdminIfAuthorized();
});

// Cargar Supabase SDK dinámicamente
async function loadSupabase() {
    try {
        // Cargar el SDK de Supabase
        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
        
        // Crear clientes
        supabase = createClient(supabaseUrl, supabaseAnonKey);
        supabase2 = createClient(supabaseUrl2, supabaseAnonKey2);
        
        console.log('Supabase cargado correctamente');
    } catch (error) {
        console.error('Error al cargar Supabase:', error);
        showError('Error al cargar el sistema. Por favor, recarga la página.');
    }
}

// Crear efecto de estrellas
function createStars() {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;
    
    // Limpiar contenedor
    starsContainer.innerHTML = '';
    
    const starCount = 150;
    
    for (let i = 0; i < starCount; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        
        // Posición aleatoria
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Tamaño aleatorio
        const size = Math.random() * 3 + 1;
        
        // Opacidad aleatoria
        const opacity = Math.random() * 0.7 + 0.3;
        
        // Animación aleatoria
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 5;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        star.style.opacity = opacity;
        star.style.animationDuration = `${duration}s`;
        star.style.animationDelay = `${delay}s`;
        
        starsContainer.appendChild(star);
    }
}

// Verificar autenticación
async function checkAuth() {
    if (!supabase) {
        console.error('Supabase no está inicializado');
        return;
    }
    
    try {
        const { data: { user }, error } = await supabase.auth.getUser();
        
        if (error) {
            console.error('Error al verificar autenticación:', error);
            return;
        }
        
        if (user) {
            currentUser = user;
            console.log('Usuario autenticado:', user.email);
            
            // Verificar si es admin (solo si no estamos en el panel admin)
            if (!window.location.pathname.includes('/admin/')) {
                await checkAdminStatus();
            }
        }
    } catch (error) {
        console.error('Error en checkAuth:', error);
    }
}

// Verificar si el usuario es administrador en la base de datos
async function checkAdminStatus() {
    if (!currentUser || !supabase) return false;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Error al verificar rol:', error);
            return false;
        }
        
        currentUser.isAdmin = data?.role === 'admin';
        console.log('Estado admin:', currentUser.isAdmin ? 'Administrador' : 'Usuario normal');
        return currentUser.isAdmin;
    } catch (error) {
        console.error('Error en checkAdminStatus:', error);
        return false;
    }
}

// Función para redirigir al admin si tiene permisos
function redirectToAdminIfAuthorized() {
    // Solo aplicar si estamos en una página admin
    if (window.location.pathname.includes('/admin/')) {
        // El panel admin tiene su propio sistema de login
        // No redirigir automáticamente, dejar que admin.js maneje el acceso
        console.log('Página admin detectada, dejando que admin.js maneje el acceso');
        return;
    }
    
    // Si el usuario es admin y quiere ir al panel, podemos mostrar un enlace
    if (currentUser?.isAdmin) {
        // Agregar enlace al admin en la navegación si no existe
        const adminLink = document.querySelector('a[href*="admin"]');
        if (!adminLink) {
            // Podemos agregar dinámicamente un enlace al admin
            const navMenu = document.getElementById('navMenu');
            if (navMenu) {
                const adminNavItem = document.createElement('a');
                adminNavItem.href = 'admin/index.html';
                adminNavItem.className = 'nav-link';
                adminNavItem.innerHTML = '<i class="fas fa-crown"></i> Admin';
                navMenu.insertBefore(adminNavItem, navMenu.querySelector('.nav-auth'));
            }
        }
    }
}

// Actualizar navegación según autenticación
function updateNavAuth() {
    const navAuth = document.getElementById('navAuth');
    if (!navAuth) return;
    
    if (currentUser) {
        // Mostrar email cortado si es muy largo
        const email = currentUser.email;
        const displayEmail = email.length > 20 ? email.substring(0, 20) + '...' : email;
        
        navAuth.innerHTML = `
            <span class="user-email" style="color: #b0b0c0; font-size: 0.875rem;">
                ${displayEmail}
            </span>
            <a href="perfil.html" class="auth-btn auth-btn-login">
                <i class="fas fa-user"></i> Perfil
            </a>
            <button id="logoutBtn" class="auth-btn auth-btn-register">
                <i class="fas fa-sign-out-alt"></i> Salir
            </button>
        `;
        
        // Agregar evento al botón de logout
        document.getElementById('logoutBtn')?.addEventListener('click', logout);
    } else {
        navAuth.innerHTML = `
            <a href="login.html" class="auth-btn auth-btn-login">
                <i class="fas fa-sign-in-alt"></i> Iniciar Sesión
            </a>
            <a href="register.html" class="auth-btn auth-btn-register">
                <i class="fas fa-user-plus"></i> Registrarse
            </a>
        `;
    }
}

// Cerrar sesión
async function logout() {
    if (!supabase) {
        showError('Error de conexión. Intenta recargar la página.');
        return;
    }
    
    const { error } = await supabase.auth.signOut();
    
    if (error) {
        showError('Error al cerrar sesión: ' + error.message);
        return;
    }
    
    currentUser = null;
    updateNavAuth();
    
    showSuccess('Sesión cerrada correctamente', () => {
        window.location.href = 'index.html';
    });
}

// Cargar datos específicos de la página
function loadPageData() {
    const path = window.location.pathname;
    
    if (path.includes('index.html') || path === '/' || path.includes('/index.html')) {
        loadTopBuyers();
    }
}

// Cargar top compradores
async function loadTopBuyers() {
    const topBuyersContainer = document.getElementById('topBuyers');
    if (!topBuyersContainer) return;
    
    try {
        if (!supabase) {
            throw new Error('Supabase no inicializado');
        }
        
        // Obtener usuarios con más TCoins
        const { data: topUsers, error } = await supabase
            .from('profiles')
            .select('nick, tcoins, skin_url')
            .order('tcoins', { ascending: false })
            .limit(5);
        
        if (error) {
            console.error('Error al cargar top compradores:', error);
            throw error;
        }
        
        // URLs de skins predeterminadas
        const defaultSkins = [
            'https://mc-heads.net/head/Steve',
            'https://mc-heads.net/head/Alex',
            'https://mc-heads.net/head/Villager',
            'https://mc-heads.net/head/Chicken',
            'https://mc-heads.net/head/Computer'
        ];
        
        // Crear HTML para los compradores
        topBuyersContainer.innerHTML = topUsers.map((user, index) => {
            const skinUrl = user.skin_url || defaultSkins[index] || defaultSkins[0];
            const rank = index + 1;
            
            return `
                <div class="buyer-card">
                    <div class="buyer-rank">#${rank}</div>
                    <div class="buyer-info">
                        <img src="${skinUrl}" 
                             alt="${user.nick}" 
                             class="buyer-avatar"
                             onerror="this.src='${defaultSkins[0]}'">
                        <div>
                            <div class="buyer-name">${user.nick}</div>
                            <div class="buyer-tcoins">
                                <i class="fas fa-coins"></i> ${user.tcoins?.toLocaleString() || 0} TCoins
                            </div>
                        </div>
                    </div>
                    <div class="buyer-stats">
                        <div class="stat">
                            <div class="stat-value">${Math.floor((user.tcoins || 0) / 100)}</div>
                            <div class="stat-label">Compras</div>
                        </div>
                        <div class="stat">
                            <div class="stat-value">${rank === 1 ? 'VIP' : 'Premium'}</div>
                            <div class="stat-label">Rango</div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Error al cargar top compradores:', error);
        
        // Mostrar datos de ejemplo si hay error
        const topBuyers = [
            { name: 'Player1', tcoins: 5000, rank: 1 },
            { name: 'GamerPro', tcoins: 4200, rank: 2 },
            { name: 'MineCrafter', tcoins: 3800, rank: 3 },
            { name: 'BedrockKing', tcoins: 3500, rank: 4 },
            { name: 'SurvivalPro', tcoins: 3200, rank: 5 }
        ];
        
        topBuyersContainer.innerHTML = topBuyers.map(buyer => `
            <div class="buyer-card">
                <div class="buyer-rank">#${buyer.rank}</div>
                <div class="buyer-info">
                    <img src="https://mc-heads.net/head/Steve" 
                         alt="${buyer.name}" 
                         class="buyer-avatar">
                    <div>
                        <div class="buyer-name">${buyer.name}</div>
                        <div class="buyer-tcoins">
                            <i class="fas fa-coins"></i> ${buyer.tcoins.toLocaleString()} TCoins
                        </div>
                    </div>
                </div>
                <div class="buyer-stats">
                    <div class="stat">
                        <div class="stat-value">${Math.floor(buyer.tcoins / 100)}</div>
                        <div class="stat-label">Compras</div>
                    </div>
                    <div class="stat">
                        <div class="stat-value">${buyer.rank === 1 ? 'VIP' : 'Premium'}</div>
                        <div class="stat-label">Rango</div>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Setup de eventos generales
function setupEventListeners() {
    // Toggle del menú móvil
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.innerHTML = navMenu.classList.contains('active') 
                ? '<i class="fas fa-times"></i>' 
                : '<i class="fas fa-bars"></i>';
        });
    }
    
    // Cerrar menú al hacer clic en un enlace
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu?.classList.remove('active');
            if (navToggle) {
                navToggle.innerHTML = '<i class="fas fa-bars"></i>';
            }
        });
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', (e) => {
        if (navMenu?.classList.contains('active') && 
            !navMenu.contains(e.target) && 
            !navToggle?.contains(e.target)) {
            navMenu.classList.remove('active');
            navToggle.innerHTML = '<i class="fas fa-bars"></i>';
        }
    });
    
    // Actualizar cada minuto para mantener datos frescos
    setInterval(async () => {
        if (currentUser) {
            await checkAuth();
            updateNavAuth();
        }
    }, 60000);
}

// Función de utilidad para mostrar errores
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message,
        background: '#0b0a15',
        color: '#ffffff',
        confirmButtonColor: '#fec600',
        confirmButtonText: 'Aceptar'
    });
}

// Función de utilidad para mostrar éxito
function showSuccess(message, callback) {
    Swal.fire({
        icon: 'success',
        title: '¡Éxito!',
        text: message,
        background: '#0b0a15',
        color: '#ffffff',
        confirmButtonColor: '#fec600',
        confirmButtonText: 'Aceptar'
    }).then((result) => {
        if (result.isConfirmed && callback) {
            callback();
        }
    });
}

// Función para mostrar confirmación
function showConfirm(message, confirmCallback, cancelCallback) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#fec600',
        cancelButtonColor: '#6c6b80',
        confirmButtonText: 'Sí, continuar',
        cancelButtonText: 'Cancelar',
        background: '#0b0a15',
        color: '#ffffff'
    }).then((result) => {
        if (result.isConfirmed) {
            if (confirmCallback) confirmCallback();
        } else if (cancelCallback) {
            cancelCallback();
        }
    });
}

// Función para formatear fecha
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para cargar imagen con fallback
function loadImageWithFallback(imgElement, url, fallbackUrl) {
    imgElement.src = url;
    imgElement.onerror = () => {
        imgElement.src = fallbackUrl;
    };
}

// Función para verificar si estamos en panel admin
function isAdminPanel() {
    return window.location.pathname.includes('/admin/');
}

// Función para obtener el ID del usuario actual
function getCurrentUserId() {
    return currentUser?.id || null;
}

// Función para obtener el email del usuario actual
function getCurrentUserEmail() {
    return currentUser?.email || null;
}

// Función para verificar si el usuario está autenticado
function isAuthenticated() {
    return currentUser !== null;
}

// Función para obtener datos del perfil del usuario actual
async function getCurrentUserProfile() {
    if (!currentUser || !supabase) return null;
    
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
        
        if (error) {
            console.error('Error al obtener perfil:', error);
            return null;
        }
        
        return data;
    } catch (error) {
        console.error('Error en getCurrentUserProfile:', error);
        return null;
    }
}

// Función para actualizar el perfil del usuario actual
async function updateCurrentUserProfile(updates) {
    if (!currentUser || !supabase) return false;
    
    try {
        const { error } = await supabase
            .from('profiles')
            .update({
                ...updates,
                updated_at: new Date().toISOString()
            })
            .eq('id', currentUser.id);
        
        if (error) {
            console.error('Error al actualizar perfil:', error);
            return false;
        }
        
        return true;
    } catch (error) {
        console.error('Error en updateCurrentUserProfile:', error);
        return false;
    }
}

// Exportar para uso en otros módulos
window.supabase = supabase;
window.supabase2 = supabase2;
window.currentUser = currentUser;
window.showError = showError;
window.showSuccess = showSuccess;
window.showConfirm = showConfirm;
window.formatDate = formatDate;
window.checkAdminStatus = checkAdminStatus;
window.getCurrentUserId = getCurrentUserId;
window.getCurrentUserEmail = getCurrentUserEmail;
window.isAuthenticated = isAuthenticated;
window.getCurrentUserProfile = getCurrentUserProfile;
window.updateCurrentUserProfile = updateCurrentUserProfile;
window.isAdminPanel = isAdminPanel;

// Asegurarse de que las funciones estén disponibles globalmente
document.addEventListener('DOMContentLoaded', () => {
    // Añadir estilos adicionales
    const style = document.createElement('style');
    style.textContent = `
        .user-email {
            color: #b0b0c0;
            font-size: 0.875rem;
            padding: 0.5rem;
            max-width: 150px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        @media (max-width: 768px) {
            .user-email {
                display: none;
            }
        }
        
        .buyer-avatar {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid #fec600;
            object-fit: cover;
        }
        
        .error-message {
            text-align: center;
            padding: 2rem;
            color: #f44336;
        }
        
        .error-message i {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        
        /* Estilos para enlaces admin en navegación */
        .nav-link[href*="admin"] {
            color: #fec600 !important;
            background-color: rgba(254, 198, 0, 0.1) !important;
        }
        
        .nav-link[href*="admin"]:hover {
            background-color: rgba(254, 198, 0, 0.2) !important;
        }
        
        .nav-link[href*="admin"] i {
            color: #fec600 !important;
        }
    `;
    document.head.appendChild(style);
});