/** Run with these variable for tests
 * $ PGUSER=yourUser 
 * PGHOST='localhost' 
 * PGPASSWORD=yourPassword 
 * PGDATABASE=biztime_test 
 * PGPORT=5432 
 * jest
 */
// npm packages
const request = require("supertest");

// app imports
const app = require("../app");
const db = require("../db");

let testInvoice;

beforeEach(async function() {
    await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('microsoft', 'Microsoft', 'blueIcon');`);
    const invoiceResult = await db.query(`
    INSERT INTO invoices (comp_Code, amt, paid, paid_date)
    VALUES ('microsoft', 100, true, '2018-05-05')
    RETURNING id, comp_code, amt, paid, add_date, paid_date;`);
    testInvoice = invoiceResult.rows[0];
});

/** GET / - returns `{invoices: [{id, comp_code}, ...]}` */

describe("GET /invoices", function() {
    test("Gets a list of 1 invoice", async function() {
        const response = await request(app).get(`/invoices`);
        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({
            invoices: [testInvoice]
        }));
    });
});
// end

/** GET /[id] - return data about one invoice: 
 * `{invoice: {id, amt, paid, add_date, paid_date, company:
 *  {code, name, description}}}` */

describe("GET /invoices/:id", function() {
    test("Gets a single invoice", async function() {
        const response = await request(app).get(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({invoice: testInvoice}));
    });

    test("Responds with 404 if can't find invoice", async function() {
        const response = await request(app).get(`/invoices/3333`);
        expect(response.statusCode).toEqual(404);
    });
});
// end

/** POST / - create invoice from data; return `{comp_code: amt}`
 * returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

describe("POST /invoices", function() {
    test("Creates a new invoice", async function() {
        const response = await request(app)
        .post(`/invoices`)
        .send({
            comp_code: "microsoft",
            amt: 9876,
            paid: false,
            paid_date: null
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            invoice: {id: expect.any(Number), comp_code: "microsoft", amt: 9876, paid: false, add_date: expect.any(String), paid_date: null}
        });
    });
});
// end

/** PUT /[id] - update fields in invoices; 
 * returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

describe("PUT /invoices/:id", function() {
    test("Updates a single invoice", async function() {
        const response = await request(app)
        .put(`/invoices/${testInvoice.id}`)
        .send({
            amt: 99,
            paid: false
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            invoice: {id: expect.any(Number), comp_code: "microsoft", amt: 99, paid: true, add_date: expect.any(String), paid_date: null}
        });
    });

    test("Responds with 404 if can't find invoice", async function() {
        // The below line suppresses the console.error() message created by 
        // the 404 handler in app.js so the jest printout looks more neat.
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const response = await request(app).put(`/invoices/7777`);
        expect(response.statusCode).toEqual(404);
    });
});
// end

/** DELETE /[id] - delete invoice, return `{status: "deleted"}` */

describe("DELETE /invoices/:id", function() {
    test("Deletes a single a invoice", async function() {
        const response = await request(app)
        .delete(`/invoices/${testInvoice.id}`);
        expect(response.statusCode).toEqual(200);
        expect(JSON.stringify(response.body)).toEqual(JSON.stringify({ status: "deleted" }));
    });
});
// end

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM invoices");
    await db.query("DELETE FROM companies");
});

afterAll(async function() {
    // close db connection
    await db.end();
});