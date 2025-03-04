import BaseRequestBuilder from "./api/Base.request.builder";
import DINames from "../utils/DI.names";
import ConfigService from "../services/Config.service";
import { TokenService } from "../services/Token.service";
import { DIContainer } from "../di/Container";

/**
 * Function that fulfills the request with the necessary data (client ID, access token related to the user depending on the request)
 * @param requestBuilder Request builder {@link BaseRequestBuilder}
 * @returns Request builder with the necessary data {@link BaseRequestBuilder}
 */
export default async function FulfillRequest<T extends BaseRequestBuilder>(requestBuilder: T, useAppTokenIfNull: boolean = true): Promise<T> {
    const config = (DIContainer.get(DINames.ConfigService) as ConfigService);
    const tokenService = (DIContainer.get(DINames.TokenService) as TokenService);

    requestBuilder.setClientId(config.getClientId());
    const userId = requestBuilder.getUserIdRelatedToToken();
    if(userId == "") {
        if(!useAppTokenIfNull) return requestBuilder;
        const appAccessToken = await tokenService.getAppToken();
        requestBuilder.setAccessToken(appAccessToken);
        return requestBuilder;
    }
    const accessToken = await tokenService.getUserTokenById(userId);
    if(accessToken == null) throw new Error(`Cannot obtain access token for user ID=${userId}`);
    requestBuilder.setAccessToken(accessToken);
    return requestBuilder;
}