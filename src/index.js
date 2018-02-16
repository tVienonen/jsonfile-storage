var JSONFileStorage = require('./lib/storage/JSONFileStorage.js').JSONFileStorage;

var storage = new JSONFileStorage(__dirname + '/data');
storage.removeBulk(storage.getFiles());
// var data = [
//     {
//         name: 'Topi Vop',
//     },
//     {
//         id: '000-123',
//         name: 'Mr. Topi',
//     }

// ]
// storage.putBulk(data).then(res => {

//     storage.getBulk().then(res => {
//         console.log(res);
//     }) 
// })
