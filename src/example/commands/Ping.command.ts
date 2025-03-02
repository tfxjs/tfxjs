import { ChatCommand } from "../../decorators/ChatCommand.decorator";
import { Mess } from "../../decorators/ChatData.decorators";
import CommandsModule from "../../modules/Commands.module";
import { TwitchChatMessage } from "../../objects/ChatMessage.object";
import { ChatCommandExecution } from '../../types/ChatCommand.types';

@ChatCommand(CommandsModule.forFeature({
    name: 'ping',
    keyword: 'ping',
    aliases: ['p'],
    transistent: false,
}))
export default class PingCommand implements ChatCommandExecution {
    async execution(
        @Mess() message: TwitchChatMessage,
    ): Promise<void> {
        message.reply(`Pong!`);
    }
}