const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");
const { logger } = require("../utils/logger");
const {
  getUserByEmail,
  validatePassword,
  getUsersWithPasswords,
} = require("../services/user.service");
process.env.USERNAME =
  require("dotenv").config().parsed.USERNAME || process.env.USERNAME;
const JWT_SECRET = process.env.JWT_SECRET;
const validateToken = (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is missing in environment variables");
      throw new Error("Server configuration error");
    }

    // Verify and decode the token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Check if token is expired
    const currentTimestamp = Math.floor(Date.now() / 1000);
    if (decoded.exp && decoded.exp < currentTimestamp) {
      throw new Error("Token has expired");
    }

    return decoded;
  } catch (error) {
    console.error("Token validation error:", error.message);
    if (error.name === "JsonWebTokenError") {
      throw new Error("Invalid token");
    }
    if (error.name === "TokenExpiredError") {
      throw new Error("Token has expired");
    }
    throw error;
  }
};

const ADMIN_CREDENTIALS = {
  username: process.env.USERNAME,
  password: process.env.PASSWORD,
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    

    // Check if credentials match admin
    if (
      username === ADMIN_CREDENTIALS.username &&
      password === ADMIN_CREDENTIALS.password
    ) {
      const token = jwt.sign(
        {
          username: ADMIN_CREDENTIALS.username,
          role: "admin",
          type: "admin",
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      return res.json({
        success: true,
        token,
        message: "Admin login successful",
        user: {
          username: ADMIN_CREDENTIALS.username,
          role: "admin",
          type: "admin",
        },
      });
    }

    // Check if credentials match by email
    let user;
    user = await getUserByEmail(username);
    // Check if credentials match by email
    if (!user) {
      const allUsers = await getUsersWithPasswords();
      user = allUsers.find((u) => u.username === username);
    }

    if (user) {
      const isPasswordValid = await validatePassword(
        password,
        user.userpassword
      );

      if (isPasswordValid && user.userstatus !== 1) {
        return res.status(httpStatus.FORBIDDEN).json({
          success: false,
          code: "ACCOUNT_INACTIVE",
          message:
            "Your account is inactive. Please contact the administrator.",
        });
      }

      if (isPasswordValid && user.userstatus === 1) {
        const token = jwt.sign(
          {
            userid: user.userid,
            username: user.username,
            useremail: user.useremail,
            role: "user",
            type: "user",
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );

        return res.json({
          success: true,
          token,
          message: "User login successful",
          user: {
            userid: user.userid,
            username: user.username,
            useremail: user.useremail,
            role: "user",
            type: "user",
          },
        });
      }
    }

    // If neither admin nor user credentials match
    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
};

const logout = (req, res) => {
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

const validate = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    if (!token) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "No token provided in authorization header",
      });
    }

    try {
      const decoded = validateToken(token);

      // Add cache control headers to prevent caching
      res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
      res.set("Pragma", "no-cache");
      res.set("Expires", "0");

      return res.json({
        success: true,
        user: decoded,
      });
    } catch (tokenError) {
      console.error("Token validation failed:", tokenError.message);
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: tokenError.message || "Token validation failed",
      });
    }
  } catch (error) {
    console.error("Validation endpoint error:", error);
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

module.exports = {
  login,
  logout,
  validate,
};
