/**
 * @author Luuxis
 * Luuxis License v1.0
 * Modified for New Design
 */
import { config, database, logger, changePanel, appdata, setStatus, pkg, popup } from '../utils.js'
import { ValeriumUpdater } from '../utils/updater.js';
const { Launch } = require('minecraft-java-core')
const { shell, ipcRenderer } = require('electron')
const path = require('path');

class Home {
    static id = "home";

    async init(config) {
        this.config = config;
        this.db = new database();
        
        // Initialisation des modules
        await this.news();
        this.socialLick();
        await this.instancesSelect();
        
        // Initialisation spécifique du bouton JOUER (Correctif)
        this.initPlayButton();

        // Bouton paramètres
        const settingsBtn = document.querySelector('.settings-btn');
        if(settingsBtn) settingsBtn.addEventListener('click', e => changePanel('settings'));
    }

    // --- CORRECTIF BOUTON JOUER ---
    initPlayButton() {
        const playBtn = document.querySelector('.play-btn');

        if (playBtn) {
            // On clone le bouton pour nettoyer les anciens event listeners
            let newBtn = playBtn.cloneNode(true);
            playBtn.parentNode.replaceChild(newBtn, playBtn);

            newBtn.addEventListener('click', async (e) => {
                e.preventDefault(); 
                e.stopPropagation();
                console.log("Lancement du jeu demandé...");
                await this.startGame();
            });
        } else {
            console.error("Erreur : Le bouton .play-btn est introuvable.");
        }
    }

    async news() {
        let newsElement = document.querySelector('.news-list');
        let news = await config.getNews().then(res => res).catch(err => false);
        
        newsElement.innerHTML = ""; // Reset

        if (news && news.length) {
            for (let News of news) {
                let date = this.getdate(News.publish_date)
                let blockNews = document.createElement('div');
                blockNews.classList.add('news-card'); // Design : Card style
                
                blockNews.innerHTML = `
                    <div class="news-title">${News.title}</div>
                    <div class="news-date">Publié le ${date.day} ${date.month} par ${News.author}</div>
                    <div class="news-snippet">
                        ${News.content.replace(/\n/g, '<br>')}
                    </div>
                `;
                newsElement.appendChild(blockNews);
            }
        } else {
            let blockNews = document.createElement('div');
            blockNews.classList.add('news-card');
            blockNews.innerHTML = `
                <div class="news-title">Aucune actualité</div>
                <div class="news-snippet">
                    Impossible de récupérer les news ou aucune news n'est disponible pour le moment.
                </div>`;
            newsElement.appendChild(blockNews);
        }
    }

    socialLick() {
        let socials = document.querySelectorAll('.social-icon')
        socials.forEach(social => {
            social.addEventListener('click', e => {
                let url = e.currentTarget.dataset.url;
                if(url) shell.openExternal(url)
            })
        });
    }

    async instancesSelect() {
        let configClient = await this.db.readData('configClient')
        let auth = await this.db.readData('accounts', configClient.account_selected)
        let instancesList = await config.getInstanceList()
        let instanceSelect = instancesList.find(i => i.name == configClient?.instance_selct) ? configClient?.instance_selct : null

        // Sélecteurs mis à jour pour le nouveau design
        let instanceBTN = document.querySelector('.instance-select')
        let instancePopup = document.querySelector('.instance-popup')
        let instancesListPopup = document.querySelector('.instances-List')
        let instanceCloseBTN = document.querySelector('.close-popup')
        
        // Helper pour mettre à jour le texte affiché
        const updateInstanceText = (name) => {
            let el = document.querySelector('.selected-instance-name');
            if(el) el.innerText = name;
        }

        if (instancesList.length === 1) {
            if(instanceBTN) instanceBTN.style.display = 'none'
        }

        if (!instanceSelect) {
            let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
            configClient = await this.db.readData('configClient')
            configClient.instance_selct = newInstanceSelect.name
            instanceSelect = newInstanceSelect.name
            await this.db.updateData('configClient', configClient)
        }
        
        // Mise à jour initiale du texte
        if(instanceSelect) updateInstanceText(instanceSelect);

        for (let instance of instancesList) {
            if (instance.whitelistActive) {
                let whitelist = instance.whitelist.find(whitelist => whitelist == auth?.name)
                if (whitelist !== auth?.name) {
                    if (instance.name == instanceSelect) {
                        let newInstanceSelect = instancesList.find(i => i.whitelistActive == false)
                        configClient = await this.db.readData('configClient')
                        configClient.instance_selct = newInstanceSelect.name
                        instanceSelect = newInstanceSelect.name
                        updateInstanceText(instanceSelect);
                        setStatus(newInstanceSelect.status)
                        await this.db.updateData('configClient', configClient)
                    }
                }
            }
            if (instance.name == instanceSelect) setStatus(instance.status)
        }

        // Gestion du clic dans la popup
        instancePopup.addEventListener('click', async e => {
            if (e.target.classList.contains('instance-elements')) {
                let newInstanceSelect = e.target.id
                let activeInstanceSelect = document.querySelector('.active-instance')

                if (activeInstanceSelect) activeInstanceSelect.classList.toggle('active-instance');
                e.target.classList.add('active-instance');

                configClient = await this.db.readData('configClient')
                configClient.instance_selct = newInstanceSelect
                await this.db.updateData('configClient', configClient)
                
                instanceSelect = instancesList.filter(i => i.name == newInstanceSelect)
                updateInstanceText(newInstanceSelect); // Mise à jour du texte
                
                instancePopup.style.display = 'none'
                
                let instance = await config.getInstanceList()
                let options = instance.find(i => i.name == configClient.instance_selct)
                await setStatus(options.status)
            }
        })

        // Ouverture de la popup
        if(instanceBTN) {
            instanceBTN.addEventListener('click', async e => {
                e.stopPropagation();
                
                configClient = await this.db.readData('configClient')
                instanceSelect = configClient.instance_selct
                auth = await this.db.readData('accounts', configClient.account_selected)

                instancesListPopup.innerHTML = ''
                for (let instance of instancesList) {
                    let isWhitelisted = false;
                    if (instance.whitelistActive) {
                        instance.whitelist.map(whitelist => {
                            if (whitelist == auth?.name) isWhitelisted = true;
                        })
                    } else {
                        isWhitelisted = true;
                    }

                    if(isWhitelisted) {
                        if (instance.name == instanceSelect) {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements active-instance">${instance.name}</div>`
                        } else {
                            instancesListPopup.innerHTML += `<div id="${instance.name}" class="instance-elements">${instance.name}</div>`
                        }
                    }
                }
                instancePopup.style.display = 'flex'
            })
        }

        if(instanceCloseBTN) instanceCloseBTN.addEventListener('click', () => instancePopup.style.display = 'none')
    }

    async startGame() {
        let launch = new Launch()
        let configClient = await this.db.readData('configClient')
        let instance = await config.getInstanceList().catch(() => [])
        // Préconditions: config client, compte et instance sélectionnés
        if (!configClient) {
            new popup().openPopup({
                title: 'Configuration manquante',
                content: "La configuration du launcher est introuvable. Veuillez relancer l'application.",
                color: 'red',
                options: true
            });
            return;
        }
        let authenticator = null;
        if (configClient.account_selected) {
            authenticator = await this.db.readData('accounts', configClient.account_selected)
        }
        if (!authenticator) {
            new popup().openPopup({
                title: 'Aucun compte',
                content: "Veuillez vous connecter ou sélectionner un compte avant de lancer le jeu.",
                color: 'red',
                options: true
            });
            return;
        }
        let options = null;
        if (Array.isArray(instance)) {
            options = instance.find(i => i.name == configClient.instance_selct)
        }
        if (!options) {
            new popup().openPopup({
                title: 'Instance manquante',
                content: "Aucune instance sélectionnée ou l'instance n'existe plus. Sélectionnez une version dans la liste.",
                color: 'red',
                options: true
            });
            return;
        }

        // Sélecteurs mis à jour
        let playElements = document.querySelector('.play-elements')
        let infoStartingBOX = document.querySelector('.info-starting-game')
        let infoStarting = document.querySelector(".info-starting-game-text")
        let progressBar = document.querySelector('.progress-bar')

        // Affichage UI chargement
        if(playElements) playElements.style.display = "none"
        if(infoStartingBOX) infoStartingBOX.style.display = "block" // ou flex selon css
        if(progressBar) progressBar.style.display = "block";
        
        // Nom de dossier de données (utilisé par l'updater et le lanceur)
        // macOS: 'valerium' | Windows/Linux: '.valerium'
        const dataDirName = process.platform == 'darwin'
            ? (this.config.dataDirectory || 'valerium')
            : `.${(this.config.dataDirectory || 'valerium')}`;
        
        // --- UPDATER ---
        try {
            const CDN_URL = options.url; 
            if (!CDN_URL) throw new Error('URL de CDN manquante pour cette instance.');
            const gameRoot = path.join(await appdata(), dataDirName);
            
            const updater = new ValeriumUpdater(gameRoot, CDN_URL);

            await updater.checkForUpdates((status, current, total) => {
                if(infoStarting) infoStarting.innerHTML = status;
                if (total > 0 && progressBar) {
                    progressBar.max = total;
                    progressBar.value = current;
                    ipcRenderer.send('main-window-progress', { progress: current, size: total });
                } else if(progressBar) {
                    progressBar.removeAttribute('value');
                }
            });

        } catch (err) {
            console.error("[Updater Error]", err);
            
            let popupError = new popup();
            popupError.openPopup({
                title: 'Erreur Mise à jour',
                content: "Impossible de mettre à jour les fichiers.<br>" + err.message,
                color: 'red',
                options: true
            });

            if (configClient?.launcher_config?.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-show")
            };
            
            ipcRenderer.send('main-window-progress-reset');
            if(infoStartingBOX) infoStartingBOX.style.display = "none";
            if(playElements) playElements.style.display = "flex";
            return; 
        }

        // --- CONFIGURATION LANCEMENT ---
        const lc = configClient?.launcher_config ?? {
            download_multi: 5,
            theme: 'auto',
            closeLauncher: 'close-launcher',
            intelEnabledMac: true
        };

        // Normalisation des champs options
        const loader = options.loadder || {};
        const verify = typeof options.verify === 'boolean' ? options.verify : true;
        const ignored = Array.isArray(options.ignored) ? options.ignored : [];
        const gameArgs = Array.isArray(options.game_args) ? options.game_args : (typeof options.game_args === 'string' ? options.game_args.split(' ').filter(Boolean) : []);
        const jvmArgsBase = Array.isArray(options.jvm_args) ? options.jvm_args : (typeof options.jvm_args === 'string' ? options.jvm_args.split(' ').filter(Boolean) : []);

        let opt = {
            authenticator: authenticator,
            timeout: 10000,
            // Match updater path; default to '.valerium' when unset
            path: path.join(await appdata(), dataDirName),
            version: loader.minecraft_version,
            detached: lc.closeLauncher == "close-all" ? false : true,
            downloadFileMultiple: lc.download_multi,
            intelEnabledMac: lc.intelEnabledMac,

            loader: {
                type: loader.loadder_type || 'none',
                build: loader.loadder_version || '',
                enable: (loader.loadder_type || 'none') == 'none' ? false : true
            },

            verify: verify,
            ignored: ['mods', 'config', 'resources', 'shaderpacks', ...ignored],

            java: {
                path: configClient.java_config.java_path,
            },

            // Inject JVM argument to force Forge stencil display
            JVM_ARGS: (() => {
                let base = [...jvmArgsBase];
                // Ensure the flag is present only once
                const stencilFlag = '-Dforge.forceDisplayStencil=true';
                if (!base.includes(stencilFlag)) base.push(stencilFlag);
                // Déduplication simple
                return Array.from(new Set(base));
            })(),
            GAME_ARGS: Array.from(new Set(gameArgs)),

            screen: {
                width: configClient.game_config.screen_size.width,
                height: configClient.game_config.screen_size.height
            },

            memory: {
                min: `${configClient.java_config.java_memory.min * 1024}M`,
                max: `${configClient.java_config.java_memory.max * 1024}M`
            }
        }

        launch.Launch(opt);

        ipcRenderer.send('main-window-progress-load'); 
        if(infoStarting) infoStarting.innerHTML = "Vérification des Assets...";

        launch.on('extract', extract => {
            ipcRenderer.send('main-window-progress-load')
            console.log(extract);
        });

        launch.on('progress', (progress, size) => {
            if(infoStarting) infoStarting.innerHTML = `Téléchargement Assets ${((progress / size) * 100).toFixed(0)}%`
            ipcRenderer.send('main-window-progress', { progress, size })
            if(progressBar) {
                progressBar.value = progress;
                progressBar.max = size;
            }
        });

        launch.on('check', (progress, size) => {
            if(infoStarting) infoStarting.innerHTML = `Vérification Assets ${((progress / size) * 100).toFixed(0)}%`
            ipcRenderer.send('main-window-progress', { progress, size })
            if(progressBar) {
                progressBar.value = progress;
                progressBar.max = size;
            }
        });

        launch.on('estimated', (time) => {
            console.log(`Temps estimé : ${time}`);
        })

        launch.on('speed', (speed) => {
            console.log(`${(speed / 1067008).toFixed(2)} Mb/s`)
        })

        launch.on('patch', patch => {
            ipcRenderer.send('main-window-progress-load')
            if(infoStarting) infoStarting.innerHTML = `Patch en cours...`
        });

        launch.on('data', (e) => {
            if(progressBar) progressBar.style.display = "none"
            if (lc.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-hide")
            };
            new logger('Minecraft', '#36b030');
            ipcRenderer.send('main-window-progress-load')
            if(infoStarting) infoStarting.innerHTML = `Demarrage en cours...`
            console.log(e);
        })

        launch.on('close', code => {
            if (lc.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-show")
            };
            ipcRenderer.send('main-window-progress-reset')
            if(infoStartingBOX) infoStartingBOX.style.display = "none"
            if(playElements) playElements.style.display = "flex" // IMPORTANT: Flex pour le nouveau design
            if(infoStarting) infoStarting.innerHTML = `Vérification`
            new logger(pkg.name, '#7289da');
            console.log('Close');
        });

        launch.on('error', err => {
            let popupError = new popup()
            popupError.openPopup({
                title: 'Erreur',
                content: err.error,
                color: 'red',
                options: true
            })

            if (lc.closeLauncher == 'close-launcher') {
                ipcRenderer.send("main-window-show")
            };
            ipcRenderer.send('main-window-progress-reset')
            if(infoStartingBOX) infoStartingBOX.style.display = "none"
            if(playElements) playElements.style.display = "flex"
            if(infoStarting) infoStarting.innerHTML = `Vérification`
            new logger(pkg.name, '#7289da');
            console.log(err);
        });
    }

    getdate(e) {
        let date = new Date(e)
        let year = date.getFullYear()
        let month = date.getMonth() + 1
        let day = date.getDate()
        let allMonth = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
        return { year: year, month: allMonth[month - 1], day: day }
    }
}
export default Home;