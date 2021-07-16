/** Routes for companies. */
const slugify = require("slugify");
const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

/** GET / - returns `{companies: [company, ...]}` */

router.get("/", async function(req, res, next) {
    try {
        const allCompanies = await db.query("SELECT code, name, description FROM companies;")
        return res.json({ companies: allCompanies.rows});
    } catch(err){
        return next(err)
    }
});

/** GET /[code] - return data about one company: `{company: company}`
 *  and the companies industries 
 */

router.get("/:code", async function(req, res, next) {
    try {
        const oneCompany = await db.query(
            "SELECT code, name, description FROM companies WHERE code = $1;", 
            [req.params.code]);

        const compsIndustriesCodes = await db.query(
            "SELECT indus_code, comp_code FROM industries_and_companies WHERE comp_code = $1", 
            [req.params.code]);

        let industries = [];
        if (compsIndustriesCodes) {
            
            for (const index in compsIndustriesCodes.rows) {
                const code = compsIndustriesCodes.rows[index]['indus_code']
                const resp = await db.query(
                    "SELECT industry FROM industries WHERE code = $1",
                    [code]
                )
                industries.push(resp.rows[0]['industry'])
            }
        }

        if (oneCompany.rows.length === 0) {
            let notFoundError = new Error(`There is no company with code ${req.params.code}`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ company: oneCompany.rows[0], industry: industries});
    } catch (err) {
        return next(err);
    }
});

/** POST / - create company from data; return `{company: company}` */

router.post("/", async function(req, res, next) {
    try {
        const newCompany = await db.query(
        `INSERT INTO companies (code, name, description) 
        VALUES ($1, $2, $3) 
        RETURNING code, name, description`,
        [req.body.code, req.body.name, req.body.description]);

        return res.status(201).json({company: newCompany.rows[0]});  // 201 CREATED
    } catch (err) {
        return next(err);
    }
});

/** PUT /[code] - update fields in companies; return `{company: company}` */

router.put("/", async function(req, res, next) {
    try {
        const code = slugify(req.body.name, {remove: /[*+~.()'"!:@]/g, lower: true});
        if ("code" in req.body) {
            throw new ExpressError("Not allowed", 400)
        }

        const result = await db.query(
        `UPDATE companies 
        SET name=$1, description=$2
        WHERE code = $3
        RETURNING code, name, description`,
        [req.body.name, req.body.description, code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${code}`, 404);
        }

        return res.json({ company: result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[code] - delete company, return `{message: "Company deleted"}` */

router.delete("/:code", async function(req, res, next) {
    try {
        const result = await db.query(
        "DELETE FROM companies WHERE code = $1 RETURNING code", [req.params.code]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no company with code of '${req.params.code}`, 404);
        }
        return res.json({ message: "Company deleted" });
    } catch (err) {
        return next(err);
    }
});

module.exports = router;