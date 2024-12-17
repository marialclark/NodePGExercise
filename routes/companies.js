const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

let router = new express.Router();

/** GET /companies: Returns list of companies */
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query('SELECT code, name FROM companies');
		return res.json({ companies: results.rows });
	} catch (e) {
		return next(e);
	}
});

/** 
	GET /companies/[code]: Returns object of company.
	Returns 404 if the company cannot be found.
*/
router.get('/:code', async (req, res, next) => {
	try {
		let { code } = req.params;

		const cResults = await db.query(
			'SELECT code, name, description FROM companies WHERE code=$1',
			[code]
		);

		const iResults = await db.query(
			'SELECT id FROM invoices WHERE comp_code=$1',
			[code]
		);

		if (cResults.rows.length === 0) {
			throw new ExpressError(
				`Company with code '${code}' cannot be found`,
				404
			);
		}

		const company = cResults.rows[0];
		const invoices = iResults.rows.map((inv) => inv.id);

		const data = {
			...company,
			invoices: invoices,
		};

		return res.json({ company: data });
	} catch (e) {
		return next(e);
	}
});

/** POST /companies: Adds a company */
router.post('/', async (req, res, next) => {
	try {
		const { code, name, description } = req.body;
		const results = await db.query(
			`INSERT INTO companies (code, name, description) 
      VALUES ($1, $2, $3) 
      RETURNING code, name, description`,
			[code, name, description]
		);
		return res.status(201).json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

/** 
  PUT /companies/[code]: Edits existing company. 
  Returns 404 if company cannot be found. 
*/
router.put('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;
		const { name, description } = req.body;
		const results = await db.query(
			'UPDATE companies SET name=$1, description=$2 WHERE code=$3 RETURNING code, name, description',
			[name, description, code]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(
				`Company with code '${code}' cannot be found`,
				404
			);
		}
		return res.json({ company: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

/** 
  DELETE /companies/[code]: Deletes a company.
  Returns 404 if company cannot be found.
*/
router.delete('/:code', async (req, res, next) => {
	try {
		const { code } = req.params;

		const results = await db.query(
			'DELETE FROM companies WHERE code = $1 RETURNING code',
			[code]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(
				`Company with code '${code}' cannot be found`,
				404
			);
		}
		return res.json({ status: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
