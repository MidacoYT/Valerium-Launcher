/**
 * @author Luuxis
 * Modified for Cloudflare CDN
 */

const nodeFetch = require("node-fetch");
const convert = require('xml-js');

// 1. DÉFINITION DE L'URL DE BASE (Ton CDN)
const CDN_URL = "https://cdn.valerium.fr";

// 2. DÉFINITION DES CHEMINS STATIQUES
// Assure-toi que ces fichiers existent sur ton Cloudflare !
const URL_CONFIG = `${CDN_URL}/launcher/config.json`;
const URL_INSTANCES = `${CDN_URL}/launcher/instances.json`;
const URL_NEWS = `${CDN_URL}/launcher/news.json`;

class Config {
    
    // Récupère la configuration globale (maintenance, liens, etc)
    GetConfig() {
        return new Promise((resolve, reject) => {
            nodeFetch(URL_CONFIG).then(async response => {
                if (response.status === 200) {
                    return resolve(response.json());
                } else {
                    console.error(`Erreur HTTP ${response.status} sur ${URL_CONFIG}`);
                    return reject({ error: { code: response.statusText, message: 'server not accessible' } });
                }
            }).catch(error => {
                console.error("Erreur connexion config:", error);
                return reject({ error });
            })
        })
    }

    // Récupère la liste des instances (Serveurs) depuis un fichier JSON statique
    async getInstanceList() {
        try {
            const response = await nodeFetch(URL_INSTANCES);
            if (!response.ok) throw new Error("Impossible de récupérer instances.json");
            
            let instancesData = await response.json();
            let instancesList = [];

            // Adaptation selon le format de ton JSON. 
            // Si ton JSON est un objet { "NomServeur": {data...} } :
            if (!Array.isArray(instancesData)) {
                let entries = Object.entries(instancesData);
                for (let [name, data] of entries) {
                    let instance = data;
                    instance.name = name;
                    instancesList.push(instance);
                }
            } else {
                // Si ton JSON est déjà une liste []
                instancesList = instancesData;
            }

            return instancesList;
        } catch (err) {
            console.error("Erreur getInstanceList:", err);
            return []; // Retourne une liste vide en cas d'erreur pour éviter le crash
        }
    }

    // Récupère les news
    async getNews() {
        // On récupère d'abord la config pour voir si un RSS est défini
        let config = await this.GetConfig().catch(() => ({}));

        if (config.rss) {
            // Gestion RSS (inchangé)
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
            // Gestion JSON statique depuis Cloudflare
            return new Promise((resolve, reject) => {
                nodeFetch(URL_NEWS).then(async response => {
                    if (response.status === 200) return resolve(response.json());
                    else return reject({ error: { code: response.statusText, message: 'news.json not accessible' } });
                }).catch(error => {
                    return reject({ error });
                })
            })
        }
    }
}

export default new Config;