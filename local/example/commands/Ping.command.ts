import { ChatCommand, ChatCommandExecution, CommandsModule, Mess, TwitchChatMessage } from "../../../index";


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