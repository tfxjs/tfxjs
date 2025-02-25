import { ITwitchBotOptions } from "../decorators/TwitchBot.decorator";

export type ConfigServiceConfig = Omit<ITwitchBotOptions, 'modules'>;

export default class ConfigService {
    constructor(
        private config: ConfigServiceConfig
    ) {}

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