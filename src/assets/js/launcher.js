/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */
// import panel
import Login from './panels/login.js';
import Home from './panels/home.js';
import Settings from './panels/settings.js';

// import modules
import { logger, config, changePanel, database, popup, setBackground, accountSelect, addAccount, updateSidebarUserInfo, pkg } from './utils.js';
const { AZauth, Microsoft, Mojang } = require('minecraft-java-core');

// libs
const { ipcRenderer } = require('electron');
const fs = require('fs');
const os = require('os');

// Fonction pour gérer l'affichage de la sidebar
function toggleSidebarVisibility(panelId) {
    const sidebar = document.querySelector('.sidebar');
    const mainContent = document.querySelector('.main-content');
    const dragbar = document.querySelector('.dragbar');
    
    if (panelId === 'login') {
        // Masquer seulement la sidebar et la barre de titre sur la page de connexion
        if (sidebar) sidebar.style.display = 'none';
        if (dragbar) dragbar.style.display = 'none';
        // Le contenu principal reste visible pour la page de connexion
        if (mainContent) {
            mainContent.style.marginLeft = '0';
            mainContent.style.width = '100%';
        }
    } else {
        // Afficher la sidebar et ajuster le contenu principal pour les autres pages
        if (sidebar) sidebar.style.display = 'flex';
        if (dragbar) dragbar.style.display = 'block';
        if (mainContent) {
            // Vérifier si la sidebar est rétractée et respecter cet état
            const isCollapsed = sidebar.classList.contains('collapsed');
            const sidebarWidth = isCollapsed ? '80px' : '280px';
            mainContent.style.marginLeft = sidebarWidth;
            mainContent.style.width = `calc(100% - ${sidebarWidth})`;
        }
        if (dragbar) {
            // Ajuster la dragbar selon l'état de la sidebar
            const isCollapsed = sidebar.classList.contains('collapsed');
            const sidebarWidth = isCollapsed ? '80px' : '280px';
            dragbar.style.left = sidebarWidth;
            dragbar.style.width = `calc(100% - ${sidebarWidth})`;
        }
    }
}

// Rendre la fonction globale
window.toggleSidebarVisibility = toggleSidebarVisibility;

class Launcher {
    async init() {
        this.initLog();
        console.log('Initializing Launcher...');
        this.shortcut()
        await setBackground()
        this.initFrame();
        this.initSidebar();
        this.config = await config.GetConfig().then(res => res).catch(err => err);
        if (await this.config.error) return this.errorConnect()
        this.db = new database();
        await this.initConfigClient();
        this.createPanels(Login, Home, Settings);
        this.startLauncher();
    }

    initLog() {
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.shiftKey && e.keyCode == 73 || e.keyCode == 123) {
                ipcRenderer.send('main-window-dev-tools-close');
                ipcRenderer.send('main-window-dev-tools');
            }
        })
        new logger(pkg.name, '#7289da')
    }

    shortcut() {
        document.addEventListener('keydown', e => {
            if (e.ctrlKey && e.keyCode == 87) {
                ipcRenderer.send('main-window-close');
            }
        })
    }


    errorConnect() {
        new popup().openPopup({
            title: this.config.error.code,
            content: this.config.error.message,
            color: 'red',
            exit: true,
            options: true
        });
    }

    initFrame() {
        console.log('Initializing Frame...')
        const platform = os.platform() === 'darwin' ? "darwin" : "other";

        document.querySelector(`.${platform} .frame`).classList.toggle('hide')

        document.querySelector(`.${platform} .frame #minimize`).addEventListener('click', () => {
            ipcRenderer.send('main-window-minimize');
        });

        let maximized = false;
        let maximize = document.querySelector(`.${platform} .frame #maximize`);
        maximize.addEventListener('click', () => {
            if (maximized) ipcRenderer.send('main-window-maximize')
            else ipcRenderer.send('main-window-maximize');
            maximized = !maximized
            maximize.classList.toggle('icon-maximize')
            maximize.classList.toggle('icon-restore-down')
        });

        document.querySelector(`.${platform} .frame #close`).addEventListener('click', () => {
            ipcRenderer.send('main-window-close');
        })
    }

    initSidebar() {
        console.log('Initializing Sidebar...')
        
        // Gestion de la navigation de la sidebar utilisant les éléments existants
        const navItems = document.querySelectorAll('.sidebar .nav-settings-btn');
        
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                
                // Retirer la classe active de tous les éléments
                navItems.forEach(nav => nav.classList.remove('active-settings-BTN'));
                
                // Ajouter la classe active à l'élément cliqué
                item.classList.add('active-settings-BTN');
                
                // Changer de panel
                const panel = item.getAttribute('data-panel');
                changePanel(panel);
            });
        });

        // Gestion du bouton settings dans la sidebar
        const sidebarSettingsBtn = document.querySelector('.sidebar-settings-btn');
        if (sidebarSettingsBtn) {
            sidebarSettingsBtn.addEventListener('click', () => {
                // Changer vers le panel settings
                changePanel('settings');
            });
        }

        // Gestion du toggle de la sidebar
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const dragbar = document.querySelector('.dragbar');
        
        if (sidebarToggle) {
            sidebarToggle.addEventListener('click', () => {
                const isCollapsed = sidebar.classList.contains('collapsed');
                
                if (isCollapsed) {
                    // Étendre la sidebar
                    sidebar.classList.remove('collapsed');
                    mainContent.classList.remove('sidebar-collapsed');
                    dragbar.classList.remove('sidebar-collapsed');
                    
                    // Ajuster les styles inline pour s'assurer qu'ils s'appliquent
                    mainContent.style.marginLeft = '280px';
                    mainContent.style.width = 'calc(100% - 280px)';
                    dragbar.style.left = '280px';
                    dragbar.style.width = 'calc(100% - 280px)';
                } else {
                    // Rétracter la sidebar
                    sidebar.classList.add('collapsed');
                    mainContent.classList.add('sidebar-collapsed');
                    dragbar.classList.add('sidebar-collapsed');
                    
                    // Ajuster les styles inline pour s'assurer qu'ils s'appliquent
                    mainContent.style.marginLeft = '80px';
                    mainContent.style.width = 'calc(100% - 80px)';
                    dragbar.style.left = '80px';
                    dragbar.style.width = 'calc(100% - 80px)';
                }
                
                // Sauvegarder l'état dans le localStorage
                localStorage.setItem('sidebarCollapsed', !isCollapsed);
            });
            
            // Restaurer l'état de la sidebar au chargement
            const savedState = localStorage.getItem('sidebarCollapsed');
            if (savedState === 'true') {
                sidebar.classList.add('collapsed');
                mainContent.classList.add('sidebar-collapsed');
                dragbar.classList.add('sidebar-collapsed');
                
                // Appliquer les styles inline au chargement
                mainContent.style.marginLeft = '80px';
                mainContent.style.width = 'calc(100% - 80px)';
                dragbar.style.left = '80px';
                dragbar.style.width = 'calc(100% - 80px)';
            }
        }

        // Mise à jour du profil utilisateur
        this.updateUserProfile();
    }

    updateUserProfile() {
        // Cette méthode sera appelée pour mettre à jour les informations du profil utilisateur
        // Elle sera utilisée quand un utilisateur se connecte
        const playerOptions = document.querySelector('.sidebar .player-options');
        if (playerOptions) {
            // Mise à jour du nom d'utilisateur et du statut
            // Cette logique sera implémentée plus tard
        }
    }

    async initConfigClient() {
        console.log('Initializing Config Client...')
        let configClient = await this.db.readData('configClient')

        if (!configClient) {
            await this.db.createData('configClient', {
                account_selected: null,
                instance_selct: null,
                java_config: {
                    java_path: null,
                    java_memory: {
                        min: 2,
                        max: 4
                    }
                },
                game_config: {
                    screen_size: {
                        width: 854,
                        height: 480
                    }
                },
                launcher_config: {
                    download_multi: 5,
                    theme: 'auto',
                    closeLauncher: 'close-launcher',
                    intelEnabledMac: true
                }
            })
        }
    }

    createPanels(...panels) {
        let panelsElem = document.querySelector('.panels')
        for (let panel of panels) {
            console.log(`Initializing ${panel.name} Panel...`);
            let div = document.createElement('div');
            div.classList.add('panel', panel.id)
            div.innerHTML = fs.readFileSync(`${__dirname}/panels/${panel.id}.html`, 'utf8');
            panelsElem.appendChild(div);
            new panel().init(this.config);
        }
    }

    async startLauncher() {
        let accounts = await this.db.readAllData('accounts')
        let configClient = await this.db.readData('configClient')
        let account_selected = configClient ? configClient.account_selected : null
        let popupRefresh = new popup();

        if (accounts?.length) {
            for (let account of accounts) {
                let account_ID = account.ID
                if (account.error) {
                    await this.db.deleteData('accounts', account_ID)
                    continue
                }
                if (account.meta.type === 'Xbox') {
                    console.log(`Account Type: ${account.meta.type} | Username: ${account.name}`);
                    popupRefresh.openPopup({
                        title: 'Connexion',
                        content: `Refresh account Type: ${account.meta.type} | Username: ${account.name}`,
                        color: 'var(--color)',
                        background: false
                    });

                    let refresh_accounts = await new Microsoft(this.config.client_id).refresh(account);

                    if (refresh_accounts.error) {
                        await this.db.deleteData('accounts', account_ID)
                        if (account_ID == account_selected) {
                            configClient.account_selected = null
                            await this.db.updateData('configClient', configClient)
                        }
                        console.error(`[Account] ${account.name}: ${refresh_accounts.errorMessage}`);
                        continue;
                    }

                    refresh_accounts.ID = account_ID
                    await this.db.updateData('accounts', refresh_accounts, account_ID)
                    await addAccount(refresh_accounts)
                    if (account_ID == account_selected) accountSelect(refresh_accounts)
                } else if (account.meta.type == 'AZauth') {
                    console.log(`Account Type: ${account.meta.type} | Username: ${account.name}`);
                    popupRefresh.openPopup({
                        title: 'Connexion',
                        content: `Refresh account Type: ${account.meta.type} | Username: ${account.name}`,
                        color: 'var(--color)',
                        background: false
                    });
                    let refresh_accounts = await new AZauth(this.config.online).verify(account);

                    if (refresh_accounts.error) {
                        this.db.deleteData('accounts', account_ID)
                        if (account_ID == account_selected) {
                            configClient.account_selected = null
                            this.db.updateData('configClient', configClient)
                        }
                        console.error(`[Account] ${account.name}: ${refresh_accounts.message}`);
                        continue;
                    }

                    refresh_accounts.ID = account_ID
                    this.db.updateData('accounts', refresh_accounts, account_ID)
                    await addAccount(refresh_accounts)
                    if (account_ID == account_selected) accountSelect(refresh_accounts)
                } else if (account.meta.type == 'Mojang') {
                    console.log(`Account Type: ${account.meta.type} | Username: ${account.name}`);
                    popupRefresh.openPopup({
                        title: 'Connexion',
                        content: `Refresh account Type: ${account.meta.type} | Username: ${account.name}`,
                        color: 'var(--color)',
                        background: false
                    });
                    if (account.meta.online == false) {
                        let refresh_accounts = await Mojang.login(account.name);

                        refresh_accounts.ID = account_ID
                        await addAccount(refresh_accounts)
                        this.db.updateData('accounts', refresh_accounts, account_ID)
                        if (account_ID == account_selected) accountSelect(refresh_accounts)
                        continue;
                    }

                    let refresh_accounts = await Mojang.refresh(account);

                    if (refresh_accounts.error) {
                        this.db.deleteData('accounts', account_ID)
                        if (account_ID == account_selected) {
                            configClient.account_selected = null
                            this.db.updateData('configClient', configClient)
                        }
                        console.error(`[Account] ${account.name}: ${refresh_accounts.errorMessage}`);
                        continue;
                    }

                    refresh_accounts.ID = account_ID
                    this.db.updateData('accounts', refresh_accounts, account_ID)
                    await addAccount(refresh_accounts)
                    if (account_ID == account_selected) accountSelect(refresh_accounts)
                } else {
                    console.error(`[Account] ${account.name}: Account Type Not Found`);
                    this.db.deleteData('accounts', account_ID)
                    if (account_ID == account_selected) {
                        configClient.account_selected = null
                        this.db.updateData('configClient', configClient)
                    }
                }
            }

            accounts = await this.db.readAllData('accounts')
            configClient = await this.db.readData('configClient')
            account_selected = configClient ? configClient.account_selected : null

            if (!account_selected) {
                let uuid = accounts[0].ID
                if (uuid) {
                    configClient.account_selected = uuid
                    await this.db.updateData('configClient', configClient)
                    accountSelect(accounts[0])
                }
            }

            if (!accounts.length) {
                config.account_selected = null
                await this.db.updateData('configClient', config);
                // Réinitialiser la sidebar
                updateSidebarUserInfo(null);
                popupRefresh.closePopup()
                return changePanel("login");
            }

            popupRefresh.closePopup()
            changePanel("home");
        } else {
            popupRefresh.closePopup()
            changePanel('login');
        }
    }
}

new Launcher().init();
