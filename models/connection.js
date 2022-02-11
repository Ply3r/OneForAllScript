const mysql = require('mysql2/promise');

const connection = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'xafixav',
  database: 'SpotifyClone'
});

module.exports = connection;
