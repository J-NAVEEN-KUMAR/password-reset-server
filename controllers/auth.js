import User from "../models/user.js";
import nodemailer from "nodemailer";
import cryptoRandomString from "crypto-random-string";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import _ from "lodash";
import dotenv from "dotenv";
dotenv.config();

//using nodemailer to send verification email to user for activating the account

let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_ID,
    pass: process.env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

//user signup with email verification using nodemailer
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const check = await User.findOne({ email });
    if (!check) {
      const user = new User({
        name,
        email,
        password,
        emailToken: cryptoRandomString({ length: 100, type: "url-safe" }),
        isVerified: false,
      });
      //hashing the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      user.password = hashedPassword;
      //saving user to database
      const newUser = await user.save();

      //providing details to send the mail to the user
      var mailOptions = {
        from: "<>Password-reset Application built using MERN stack<>",
        to: user.email,
        subject: "Please verify your email for account activation",
        html: `<h2>Hey ${user.name}...! Thanks for registering with us.</h2>
      <h4>Please verify your mail to move forward. You are just a click away.</h4>
      <a href="http://${req.headers.host}/api/verify-email?token=${user.emailToken}">Please click to verify</a>`,
      };
      //sending email to user
      transporter.sendMail(mailOptions, function (error, info) {
        if (error) console.log("Error in sending verification email", error);
        else console.log("verification email is sent to your email account");
      });

      res.status(200).json(newUser);
    } else {
      res
        .status(400)
        .json("User with this email already exists. Please login.");
    }
  } catch (error) {
    console.log("ERROR IN REGISTERING THE USER ===>", error);
    return res.status(400).json("Error in registering the user");
  }
};

//verification of link sent to user email
export const verifyEmail = async (req, res) => {
  try {
    const emailToken = req.query.token;
    const user = await User.findOne({ emailToken });
    if (user) {
      user.emailToken = null;
      user.isVerified = true;
      await user.save();
      res.status(200).json("Email verification done successfully");
    } else {
      res.status(400).json("Email verification Unsuccessful");
    }
  } catch (error) {
    res.status(400).json("Error in verying the email", error);
    console.log("ERROR IN VERIFYING THE EMAIL", error);
  }
};

//creating a token using jsonwebtoken so that the routes are protected based on login
const createToken = (id) => {
  return jwt.sign(id, process.env.JWT_SECRET);
};

//user login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      const match = await bcrypt.compare(password, findUser.password);
      if (match) {
        //create token
        const token = createToken(findUser.password);
        //store token in cookie
        res.cookie("access-token", token);
        res.status(200).json("Login success!");
      } else {
        res
          .status(400)
          .json("Incorrect password! Check your password and try again.");
      }
    } else {
      res
        .status(400)
        .json("User doesn't exists with this email. Please register.");
    }
  } catch (error) {
    console.log("ERROR IN USER LOGIN ===>", error);
    res.status(400).json("Error in user login. Please try login again.");
  }
};

//user logout
export const logout = async (req, res) => {
  res.cookies("access-token", "", { maxAge: 1 });
  res.status(200).json("Logout success!");
};

//forgot password
export const forgotPassword = async (req, res) => {
  try {
    const email  = req.body.email;
    // console.log(req.body);
    console.log("EMAIL ==>", email);
    let user = await User.findOne({ email });
    //checking if the user is present or not
    if (user) {
      //creating a token
      const resetLink = createToken(user.password);

      //providing details to send user mail with forgot password link
      var mailOptions = {
        from: "<>Password-reset Application built using MERN stack<>",
        to: user.email,
        subject:
          "Forgot password? Please follow the instructions to reset your password",
        html: `<h2>Hey ${user.name}...! How's your day?</h2>
        <h4>Please use the below link to reset your password.</h4>
        <h5><strong>Note:</strong>The below link expires in 15 minutes</h5>
        <a href="${process.env.FRONTEND_URL}/reset-password/resetLink=${resetLink}">Click here!</a>`,
      };

      //updating password reset link in db
      let userUpdate = await User.updateOne({ resetLink });
      if (userUpdate.acknowledged) {
        //sending email to user
        transporter.sendMail(mailOptions, function (error, info) {
          if (error) {
            console.log("Error in sending password reset email", error);
            res.status(400).json("Error in sending password reset email");
          } else {
            console.log("Password Reset email sent successfully");
            res
              .status(200)
              .json(
                "Password reset email sent successfully. Please check in spam folder if not found in inbox."
              );
          }
        });
      } else {
        return res.status(400).json("Error in updating link in the db");
      }
    } else {
      return res
        .status(400)
        .json("User with this email doesn't exists. Please check your email");
    }
  } catch (error) {
    console.log("ERROR IN FORGOT PASSWORD ROUTE ===>", error);
    res.status(400).json("Error in forgotPassword route");
  }
};

//resetting the password
export const resetPassword = async (req, res) => {
  try {
    // const { resetLink } = req.query.resetLink;
    let { password, resetLink } = req.body;
    if (resetLink) {
      resetLink = resetLink.slice(10);
      jwt.verify(
        resetLink,
        process.env.JWT_SECRET,
        function (error, decodedData) {
          if (error) {
            return res.status(401).json("Incorrect token or token expired");
          }
          User.findOne({ resetLink }, async (err, user) => {
            if (err || !user) {
              return res.status(400).json("Password reset link is expired");
            }
            //hashing the password
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            const obj = {
              password: hashedPassword,
              resetLink: "",
            };

            user = _.extend(user, obj);
            user.save((err, result) => {
              if (err) {
                return res.status(400).json("reset password error", err);
              } else {
                return res.status(200).json("Password changed successfully");
              }
            });
          });
        }
      );
    } else {
      res
        .status(400)
        .json("It seems the token is expired. Please generate new one");
    }
  } catch (error) {
    console.log("ERROR IN RESETTING THE PASSWORD", error);
    res.status(400).json("Error in resetting the password");
  }
};
