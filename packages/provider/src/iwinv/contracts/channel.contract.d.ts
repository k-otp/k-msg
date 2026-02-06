/**
 * IWINV Channel Contract Implementation
 */
import { ChannelContract, Channel, SenderNumber, ChannelRequest } from '../../contracts/provider.contract';
import { IWINVConfig } from '../types/iwinv';
export declare class IWINVChannelContract implements ChannelContract {
    private config;
    constructor(config: IWINVConfig);
    register(channel: ChannelRequest): Promise<Channel>;
    list(): Promise<Channel[]>;
    private getDefaultChannel;
    addSenderNumber(channelId: string, number: string): Promise<SenderNumber>;
    verifySenderNumber(number: string, verificationCode: string): Promise<boolean>;
}
//# sourceMappingURL=channel.contract.d.ts.map