const express = require("express");
const publisherController = require("../controllers/publisher.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, publisherController.findAll);
router.post("/", protect, publisherController.create);
router.put(`/:publisherId`, protect, publisherController.update);
router.delete(`/:publisherId`, protect, publisherController.delete);

module.exports = router;

