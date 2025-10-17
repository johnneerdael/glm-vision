/**
 * Logger utility that writes to stderr and a log file.
 * Stderr keeps MCP JSON on stdout clean; file provides persistent logs.
 */
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
class Logger {
    logStream;
    logFilePath;
    constructor(logFilePath) {
        if (logFilePath) {
            this.setLogFile(logFilePath);
        }
    }
    setLogFile(logFilePath) {
        try {
            this.logFilePath = logFilePath;
            const dir = path.dirname(logFilePath);
            fs.mkdirSync(dir, { recursive: true });
            if (this.logStream) {
                this.logStream.end();
            }
            this.logStream = fs.createWriteStream(logFilePath, { flags: 'a' });
        }
        catch (err) {
            const timestamp = new Date().toISOString();
            const msg = `[${timestamp}] ERROR: Failed to initialize log file '${logFilePath}': ${String(err)}`;
            process.stderr.write(msg + '\n');
        }
    }
    safeStringify(obj) {
        // Serialize Error objects so that message/stack and custom fields are visible
        const replacer = (_key, value) => {
            if (value instanceof Error) {
                const base = {
                    name: value.name,
                    message: value.message,
                    stack: value.stack
                };
                // Include enumerable own properties (e.g., code, statusCode, details, context)
                for (const k of Object.keys(value)) {
                    if (!(k in base)) {
                        base[k] = value[k];
                    }
                }
                return base;
            }
            return value;
        };
        try {
            return JSON.stringify(obj, replacer);
        }
        catch {
            try {
                return String(obj);
            }
            catch {
                return '[Unserializable]';
            }
        }
    }
    write(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const serializedArgs = args.length > 0 ? ` ${this.safeStringify(args)}` : '';
        const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${serializedArgs}`;
        // Write to stderr (visible console output without polluting stdout)
        process.stderr.write(logMessage + '\n');
        // Write to log file if configured
        if (this.logStream) {
            this.logStream.write(logMessage + '\n');
        }
    }
    info(message, ...args) {
        this.write('info', message, ...args);
    }
    error(message, ...args) {
        this.write('error', message, ...args);
    }
    warn(message, ...args) {
        this.write('warn', message, ...args);
    }
    debug(message, ...args) {
        this.write('debug', message, ...args);
    }
    log(message, ...args) {
        this.write('info', message, ...args);
    }
}
export const logger = new Logger();
/**
 * Override global console to redirect to stderr
 * This prevents console output from interfering with MCP JSON protocol
 */
export function setupConsoleRedirection() {
    const originalConsole = { ...console };
    // Cross-platform log file path:
    // - If env ZAI_MCP_LOG_PATH is set, use it
    // - Otherwise use user home directory: ~/.zai/zai-mcp-YYYY-MM-DD.log (Windows/macOS/Linux)
    const resolveLogFilePath = () => {
        const envPath = process.env.ZAI_MCP_LOG_PATH;
        if (envPath && envPath.trim().length > 0) {
            return path.resolve(envPath);
        }
        const homeDir = os.homedir();
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`;
        return path.join(homeDir, '.zai', `zai-mcp-${dateStr}.log`);
    };
    logger.setLogFile(resolveLogFilePath());
    console.info = logger.info.bind(logger);
    console.error = logger.error.bind(logger);
    console.warn = logger.warn.bind(logger);
    console.debug = logger.debug.bind(logger);
    console.log = logger.log.bind(logger);
    return originalConsole;
}