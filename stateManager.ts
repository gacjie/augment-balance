import * as vscode from 'vscode';
import { ApiService, AccountInfo } from './apiService';

export interface CachedAccountData {
    customer_id: string;
    email: string;
    plan_name: string;
    end_date: string | null;
    balance: string;
    timestamp: number;
    token: string;
    error?: string;
}

export class StateManager {
    private static readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时

    private context: vscode.ExtensionContext;
    private _onStateChanged = new vscode.EventEmitter<void>();
    public readonly onStateChanged = this._onStateChanged.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 生成账号缓存键名
     */
    private getAccountCacheKey(token: string): string {
        return `${token}_AccountInfo`;
    }

    /**
     * 获取缓存的账号数据
     */
    public getCachedAccountData(token: string): CachedAccountData | null {
        try {
            const cacheKey = this.getAccountCacheKey(token);
            const cached = this.context.globalState.get<CachedAccountData>(cacheKey);

            if (!cached) {
                return null;
            }

            // 检查缓存是否过期
            const now = Date.now();
            if (now - cached.timestamp > StateManager.CACHE_EXPIRY_MS) {
                console.log('账号数据缓存已过期，清除缓存');
                this.clearAccountCache(token);
                return null;
            }

            return cached;
        } catch (error) {
            console.error('获取缓存账号数据失败:', error);
            return null;
        }
    }

    /**
     * 缓存账号数据
     */
    public async cacheAccountData(accountData: CachedAccountData): Promise<void> {
        try {
            const cacheKey = this.getAccountCacheKey(accountData.token);
            await this.context.globalState.update(cacheKey, accountData);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('缓存账号数据失败:', error);
        }
    }

    /**
     * 清除账号缓存
     */
    public async clearAccountCache(token?: string): Promise<void> {
        try {
            if (token) {
                // 清除特定token的缓存
                const cacheKey = this.getAccountCacheKey(token);
                await this.context.globalState.update(cacheKey, undefined);
            } else {
                // 清除所有账号缓存
                const keys = this.context.globalState.keys();
                for (const key of keys) {
                    if (key.endsWith('_AccountInfo')) {
                        await this.context.globalState.update(key, undefined);
                    }
                }
            }
            this._onStateChanged.fire();
        } catch (error) {
            console.error('清除账号缓存失败:', error);
        }
    }

    /**
     * 获取或刷新账号信息
     */
    public async getOrFetchAccountInfo(token: string, forceRefresh: boolean = false): Promise<AccountInfo> {
        // 如果不强制刷新，先尝试从缓存获取
        if (!forceRefresh) {
            const cachedData = this.getCachedAccountData(token);
            if (cachedData && cachedData.customer_id && cachedData.customer_id.trim() !== '') {
                console.log('使用缓存的账号信息:', cachedData.customer_id);
                return {
                    customer_id: cachedData.customer_id,
                    email: cachedData.email,
                    plan_name: cachedData.plan_name,
                    end_date: cachedData.end_date
                };
            }
        }

        console.log('从API获取账号信息, forceRefresh:', forceRefresh);

        try {
            // 从API获取账号信息
            const accountInfo = await ApiService.getAccountInfo(token);

            // 验证获取到的账号信息
            if (!accountInfo.customer_id || accountInfo.customer_id.trim() === '') {
                throw new Error('API返回的Customer ID为空');
            }

            console.log('成功获取账号信息:', accountInfo.customer_id);
            return accountInfo;

        } catch (error) {
            console.error('获取账号信息失败:', error);
            // 清除可能的无效缓存
            await this.clearAccountCache(token);
            throw error;
        }
    }

    /**
     * 缓存错误信息
     */
    public async cacheError(error: string, token: string): Promise<void> {
        try {
            const errorData: CachedAccountData = {
                customer_id: '',
                email: '',
                plan_name: '',
                end_date: null,
                balance: '',
                timestamp: Date.now(),
                token,
                error
            };

            const cacheKey = this.getAccountCacheKey(token);
            await this.context.globalState.update(cacheKey, errorData);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('缓存错误信息失败:', error);
        }
    }

    /**
     * 获取完整账号信息（包括余额）
     */
    public async fetchAccountInfo(token: string, forceRefresh: boolean = false): Promise<CachedAccountData> {
        try {
            // 获取账号基础信息
            const accountInfo = await this.getOrFetchAccountInfo(token, forceRefresh);

            // 获取余额
            const balance = await ApiService.getBalance(accountInfo.customer_id, token);

            // 构建完整的账号数据
            const fullAccountData: CachedAccountData = {
                customer_id: accountInfo.customer_id,
                email: accountInfo.email,
                plan_name: accountInfo.plan_name,
                end_date: accountInfo.end_date,
                balance: balance,
                timestamp: Date.now(),
                token: token
            };

            // 缓存完整数据
            await this.cacheAccountData(fullAccountData);

            return fullAccountData;

        } catch (error) {
            // 获取失败时的容错处理
            console.log('账号信息获取失败，清除缓存:', error);

            // 自动清空缓存，确保下次能重新获取正确数据
            await this.clearAccountCache(token);

            // 重新抛出错误，让上层处理
            throw error;
        }
    }

    /**
     * 获取余额（保持向后兼容）
     */
    public async fetchBalance(token: string, forceRefresh: boolean = false): Promise<string> {
        const accountData = await this.fetchAccountInfo(token, forceRefresh);
        return accountData.balance;
    }

    /**
     * 验证缓存有效性
     */
    public validateCache(token: string): { isAccountInfoValid: boolean; isBalanceValid: boolean } {
        const accountData = this.getCachedAccountData(token);
        const accountInfoValid = accountData !== null && accountData.customer_id !== '';
        const balanceValid = accountData !== null && !accountData.error && accountData.balance !== '';

        return {
            isAccountInfoValid: accountInfoValid,
            isBalanceValid: balanceValid
        };
    }

    /**
     * 清除所有缓存
     */
    public async clearAllCache(): Promise<void> {
        console.log('清除所有缓存');
        await this.clearAccountCache(); // 清除所有账号缓存
    }

    /**
     * 清理过期的缓存数据
     */
    public async cleanupExpiredCache(): Promise<void> {
        try {
            const keys = this.context.globalState.keys();
            const now = Date.now();
            let cleanedCount = 0;

            for (const key of keys) {
                if (key.endsWith('_AccountInfo')) {
                    const cached = this.context.globalState.get<CachedAccountData>(key);
                    if (cached && (now - cached.timestamp > StateManager.CACHE_EXPIRY_MS)) {
                        await this.context.globalState.update(key, undefined);
                        cleanedCount++;
                        console.log(`清理过期缓存: ${key}`);
                    }
                }
            }

            if (cleanedCount > 0) {
                console.log(`清理了 ${cleanedCount} 个过期缓存项`);
                this._onStateChanged.fire();
            }
        } catch (error) {
            console.error('清理过期缓存失败:', error);
        }
    }

    public dispose(): void {
        this._onStateChanged.dispose();
    }
}
