const express = require("express");
const subjectController = require("../controllers/subject.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, subjectController.findAll);
router.post(`/`, protect, subjectController.create);
router.put(`/:subjectId`, protect, subjectController.update);
router.delete(`/:subjectId`, protect, subjectController.delete);

module.exports = router;

