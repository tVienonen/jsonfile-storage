var fs = require('fs');
/**
 * Class for handling file based storage
 * @param {string} directoryPath 
 * The path of the folder where the data will be saved/retrieved
 */
function FileStorage(directoryPath) {
    this.files = [];
    if (typeof directoryPath === 'string' && directoryPath.trim() !== '') {
        if (directoryPath.charAt(directoryPath.length-1) !== '/') {
            // add trailing slash
            directoryPath += '/'; 
        }
        this.directoryPath = directoryPath;
        try {
            this.files = this.getDirectoryFiles();
        } catch (e) {
            throw new Error('Error reading the files from the directory', e);
        }
    } else {
        throw new Error('No directoryPath specified or directoryPath was an empty string');
    }
}
FileStorage.prototype.get = function(id) {
    return new Promise((resolve, reject) => {
        fs.readFile(this.directoryPath + id, (err, data) => {
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
FileStorage.prototype.getBulk = function() {
    var promises = this.files.reduce((carry, current) => {
        carry.push(this.get(current));
        return carry;
    }, []);
    return Promise.all(promises);
}
FileStorage.prototype.put = function(item, updateListing = true) {
    if (!('id' in item)) {
        console.warn('No id field was set in the item. Defaulting to timestamp');
    }
    return new Promise((resolve, reject) => {
        var filePath = this.directoryPath + (item.id !== undefined ? item.id : new Date().getTime()) + '.json';
        fs.writeFile(filePath, JSON.stringify(item), err => {
            if (err) {
                console.error(err);
                reject(err);
            } else {
                if (updateListing) {
                    this.files = this.getDirectoryFiles();
                }
                resolve(item);
            }
        })
    });
}
FileStorage.prototype.putBulk = function(itemList) {
    if (!Array.isArray(itemList)) {
        throw new Error('itemList must be an array of items!');
    }
    var promises = itemList.map(item => this.put(item, false));
    var promiseContainer = Promise.all(promises);
    return new Promise((resolve, reject) => {
        promiseContainer
        .then(items => {
            this.files = this.getDirectoryFiles();
            resolve(items);
        })
        .catch(err => {
            console.error(err);
        });
    });
}
FileStorage.prototype.remove = function(id) {
    return new Promise((resolve, reject) => {
        if (this.files.indexOf(id) === -1) {
            console.error('File not found with for this id!', id);
            reject('File not found with for this id!');
            return;
        }
        fs.unlink(this.directoryPath + id, err => {
            if (err) {
                console.log('There was an error removing the file', err);
                reject(err);
            } else {
                resolve();
            }
        })
    })
}
/**
 * Deletes files in bulk
 * @param {Array<string>} ids Array of ids for the files to be deleted
 */
FileStorage.prototype.removeBulk = function(ids) {
    if (!Array.isArray(ids)) {
        console.error('Ids must be an Array');
        throw new Error('Ids must be an Array');
    }
    
}
FileStorage.prototype.getDirectoryFiles = function() {
    try {
        return fs.readdirSync(this.directoryPath)
    } catch (e) {
        console.log(e);
        return this.files;
    }
}

exports.FileStorage = FileStorage;
