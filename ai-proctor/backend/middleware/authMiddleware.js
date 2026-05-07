const jwt = require("jsonwebtoken");
const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

// @desc  Verify JWT and attach user to req.user
const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    res.status(401);
    throw new Error("Not authorized, no token provided");
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    res.status(401);
    throw new Error("Not authorized, token is invalid or expired");
  }

  req.user = await User.findById(decoded.id).select("-password");

  if (!req.user) {
    res.status(401);
    throw new Error("Not authorized, user no longer exists");
  }

  next();
});

// @desc  Restrict route to teacher role only
const teacherOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "teacher") {
    res.status(403);
    throw new Error("Not authorized — teacher access only");
  }
  next();
});

// @desc  Restrict route to student role only
const studentOnly = asyncHandler(async (req, res, next) => {
  if (req.user.role !== "student") {
    res.status(403);
    throw new Error("Not authorized — student access only");
  }
  next();
});

// @desc  Restrict route to specific roles
// Usage: authorizeRoles("teacher") or authorizeRoles("teacher", "admin")
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      res.status(403);
      return next(new Error(
        `Access denied — role '${req.user.role}' cannot access this route`
      ));
    }
    next();
  };
};

module.exports = { protect, teacherOnly, studentOnly, authorizeRoles };