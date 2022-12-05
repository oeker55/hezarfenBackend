const express = require("express");
const bookTypeController = require("../controllers/bookType.controller");

const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, bookTypeController.findAll);
router.post(`/`, protect, bookTypeController.create);
router.post(`/:oldBookTypeId`, protect, bookTypeController.changeBookTypeAndDelete);
router.put(`/:bookTypeId`, protect, bookTypeController.update);
router.delete(`/:bookTypeId`, protect, bookTypeController.delete);

module.exports = router;
