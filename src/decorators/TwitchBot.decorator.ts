import 'reflect-metadata';
import ConfigService from '../services/Config.service';
import DINames from '../utils/DI.names';
import { LoggerFactory, LogLevel } from '../utils/Logger';
import { IModuleDefinition, Provider } from '../types/Module.types';
import { DIContainer } from '../di/Container';

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
        if (DIContainer.isBound(DINames.ConfigService)) throw new Error(`You can only have one instance of bot`);

        // Basic

        const configService = new ConfigService(options);
        DIContainer.bind(DINames.ConfigService).toConstantValue(configService);

        LoggerFactory.setConfig(configService);
        const logger = LoggerFactory.createLogger('TwitchBot');

        // userDefined
        options.modules.forEach((moduleDefinition) => {
            if (!moduleDefinition.userProviders) return;
            moduleDefinition.userProviders.forEach((provider: Provider<any>) => {
                logger.debug(`Setting up ${moduleDefinition.module.name}:${provider.token}`);

                if (DIContainer.isBound(provider.token)) {
                    logger.error(`Duplicate provider ${provider.token}`);
                    return;
                }

                if (provider.useClass) {
                    DIContainer.bind(provider.token).to(provider.useClass).inSingletonScope();
                } else if (provider.useValue) {
                    DIContainer.bind(provider.token).toConstantValue(provider.useValue);
                }
            });
        });

        // services
        options.modules.forEach((moduleDefinition) => {
            moduleDefinition.providers.forEach((provider: Provider<any>) => {
                logger.debug(`Setting up ${moduleDefinition.module.name}:${provider.token}`);

                if (DIContainer.isBound(provider.token)) {
                    logger.debug(`Duplicate provider ${provider.token}`);
                    return;
                }

                if (provider.useClass) {
                    DIContainer.bind(provider.token).to(provider.useClass).inSingletonScope();
                } else if (provider.useValue) {
                    DIContainer.bind(provider.token).toConstantValue(provider.useValue);
                }
            });
        });

        // run services
        options.modules.forEach((moduleDefinition) => {
            moduleDefinition.providers.forEach((provider: Provider<any>) => {
                DIContainer.get(provider.token);
            });
        });
    };
}