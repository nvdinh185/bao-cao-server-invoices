"use strict"
/**
 * Khai báo kết nối csdl, các thành phần khác chỉ import nó 
 * và dùng:
 * const db = require('../../db/sqlite3/db-pool');
 */
const SQLiteDAO = require('./sqlite-dao');
const dbFile = './db/database/crm-invoice-qld-dinh.db';
module.exports = new SQLiteDAO(dbFile);