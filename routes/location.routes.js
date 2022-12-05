const express = require("express");
const locationController = require("../controllers/location.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, locationController.findAll);
router.post(`/`, protect, locationController.create);
router.put(`/:locationId`, protect, locationController.update);
router.delete(`/:locationId`, protect, locationController.delete);


module.exports = router;
