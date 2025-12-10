/**
 * @author Luuxis
 * Modified for Cloudflare CDN & Azure Auth
 */

const nodeFetch = require("node-fetch");
const convert = require('xml-js');

// 1. DÉFINITION DE L'URL DE BASE
const CDN_URL = "https://cdn.valerium.fr";

// 2. CHEMINS STATIQUES
const URL_CONFIG = `${CDN_URL}/launcher/config.json`;
const URL_INSTANCES = `${CDN_URL}/launcher/instances.json`;
const URL_NEWS = `${CDN_URL}/launcher/news.json`;

class Config {
    constructor() {
        // ==========================================================
        // CONFIGURATION AZURE (Microsoft)
        // ==========================================================
        this.client_id = "e384b9ce-27a4-427e-9d74-2802052f5fbd"; 
        // ==========================================================

        this.online = true;
        this.base_url = CDN_URL;
        this.rss = false;

        // POUR ÉVITER LE CRASH (Écran blanc) :
        // On met les infos en dur au lieu d'importer pkg depuis utils.js
        // Cela casse la boucle infinie qui faisait planter ton launcher.
        this.project = {
            name: "Valerium Launcher",
            version: "1.0.0",
            stage: "Release",
            authors: ["Luuxis"]
        };
    }
    
    GetConfig() {
        return new Promise((resolve, reject) => {
            nodeFetch(URL_CONFIG).then(async response => {
                if (response.status === 200) {
                    let remoteConfig = await response.json();
                    // On fusionne la config
                    let mergedConfig = { ...this, ...remoteConfig };
                    return resolve(mergedConfig);
                } else {
                    console.error(`Erreur HTTP ${response.status} sur ${URL_CONFIG}`);
                    return resolve(this);
                }
            }).catch(error => {
                console.error("Erreur connexion config:", error);
                return resolve(this);
            })
        })
    }

    async getInstanceList() {
        try {
            const response = await nodeFetch(URL_INSTANCES);
            if (!response.ok) throw new Error("Impossible de récupérer instances.json");
            
            let instancesData = await response.json();
            let instancesList = [];

            if (!Array.isArray(instancesData)) {
                let entries = Object.entries(instancesData);
                for (let [name, data] of entries) {
                    let instance = data;
                    instance.name = name;
                    instancesList.push(instance);
                }
            } else {
                instancesList = instancesData;
            }

            return instancesList;
        } catch (err) {
            console.error("Erreur getInstanceList:", err);
            return []; 
        }
    }

    async getNews() {
        let config = await this.GetConfig().catch(() => ({}));

        if (config.rss) {
            return new Promise((resolve, reject) => {
                nodeFetch(config.rss).then(async response => {
                    if (response.status === 200) {
                        let news = [];
                        let textData = await response.text();
                        let jsonData = (JSON.parse(convert.xml2json(textData, { compact: true })))?.rss?.channel?.item;

                        if (!Array.isArray(jsonData)) jsonData = [jsonData];
                        for (let item of jsonData) {
                            if(item) {
                                news.push({
                                    title: item.title._text,
                                    content: item['content:encoded']?._text || item.description._text,
                                    author: item['dc:creator']?._text || 'Admin',
                                    publish_date: item.pubDate._text
                                });
                            }
                        }
                        return resolve(news);
                    }
                    else return reject({ error: { code: response.statusText, message: 'RSS not accessible' } });
                }).catch(error => reject({ error }))
            })
        } else {
            return new Promise((resolve, reject) => {
                nodeFetch(URL_NEWS).then(async response => {
                    if (response.status === 200) return resolve(response.json());
                    else return reject({ error: { code: response.statusText, message: 'news.json not accessible' } });
                }).catch(error => {
                    console.error("Erreur News:", error);
                    return resolve([]);
                })
            })
        }
    }
}

export default new Config();