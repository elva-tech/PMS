const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

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

module.exports = {
  login,
  logout,
};
