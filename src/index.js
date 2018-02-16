var FileStorage = require('./lib/storage/FileStorage.js').FileStorage;

var storage = new FileStorage(__dirname + '/data');

var data = [
    {
        name: 'Topi Vop',
    },
    {
        id: '000-123',
        name: 'Mr. Topi',
    }

]
storage.putBulk(data).then(res => {

    storage.getBulk().then(res => {
        console.log(res);
    }) 
})
