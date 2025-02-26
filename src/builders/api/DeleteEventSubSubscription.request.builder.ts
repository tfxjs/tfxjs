// ###

import BaseRequestBuilder from "./Base.request.builder";

// Typy

// 204 No Content
export type DeleteEventSubSubscriptionResponse = {}

// Builder

export default class DeleteEventSubSubscriptionRequestConfigBuilder extends BaseRequestBuilder {
    correctResponseCodes: number[] = [204];
    errorResponseCodes: number[] = [400, 401, 404];

    constructor() {
        super('DELETE', 'https://api.twitch.tv/helix/eventsub/subscriptions', {
            id: null
        });
    }

    public setId(id: string): this {
        this.config.data.id = id;
        return this;
    }

    public checkTypes(): boolean {
        if(this.config.data.id === null) throw new Error('Id is required');
        return true;
    }
}