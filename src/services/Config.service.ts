import { ITwitchBotOptions } from "../decorators/TwitchBot.decorator";
import { Logger, LoggerFactory } from "../utils/Logger";

export type ConfigServiceConfig = Omit<ITwitchBotOptions, 'modules'>;

export default class ConfigService {
    private logger: Logger;

    constructor(
        private config: ConfigServiceConfig
    ) {
        this.logger = LoggerFactory.createLogger('ConfigService');
        this.logger.debug('Initialized');
    }

    getConfig() {
        return this.config;
    }

    getUserId() {
        return this.config.userId;
    }

    getClientId() {
        return this.config.client.id;
    }

    getClientSecret() {
        return this.config.client.secret;
    }
}