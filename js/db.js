// js/db.js

const DB_NAME = 'reloadingDB';
const DB_VERSION = 2;
let db;

const objectStores = [
    'manufacturers', 'diameters', 'bullets', 'powders', 'primers', 
    'brass', 'cartridges', 'firearms', 'loads', 'impactData', 'targetImages'
];

export function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);
        request.onerror = (event) => { console.error("Database error:", event.target.errorCode); reject(event.target.errorCode); };
        request.onupgradeneeded = (event) => {
            db = event.target.result;
            objectStores.forEach(storeName => {
                if (!db.objectStoreNames.contains(storeName)) {
                    db.createObjectStore(storeName, { keyPath: 'id' });
                }
            });
        };
        request.onsuccess = (event) => { db = event.target.result; console.log("Database opened successfully"); resolve(db); };
    });
}

export function generateUniqueId() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode.apply(null, array)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function updateItem(storeName, item) {
     return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        if (!item.id) { item.id = generateUniqueId(); }
        const request = store.put(item);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export function deleteItem(storeName, id) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(id);
        request.onsuccess = () => resolve();
        request.onerror = (event) => reject(event.target.error);
    });
}

export function getItem(storeName, id) {
    return new Promise((resolve, reject) => {
        if (!id) return resolve(null);
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(id);
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export function getAllItems(storeName) {
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([storeName], 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = (event) => reject(event.target.error);
    });
}

export function deleteDatabase() {
    return new Promise((resolve, reject) => {
         db.close();
        const req = indexedDB.deleteDatabase(DB_NAME);
        req.onsuccess = () => { resolve(); };
        req.onerror = (err) => { reject(err); };
        req.onblocked = () => { reject('blocked'); };
    });
}

export function getObjectStores() {
    return objectStores;
}
