import express from "express";
import morgan from "morgan";
import dotenv from "dotenv";
import mongoose from "mongoose";
import router from "./routes/auth.js";
import cookieParser from "cookie-parser";
import cors from "cors";

const app = express();
dotenv.config();

//connect database
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Database connected"))
  .catch((err) => console.log("Error in connecting Database", err));

//middlewares
app.use(express.json());
app.use(morgan("dev"));
app.use(cookieParser());
app.use(cors());

//route middleware
app.use("/api", router);

//listening the app on the server on port
const port = process.env.PORT || 8000;
app.listen(port, () => console.log(`server is running at 8000`));
