import ChatCommandsService from '../services/ChatCommands.service';
import { CommandsModuleForFeatureConfig, CommandsModuleForRootConfig, IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export default class CommandsModule {
    static forRoot(config: CommandsModuleForRootConfig): IModuleDefinition {
        return {
            module: CommandsModule,
            userProviders: [{ token: DINames.Commands, useValue: config.commands }],
            providers: [
                {
                    token: DINames.ChatCommandsService,
                    useClass: ChatCommandsService,
                },
            ],
        };
    }

    static forFeature(config: CommandsModuleForFeatureConfig): CommandsModuleForFeatureConfig {
        return {
            aliases: [],
            ignoreCase: false,
            transistent: false,
            ...config
        }
    }
}
