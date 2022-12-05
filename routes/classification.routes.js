const express = require("express");
const classificationController = require("../controllers/classification.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, classificationController.findAll);
router.get(`/:bookId`, protect, classificationController.findOne);
router.post(`/`, protect, classificationController.create);
router.put(`/:classificationId`, protect, classificationController.update);
router.delete(`/:bookId/:classificationId`, protect, classificationController.delete);

module.exports = router;
