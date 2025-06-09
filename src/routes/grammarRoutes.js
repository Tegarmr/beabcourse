// File: src/routes/grammarRoutes.js
const express = require("express");
const router = express.Router();
const { correctGrammar } = require("../controllers/grammarController");

router.post("/correct", correctGrammar);

module.exports = router;
