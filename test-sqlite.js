"use strict"
const SQLiteDAO = require('./db/sqlite3/sqlite-dao');
const dbFile = './db/database/crm-invoice-qld-ver4.1.db';     //ten database muon tao
const db = new SQLiteDAO(dbFile);

setTimeout(async () => {

    let bill_cycle = "201901"

    db.getRsts("select * from customers limit 1")
        .then(results => {
            console.log(results);
        });
}, 1000);