const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

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

// Hardcoded admin credentials
const ADMIN_CREDENTIALS = {
  username: "admin",
  password: "1234",
};

const login = (req, res) => {
  const { username, password } = req.body;

  // Check if credentials match
  if (
    username === ADMIN_CREDENTIALS.username &&
    password === ADMIN_CREDENTIALS.password
  ) {
    // Generate JWT token
    const token = jwt.sign(
      { username: ADMIN_CREDENTIALS.username },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Send token in response
    res.json({
      success: true,
      token,
      message: "Login successful",
    });
  } else {
    res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  }
};

const logout = (req, res) => {
  // Since we're using JWT, we don't need to do anything server-side
  // The client should remove the token from their storage
  res.json({
    success: true,
    message: "Logged out successfully",
  });
};

const validate = async (req, res) => {
  // Set CORS headers explicitly for this endpoint
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Max-Age", "86400"); // 24 hours

  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "No authorization header provided",
      });
    }

    // Extract token from Bearer token
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
