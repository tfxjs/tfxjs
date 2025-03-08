import { ChannelOptionsProvider, ChatCommand, ChatCommandExecution, ChatCommandExecutionGuard, ChatCommandExecutionGuardAvaliableResults, ChatterUser, CommandsModule, Mess, MessageUser, OptionsManager, TwitchChatMessage } from "../../../index";

@ChatCommand(CommandsModule.forFeature({
    name: 'ChangePrefixCommand',
    keyword: 'prefix'
}))
export default class PrefixCommand implements ChatCommandExecution, ChatCommandExecutionGuard {
    guard(
        @MessageUser() chatter: ChatterUser,
    ): ChatCommandExecutionGuardAvaliableResults {
        if (chatter.isBroadcaster() || chatter.isModerator()) return { canAccess: true };
        return { canAccess: false, message: 'You do not have permission to execute this command'};
    }

    async execution(
        @OptionsManager() options: ChannelOptionsProvider,
        @Mess() message: TwitchChatMessage
    ) {
        console.log('ChangePrefixCommand executed');
        const messageContent = message.getText();
        const newPrefix = messageContent.split(' ')[1];
        if (!newPrefix) {
            message.reply('You need to specify a prefix');
            return;
        }

        const saver = options.getChannelOptionsSaver(message.getBroadcasterId())
        await saver('prefix', newPrefix);

        message.reply(`Prefix changed to ${newPrefix}`);
    }
}