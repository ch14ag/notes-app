import { Router } from "express";

import verifyJwt from "../middlewares/authMiddleware.js";
import { register, login, logout, refreshAcessToken, getCurrentUser, newNote, getNotes, deleteNote } from "../controllers/userController.js";

const router = Router();

router.route("/register").post(register);
router.route("/login").post(login);

// secured routes
router.route("/refresh-token").post(refreshAcessToken);
router.route("/logout").post(verifyJwt, logout);
router.route("/current-user").get(verifyJwt, getCurrentUser);
router.route("/notes").get(verifyJwt, getNotes).post(verifyJwt, newNote);
router.route("/notes/:id").delete(verifyJwt, deleteNote);

export default router;
