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

let testIndustry;
let testRelationship;
let testCompany;

beforeEach(async function() {
    let result = await db.query(`
    INSERT INTO industries (code, industry) 
    VALUES ('acct', 'Accounting')
    RETURNING code, industry`);
    testIndustry = result.rows[0];

    let compResult = await db.query(`
    INSERT INTO companies (code, name, description) 
    VALUES ('ibm', 'IBM', 'Big blue.')
    RETURNING code, name, description`);
    testCompany = compResult.rows[0];

    let relResult = await db.query(`
    INSERT INTO industries_and_companies (indus_code, comp_code) 
    VALUES ('acct', 'ibm')
    RETURNING indus_code, comp_code`);
    testRelationship = relResult.rows[0];
});

/** GET / - List all industries and show the company codes for that industry */

describe("GET /industries", function() {
    test("Gets a list of the only industry in the database", async function() {
        const response = await request(app).get(`/industries`);
        expect(response.statusCode).toEqual(200);
        expect(response.body).toEqual({
            industries: [testIndustry], 
            companies: [testCompany['code']]
        });
    });
});
// end

/** POST / - Add an industry */

describe("POST /industries", function() {
    test("Creates a new industry", async function() {
        const response = await request(app)
        .post(`/industries`)
        .send({
            code: "constru",
            industry: "Construction"
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            industry: {code: "constru",  industry: "Construction"}
        });
    });
});
// end

/** Create a relationship between an industry and a company */

describe("POST /industries/relationship", function() {
    test("Creates a new relationship between a company and industry", async function() {
        const response = await request(app)
        .post(`/industries/relationship`)
        .send({
            indus_code: "acct",
            comp_code: "ibm"
        });
        expect(response.statusCode).toEqual(201);
        expect(response.body).toEqual({
            relationship: {indus_code: "acct", comp_code: "ibm"}
        });
    });
});
// end

afterEach(async function() {
    // delete any data created by test
    await db.query("DELETE FROM industries");
    await db.query("DELETE FROM companies");
    await db.query("DELETE FROM industries_and_companies");
});

afterAll(async function() {
    // close db connection
    await db.end();
});