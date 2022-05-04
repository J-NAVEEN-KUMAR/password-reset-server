import { Router } from "express";
import {
  register,
  verifyEmail,
  login,
  logout,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.js";
import { verifyEmailBeforeLogin } from "../middlewares/verifyEmailBeforeLogin.js";

const router = Router();

router.post("/register", register);
router.get("/verify-email", verifyEmail);
router.post("/login", verifyEmailBeforeLogin, login);
router.get("/logout", logout);

//routes for password reset
router.put("/forgot-password", forgotPassword);
router.put("/reset-password", resetPassword);

export default router;
