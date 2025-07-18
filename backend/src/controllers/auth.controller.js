const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const JWT_SECRET = process.env.JWT_SECRET;

const validateToken = (token) => {
  try {
    if (!token) {
      throw new Error("No token provided");
    }
    if (!JWT_SECRET) {
      throw new Error("JWT_SECRET is not configured");
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("Token validation error:", error.message);
    return false;
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

const validate = (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log("No authorization header");
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "No token provided",
      });
    }

    // Extract token from Bearer token
    const token = authHeader.split(" ")[1];

    if (!token) {
      console.log("No token in authorization header");
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = validateToken(token);

    if (!decoded) {
      console.log("Token validation failed");
      return res.status(httpStatus.UNAUTHORIZED).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    // Add cache control headers to prevent caching
    res.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    res.set("Pragma", "no-cache");
    res.set("Expires", "0");

    res.json({
      success: true,
      user: decoded,
    });
  } catch (error) {
    console.error("Validation error:", error);
    res.status(httpStatus.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Internal server error",
      error: error.message,
    });
  }
};

module.exports = {
  login,
  logout,
  validate,
};
