const express = require("express");
const bookController = require("../controllers/book.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, bookController.findAll);
router.post(`/`, protect, bookController.create);
router.put(`/:bookId`, protect, bookController.update);
router.delete(`/:bookId`, protect, bookController.delete);

module.exports = router;
