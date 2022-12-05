const express = require("express");
const eventController = require("../controllers/event.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, eventController.findAll);
router.post(`/`, protect, eventController.create);
router.put(`/:eventId`, protect, eventController.update);
router.delete(`/:eventId`, protect, eventController.delete);

module.exports = router;
