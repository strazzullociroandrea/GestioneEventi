const mysql = require('mysql2');

const db = (conf, fs) => {
    const connection = mysql.createConnection({
        "host": conf.host,
        "user": conf.user,
        "password": conf.password,
        "database": conf.database,
        "port": conf.porta,
        "ssl": {
            "ca": fs.readFileSync(conf.ca),
            "rejectUnauthorized": true
        }
    });

    const executeQuery = (sql, val) => {
        console.log(sql);
        return new Promise((resolve, reject) => {
            connection.query(sql, val, function (err, result) {
                if (err) {
                    console.error(err);
                    reject(err);
                }
                console.log('done');
                resolve(result);
            });
        })
    }
    return {
        executeQuery
    }
}

module.exports = db;