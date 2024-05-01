const fs = require('fs');
const mysql = require('mysql2');
const conf = JSON.parse(fs.readFileSync("conf.json"));
const connection =  mysql.createConnection({
    "host": conf.host,
    "user": conf.user,
    "password": conf.password,
    "database": conf.database,
    "port": conf.porta,
    "ssl": {
        "ca" : fs.readFileSync(conf.ca),
        "rejectUnauthorized": true
    }
});

