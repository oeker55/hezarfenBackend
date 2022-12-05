const express = require("express");
const personController = require("../controllers/person.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, personController.findAll);

router.post(`/`, protect, personController.create);
router.put(`/:personId`, protect, personController.update);
router.delete(`/:personId`, protect, personController.delete);

module.exports = router;
