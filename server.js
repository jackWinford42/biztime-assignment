/** Server startup for BizTime. */
// Run with these variables
// $ PGUSER=dbuser \
//   PGHOST=database.server.com \
//   PGPASSWORD=secretpassword \
//   PGDATABASE=mydb \
//   PGPORT=3211 \
//   node server.js

const app = require("./app");


app.listen(3000, function () {
  console.log("Listening on 3000 and running at http://127.0.0.1:3000/");
});