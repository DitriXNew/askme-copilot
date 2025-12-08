// Logger utility for Ask Me Copilot Tool
import * as vscode from 'vscode';

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3
}

export class Logger {
    private channel: vscode.LogOutputChannel;
    private level: LogLevel = LogLevel.INFO;
    
    constructor(name: string) {
        this.channel = vscode.window.createOutputChannel(name, { log: true });
    }
    
    debug(message: string, ...args: any[]) {
        if (this.level <= LogLevel.DEBUG) {
            this.channel.debug(`🔍 [DEBUG] ${message}`, ...args);
        }
    }
    
    info(message: string, ...args: any[]) {
        if (this.level <= LogLevel.INFO) {
            this.channel.info(`✨ [INFO] ${message}`, ...args);
        }
    }
    
    warn(message: string, ...args: any[]) {
        if (this.level <= LogLevel.WARN) {
            this.channel.warn(`⚠️ [WARN] ${message}`, ...args);
        }
    }
    
    error(message: string, error?: any) {
        this.channel.error(`❌ [ERROR] ${message}`, error);
    }
    
    setLevel(level: LogLevel) {
        this.level = level;
    }
}

// Global logger instance
let logger: Logger | undefined;

export function getLogger(): Logger {
    if (!logger) {
        logger = new Logger('AskMeCopilot');
    }
    return logger;
}

export function initLogger(): Logger {
    logger = new Logger('AskMeCopilot');
    return logger;
}
