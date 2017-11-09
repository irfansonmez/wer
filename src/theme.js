const express = require('express');

const router = express.Router();

router.get('/', (req, res) => {
	res.render('theme');
})
	.get('/:theme', (req, res) => {
		res.cookie('theme', req.params.theme);
		res.redirect('/');
	});

module.exports = router;