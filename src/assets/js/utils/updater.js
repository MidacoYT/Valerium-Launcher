// src/assets/js/utils/updater.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const nodeFetch = require('node-fetch');

export class ValeriumUpdater {
    
    constructor(gameRoot, cdnUrl) {
        this.gameRoot = gameRoot;
        this.cdnUrl = cdnUrl.endsWith('/') ? cdnUrl.slice(0, -1) : cdnUrl;
        this.manifestUrl = `${this.cdnUrl}/manifest.json`;
    }

    async getFileHash(filePath) {
        if (!fs.existsSync(filePath)) return null;
        return new Promise((resolve, reject) => {
            const hash = crypto.createHash('md5');
            const stream = fs.createReadStream(filePath);
            stream.on('data', data => hash.update(data));
            stream.on('end', () => resolve(hash.digest('hex')));
            stream.on('error', err => reject(err));
        });
    }

    async downloadFile(relativePath, size, onProgress) {
        const urlPath = relativePath.replace(/\\/g, '/');
        
        // --- MODIFICATION ICI ---
        // On ajoute '/files/' entre l'URL de base et le fichier
        const fileUrl = `${this.cdnUrl}/files/${urlPath}`;
        // ------------------------

        console.log(`[Updater] DL: ${fileUrl}`); // Debug pour vérifier l'URL

        const destPath = path.join(this.gameRoot, relativePath);
        const destDir = path.dirname(destPath);

        if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
        }

        const res = await nodeFetch(fileUrl);
        if (!res.ok) throw new Error(`Erreur ${res.status} sur : ${fileUrl}`);

        const fileStream = fs.createWriteStream(destPath);
        
        return new Promise((resolve, reject) => {
            let downloadedBytes = 0;
            res.body.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                fileStream.write(chunk);
                if(onProgress) onProgress(downloadedBytes);
            });
            res.body.on('end', () => {
                fileStream.end();
                resolve();
            });
            res.body.on('error', (err) => {
                fileStream.end();
                reject(err);
            });
        });
    }

    async checkForUpdates(callback) {
        callback("Récupération du manifeste...", 0, 100);

        let manifest;
        try {
            // Le manifeste reste à la racine (défini dans le constructor)
            const response = await nodeFetch(this.manifestUrl);
            if (!response.ok) throw new Error("Manifeste introuvable (404)");
            manifest = await response.json();
        } catch (e) {
            console.error(e);
            throw new Error("Impossible de contacter le serveur de mise à jour.");
        }

        if (manifest.maintenance) {
            throw new Error("Le serveur est en maintenance.");
        }

        const filesToDownload = [];
        let totalSizeToDownload = 0;
        let checkedCount = 0;

        for (const file of manifest.files) {
            if (checkedCount % 10 === 0) callback(`Vérification (${checkedCount}/${manifest.files.length})`, 0, 0);

            const localPath = path.join(this.gameRoot, file.path);
            const localHash = await this.getFileHash(localPath);

            if (localHash !== file.hash) {
                filesToDownload.push(file);
                totalSizeToDownload += file.size;
            }
            checkedCount++;
        }

        if (filesToDownload.length === 0) {
            callback("Fichiers à jour.", 100, 100);
            return true;
        }

        console.log(`[Updater] ${filesToDownload.length} fichiers à mettre à jour.`);
        
        let globalDownloaded = 0;

        for (const file of filesToDownload) {
            callback(`Téléchargement : ${path.basename(file.path)}`, globalDownloaded, totalSizeToDownload);
            await this.downloadFile(file.path, file.size);
            globalDownloaded += file.size;
            callback(`Téléchargement : ${path.basename(file.path)}`, globalDownloaded, totalSizeToDownload);
        }

        return true;
    }
}