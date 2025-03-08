import { BroadcasterData, ChatListener, ChatListenerExecution, ChatMessage, ChatterUser, ListenersModule, MessageData, MessageUser, PartialTwitchUser, SenderData } from "../../../index";

@ChatListener(ListenersModule.forFeature({
    name: 'ShowMessage',
    transient: true
}))
export default class ShowMessageListener implements ChatListenerExecution {
    async execution(
        @SenderData() sender: PartialTwitchUser,
        @BroadcasterData() broadcaster: PartialTwitchUser,
        @MessageData() message: ChatMessage,
        @MessageUser() chatter: ChatterUser 
    ): Promise<void> {
        const textBadges: string[] = [];
        if(chatter.isBroadcaster()) textBadges.push('[B]');
        if(chatter.isModerator()) textBadges.push('[M]');
        if(chatter.isVIP()) textBadges.push('[VIP]');
        if(chatter.isSubscriber()) textBadges.push(`[SUB:${chatter.getSubscriberMonths()}]`);
        if(chatter.isSubGifter()) textBadges.push(`[GIFT:${chatter.getGiftedSubs()}]`);
        if(chatter.isBitsGift()) textBadges.push(`[BITS:${chatter.getGiftedBits()}]`);
        console.log(`#${broadcaster.getUsername()} | ${textBadges.join('')}${sender.getUsername()}: ${message.getText()}`);
    }
}