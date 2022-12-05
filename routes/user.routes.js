const express = require("express");

const userController = require("../controllers/user.controllers");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.get(`/`, protect, userController.getUsers);
router.post(`/register`, userController.registerUser);
router.post(`/login`, userController.login);
router.post(`/google-login`, userController.googleLogin);
router.post(`/facebook-login`, userController.facebookLogin);
router.post(`/github-login`, userController.githubLogin);
router.post(`/`, protect, userController.addUser);
router.put(`/:userId`, protect, userController.updateUser);
router.delete(`/:userId`, protect, userController.deleteUser);
router.get(`/logout`, protect, userController.logout);
router.get(`/expiredTokenLogout`, userController.expiredTokenLogout);

module.exports = router;
