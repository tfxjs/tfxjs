import { BroadcasterData, MessageData, MessageUser, Raw, SenderData } from "../../decorators/ChatData.decorators";
import { ChatListener } from "../../decorators/ChatListener.decorator";
import ListenersModule from "../../modules/Listeners.module";
import { ChatMessage } from "../../objects/ChatMessage.object";
import { ChatterUser, PartialTwitchUser } from "../../objects/TwitchUser.object";
import { ChatListenerExecution } from "../../types/ChatListener.types";

// @ChatListener(ListenersModule.forFeature({
//     name: 'ShowMessage',
//     transient: true
// }))
/**
 * @deprecated This listener is just for testing purposes. It wont be working in production.
 */
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