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

// URLs GitHub pour les téléchargements (à remplacer par vos vraies URLs)
const GITHUB_RELEASE_URL = 'https://github.com/MidacoYT/Valerium-Launcher/releases/latest/download/';

// Fonction pour télécharger Windows
function downloadWindows() {
    const downloadUrl = GITHUB_RELEASE_URL + 'Valerium-Launcher-win-x64.exe';
    showNotification('Téléchargement du launcher Windows en cours...', 'info');
    
    // Créer un lien temporaire pour le téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Valerium-Launcher-win-x64.exe';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Simuler le succès (en production, vous pourriez tracker le téléchargement)
    setTimeout(() => {
        showNotification('Téléchargement Windows terminé !', 'success');
        updateDownloadStats('windows');
    }, 2000);
}

// Fonction pour télécharger macOS
function downloadMac() {
    const downloadUrl = GITHUB_RELEASE_URL + 'Valerium-Launcher-mac-universal.dmg';
    showNotification('Téléchargement du launcher macOS en cours...', 'info');
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Valerium-Launcher-mac-universal.dmg';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        showNotification('Téléchargement macOS terminé !', 'success');
        updateDownloadStats('mac');
    }, 2000);
}

// Fonction pour télécharger Linux
function downloadLinux() {
    const downloadUrl = GITHUB_RELEASE_URL + 'Valerium-Launcher-linux-x86_64.AppImage';
    showNotification('Téléchargement du launcher Linux en cours...', 'info');
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'Valerium-Launcher-linux-x86_64.AppImage';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setTimeout(() => {
        showNotification('Téléchargement Linux terminé !', 'success');
        updateDownloadStats('linux');
    }, 2000);
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

// Système d'onglets pour les instructions
function showTab(tabId) {
    // Masquer tous les panneaux
    const panels = document.querySelectorAll('.tab-panel');
    panels.forEach(panel => panel.classList.remove('active'));
    
    // Désactiver tous les boutons
    const buttons = document.querySelectorAll('.tab-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    // Activer le panneau et le bouton sélectionnés
    document.getElementById(tabId).classList.add('active');
    event.target.classList.add('active');
}

// Système FAQ
function toggleFAQ(element) {
    const faqItem = element.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = element.querySelector('i');
    
    // Fermer toutes les autres FAQ
    const allFaqItems = document.querySelectorAll('.faq-item');
    allFaqItems.forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            const otherAnswer = item.querySelector('.faq-answer');
            const otherIcon = item.querySelector('.faq-question i');
            otherAnswer.style.maxHeight = '0';
            otherIcon.style.transform = 'rotate(0deg)';
        }
    });
    
    // Basculer l'état actuel
    faqItem.classList.toggle('active');
    
    if (faqItem.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = '0';
        icon.style.transform = 'rotate(0deg)';
    }
}

// Mise à jour des statistiques de téléchargement (simulation)
function updateDownloadStats(platform) {
    const statsElements = {
        windows: document.querySelector('.download-card.windows .download-stats span'),
        mac: document.querySelector('.download-card.mac .download-stats span'),
        linux: document.querySelector('.download-card.linux .download-stats span')
    };
    
    const element = statsElements[platform];
    if (element) {
        const currentText = element.textContent;
        const currentNumber = parseInt(currentText.match(/\d+/)[0]);
        const newNumber = currentNumber + 1;
        element.innerHTML = `<i class="fas fa-download"></i> ${newNumber.toLocaleString()} téléchargements`;
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
    const animatedElements = document.querySelectorAll('.download-card, .faq-item');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
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
        
        .tab-panel {
            display: none;
        }
        
        .tab-panel.active {
            display: block;
        }
        
        .faq-answer {
            max-height: 0;
            overflow: hidden;
            transition: max-height 0.3s ease;
        }
        
        .faq-question i {
            transition: transform 0.3s ease;
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
    ticking = false;
}

window.addEventListener('scroll', () => {
    if (!ticking) {
        requestAnimationFrame(updateOnScroll);
        ticking = true;
    }
}); 