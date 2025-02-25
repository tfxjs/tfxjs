/*

Dekorator do definiowania klas jako komendy czatu

Przykład użycia:

@ChatCommand({
    name: string;
    keyword: string;
    aliases?: string[];
    ignorePrefix?: boolean;
    ignoreCase?: boolean;
    transistent?: boolean;
})

*/

// Decorator
import ChatCommandsService from "../services/ChatCommands.service";
import { CommandsModuleForFeatureConfig } from "../types/Module.types";

// Decorator
export function ChatCommand(options: CommandsModuleForFeatureConfig): ClassDecorator {
    return function (target: any) {
        const allOptions: Required<CommandsModuleForFeatureConfig> = {
            name: options.name,
            keyword: options.keyword,
            aliases: options.aliases ?? [],
            transistent: options.transistent ?? false,
            ignoreCase: options.ignoreCase ?? true
        };

        ChatCommandsService.registerCommand(target, allOptions);
    };
}