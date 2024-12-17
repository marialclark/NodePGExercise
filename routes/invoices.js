const express = require('express');
const ExpressError = require('../expressError');
const db = require('../db');

let router = new express.Router();

/** GET /invoices: Returns info on invoices */
router.get('/', async (req, res, next) => {
	try {
		const results = await db.query(
			'SELECT id, comp_code FROM invoices ORDER BY id'
		);
		return res.json({ invoices: results.rows });
	} catch (e) {
		return next(e);
	}
});

/** 
  GET /invoices/[id]: Returns object on given invoice.
  If invoice cannot be found, returns 404.  
*/
router.get('/:id', async (req, res, next) => {
	try {
		let { id } = req.params;
		const results = await db.query(
			`SELECT i.id, 
              i.amt, 
              i.paid, 
              i.add_date, 
              i.paid_date, 
              c.name,
              c.description
       FROM invoices AS i
        INNER JOIN companies AS c ON (i.comp_code = c.code)
       WHERE i.id=$1`,
			[id]
		);

		if (results.rows.length === 0) {
			throw new ExpressError(`Invoice with id '${id}' cannot be found`, 404);
		}

		const data = results.rows[0];
		const invoice = {
			id: data.id,
			amt: data.amt,
			paid: data.paid,
			add_date: data.add_date,
			paid_date: data.paid_date,
			company: {
				code: data.comp_code,
				name: data.name,
				description: data.description,
			},
		};
		return res.json({ invoice: invoice });
	} catch (e) {
		return next(e);
	}
});

/** POST /invoices: Adds an invoice */
router.post('/', async (req, res, next) => {
	try {
		const { comp_code, amt } = req.body;
		const results = await db.query(
			`INSERT INTO invoices (comp_code, amt)
      VALUES ($1, $2)
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[comp_code, amt]
		);
		return res.status(201).json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

/**
  PUT /invoices/[id]: Updates an invoice.
  Returns 404 if invoice cannot be found.
*/
router.put('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;
		const { amt } = req.body;
		const results = await db.query(
			`UPDATE invoices 
      SET amt=$1 
      WHERE id=$2 
      RETURNING id, comp_code, amt, paid, add_date, paid_date`,
			[amt, id]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(`Invoice with id '${id}' cannot be found`, 404);
		}
		return res.json({ invoice: results.rows[0] });
	} catch (e) {
		return next(e);
	}
});

/**
  DELETE /invoices/[id]: Deletes an invoice.
  Returns 404 if invoice cannot be found.
*/
router.delete('/:id', async (req, res, next) => {
	try {
		const { id } = req.params;

		const results = await db.query(
			'DELETE FROM invoices WHERE id=$1 RETURNING id',
			[id]
		);
		if (results.rows.length === 0) {
			throw new ExpressError(`Invoice with id '${code}' cannot be found`, 404);
		}
		return res.json({ status: 'deleted' });
	} catch (e) {
		return next(e);
	}
});

module.exports = router;
