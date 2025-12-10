/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

const { ipcRenderer } = require('electron')
const { Status } = require('minecraft-java-core')
const fs = require('fs');
const pkg = require('../package.json');

import config from './utils/config.js';
import database from './utils/database.js';
import logger from './utils/logger.js';
import popup from './utils/popup.js';
import { skin2D } from './utils/skin.js';
import slider from './utils/slider.js';

async function setBackground(theme) {
    if (typeof theme == 'undefined') {
        let databaseLauncher = new database();
        let configClient = await databaseLauncher.readData('configClient');
        theme = configClient?.launcher_config?.theme || "auto"
        theme = await ipcRenderer.invoke('is-dark-theme', theme).then(res => res)
    }
    let background
    let body = document.body;
    body.className = theme ? 'dark global' : 'light global';
    if (fs.existsSync(`${__dirname}/assets/images/background/easterEgg`) && Math.random() < 0.005) {
        let backgrounds = fs.readdirSync(`${__dirname}/assets/images/background/easterEgg`);
        let Background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        background = `url(./assets/images/background/easterEgg/${Background})`;
    } else if (fs.existsSync(`${__dirname}/assets/images/background/${theme ? 'dark' : 'light'}`)) {
        let backgrounds = fs.readdirSync(`${__dirname}/assets/images/background/${theme ? 'dark' : 'light'}`);
        let Background = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        background = `linear-gradient(#00000080, #00000080), url(./assets/images/background/${theme ? 'dark' : 'light'}/${Background})`;
    }
    if (background) {
        body.style.backgroundImage = background;
        body.style.backgroundSize = 'cover';
        body.style.backgroundColor = '';
    } else {
        // Aucun asset d'arrière-plan trouvé: utilise une couleur unie fiable
        body.style.backgroundImage = 'none';
        body.style.backgroundColor = theme ? '#000' : '#fff';
        body.style.backgroundSize = '';
    }
}

async function changePanel(id) {
    let panel = document.querySelector(`.${id}`);
    let active = document.querySelector(`.active`)
    if (active) active.classList.toggle("active");
    if (panel) panel.classList.add("active");
    
    // Gérer l'affichage de la sidebar
    if (window.toggleSidebarVisibility) {
        window.toggleSidebarVisibility(id);
    }
}

async function appdata() {
    return await ipcRenderer.invoke('appData').then(path => path)
}

async function addAccount(data) {
    let skin = false
    if (data?.profile?.skins[0]?.base64) {
        try {
            skin = await new skin2D().creatHeadTexture(data.profile.skins[0].base64);
        } catch (error) {
            console.error('Erreur lors de la génération du skin:', error);
            skin = false;
        }
    }
    
    let accountsList = document.querySelector('.accounts-list');
    if(!accountsList) return; // Sécurité si la liste n'existe pas

    let div = document.createElement("div");
    div.classList.add("account");
    div.id = data.ID;
    div.innerHTML = `
        <div class="profile-image" ${skin ? 'style="background-image: url(' + skin + ');"' : ''}></div>
        <div class="profile-infos">
            <div class="profile-pseudo">${data.name}</div>
            <div class="profile-uuid">${data.uuid}</div>
        </div>
        <div class="delete-profile" id="${data.ID}">
            <div class="icon-account-delete delete-profile-icon"></div>
        </div>
    `
    return accountsList.appendChild(div);
}

async function accountSelect(data) {
    let account = document.getElementById(`${data.ID}`);
    let activeAccount = document.querySelector('.account-select')

    if (activeAccount) activeAccount.classList.toggle('account-select');
    if (account) account.classList.add('account-select');
    
    if (data?.profile?.skins[0]?.base64) headplayer(data.profile.skins[0].base64);
    
    // Mise à jour des informations dans la sidebar
    updateSidebarUserInfo(data);
}

async function updateSidebarUserInfo(data) {
    const playerName = document.querySelector('.sidebar .player-name');
    const playerStatus = document.querySelector('.sidebar .player-status');
    const playerHead = document.querySelector('.sidebar .player-head');
    
    if (playerName) {
        playerName.textContent = data?.name || 'Joueur';
    }
    
    if (playerStatus) {
        if (data?.name) {
            playerStatus.textContent = 'Connecté';
            playerStatus.style.color = 'var(--success-color)';
        } else {
            playerStatus.textContent = 'Non connecté';
            playerStatus.style.color = 'var(--color-muted)';
        }
    }
    
    if (playerHead) {
        if (data?.profile?.skins[0]?.base64) {
            try {
                let skin = await new skin2D().creatHeadTexture(data.profile.skins[0].base64);
                playerHead.style.backgroundImage = `url(${skin})`;
            } catch (error) {
                console.error('Erreur lors de la mise à jour du skin dans la sidebar:', error);
                playerHead.style.backgroundImage = `url('../images/default/setve.png')`;
            }
        } else {
            playerHead.style.backgroundImage = `url('../images/default/setve.png')`;
        }
    }
}

async function headplayer(skinBase64) {
    let headElement = document.querySelector(".player-head");
    if(!headElement) return;

    try {
        let skin = await new skin2D().creatHeadTexture(skinBase64);
        headElement.style.backgroundImage = `url(${skin})`;
    } catch(err) {
        console.error(err);
    }
}

// --- FONCTION CORRIGÉE POUR LE NOUVEAU DESIGN ---
async function setStatus(opt) {
    // Sélection des nouveaux éléments HTML (Glassmorphism design)
    let statusDot = document.querySelector('.status-dot');
    let countVal = document.querySelector('.count-val');
    let serverName = document.querySelector('.server-name');

    // Sécurité : Si les éléments n'existent pas (ex: on n'est pas sur Home), on arrête.
    if (!statusDot || !countVal) return;

    // État par défaut (Pas d'info ou Offline)
    if (!opt) {
        statusDot.classList.remove('online');
        countVal.innerHTML = '0';
        if(serverName) serverName.innerHTML = 'Hors Ligne';
        return;
    }

    let { ip, port, nameServer } = opt;
    
    // Mise à jour du nom si disponible
    if(serverName && nameServer) serverName.innerHTML = nameServer;

    try {
        let status = new Status(ip, port);
        let statusServer = await status.getStatus();

        if (!statusServer.error) {
            // Serveur EN LIGNE
            statusDot.classList.add('online');
            // Gère playersConnect ou players.online selon la version de la lib
            let players = statusServer.playersConnect || (statusServer.players ? statusServer.players.online : 0);
            countVal.innerHTML = players;
        } else {
            // Serveur HORS LIGNE (Erreur ping)
            statusDot.classList.remove('online');
            countVal.innerHTML = '0';
        }
    } catch (err) {
        // En cas d'erreur critique
        statusDot.classList.remove('online');
        countVal.innerHTML = '0';
        console.error("Erreur Ping Serveur:", err);
    }
}

async function clearAllSessionData() {
    try {
        // Nettoyer localStorage et sessionStorage
        localStorage.clear();
        sessionStorage.clear();
        
        // Nettoyer les cookies
        document.cookie.split(";").forEach(function(c) { 
            document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Forcer le nettoyage du cache d'Electron
        if (window.electronAPI) {
            try {
                await window.electronAPI.clearCache();
            } catch (e) {
                console.log('Impossible de nettoyer le cache Electron:', e);
            }
        }
        
        console.log('Toutes les données de session ont été nettoyées');
    } catch (error) {
        console.error('Erreur lors du nettoyage des données de session:', error);
    }
}

export {
    appdata as appdata,
    changePanel as changePanel,
    config as config,
    database as database,
    logger as logger,
    popup as popup,
    setBackground as setBackground,
    skin2D as skin2D,
    addAccount as addAccount,
    accountSelect as accountSelect,
    updateSidebarUserInfo as updateSidebarUserInfo,
    slider as Slider,
    pkg as pkg,
    setStatus as setStatus,
    clearAllSessionData as clearAllSessionData
}