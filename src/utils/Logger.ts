import Container, { Inject, Service } from "typedi";
import DINames from "./DI.names";
import ConfigService from "../services/Config.service";

export enum LogLevel {
    NORMAL = 'normal',
    DEBUG = 'debug',
    ERROR = 'error',
    WARN = 'warn',
    INFO = 'info'
}

export enum ANSI_COLORS {
    reset = "\x1b[0m",
    white = "\x1b[37m",
    blue = "\x1b[34m",
    red = "\x1b[31m",
    yellow = "\x1b[33m",
    green = "\x1b[32m",
    cyan = "\x1b[36m",
    magenta = "\x1b[35m",
    black = "\x1b[30m"
};


export class LoggerFactory {
    private static _logger: Logger | null = null;
    private static configService: ConfigService | null = null;

    static get logger(): Logger {
        if (LoggerFactory._logger === null) LoggerFactory._logger = new Logger('LoggerFactory');
        return LoggerFactory._logger;
    }

    public static setConfig(configService: ConfigService): void {
        this.logger.debug('Setting config service');
        this.configService = configService
    }

    public static createLogger(name: string, nameColor: ANSI_COLORS = ANSI_COLORS.cyan, messageColor: ANSI_COLORS = ANSI_COLORS.white): Logger {
        this.logger.debug(`Creating logger for ${name}`);
        return new Logger(name, nameColor, messageColor, this.configService);
    }
}

export class Logger {
    constructor(
        private readonly name: string,
        private readonly nameColor: ANSI_COLORS = ANSI_COLORS.cyan,
        private readonly messageColor: ANSI_COLORS = ANSI_COLORS.white,
        private configService: ConfigService | null = null
    ) {
        
    }

    private canShowLogLevel(type: LogLevel): boolean {
        if(!Container.has(DINames.ConfigService)) return true;
        this.configService = Container.get(DINames.ConfigService);
        if(this.configService === null) return true;
        const config = this.configService.getConfig()
        if (!config.log) return true;
        if(config.log.levels.includes(type)) return true;
        return false;
    }

    /**
     * Censor tokens in the message
     * @param token Token to censor 
     * @returns Censored message
     */
    public censor(token: string): string {
        const length = token.length;
        const visibleLength = Math.ceil(length * 0.1);
        const start = token.slice(0, visibleLength);
        const end = token.slice(-visibleLength);
        return `${start}${'*'.repeat(length - 2 * visibleLength)}${end}`;
    }

    private formatMessage(level: LogLevel, message: string): string {
        const nameColorCode = this.nameColor || ANSI_COLORS.white;
        const messageColorCode = this.getLevelColor(level);
        return `${nameColorCode}[${this.name}]${ANSI_COLORS.reset} ${messageColorCode}${message}${ANSI_COLORS.reset}`;
    }

    private getLevelColor(level: LogLevel): string {
        switch (level) {
            case LogLevel.DEBUG:
                return ANSI_COLORS.blue;
            case LogLevel.ERROR:
                return ANSI_COLORS.red;
            case LogLevel.WARN:
                return ANSI_COLORS.yellow;
            case LogLevel.INFO:
                return ANSI_COLORS.green;
            default:
                return this.messageColor || ANSI_COLORS.white;
        }
    }

    public log(message: string, level: LogLevel = LogLevel.NORMAL): void {
        if (!this.canShowLogLevel(level)) return;
        console.log(this.formatMessage(level, message));
    }

    public error(message: string): void {
        if(!this.canShowLogLevel(LogLevel.ERROR)) return;
        this.log(message, LogLevel.ERROR);
    }

    public warn(message: string): void {
        if(!this.canShowLogLevel(LogLevel.WARN)) return;
        this.log(message, LogLevel.WARN);
    }

    public debug(message: string): void {
        if(!this.canShowLogLevel(LogLevel.DEBUG)) return;
        this.log(message, LogLevel.DEBUG);
    }

    public info(message: string): void {
        if(!this.canShowLogLevel(LogLevel.INFO)) return;
        this.log(message, LogLevel.INFO);
    }
}