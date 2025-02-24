import ChatCommandsService from '../services/ChatCommands.service';
import { ChatCommandExecution } from '../types/ChatCommand.types';
import { IModuleDefinition } from '../types/Module.types';
import DINames from '../utils/DI.names';

export type CommandsModuleForRootConfig = {
    commands: (new () => ChatCommandExecution)[];
};

export type CommandsModuleForFeatureConfig = {
    name: string;
    keyword: string;
    aliases?: string[];
    ignoreCase?: boolean;
    transistent?: boolean;
}

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
