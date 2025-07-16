const jwt = require("jsonwebtoken");
const httpStatus = require("http-status");

const JWT_SECRET = process.env.JWT_SECRET;

const validateToken = (token) => {
  try {
    if (!token) return false;
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
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
    // Get token from header
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "No token provided",
      });
    }

    const decoded = validateToken(token);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    res.status(200).json({
      success: true,
      valid: true,
      user: decoded,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Token validation failed",
    });
  }
};

module.exports = {
  login,
  logout,
  validate,
};
