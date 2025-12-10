// En handleRegister function, después de las validaciones básicas:
const skinUrl = document.getElementById('skinUrl')?.value.trim() || '';

// Validar skin URL
if (!skinUrl) {
    showError('Debes seleccionar una skin para tu personaje');
    return;
}

if (!isValidSkinUrl(skinUrl)) {
    showError('La URL de la skin no es válida. Usa una de las predeterminadas o una URL de imagen válida.');
    return;
}

// Inicializar formularios de autenticación
document.addEventListener('DOMContentLoaded', () => {
    setupAuthForms();
    setupPasswordStrength();
});

function setupAuthForms() {
    // Formulario de Login
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    // Formulario de Registro
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', handleRegister);
    }
    
    // Formulario de Recuperación
    const recoveryForm = document.getElementById('recoveryForm');
    if (recoveryForm) {
        recoveryForm.addEventListener('submit', handleRecovery);
    }
}

// Configurar indicador de fuerza de contraseña
function setupPasswordStrength() {
    const passwordInput = document.getElementById('password');
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    if (!passwordInput || !strengthFill || !strengthText) return;
    
    passwordInput.addEventListener('input', function() {
        const password = this.value;
        const strength = calculatePasswordStrength(password);
        
        // Actualizar barra de fuerza
        strengthFill.style.width = `${strength.percentage}%`;
        strengthFill.className = `strength-fill ${strength.class}`;
        
        // Actualizar texto
        strengthText.textContent = strength.text;
        strengthText.style.color = strength.color;
    });
}

// Calcular fuerza de contraseña
function calculatePasswordStrength(password) {
    let score = 0;
    
    // Longitud mínima
    if (password.length >= 8) score += 25;
    if (password.length >= 12) score += 25;
    
    // Caracteres variados
    if (/[A-Z]/.test(password)) score += 15;
    if (/[a-z]/.test(password)) score += 15;
    if (/[0-9]/.test(password)) score += 15;
    if (/[^A-Za-z0-9]/.test(password)) score += 15;
    
    // Determinar nivel
    if (score >= 80) {
        return {
            percentage: 100,
            class: 'strength-strong',
            text: 'Contraseña fuerte',
            color: '#00c853'
        };
    } else if (score >= 50) {
        return {
            percentage: 66,
            class: 'strength-medium',
            text: 'Contraseña media',
            color: '#ff9800'
        };
    } else if (score >= 25) {
        return {
            percentage: 33,
            class: 'strength-weak',
            text: 'Contraseña débil',
            color: '#f44336'
        };
    } else {
        return {
            percentage: 0,
            class: '',
            text: 'Ingresa una contraseña',
            color: '#b0b0c0'
        };
    }
}

// Manejar Login
async function handleLogin(e) {
    e.preventDefault();
    
    if (!window.supabase) {
        showError('Error de conexión. Por favor, recarga la página.');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    // Validaciones básicas
    if (!email || !password) {
        showError('Por favor, completa todos los campos');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando...';
    submitBtn.disabled = true;
    
    try {
        const { data, error } = await window.supabase.auth.signInWithPassword({
            email,
            password
        });
        
        if (error) throw error;
        
        showSuccess('¡Inicio de sesión exitoso!', () => {
            // Redirigir según la página de origen
            const urlParams = new URLSearchParams(window.location.search);
            const redirect = urlParams.get('redirect') || 'perfil.html';
            window.location.href = redirect;
        });
        
    } catch (error) {
        console.error('Error en login:', error);
        
        // Mensajes de error específicos
        let errorMessage = 'Error al iniciar sesión';
        if (error.message.includes('Invalid login credentials')) {
            errorMessage = 'Email o contraseña incorrectos';
        } else if (error.message.includes('Email not confirmed')) {
            errorMessage = 'Por favor, confirma tu email antes de iniciar sesión';
        } else {
            errorMessage = error.message;
        }
        
        showError(errorMessage);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar Registro
async function handleRegister(e) {
    e.preventDefault();
    
    if (!window.supabase) {
        showError('Error de conexión. Por favor, recarga la página.');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const nick = document.getElementById('nick').value.trim();
    const skinUrl = document.getElementById('skinUrl')?.value.trim() || '';
    
    // Validaciones
    if (!email || !password || !confirmPassword || !nick) {
        showError('Por favor, completa todos los campos obligatorios');
        return;
    }
    
    if (password !== confirmPassword) {
        showError('Las contraseñas no coinciden');
        return;
    }
    
    if (password.length < 6) {
        showError('La contraseña debe tener al menos 6 caracteres');
        return;
    }
    
    if (nick.length < 3 || nick.length > 20) {
        showError('El nick debe tener entre 3 y 20 caracteres');
        return;
    }
    
    // Validar skin URL si se proporciona
    if (skinUrl && !isValidUrl(skinUrl)) {
        showError('La URL de la skin no es válida');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registrando...';
    submitBtn.disabled = true;
    
    try {
        // 1. Registrar usuario en Supabase Auth
        const { data: authData, error: authError } = await window.supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    nick,
                    skin_url: skinUrl
                },
                emailRedirectTo: `${window.location.origin}/login.html`
            }
        });
        
        if (authError) throw authError;
        
        // 2. Crear perfil en la base de datos
        if (authData.user) {
            // Intentar con la primera base de datos
            try {
                const { error: profileError } = await window.supabase
                    .from('profiles')
                    .insert({
                        id: authData.user.id,
                        nick: nick,
                        skin_url: skinUrl || null,
                        tcoins: 50, // Bonificación de bienvenida
                        role: 'user',
                        banned: false
                    });
                
                if (profileError) {
                    console.warn('Error al crear perfil en DB1:', profileError);
                }
            } catch (profileError) {
                console.warn('Error en creación de perfil DB1:', profileError);
            }
            
            // Intentar con la segunda base de datos
            try {
                if (window.supabase2) {
                    const { error: profileError2 } = await window.supabase2
                        .from('user_profiles')
                        .insert({
                            id: authData.user.id,
                            nick: nick,
                            skin_url: skinUrl || null,
                            preferences: {},
                            created_at: new Date().toISOString()
                        });
                    
                    if (profileError2) {
                        console.warn('Error al crear perfil en DB2:', profileError2);
                    }
                }
            } catch (profileError2) {
                console.warn('Error en creación de perfil DB2:', profileError2);
            }
        }
        
        // 3. Registrar evento de registro
        try {
            if (window.supabase2) {
                await window.supabase2
                    .from('user_events')
                    .insert({
                        user_id: authData.user.id,
                        event_type: 'register',
                        event_data: { email, nick },
                        created_at: new Date().toISOString()
                    });
            }
        } catch (eventError) {
            console.warn('Error al registrar evento:', eventError);
        }
        
        showSuccess('¡Registro exitoso! Se ha enviado un email de confirmación a tu correo. Revisa tu bandeja de entrada y spam.', () => {
            window.location.href = 'login.html';
        });
        
    } catch (error) {
        console.error('Error en registro:', error);
        
        let errorMessage = 'Error al registrarse';
        if (error.message.includes('User already registered')) {
            errorMessage = 'Este email ya está registrado';
        } else if (error.message.includes('Password should be at least')) {
            errorMessage = 'La contraseña debe tener al menos 6 caracteres';
        } else {
            errorMessage = error.message;
        }
        
        showError(errorMessage);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Manejar Recuperación de Contraseña
async function handleRecovery(e) {
    e.preventDefault();
    
    if (!window.supabase) {
        showError('Error de conexión. Por favor, recarga la página.');
        return;
    }
    
    const email = document.getElementById('email').value.trim();
    
    if (!email) {
        showError('Por favor, ingresa tu email');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
    submitBtn.disabled = true;
    
    try {
        const { error } = await window.supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/recuperar.html?action=reset`
        });
        
        if (error) throw error;
        
        showSuccess('Se ha enviado un enlace de recuperación a tu email. Revisa tu bandeja de entrada y spam.');
        
    } catch (error) {
        console.error('Error en recuperación:', error);
        showError('Error al enviar el email de recuperación: ' + error.message);
    } finally {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Validar URL
function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Manejar reset de contraseña desde el enlace
async function handlePasswordReset() {
    const urlParams = new URLSearchParams(window.location.search);
    const action = urlParams.get('action');
    
    if (action === 'reset' && window.supabase) {
        try {
            const { data, error } = await window.supabase.auth.getSession();
            
            if (error) throw error;
            
            if (data.session) {
                // Mostrar formulario para nueva contraseña
                showPasswordResetForm();
            }
        } catch (error) {
            console.error('Error en reset de contraseña:', error);
        }
    }
}

function showPasswordResetForm() {
    const authCard = document.querySelector('.auth-card');
    if (!authCard) return;
    
    authCard.innerHTML = `
        <div class="recovery-icon">
            <i class="fas fa-key"></i>
        </div>
        
        <div class="auth-header">
            <h2>Nueva Contraseña</h2>
            <p>Crea una nueva contraseña para tu cuenta</p>
        </div>
        
        <form id="resetPasswordForm" class="auth-form">
            <div class="form-group">
                <label for="newPassword">
                    <i class="fas fa-lock"></i> Nueva Contraseña
                </label>
                <input type="password" id="newPassword" name="newPassword" required 
                       placeholder="••••••••" minlength="6">
            </div>
            
            <div class="form-group">
                <label for="confirmNewPassword">
                    <i class="fas fa-lock"></i> Confirmar Nueva Contraseña
                </label>
                <input type="password" id="confirmNewPassword" name="confirmNewPassword" required 
                       placeholder="••••••••" minlength="6">
            </div>
            
            <button type="submit" class="btn btn-primary btn-block">
                <i class="fas fa-save"></i> Guardar Nueva Contraseña
            </button>
        </form>
    `;
    
    // Configurar el nuevo formulario
    const resetForm = document.getElementById('resetPasswordForm');
    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;
            
            if (newPassword !== confirmNewPassword) {
                showError('Las contraseñas no coinciden');
                return;
            }
            
            if (newPassword.length < 6) {
                showError('La contraseña debe tener al menos 6 caracteres');
                return;
            }
            
            const submitBtn = e.target.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
            submitBtn.disabled = true;
            
            try {
                const { error } = await window.supabase.auth.updateUser({
                    password: newPassword
                });
                
                if (error) throw error;
                
                showSuccess('¡Contraseña actualizada correctamente! Ahora puedes iniciar sesión.', () => {
                    window.location.href = 'login.html';
                });
                
            } catch (error) {
                showError('Error al actualizar la contraseña: ' + error.message);
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }
        });
    }
}

// Inicializar reset de contraseña si es necesario
if (window.location.pathname.includes('recuperar.html')) {
    document.addEventListener('DOMContentLoaded', handlePasswordReset);
}
// Validar URL de skin
function isValidSkinUrl(string) {
    try {
        new URL(string);
        
        // Aceptar URLs de mc-heads.net o cualquier imagen
        const validExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];
        const isImageUrl = validExtensions.some(ext => string.toLowerCase().includes(ext));
        const isMinecraftHead = string.includes('mc-heads.net');
        
        return isImageUrl || isMinecraftHead;
    } catch (_) {
        return false;
    }
}