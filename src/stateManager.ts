import * as vscode from 'vscode';
import { ApiService, ApiError } from './apiService';

export interface CachedCustomerData {
    customerId: string;
    token: string;
    timestamp: number;
}

export interface BalanceData {
    balance: string;
    timestamp: number;
    error?: string;
}

export class StateManager {
    private static readonly BALANCE_CACHE_KEY = 'augmentBalance.balanceCache';
    private static readonly CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24小时

    private context: vscode.ExtensionContext;
    private _onStateChanged = new vscode.EventEmitter<void>();
    public readonly onStateChanged = this._onStateChanged.event;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
    }

    /**
     * 生成Customer ID缓存键名
     */
    private getCustomerCacheKey(token: string): string {
        return `${token}_CustomerID`;
    }

    /**
     * 获取缓存的Customer ID
     */
    public getCachedCustomerId(token: string): string | null {
        try {
            const cacheKey = this.getCustomerCacheKey(token);
            const cached = this.context.globalState.get<CachedCustomerData>(cacheKey);

            if (!cached) {
                return null;
            }

            // 检查缓存是否过期
            const now = Date.now();
            if (now - cached.timestamp > StateManager.CACHE_EXPIRY_MS) {
                console.log('Customer ID缓存已过期，清除缓存');
                this.clearCustomerCache(token);
                return null;
            }

            // 检查Customer ID是否为空
            if (!cached.customerId || cached.customerId.trim() === '') {
                console.log('缓存的Customer ID为空，清除缓存');
                this.clearCustomerCache(token);
                return null;
            }

            return cached.customerId;
        } catch (error) {
            console.error('获取缓存Customer ID失败:', error);
            return null;
        }
    }

    /**
     * 缓存Customer ID
     */
    public async cacheCustomerId(customerId: string, token: string): Promise<void> {
        try {
            const cacheKey = this.getCustomerCacheKey(token);
            const cacheData: CachedCustomerData = {
                customerId,
                token,
                timestamp: Date.now()
            };

            await this.context.globalState.update(cacheKey, cacheData);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('缓存Customer ID失败:', error);
        }
    }

    /**
     * 清除Customer ID缓存
     */
    public async clearCustomerCache(token?: string): Promise<void> {
        try {
            if (token) {
                // 清除特定token的缓存
                const cacheKey = this.getCustomerCacheKey(token);
                await this.context.globalState.update(cacheKey, undefined);
            } else {
                // 清除所有Customer ID缓存（用于兼容性）
                // 获取所有存储的键
                const keys = this.context.globalState.keys();
                for (const key of keys) {
                    if (key.endsWith('_CustomerID')) {
                        await this.context.globalState.update(key, undefined);
                    }
                }
            }
            this._onStateChanged.fire();
        } catch (error) {
            console.error('清除Customer ID缓存失败:', error);
        }
    }

    /**
     * 获取或刷新Customer ID
     */
    public async getOrFetchCustomerId(token: string, forceRefresh: boolean = false): Promise<string> {
        // 如果不强制刷新，先尝试从缓存获取
        if (!forceRefresh) {
            const cachedId = this.getCachedCustomerId(token);
            if (cachedId && cachedId.trim() !== '') {
                console.log('使用缓存的Customer ID:', cachedId);
                return cachedId;
            } else if (cachedId === '') {
                console.log('缓存的Customer ID为空，清除缓存并重新获取');
                await this.clearCustomerCache(token);
            }
        }

        console.log('从API获取Customer ID, forceRefresh:', forceRefresh);

        try {
            // 从API获取
            const customerId = await ApiService.getCustomerId(token);

            // 验证获取到的Customer ID
            if (!customerId || customerId.trim() === '') {
                throw new Error('API返回的Customer ID为空');
            }

            // 缓存结果
            await this.cacheCustomerId(customerId, token);

            console.log('成功获取并缓存Customer ID:', customerId);
            return customerId;

        } catch (error) {
            console.error('获取Customer ID失败:', error);
            // 清除可能的无效缓存
            await this.clearCustomerCache(token);
            throw error;
        }
    }

    /**
     * 获取缓存的余额数据
     */
    public getCachedBalance(): BalanceData | null {
        try {
            return this.context.globalState.get<BalanceData>(StateManager.BALANCE_CACHE_KEY) || null;
        } catch (error) {
            console.error('获取缓存余额失败:', error);
            return null;
        }
    }

    /**
     * 缓存余额数据
     */
    public async cacheBalance(balance: string): Promise<void> {
        try {
            const balanceData: BalanceData = {
                balance,
                timestamp: Date.now()
            };

            await this.context.globalState.update(StateManager.BALANCE_CACHE_KEY, balanceData);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('缓存余额失败:', error);
        }
    }

    /**
     * 缓存错误信息
     */
    public async cacheError(error: string): Promise<void> {
        try {
            const balanceData: BalanceData = {
                balance: '',
                timestamp: Date.now(),
                error
            };

            await this.context.globalState.update(StateManager.BALANCE_CACHE_KEY, balanceData);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('缓存错误信息失败:', error);
        }
    }

    /**
     * 清除余额缓存
     */
    public async clearBalanceCache(): Promise<void> {
        try {
            await this.context.globalState.update(StateManager.BALANCE_CACHE_KEY, undefined);
            this._onStateChanged.fire();
        } catch (error) {
            console.error('清除余额缓存失败:', error);
        }
    }

    /**
     * 获取余额
     */
    public async fetchBalance(token: string, forceRefresh: boolean = false): Promise<string> {
        try {
            // 获取Customer ID（如果强制刷新则重新获取）
            let customerId = await this.getOrFetchCustomerId(token, forceRefresh);

            // Customer ID空值检查
            if (!customerId || customerId.trim() === '') {
                console.log('Customer ID为空，强制重新获取');
                customerId = await this.getOrFetchCustomerId(token, true);

                if (!customerId || customerId.trim() === '') {
                    throw new Error('无法获取有效的Customer ID');
                }
            }

            // 获取余额
            const balance = await ApiService.getBalance(customerId, token);

            // 缓存结果
            await this.cacheBalance(balance);

            return balance;

        } catch (error) {
            // 余额获取失败时的容错处理
            console.log('余额获取失败，清除缓存:', error);

            // 自动清空所有缓存，确保下次能重新获取正确数据
            await this.clearAllCache();

            // 重新抛出错误，让上层处理
            throw error;
        }
    }

    /**
     * 验证缓存有效性
     */
    public validateCache(token: string): { isCustomerIdValid: boolean; isBalanceValid: boolean } {
        const customerIdValid = this.getCachedCustomerId(token) !== null;
        const balanceData = this.getCachedBalance();
        const balanceValid = balanceData !== null && !balanceData.error;

        return {
            isCustomerIdValid: customerIdValid,
            isBalanceValid: balanceValid
        };
    }

    /**
     * 清除所有缓存
     */
    public async clearAllCache(): Promise<void> {
        console.log('清除所有缓存');
        await Promise.all([
            this.clearCustomerCache(), // 清除所有Customer ID缓存
            this.clearBalanceCache()
        ]);
    }

    public dispose(): void {
        this._onStateChanged.dispose();
    }
}
