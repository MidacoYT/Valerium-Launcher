/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)
 */

import { changePanel, accountSelect, database, Slider, config, setStatus, popup, appdata, setBackground, updateSidebarUserInfo, clearAllSessionData } from '../utils.js'
const { ipcRenderer } = require('electron');
const os = require('os');

class Settings {
    static id = "settings";
    async init(config) {
        this.config = config;
        this.db = new database();
        this.initSettingsNav();
        this.accounts()
        this.ram()
        this.javaPath()
        this.resolution()
        this.launcher()
    }

    initSettingsNav() {
        const navButtons = document.querySelectorAll('.settings-nav-btn');
        
        navButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetTab = btn.getAttribute('data-tab');
                
                // Retirer la classe active de tous les boutons
                navButtons.forEach(nav => nav.classList.remove('active-settings-nav'));
                
                // Ajouter la classe active au bouton cliqué
                btn.classList.add('active-settings-nav');
                
                // Masquer tous les onglets
                const allTabs = document.querySelectorAll('.container-settings');
                allTabs.forEach(tab => {
                    tab.classList.remove('active-container-settings');
                });
                
                // Afficher l'onglet ciblé
                const targetElement = document.getElementById(targetTab);
                if (targetElement) {
                    targetElement.classList.add('active-container-settings');
            }
            });
        });
    }

    accounts() {
        document.querySelector('.accounts-list').addEventListener('click', async e => {
            let popupAccount = new popup()
            try {
                // Gestion du bouton d'ajout de compte
                if (e.target.id == 'add') {
                    popupAccount.openPopup({
                        title: 'Connexion',
                        content: 'Veuillez patienter...',
                        color: 'var(--color)'
                    })
                    document.querySelector('.cancel-home').style.display = 'inline'
                    return changePanel('login')
                }

                // Gestion de la sélection d'un compte
                if (e.target.classList.contains('account')) {
                    let id = e.target.id
                    popupAccount.openPopup({
                        title: 'Connexion',
                        content: 'Veuillez patienter...',
                        color: 'var(--color)'
                    })

                    let account = await this.db.readData('accounts', id);
                    let configClient = await this.setInstance(account);
                    await accountSelect(account);
                    configClient.account_selected = account.ID;
                    return await this.db.updateData('configClient', configClient);
                }

                // Gestion de la suppression d'un compte
                if (e.target.classList.contains("delete-profile") || e.target.classList.contains("delete-profile-icon")) {
                    // Trouver l'élément parent .account pour récupérer l'ID
                    let accountElement = e.target.closest('.account');
                    if (!accountElement) return;
                    
                    let id = accountElement.id;
                    
                    popupAccount.openPopup({
                        title: 'Suppression du compte',
                        content: 'Suppression en cours...',
                        color: 'var(--color)'
                    })
                    
                    await this.db.deleteData('accounts', id);
                    accountElement.remove();

                    let accountListElement = document.querySelector('.accounts-list');
                    
                    // Si plus de comptes (seulement le bouton "Ajouter un compte" reste)
                    if (accountListElement.children.length == 1) {
                        // Plus de comptes, réinitialiser la sidebar
                        updateSidebarUserInfo(null);
                        return changePanel('login');
                    }

                    let configClient = await this.db.readData('configClient');

                    // Si le compte supprimé était le compte sélectionné
                    if (configClient.account_selected == id) {
                        let allAccounts = await this.db.readAllData('accounts');
                        if (allAccounts.length > 0) {
                            configClient.account_selected = allAccounts[0].ID
                            accountSelect(allAccounts[0]);
                            let newInstanceSelect = await this.setInstance(allAccounts[0]);
                            configClient.instance_selct = newInstanceSelect.instance_selct
                            await this.db.updateData('configClient', configClient);
                        } else {
                            // Aucun compte restant
                            configClient.account_selected = null;
                            configClient.instance_selct = null;
                            await this.db.updateData('configClient', configClient);
                            updateSidebarUserInfo(null);
                            changePanel('login');
                        }
                    }
                }
            } catch (err) {
                console.error('Erreur dans la gestion des comptes:', err)
            } finally {
                popupAccount.closePopup();
            }
        })

        // Fonction de déconnexion
        document.querySelector('.logout-btn').addEventListener('click', async () => {
            let popupLogout = new popup();
            popupLogout.openPopup({
                title: 'Déconnexion',
                content: 'Déconnexion en cours...',
                color: 'var(--color)'
            });

            try {
                // Supprimer tous les comptes
                let allAccounts = await this.db.readAllData('accounts');
                for (let account of allAccounts) {
                    await this.db.deleteData('accounts', account.ID);
                }

                // Réinitialiser la configuration
                let configClient = await this.db.readData('configClient');
                configClient.account_selected = null;
                configClient.instance_selct = null;
                await this.db.updateData('configClient', configClient);

                // Vider la liste des comptes
                let accountListElement = document.querySelector('.accounts-list');
                let addAccountElement = accountListElement.querySelector('#add');
                accountListElement.innerHTML = '';
                accountListElement.appendChild(addAccountElement);

                // Réinitialiser la sidebar
                updateSidebarUserInfo(null);

                // Nettoyer toutes les données de session
                await clearAllSessionData();

                popupLogout.closePopup();
                
                // Rediriger vers la page de connexion
                changePanel('login');
            } catch (error) {
                console.error('Erreur lors de la déconnexion:', error);
                popupLogout.closePopup();
            }
        });
    }

    async setInstance(auth) {
        let configClient = await this.db.readData('configClient')
        let instanceSelect = configClient.instance_selct
        let instancesList = await config.getInstanceList()

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == auth.name)
                if (whitelist !== auth.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        configClient.instance_selct = newInstanceSelect.name
                        await setStatus(newInstanceSelect.status)
                    }
                }
            }
        }
        return configClient
    }

    async ram() {
        let config = await this.db.readData('configClient');
        let totalMem = Math.trunc(os.totalmem() / 1073741824 * 10) / 10;
        let freeMem = Math.trunc(os.freemem() / 1073741824 * 10) / 10;

        document.getElementById("total-ram").textContent = `${totalMem} Go`;
        document.getElementById("free-ram").textContent = `${freeMem} Go`;

        let sliderDiv = document.querySelector(".memory-slider");
        let maxRam = Math.trunc((80 * totalMem) / 100);
        sliderDiv.setAttribute("max", maxRam);

        let ram = config?.java_config?.java_memory ? {
            ramMin: config.java_config.java_memory.min,
            ramMax: config.java_config.java_memory.max
        } : { ramMin: 1, ramMax: 2 };

        // Validation des valeurs
        if (totalMem < ram.ramMin || ram.ramMin < 0.5) {
            ram.ramMin = 1;
        }
        if (ram.ramMax > maxRam || ram.ramMax <= ram.ramMin) {
            ram.ramMax = Math.min(maxRam, Math.max(2, ram.ramMin + 1));
        }

        // Mettre à jour la config si nécessaire
        if (config?.java_config?.java_memory?.min !== ram.ramMin || 
            config?.java_config?.java_memory?.max !== ram.ramMax) {
            config.java_config.java_memory = { min: ram.ramMin, max: ram.ramMax };
            this.db.updateData('configClient', config);
        }

        console.log('Initialisation du slider RAM:', { ram, maxRam, totalMem });

        // Initialiser le slider
        setTimeout(() => {
            try {
                let slider = new Slider(".memory-slider", ram.ramMin, ram.ramMax);
                console.log('Slider créé avec succès');

                let minSpan = document.querySelector(".slider-touch-left span");
                let maxSpan = document.querySelector(".slider-touch-right span");

                if (minSpan && maxSpan) {
                    minSpan.textContent = `${ram.ramMin} Go`;
                    maxSpan.textContent = `${ram.ramMax} Go`;

                    slider.on("change", async (min, max) => {
                        console.log('Slider change:', { min, max });
                        let config = await this.db.readData('configClient');
                        minSpan.textContent = `${min} Go`;
                        maxSpan.textContent = `${max} Go`;
                        config.java_config.java_memory = { min: min, max: max };
                        this.db.updateData('configClient', config);
                    });
                } else {
                    console.error('Éléments span non trouvés');
                }

            } catch (error) {
                console.error('Erreur lors de l\'initialisation du slider:', error);
            }
        }, 100);
    }

    async javaPath() {
        let javaPathText = document.querySelector(".java-path-txt")
        javaPathText.textContent = `${await appdata()}/${process.platform == 'darwin' ? this.config.dataDirectory : `.${this.config.dataDirectory}`}`;

        let configClient = await this.db.readData('configClient')
        let javaPath = configClient?.java_config?.java_path || 'Utiliser la version de java livre avec le launcher';
        let javaPathInputTxt = document.querySelector(".java-path-input-text");
        let javaPathInputFile = document.querySelector(".java-path-input-file");
        javaPathInputTxt.value = javaPath;

        document.querySelector(".java-path-set").addEventListener("click", async () => {
            javaPathInputFile.value = '';
            javaPathInputFile.click();
            await new Promise((resolve) => {
                let interval;
                interval = setInterval(() => {
                    if (javaPathInputFile.value != '') resolve(clearInterval(interval));
                }, 100);
            });

            if (javaPathInputFile.value.replace(".exe", '').endsWith("java") || javaPathInputFile.value.replace(".exe", '').endsWith("javaw")) {
                let configClient = await this.db.readData('configClient')
                let file = javaPathInputFile.files[0].path;
                javaPathInputTxt.value = file;
                configClient.java_config.java_path = file
                await this.db.updateData('configClient', configClient);
            } else alert("Le nom du fichier doit être java ou javaw");
        });

        document.querySelector(".java-path-reset").addEventListener("click", async () => {
            let configClient = await this.db.readData('configClient')
            javaPathInputTxt.value = 'Utiliser la version de java livre avec le launcher';
            configClient.java_config.java_path = null
            await this.db.updateData('configClient', configClient);
        });
    }

    async resolution() {
        let configClient = await this.db.readData('configClient')
        let resolution = configClient?.game_config?.screen_size || { width: 1920, height: 1080 };

        let width = document.querySelector(".width-size");
        let height = document.querySelector(".height-size");
        let resolutionReset = document.querySelector(".size-reset");

        width.value = resolution.width;
        height.value = resolution.height;

        width.addEventListener("change", async () => {
            let configClient = await this.db.readData('configClient')
            configClient.game_config.screen_size.width = width.value;
            await this.db.updateData('configClient', configClient);
        })

        height.addEventListener("change", async () => {
            let configClient = await this.db.readData('configClient')
            configClient.game_config.screen_size.height = height.value;
            await this.db.updateData('configClient', configClient);
        })

        resolutionReset.addEventListener("click", async () => {
            let configClient = await this.db.readData('configClient')
            configClient.game_config.screen_size = { width: '854', height: '480' };
            width.value = '854';
            height.value = '480';
            await this.db.updateData('configClient', configClient);
        })
    }

    async launcher() {
        let configClient = await this.db.readData('configClient');

        let maxDownloadFiles = configClient?.launcher_config?.download_multi || 5;
        let maxDownloadFilesInput = document.querySelector(".max-files");
        let maxDownloadFilesReset = document.querySelector(".max-files-reset");
        maxDownloadFilesInput.value = maxDownloadFiles;

        maxDownloadFilesInput.addEventListener("change", async () => {
            let configClient = await this.db.readData('configClient')
            configClient.launcher_config.download_multi = maxDownloadFilesInput.value;
            await this.db.updateData('configClient', configClient);
        })

        maxDownloadFilesReset.addEventListener("click", async () => {
            let configClient = await this.db.readData('configClient')
            maxDownloadFilesInput.value = 5
            configClient.launcher_config.download_multi = 5;
            await this.db.updateData('configClient', configClient);
        })

        let themeBox = document.querySelector(".theme-box");
        let theme = configClient?.launcher_config?.theme || "auto";

        if (theme == "auto") {
            document.querySelector('.theme-btn-auto').classList.add('active-theme');
        } else if (theme == "dark") {
            document.querySelector('.theme-btn-sombre').classList.add('active-theme');
        } else if (theme == "light") {
            document.querySelector('.theme-btn-clair').classList.add('active-theme');
        }

        themeBox.addEventListener("click", async e => {
            if (e.target.classList.contains('theme-btn')) {
                let activeTheme = document.querySelector('.active-theme');
                if (e.target.classList.contains('active-theme')) return
                activeTheme?.classList.remove('active-theme');

                if (e.target.classList.contains('theme-btn-auto')) {
                    setBackground();
                    theme = "auto";
                    e.target.classList.add('active-theme');
                } else if (e.target.classList.contains('theme-btn-sombre')) {
                    setBackground(true);
                    theme = "dark";
                    e.target.classList.add('active-theme');
                } else if (e.target.classList.contains('theme-btn-clair')) {
                    setBackground(false);
                    theme = "light";
                    e.target.classList.add('active-theme');
                }

                let configClient = await this.db.readData('configClient')
                configClient.launcher_config.theme = theme;
                await this.db.updateData('configClient', configClient);
            }
        })

        let closeBox = document.querySelector(".close-box");
        let closeLauncher = configClient?.launcher_config?.closeLauncher || "close-launcher";

        if (closeLauncher == "close-launcher") {
            document.querySelector('.close-launcher').classList.add('active-close');
        } else if (closeLauncher == "close-all") {
            document.querySelector('.close-all').classList.add('active-close');
        } else if (closeLauncher == "close-none") {
            document.querySelector('.close-none').classList.add('active-close');
        }

        closeBox.addEventListener("click", async e => {
            if (e.target.classList.contains('close-btn')) {
                let activeClose = document.querySelector('.active-close');
                if (e.target.classList.contains('active-close')) return
                activeClose?.classList.toggle('active-close');

                let configClient = await this.db.readData('configClient')

                if (e.target.classList.contains('close-launcher')) {
                    e.target.classList.toggle('active-close');
                    configClient.launcher_config.closeLauncher = "close-launcher";
                    await this.db.updateData('configClient', configClient);
                } else if (e.target.classList.contains('close-all')) {
                    e.target.classList.toggle('active-close');
                    configClient.launcher_config.closeLauncher = "close-all";
                    await this.db.updateData('configClient', configClient);
                } else if (e.target.classList.contains('close-none')) {
                    e.target.classList.toggle('active-close');
                    configClient.launcher_config.closeLauncher = "close-none";
                    await this.db.updateData('configClient', configClient);
                }
            }
        })
    }
}
export default Settings;