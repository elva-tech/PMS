const express = require("express");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Welcome to Real Estate Management System API" });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
