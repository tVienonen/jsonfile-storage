var fs = require('fs');
var uuid = require('uuid/v4');
/**
 * Class for handling json file based storage
 * @param {string} directoryPath 
 * The path of the folder where the data will be saved/retrieved
 * @throws Error if directoryPath is not a string or an empty string
 */
function JSONFileStorage(directoryPath) {
    var files = [];
    var _directoryPath
    
    setDirectoryPath(directoryPath);

    this.get = function(id) {
        return new Promise((resolve, reject) => {
            fs.readFile(_directoryPath + id, (err, data) => {
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
    /**
     * Gets all the items from the directory and their content
     * @returns {Promise<Array<any>>}
     */
    this.getBulk = function() {
        var promises = files.reduce((carry, current) => {
            carry.push(this.get(current));
            return carry;
        }, []);
        return Promise.all(promises);
    }
    /**
     * Puts a single item in the directory
     * @param {any} item item to be put in to the directory
     * @param {boolean} updateListing should the files property be updated. Default is true
     */
    this.put = function(item, updateListing = true) {
        if (!('id' in item)) {
            console.debug('No id field was set in the item. Generating id...');
        }
        return new Promise((resolve, reject) => {
            var filePath = _directoryPath + (item.id !== undefined ? item.id : uuid() + '.json');
            fs.writeFile(filePath, JSON.stringify(item), err => {
                if (err) {
                    console.error(err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = getFileListing();
                    }
                    resolve(item);
                }
            })
        });
    }
    /**
     * Puts items in the directory in bulk
     * @param {Array<any>} items items to be put to the directory
     * @returns {Promise<Array<any>>} items putted to the directory
     * @throws Error if items is not an array
     */
    this.putBulk = function(items) {
        if (!Array.isArray(items)) {
            throw new Error('itemList must be an array of items!');
        }
        var promises = items.map(item => this.put(item, false));
        var promiseContainer = Promise.all(promises);
        return new Promise((resolve, reject) => {
            promiseContainer
            .then(items => {
                files = getFileListing();
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
            fs.unlink(_directoryPath + id, err => {
                if (err) {
                    console.error('There was an error removing the file', err.message);
                    reject(err);
                } else {
                    if (updateListing) {
                        files = getFileListing();
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
                files = getFileListing();
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
    this.changeDirectory = function(directoryPath) {
        setDirectoryPath(directoryPath);
    }
    /**
     * Gets the current directory file listing
     * 
     * Filters out all the files that dont have a .json extension
     * 
     * IMPORTANT: This operation is synchronous
     * @returns {Array<string>} the names of the files
     */
    function getFileListing() {
        return fs.readdirSync(_directoryPath).filter(file => /.json$/.test(file));
    }
    /**
     * Sets a new directory for this class and updates the files
     * @param {string} directoryPath directory path to be set
     * @throws Error when no directoryPath is provided or when it is an empty string
     * @throws Error when reading files from the directory fails
     */
    function setDirectoryPath(directoryPath) {
        if (typeof directoryPath === 'string' && directoryPath.trim() !== '') {
            if (directoryPath.charAt(directoryPath.length-1) !== '/') {
                // add trailing slash
                directoryPath += '/';
            }
            _directoryPath = directoryPath;
            try {
                files = getFileListing();
            } catch (e) {
                throw new Error('Error reading the files from the directory', e);
            }
        } else {
            throw new Error('No directoryPath specified or directoryPath was an empty string');
        }
    }
}

module.exports = JSONFileStorage;
