const express = require("express");
const authorController = require("../controllers/author.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, authorController.findAll);
router.post(`/`, protect, authorController.create);
router.put(`/:authorId`, protect, authorController.update);
router.delete(`/:authorId`, protect, authorController.delete);


module.exports = router;
