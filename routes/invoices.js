/** Routes for invoices. */

const express = require("express");
const router = new express.Router();
const db = require("../db")
const ExpressError = require("../expressError")

/** GET / - returns `{invoices: [{id, comp_code}, ...]}` */

router.get("/", async function(req, res, next) {
    try {
        const invoices = await db.query("SELECT * FROM invoices;")
        return res.json({ invoices: invoices.rows});
    } catch(err){
        return next(err)
    }
});

/** GET /[id] - return data about one invoice: 
 * `{invoice: {id, amt, paid, add_date, paid_date, invoice:
 *  {code, name, description}}}` */

router.get("/:id", async function(req, res, next) {
    try {
        const oneInvoice = await db.query(
            "SELECT * FROM invoices WHERE id = $1;", [req.params.id])

        if (oneInvoice.rows.length === 0) {
            let notFoundError = new Error(`There is no invoice with id ${req.params.id}`);
            notFoundError.status = 404;
            throw notFoundError;
        }
        return res.json({ invoice: oneInvoice.rows[0] });
    } catch (err) {
        return next(err);
    }
});

/** POST / - create invoice from data; return `{comp_code: amt}`
 * returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
*/

router.post("/", async function(req, res, next) {
    try {
        const newInvoice = await db.query(
        `INSERT INTO invoices (comp_code, amt) 
        VALUES ($1, $2) 
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [req.body.comp_code,req.body.amt]);

        return res.status(201).json({invoice: newInvoice.rows[0]});  // 201 CREATED
    } catch (err) {
        return next(err);
    }
});

/** PUT /[id] - update fields in invoices; 
 * returns: {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
 */

router.put("/:id", async function(req, res, next) {
    try {
        if ("id" in req.body) {
            throw new ExpressError("Not allowed", 400)
        }

        const result = await db.query(
        `UPDATE invoices 
        SET amt=$1
        WHERE id = $2
        RETURNING id, comp_code, amt, paid, add_date, paid_date`,
        [req.body.amt,req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);
        }

        return res.json({ invoice: result.rows[0]});
    } catch (err) {
        return next(err);
    }
});

/** DELETE /[id] - delete invoice, return `{status: "deleted"}` */

router.delete("/:id", async function(req, res, next) {
    try {
        const result = await db.query(
        "DELETE FROM invoices WHERE id = $1 RETURNING id", [req.params.id]);

        if (result.rows.length === 0) {
            throw new ExpressError(`There is no invoice with id of '${req.params.id}`, 404);
        }
        return res.json({status: "deleted"});
    } catch (err) {
        return next(err);
    }
});

module.exports = router;