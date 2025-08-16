// Navigation mobile
const hamburger = document.querySelector('.hamburger');
const navMenu = document.querySelector('.nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('active');
});

// Fermer le menu mobile quand on clique sur un lien
document.querySelectorAll('.nav-link').forEach(n => n.addEventListener('click', () => {
    hamburger.classList.remove('active');
    navMenu.classList.remove('active');
}));

// Navigation smooth scroll
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Animation de la navbar au scroll
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.style.background = 'rgba(10, 10, 10, 0.98)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.3)';
    } else {
        navbar.style.background = 'rgba(10, 10, 10, 0.95)';
        navbar.style.boxShadow = 'none';
    }
});

// Effet de particules Minecraft au clic
function createMinecraftParticles(x, y) {
    const blockImages = [
        'src/img/dirt.png',
        'src/img/stone.png',
        'src/img/oak_log.png',
        'src/img/crafting_table_top.png',
        'src/img/diamond_ore.png',
        'src/img/redstone_ore.png',
        'src/img/amethyst_block.png'
    ];
    
    // Probabilités pour chaque type de bloc (plus de blocs de base, moins de minerais)
    const blockWeights = [
        30, // dirt (30% de chance)
        25, // stone (25% de chance)
        20, // oak_log (20% de chance)
        10, // crafting_table_top (10% de chance)
        6,  // diamond_ore (6% de chance)
        6,  // redstone_ore (6% de chance)
        3   // amethyst_block (3% de chance)
    ];
    
    const particleCount = 6 + Math.floor(Math.random() * 3); // 6-8 particules
    
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'minecraft-particle';
        
        // Sélection aléatoire basée sur les poids
        const randomValue = Math.random() * 100;
        let cumulativeWeight = 0;
        let selectedIndex = 0;
        
        for (let j = 0; j < blockWeights.length; j++) {
            cumulativeWeight += blockWeights[j];
            if (randomValue <= cumulativeWeight) {
                selectedIndex = j;
                break;
            }
        }
        
        const randomImage = blockImages[selectedIndex];
        
        // Position initiale
        const startX = x + (Math.random() - 0.5) * 30;
        const startY = y + (Math.random() - 0.5) * 30;
        
        // Vitesse aléatoire (plus rapide)
        const velocityX = (Math.random() - 0.5) * 6; // Augmenté de 4 à 6
        const velocityY = (Math.random() - 0.5) * 6 - 1.5; // Augmenté de 4 à 6, plus de force vers le haut
        
        // Taille aléatoire (plus gros)
        const size = 12 + Math.random() * 16; // Augmenté de 4-10 à 12-28
        
        // Rotation aléatoire
        const rotation = Math.random() * 360;
        
        // Styles de la particule
        particle.style.cssText = `
            position: fixed;
            left: ${startX}px;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background-image: url('${randomImage}');
            background-size: cover;
            background-repeat: no-repeat;
            background-position: center;
            pointer-events: none;
            z-index: 10000;
            transform: rotate(${rotation}deg);
            opacity: 1;
            transition: none;
            border-radius: 2px;
        `;
        
        document.body.appendChild(particle);
        
        // Animation de la particule
        let currentX = startX;
        let currentY = startY;
        let currentVelocityX = velocityX;
        let currentVelocityY = velocityY;
        let opacity = 1;
        let scale = 1;
        let gravity = 0.2; // Augmenté de 0.15 à 0.2 pour une chute plus rapide
        let friction = 0.995; // Augmenté de 0.99 à 0.995 pour moins de friction
        
        // Système basé sur le temps pour uniformiser la vitesse
        let lastTime = performance.now();
        const targetFPS = 60;
        const frameTime = 1000 / targetFPS;
        
        const animateParticle = (currentTime) => {
            // Calculer le delta time pour uniformiser la vitesse
            const deltaTime = currentTime - lastTime;
            const timeScale = deltaTime / frameTime; // Normaliser à 60 FPS
            
            // Appliquer la gravité (ajustée pour le temps)
            currentVelocityY += gravity * timeScale;
            
            // Appliquer la friction (ajustée pour le temps)
            const frictionPerFrame = Math.pow(friction, timeScale);
            currentVelocityX *= frictionPerFrame;
            currentVelocityY *= frictionPerFrame;
            
            // Mettre à jour la position
            currentX += currentVelocityX * timeScale;
            currentY += currentVelocityY * timeScale;
            
            // Réduire l'opacité et la taille (ajustées pour le temps)
            opacity -= 0.01 * timeScale;
            scale -= 0.005 * timeScale;
            
            // Mettre à jour les styles
            particle.style.left = currentX + 'px';
            particle.style.top = currentY + 'px';
            particle.style.opacity = opacity;
            particle.style.transform = `rotate(${rotation + (currentTime * 0.05)}deg) scale(${scale})`;
            
            // Arrêter l'animation quand la particule devient invisible
            if (opacity <= 0 || scale <= 0) {
                particle.remove();
                return;
            }
            
            lastTime = currentTime;
            requestAnimationFrame(animateParticle);
        };
        
        // Démarrer l'animation
        requestAnimationFrame(animateParticle);
    }
}

// Écouter les clics sur toute la page
document.addEventListener('click', (e) => {
    createMinecraftParticles(e.clientX, e.clientY);
});

// Fonction pour télécharger le launcher (redirection vers la page de téléchargement)
function downloadLauncher() {
    window.location.href = 'download';
}

// Fonction pour afficher les instructions d'installation
function showInstructions() {
    const instructions = `
        <div class="instructions-modal">
            <div class="instructions-content">
                <h3><i class="fas fa-info-circle"></i> Instructions d'installation</h3>
                <div class="instructions-steps">
                    <div class="step">
                        <span class="step-number">1</span>
                        <div class="step-content">
                            <h4>Téléchargez le launcher</h4>
                            <p>Cliquez sur "Télécharger le Launcher" pour obtenir le fichier d'installation.</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">2</span>
                        <div class="step-content">
                            <h4>Installez le launcher</h4>
                            <p>Exécutez le fichier téléchargé et suivez les instructions d'installation.</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">3</span>
                        <div class="step-content">
                            <h4>Lancez le jeu</h4>
                            <p>Ouvrez le launcher Valerium et cliquez sur "Jouer" pour vous connecter au serveur.</p>
                        </div>
                    </div>
                    <div class="step">
                        <span class="step-number">4</span>
                        <div class="step-content">
                            <h4>Créez votre compte</h4>
                            <p>Si c'est votre première connexion, créez votre compte et choisissez votre faction !</p>
                        </div>
                    </div>
                </div>
                <div class="instructions-requirements">
                    <h4><i class="fas fa-desktop"></i> Configuration requise</h4>
                    <ul>
                        <li><strong>OS:</strong> Windows 7+, macOS 10.12+, Linux</li>
                        <li><strong>RAM:</strong> 4 GB minimum (8 GB recommandé)</li>
                        <li><strong>Espace disque:</strong> 2 GB disponibles</li>
                        <li><strong>Java:</strong> Version 8 ou supérieure</li>
                    </ul>
                </div>
                <button class="btn btn-primary" onclick="closeInstructions()">
                    <i class="fas fa-check"></i>
                    Compris !
                </button>
            </div>
        </div>
    `;
    
    // Ajouter les styles pour la modal
    const style = document.createElement('style');
    style.textContent = `
        .instructions-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
            animation: fadeIn 0.3s ease;
        }
        
        .instructions-content {
            background: var(--card-bg);
            border-radius: 16px;
            padding: 2rem;
            max-width: 600px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 1px solid rgba(255, 255, 255, 0.1);
            animation: slideInUp 0.3s ease;
        }
        
        .instructions-content h3 {
            color: var(--primary-color);
            margin-bottom: 1.5rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .instructions-steps {
            margin-bottom: 2rem;
        }
        
        .step {
            display: flex;
            gap: 1rem;
            margin-bottom: 1.5rem;
            align-items: flex-start;
        }
        
        .step-number {
            background: var(--gradient-primary);
            color: white;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 700;
            flex-shrink: 0;
        }
        
        .step-content h4 {
            color: var(--text-primary);
            margin-bottom: 0.5rem;
        }
        
        .step-content p {
            color: var(--text-secondary);
            line-height: 1.5;
        }
        
        .instructions-requirements {
            background: var(--dark-bg);
            padding: 1.5rem;
            border-radius: 12px;
            margin-bottom: 2rem;
        }
        
        .instructions-requirements h4 {
            color: var(--primary-color);
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .instructions-requirements ul {
            list-style: none;
            padding: 0;
        }
        
        .instructions-requirements li {
            color: var(--text-secondary);
            margin-bottom: 0.5rem;
            padding-left: 1rem;
            position: relative;
        }
        
        .instructions-requirements li::before {
            content: '•';
            color: var(--primary-color);
            position: absolute;
            left: 0;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes slideInUp {
            from {
                opacity: 0;
                transform: translateY(50px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.insertAdjacentHTML('beforeend', instructions);
}

// Fonction pour fermer les instructions
function closeInstructions() {
    const modal = document.querySelector('.instructions-modal');
    if (modal) {
        modal.style.animation = 'fadeOut 0.3s ease';
        setTimeout(() => modal.remove(), 300);
    }
}

// Système de notifications
function showNotification(message, type = 'info') {
    // Supprimer les notifications existantes
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
        <button class="notification-close" onclick="this.parentElement.remove()">
            <i class="fas fa-times"></i>
        </button>
    `;

    // Styles pour la notification
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
        z-index: 10000;
        display: flex;
        align-items: center;
        gap: 1rem;
        max-width: 400px;
        animation: slideInRight 0.3s ease;
    `;

    document.body.appendChild(notification);

    // Auto-suppression après 5 secondes
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#4CAF50';
        case 'error': return '#f44336';
        case 'warning': return '#ff9800';
        default: return '#2196F3';
    }
}

// Animation d'apparition des éléments au scroll
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.opacity = '1';
            entry.target.style.transform = 'translateY(0)';
        }
    });
}, observerOptions);

// Observer tous les éléments avec animation
document.addEventListener('DOMContentLoaded', () => {
    const animatedElements = document.querySelectorAll('.server-card, .rule-card');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
});

// Compteur animé pour les statistiques
function animateCounter(element, target, duration = 2000) {
    let start = 0;
    const increment = target / (duration / 16);
    
    function updateCounter() {
        start += increment;
        if (start < target) {
            element.textContent = Math.floor(start) + (element.textContent.includes('+') ? '+' : '');
            requestAnimationFrame(updateCounter);
        } else {
            element.textContent = target + (element.textContent.includes('+') ? '+' : '');
        }
    }
    
    updateCounter();
}

// Animation des compteurs quand ils deviennent visibles
const counterObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const counter = entry.target.querySelector('.stat-number');
            const text = counter.textContent;
            const number = parseInt(text.replace(/\D/g, ''));
            
            if (number > 0) {
                counter.textContent = '0' + (text.includes('+') ? '+' : '');
                animateCounter(counter, number);
            }
            
            counterObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.5 });

document.addEventListener('DOMContentLoaded', () => {
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => counterObserver.observe(item));
});

// Effet de parallaxe sur le hero
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const hero = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    
    if (hero && heroContent) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
    }
});

// Préchargement des images
function preloadImages() {
    const images = ['src/img/valerium.png', 'src/img/icon.png'];
    images.forEach(src => {
        const img = new Image();
        img.src = src;
    });
}

// Initialisation
document.addEventListener('DOMContentLoaded', () => {
    preloadImages();
    
    // Ajouter des styles CSS pour les animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideInRight {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOutRight {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        @keyframes fadeOut {
            from { opacity: 1; }
            to { opacity: 0; }
        }
        
        .notification-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
        
        .notification-close {
            background: none;
            border: none;
            color: white;
            cursor: pointer;
            padding: 0;
            font-size: 1rem;
            opacity: 0.7;
            transition: opacity 0.3s ease;
        }
        
        .notification-close:hover {
            opacity: 1;
        }
        
        .minecraft-particle {
            position: fixed;
            pointer-events: none;
            z-index: 10000;
        }
    `;
    document.head.appendChild(style);
});

// Gestion des erreurs
window.addEventListener('error', (e) => {
    console.error('Erreur JavaScript:', e.error);
});

// Optimisation des performances
let ticking = false;

function updateOnScroll() {
    // Code pour les animations au scroll
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
}); 