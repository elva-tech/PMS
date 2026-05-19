const fs = require("fs");
const path = require("path");

// ANSI color codes for console output
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
};

// Log levels with priorities and colors
const LOG_LEVELS = {
  ERROR: { priority: 0, color: colors.red, label: "ERROR" },
  WARN: { priority: 1, color: colors.yellow, label: "WARN" },
  INFO: { priority: 2, color: colors.green, label: "INFO" },
  HTTP: { priority: 3, color: colors.magenta, label: "HTTP" },
  DEBUG: { priority: 4, color: colors.blue, label: "DEBUG" },
  VERBOSE: { priority: 5, color: colors.cyan, label: "VERBOSE" },
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || "INFO";
    this.enableConsole = options.enableConsole !== false; // Default to true
    this.enableFile = options.enableFile || false;
    this.logDir = options.logDir || path.join(process.cwd(), "logs");
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    this.dateFormat = options.dateFormat || "YYYY-MM-DD HH:mm:ss";

    // Create logs directory if file logging is enabled
    if (this.enableFile) {
      this.ensureLogDirectory();
    }
  }

  /**
   * Ensure the log directory exists
   */
  ensureLogDirectory() {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Format timestamp
   */
  getTimestamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Get log file path for current date
   */
  getLogFilePath(level) {
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(this.logDir, `${level.toLowerCase()}-${date}.log`);
  }

  /**
   * Check if current log level should be displayed
   */
  shouldLog(level) {
    const currentLevelPriority = LOG_LEVELS[this.level].priority;
    const messageLevelPriority = LOG_LEVELS[level].priority;
    return messageLevelPriority <= currentLevelPriority;
  }

  /**
   * Format log message
   */
  formatMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const levelInfo = LOG_LEVELS[level];

    let formattedMessage = `[${timestamp}] [${levelInfo.label}]`;

    // Add metadata if provided
    if (meta && Object.keys(meta).length > 0) {
      const metaString = JSON.stringify(meta);
      formattedMessage += ` ${message} ${metaString}`;
    } else {
      formattedMessage += ` ${message}`;
    }

    return formattedMessage;
  }

  /**
   * Format message for console with colors
   */
  formatConsoleMessage(level, message, meta = {}) {
    const timestamp = this.getTimestamp();
    const levelInfo = LOG_LEVELS[level];

    let formattedMessage = `${colors.gray}[${timestamp}]${colors.reset} `;
    formattedMessage += `${levelInfo.color}[${levelInfo.label}]${colors.reset} `;
    formattedMessage += `${message}`;

    // Add metadata if provided
    if (meta && Object.keys(meta).length > 0) {
      formattedMessage += ` ${colors.dim}${JSON.stringify(meta)}${
        colors.reset
      }`;
    }

    return formattedMessage;
  }

  /**
   * Write to file
   */
  writeToFile(level, formattedMessage) {
    if (!this.enableFile) return;

    try {
      const logFile = this.getLogFilePath(level);

      // Check file size and rotate if necessary
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxFileSize) {
          this.rotateLogFile(logFile);
        }
      }

      fs.appendFileSync(logFile, formattedMessage + "\n");
    } catch (error) {
      console.error("Failed to write to log file:", error.message);
    }
  }

  /**
   * Rotate log file when it gets too large
   */
  rotateLogFile(logFile) {
    try {
      const ext = path.extname(logFile);
      const base = logFile.slice(0, -ext.length);

      // Shift existing backup files
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = `${base}.${i}${ext}`;
        const newFile = `${base}.${i + 1}${ext}`;

        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile); // Delete oldest
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }

      // Move current file to .1
      if (fs.existsSync(logFile)) {
        fs.renameSync(logFile, `${base}.1${ext}`);
      }
    } catch (error) {
      console.error("Failed to rotate log file:", error.message);
    }
  }

  /**
   * Core logging method
   */
  log(level, message, meta = {}) {
    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, meta);

    // Console output
    if (this.enableConsole) {
      const consoleMessage = this.formatConsoleMessage(level, message, meta);
      console.log(consoleMessage);
    }

    // File output
    if (this.enableFile) {
      this.writeToFile(level, formattedMessage);
    }
  }

  /**
   * Error level logging
   */
  error(message, meta = {}) {
    this.log("ERROR", message, meta);
  }

  /**
   * Warning level logging
   */
  warn(message, meta = {}) {
    this.log("WARN", message, meta);
  }

  /**
   * Info level logging
   */
  info(message, meta = {}) {
    this.log("INFO", message, meta);
  }

  /**
   * HTTP level logging
   */
  http(message, meta = {}) {
    this.log("HTTP", message, meta);
  }

  /**
   * Debug level logging
   */
  debug(message, meta = {}) {
    this.log("DEBUG", message, meta);
  }

  /**
   * Verbose level logging
   */
  verbose(message, meta = {}) {
    this.log("VERBOSE", message, meta);
  }

  /**
   * Set log level
   */
  setLevel(level) {
    if (LOG_LEVELS[level]) {
      this.level = level;
    } else {
      throw new Error(
        `Invalid log level: ${level}. Valid levels are: ${Object.keys(
          LOG_LEVELS
        ).join(", ")}`
      );
    }
  }

  /**
   * Enable or disable console logging
   */
  setConsoleLogging(enabled) {
    this.enableConsole = enabled;
  }

  /**
   * Enable or disable file logging
   */
  setFileLogging(enabled) {
    this.enableFile = enabled;
    if (enabled) {
      this.ensureLogDirectory();
    }
  }
}

// Create default logger instance
const logger = new Logger({
  level: process.env.LOG_LEVEL || "INFO",
  enableConsole: true,
  enableFile: process.env.ENABLE_FILE_LOGGING === "true",
  logDir: process.env.LOG_DIR || path.join(process.cwd(), "logs"),
});

// Export both the class and default instance
module.exports = {
  Logger,
  logger,
  LOG_LEVELS: Object.keys(LOG_LEVELS),
};
