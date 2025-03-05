import { ChatCommand } from "../../decorators/ChatCommand.decorator";
import { Mess, MessageUser, OptionsManager, OptionsProvider } from "../../decorators/ChatData.decorators";
import CommandsModule from "../../modules/Commands.module";
import { TwitchChatMessage } from "../../objects/ChatMessage.object";
import { ChatterUser } from "../../objects/TwitchUser.object";
import { ChannelOptionsProvider } from "../../providers/ChannelOptions.provider";
import { ChatCommandExecution, ChatCommandExecutionGuard, ChatCommandExecutionGuardAvaliableResults } from "../../types/ChatCommand.types";

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