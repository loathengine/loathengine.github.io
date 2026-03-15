// js/db.js

const DB_NAME = 'reloadingDB';
const DB_VERSION = 4; // Incremented for new precision fields
let db;

const objectStores = [
    'manufacturers', 'diameters', 'bullets', 'powders', 'primers', 
    'brass', 'cartridges', 'firearms', 'loads', 'impactData', 'targetImages', 'customTargets'
];

export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        
        request.onerror = (event) => { 
            console.error("Database error:", event.target.errorCode); 
            reject(event.target.errorCode); 
        };
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            objectStores.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
        
        request.onsuccess = (event) => { 
            db = event.target.result; 
            console.log("Database opened successfully"); 
            resolve(db); 
        };
    });
}

function getDB() {
    if (db) return Promise.resolve(db);
    return openDB();
}

export function generateUniqueId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function updateItem(storeName, item) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            if (!item.id) { 
                item.id = generateUniqueId(); 
            }
            
            // Log modification timestamp
            item.lastModified = new Date().toISOString();
            
            const request = store.put(item);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        } catch (e) {
            reject(e);
        }
    });
}

export function deleteItem(storeName, id) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);
            request.onsuccess = () => resolve();
            request.onerror = (event) => reject(event.target.error);
        } catch (e) {
            reject(e);
        }
    });
}

export function getItem(storeName, id) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            if (!id) return resolve(null);
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        } catch (e) {
            reject(e);
        }
    });
}

export function getAllItems(storeName) {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await getDB();
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => resolve(request.result);
            request.onerror = (event) => reject(event.target.error);
        } catch (e) {
            reject(e);
        }
    });
}

export function deleteDatabase() {
    return new Promise((resolve, reject) => {
        if(db) db.close();
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => { resolve(); };
        req.onerror = (err) => { reject(err); };
        req.onblocked = () => { reject('blocked'); };
    });
}

export function getObjectStores() {
    return objectStores;
}
