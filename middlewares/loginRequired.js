import jwt from "jsonwebtoken";

export const loginRequired = async (req, res, next) => {
  const token = req.cookies["access-token"];
  if (token) {
    const validateToken = await jwt.verify(token, process.env.JWT_SECRET);
    if (validateToken) {
      res.user = validateToken.id;
      next();
    } else {
      console.log("token expires");
      res.json("redirecting to login");
    }
  } else {
    console.log("token not found");
    res.json("redirecting to login");
  }
};
