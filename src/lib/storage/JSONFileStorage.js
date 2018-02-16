var fs = require('fs');
/**
 * Class for handling file based storage
 * @param {string} directoryPath 
 * The path of the folder where the data will be saved/retrieved
 */
function JSONFileStorage(directoryPath) {
    var files = [];
    if (typeof directoryPath === 'string' && directoryPath.trim() !== '') {
        if (directoryPath.charAt(directoryPath.length-1) !== '/') {
            // add trailing slash
            directoryPath += '/'; 
        }
        try {
            files = updateFileListing();
        } catch (e) {
            throw new Error('Error reading the files from the directory', e);
        }
    } else {
        throw new Error('No directoryPath specified or directoryPath was an empty string');
    }
    this.get = function(id) {
        return new Promise((resolve, reject) => {
            fs.readFile(directoryPath + id, (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    try {
                        const dataJSON = JSON.parse(data.toString());
                        resolve(dataJSON);
                    } catch (e) {
                        console.error('Error parsing JSON data');
                        reject(e);
                    }
                }
            })
        })
    }
    this.getBulk = function() {
        var promises = files.reduce((carry, current) => {
            carry.push(this.get(current));
            return carry;
        }, []);
        return Promise.all(promises);
    }
    this.put = function(item, updateListing = true) {
        if (!('id' in item)) {
            console.warn('No id field was set in the item. Defaulting to timestamp');
        }
        return new Promise((resolve, reject) => {
            var filePath = directoryPath + (item.id !== undefined ? item.id : new Date().getTime()) + '.json';
            fs.writeFile(filePath, JSON.stringify(item), err => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = updateFileListing();
                    }
                    resolve(item);
                }
            })
        });
    }
    this.putBulk = function(itemList) {
        if (!Array.isArray(itemList)) {
            throw new Error('itemList must be an array of items!');
        }
        var promises = itemList.map(item => this.put(item, false));
        var promiseContainer = Promise.all(promises);
        return new Promise((resolve, reject) => {
            promiseContainer
            .then(items => {
                files = updateFileListing();
                resolve(items);
            })
            .catch(err => {
                console.error(err.message);
            });
        });
    }
    /**
     * removes the specified file from the directory
     * @param {string} id id of the file
     * @param {boolean} updateListing should the file listing be updated
     */
    this.remove = function(id, updateListing = true) {
        return new Promise((resolve, reject) => {
            if (files.indexOf(id) === -1) {
                console.error('File not found with for this id!', id);
                reject('File not found with for this id!');
                return;
            }
            fs.unlink(directoryPath + id, err => {
                if (err) {
                    console.error('There was an error removing the file', err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = updateFileListing();
                    }
                    resolve();
                }
            })
        })
    }
    /**
    * Deletes files in bulk
    * @param {Array<string>} ids Array of ids for the files to be deleted
    * @returns {Promise<void>}
    */
    this.removeBulk = function(ids) {
        return new Promise((resolve, reject) => {
            if (!Array.isArray(ids)) {
                console.error('Ids must be an Array');
                throw new Error('Ids must be an Array');
            }
            Promise.all(ids.map(id => this.remove(id, false)))
            .then(() => {
                files = updateFileListing();
            })
            .catch(err => {
                console.error(err.message);
            })
        })
    }
    /**
     * @returns {Array<string>} files in the directory
     */
    this.getFiles = function() {
        return files.slice();
    }
    /**
     * Updates the file listing
     * 
     * IMPORTANT: This operation is synchronous
     * @returns {void} void
     */
    function updateFileListing() {
        try {
            return fs.readdirSync(directoryPath)
        } catch (e) {
            console.error(e.message);
            return files;
        }
    }
}

exports.JSONFileStorage = JSONFileStorage;
