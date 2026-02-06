/**
 * IWINV Account Contract Implementation
 */
import { AccountContract, Balance, AccountProfile } from '../../contracts/provider.contract';
import { IWINVConfig } from '../types/iwinv';
export declare class IWINVAccountContract implements AccountContract {
    private config;
    constructor(config: IWINVConfig);
    getBalance(): Promise<Balance>;
    getProfile(): Promise<AccountProfile>;
}
//# sourceMappingURL=account.contract.d.ts.map