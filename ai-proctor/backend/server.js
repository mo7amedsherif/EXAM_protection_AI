const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const connectDB = require("./config/db");
const { errorHandler } = require("./middleware/errorMiddleware");

dotenv.config();
connectDB();

const app = express();

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:5173"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Serve uploaded files as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
//for checking if the server is running or not
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", env: process.env.NODE_ENV });
});
//api fpr project 
app.use("/api/users",         require("./routes/userRoutes"));
app.use("/api/exams",         require("./routes/examRoutes"));
app.use("/api/results",       require("./routes/resultRoutes"));
app.use("/api/cheating-logs", require("./routes/cheatingLogRoutes"));
app.use("/api/materials",     require("./routes/materialRoutes"));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}
  and  url is http://localhost:5000`));