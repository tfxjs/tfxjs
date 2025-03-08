import { API, BroadcasterData, ChannelOptionsProvider, ChatCommand, ChatCommandExecution, ChatCommandExecutionGuard, ChatCommandExecutionGuardAvaliableResults, ChatCommandPostExecution, ChatCommandPreExecution, ChatterUser, CommandsModule, Mess, MessageUser, OptionsManager, PartialTwitchUser, RefreshChatListeners, TChannelOptions, TwitchChatMessage, APIClient } from "../../../index";

export type ChannelOptionsExtend = TChannelOptions<{
    eXampleExecutionCounter: number;
}>;

@ChatCommand(CommandsModule.forFeature({ 
    name: 'example',
    keyword: 'eXample',
    ignoreCase: false
}))
export default class ExampleCommand implements ChatCommandExecutionGuard, ChatCommandPreExecution, ChatCommandExecution, ChatCommandPostExecution {
    async guard(@MessageUser() user: ChatterUser): Promise<ChatCommandExecutionGuardAvaliableResults> {
        if(user.isBroadcaster() || user.isModerator() || user.isVIP()) return { canAccess: true };
        return { canAccess: false, message: "You must be a broadcaster, moderator or VIP to use this command." };
    }

    async preExecution(): Promise<void> {}

    async execution(
        @OptionsManager() optionsManager: ChannelOptionsProvider<ChannelOptionsExtend>,
        @BroadcasterData() broadcasterData: PartialTwitchUser,
        @Mess() message: TwitchChatMessage,
        @RefreshChatListeners() refreshChannels: () => void
    ): Promise<void> {
        const options = await optionsManager.getChannelOptions(broadcasterData.getId());
        await message.reply(`Example command executed ${options.eXampleExecutionCounter} times.`);
        if(!options.eXampleExecutionCounter) options.eXampleExecutionCounter = 0;

        const saver = optionsManager.getChannelOptionsSaver(broadcasterData.getId());
        await saver('eXampleExecutionCounter', options.eXampleExecutionCounter + 1);

        refreshChannels();
    }

    async postExecution(
            @API() api: APIClient,
            @BroadcasterData() broadcasterData: PartialTwitchUser
        ): Promise<void> {
            const botUserId = api.config.getConfig().userId;
            await api.sendMessage(botUserId, `eXample command executed @ #${broadcasterData.getLogin()}`);
        }
}