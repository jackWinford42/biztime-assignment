/** Routes for industries */
const express = require("express");
const router = new express.Router();
const db = require("../db")

/** GET / - List all industries and show the company codes for that industry */

router.get("/", async function(req, res, next) {
    try {
        const allIndustries = await db.query("SELECT code, industry FROM industries;")

        let company_codes = [];
        for (const index in allIndustries.rows) {
            const code = allIndustries.rows[index]['code']

            const resp = await db.query(
                "SELECT comp_code FROM industries_and_companies WHERE indus_code = $1;",
                [code]
            )

            if (resp.rows[0]) {
                company_codes.push(resp.rows[0]['comp_code'])
            }
        }

        return res.json({ industries: allIndustries.rows, companies: company_codes});
    } catch(err){
        return next(err)
    }
});

/** POST / - Add an industry */

router.post("/", async function(req, res, next) {
    try {
        const newIndustry = await db.query(
        `INSERT INTO industries (code, industry) 
        VALUES ($1, $2) 
        RETURNING code, industry`,
        [req.body.code, req.body.industry]);

        return res.status(201).json({industry: newIndustry.rows[0]});  // 201 CREATED
    } catch (err) {
        return next(err);
    }
});

/** Create a relationship between an industry and a company */

router.post("/relationship", async function(req, res, next) {
    try {
        const newRelationship = await db.query(
        `INSERT INTO industries_and_companies (indus_code, comp_code) 
        VALUES ($1, $2) 
        RETURNING indus_code, comp_code`,
        [req.body.indus_code, req.body.comp_code]);
        
        return res.status(201).json({relationship: newRelationship.rows[0]});  // 201 CREATED
    } catch (err) {
        return next(err);
    }
})

module.exports = router;