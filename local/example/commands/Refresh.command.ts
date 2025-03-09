import { ChatCommand, ChatCommandExecution, ChatCommandExecutionGuard, ChatCommandExecutionGuardAvaliableResults, ChatterUser, CommandsModule, MessageUser, TChannelOptions } from "../../../index";

import EventSubClient from "../../../src/clients/EventSub.client";
import { DIContainer } from "../../../src/di/Container";
import ConfigService from "../../../src/services/Config.service";
import DINames from "../../../src/utils/DI.names";

@ChatCommand(CommandsModule.forFeature({ 
    name: 'refresh',
    keyword: 'refresh',
    ignoreCase: false
}))
export default class RefreshCommand implements ChatCommandExecutionGuard, ChatCommandExecution {
    async guard(@MessageUser() user: ChatterUser): Promise<ChatCommandExecutionGuardAvaliableResults> {
        if(user.isBroadcaster() || user.isModerator()) return { canAccess: true };
        return { canAccess: false, message: "You must be a broadcaster or moderator to use this command." };
    }

    async execution(): Promise<void> {
        const eventSub = DIContainer.get<EventSubClient>(DINames.EventSubClient);
        const configService = DIContainer.get<ConfigService>(DINames.ConfigService);
        const events = await eventSub['list'](configService.getUserId(), {});
        console.log(`Count: ${events.data.length}`);
        const { data, ...otherData } = events;
        console.log(otherData);
    }
}