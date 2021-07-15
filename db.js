/** Database setup for BizTime. */

async function connect(client) {
    await client.connect();
}

const { Pool, Client } = require("pg");

const pool = new Pool()

// pool.query('SELECT NOW()', (err, res) => {
//     console.log(err, res)
//     pool.end()
// })

//const DB_URI = 'postgresql:///biztime';

const client = new Client();
connect(client)

module.exports = client;