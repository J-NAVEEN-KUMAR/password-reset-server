import User from "../models/user.js";

export const verifyEmailBeforeLogin = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email });
    if (user) {
      if (user.isVerified) {
        next();
      } else {
        console.log("Please verify your email to login");
        res.status(400).json("Please verify your email to login");
      }
    } else {
      next();
    }
  } catch (error) {
    console.log("ERROR IN VERIFYEMAIL MIDDLEWARE", error);
  }
};
