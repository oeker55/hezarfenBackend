const express = require("express");
const timeController = require("../controllers/time.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, timeController.findAll);
router.post(`/`, protect, timeController.create);
router.put(`/:timeId`, protect, timeController.update);
router.delete(`/:timeId`, protect, timeController.delete);

module.exports = router;

