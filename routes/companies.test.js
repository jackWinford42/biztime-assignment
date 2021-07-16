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

let testCompany;

beforeEach(async function() {
    let result = await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('microsoft', 'Microsoft', 'windows')
    RETURNING code, name, description`);
    testCompany = result.rows[0];
});

/** GET / - returns `{companies: [company, ...]}` */

describe("GET /companies", function() {
    test("Gets a list of 1 company", async function() {
        const response = await request(app).get(`/companies`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            companies: [testCompany]
        });
    });
});
// end

/** GET /[code] - return data about one company: `{company: company}` */

describe("GET /companies/:code", function() {
    test("Gets a single company", async function() {
        const response = await request(app).get(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({company: testCompany, industry: []});
    });

    test("Responds with 404 if can't find company", async function() {
        const response = await request(app).get(`/companies/wrong-name`);
        expect(response.statusCode).toEqual(404);
    });
});
// end

/** POST / - create company from data; return `{company: company}` */

describe("POST /companies", function() {
    test("Creates a new company", async function() {
        const response = await request(app)
        .post(`/companies`)
        .send({
            code: "netflix",
            name: "Netflix",
            description: "movie streaming"
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            company: {code: "netflix", name: "Netflix", description: "movie streaming"}
        });
    });
});
// end

/** PUT /[code] - update fields in companies; return `{company: company}` */

describe("PUT /companies", function() {
    test("Updates a single company", async function() {
        const response = await request(app)
        .put(`/companies`)
        .send({
            name: "Microsoft",
            description: "Doors"
        });
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            company: {code: testCompany.code, name: "Microsoft", description: "Doors"}
        });
    });

    test("Responds with 404 if can't find company", async function() {
        // The below line suppresses the console.error() message created by 
        // the 404 handler in app.js so the jest printout looks more neat.
        jest.spyOn(console, 'error').mockImplementation(() => {});
        const response = await request(app).put(`/companies/does-not-exist`);
        expect(response.statusCode).toEqual(404);
    });
});
// end

/** DELETE /[code] - delete company, return `{message: "Company deleted"}` */

describe("DELETE /companies/:code", function() {
    test("Deletes a single a company", async function() {
        const response = await request(app)
        .delete(`/companies/${testCompany.code}`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({ message: "Company deleted" });
    });
});
// end

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM companies");
});

afterAll(async function() {
    // close db connection
    await db.end();
});