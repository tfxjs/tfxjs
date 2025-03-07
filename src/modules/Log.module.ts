import { IModuleDefinition, LogModuleForFeatureConfig, LogModuleForRootConfig } from '../types/Module.types';
import { LoggerFactory } from '../utils/Logger';

export default class LogModule {
    static forRoot(config: LogModuleForRootConfig): IModuleDefinition {
        LoggerFactory.setModuleConfig(config);

        return {
            module: LogModule,
            userProviders: [],
            providers: [],
        };
    }

    static forFeature(config: LogModuleForFeatureConfig): LogModuleForFeatureConfig {
        return {
            ...config
        }
    }
}
