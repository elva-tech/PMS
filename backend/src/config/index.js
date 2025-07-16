const dotenv = require("dotenv");
const path = require("path");
const { db } = require("../models/contact.model");

dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  env: process.env.NODE_ENV || "development",
  port: process.env.PORT || 5000,
  mongoose: {
    url: process.env.MONGODB_URL,
    options: {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: "real-estate-management",
    },
  },
  jwt: {
    secret: process.env.JWT_SECRET || "your-secret-key",
    accessExpirationMinutes: process.env.JWT_ACCESS_EXPIRATION_MINUTES || 30,
  },
};
