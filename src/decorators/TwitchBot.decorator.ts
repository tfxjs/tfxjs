import 'reflect-metadata';
import Container from 'typedi';
import ConfigService from '../services/Config.service';
import DINames from '../utils/DI.names';
import { LoggerFactory, LogLevel } from '../utils/Logger';
import { IModuleDefinition, Provider } from '../types/Module.types';

export interface ITwitchBotOptions {
    client: {
        id: string;
        secret: string;
    };
    userId: string;
    modules: IModuleDefinition[];
    log: {
        levels: LogLevel[];
    };
}

export function TwitchBot(options: ITwitchBotOptions): ClassDecorator {
    return (target: any) => {
        if (Container.has(DINames.ConfigService)) throw new Error(`You can only have one instance of bot`);

        // Basic

        const configService = new ConfigService(options);
        Container.set(DINames.ConfigService, configService);

        LoggerFactory.setConfig(configService);
        const logger = LoggerFactory.createLogger('TwitchBot');

        // userDefined
        options.modules.forEach((moduleDefinition) => {
            if(!moduleDefinition.userProviders) return;
            moduleDefinition.userProviders.forEach((provider: Provider<any>) => {
                logger.debug(`Setting up ${moduleDefinition.module.name}:${provider.token}`);
                if (provider.useClass) {
                    if(Container.has(provider.token)) {
                        console.error(`Duplicate provider ${provider.token}`);
                        return;
                    }
                    Container.set(provider.token, new provider.useClass());
                } else if (provider.useValue) {
                    Container.set(provider.token, provider.useValue);
                }
            });
        });

        // services
        options.modules.forEach((moduleDefinition) => {
            moduleDefinition.providers.forEach((provider: Provider<any>) => {
                logger.debug(`Setting up ${moduleDefinition.module.name}:${provider.token}`);
                if (provider.useClass) {
                    Container.get(provider.token)
                } else if (provider.useValue) {
                    Container.set(provider.token, provider.useValue);
                }
            });
        });

    };
}
