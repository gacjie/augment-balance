import axios, { AxiosResponse, AxiosError } from 'axios';

export interface SubscriptionResponse {
    data: Array<{
        customer: {
            id: string;
            email: string;
        };
        plan: {
            name: string;
        };
        end_date: string | null;
    }>;
}

export interface AccountInfo {
    customer_id: string;
    email: string;
    plan_name: string;
    end_date: string | null;
}

export interface BalanceResponse {
    credits_balance: string;
}

export interface ApiError {
    message: string;
    statusCode?: number;
    isNetworkError: boolean;
}

export class ApiService {
    private static readonly BASE_URL = 'https://portal.withorb.com/api/v1';
    private static readonly USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36';
    private static readonly PRICING_UNIT_ID = 'jWTJo9ptbapMWkvg';

    /**
     * 获取账号信息
     */
    public static async getAccountInfo(token: string): Promise<AccountInfo> {
        try {
            const url = `${this.BASE_URL}/subscriptions_from_link?token=${encodeURIComponent(token)}`;

            const response: AxiosResponse<SubscriptionResponse> = await axios.get(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10秒超时
            });

            if (!response.data || !response.data.data || !Array.isArray(response.data.data) || response.data.data.length === 0) {
                throw new Error('API响应格式错误：缺少data数组或数组为空');
            }

            const subscription = response.data.data[0];
            if (!subscription.customer || !subscription.customer.id || !subscription.customer.email || !subscription.plan || !subscription.plan.name) {
                throw new Error('API响应格式错误：缺少必要的账号信息字段');
            }

            return {
                customer_id: subscription.customer.id,
                email: subscription.customer.email,
                plan_name: subscription.plan.name,
                end_date: subscription.end_date
            };
        } catch (error) {
            throw this.handleApiError(error, '获取账号信息失败');
        }
    }

    /**
     * 获取余额信息
     */
    public static async getBalance(customerId: string, token: string): Promise<string> {
        try {
            const url = `${this.BASE_URL}/customers/${encodeURIComponent(customerId)}/ledger_summary?pricing_unit_id=${this.PRICING_UNIT_ID}&token=${encodeURIComponent(token)}`;
            
            const response: AxiosResponse<BalanceResponse> = await axios.get(url, {
                headers: {
                    'User-Agent': this.USER_AGENT,
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                timeout: 10000 // 10秒超时
            });

            if (!response.data || response.data.credits_balance === undefined) {
                throw new Error('API响应格式错误：缺少credits_balance字段');
            }

            return response.data.credits_balance;
        } catch (error) {
            throw this.handleApiError(error, '获取余额失败');
        }
    }

    /**
     * 处理API错误
     */
    private static handleApiError(error: any, context: string): ApiError {
        if (axios.isAxiosError(error)) {
            const axiosError = error as AxiosError;
            
            // 网络错误
            if (!axiosError.response) {
                return {
                    message: `${context}：网络连接失败，请检查网络连接`,
                    isNetworkError: true
                };
            }

            // HTTP错误
            const statusCode = axiosError.response.status;
            let message = `${context}：HTTP ${statusCode}`;

            switch (statusCode) {
                case 400:
                    message += ' - 请求参数错误，请检查token是否正确';
                    break;
                case 401:
                    message += ' - 认证失败，请检查token是否有效';
                    break;
                case 403:
                    message += ' - 访问被拒绝，请检查token权限';
                    break;
                case 404:
                    message += ' - 资源不存在，请检查Customer ID是否正确';
                    break;
                case 429:
                    message += ' - 请求过于频繁，请稍后再试';
                    break;
                case 500:
                case 502:
                case 503:
                case 504:
                    message += ' - 服务器错误，请稍后再试';
                    break;
                default:
                    message += ' - 未知错误';
            }

            return {
                message,
                statusCode,
                isNetworkError: false
            };
        }

        // 其他错误
        return {
            message: `${context}：${error.message || '未知错误'}`,
            isNetworkError: false
        };
    }

    /**
     * 验证token格式
     */
    public static validateTokenFormat(token: string): boolean {
        // 基本格式验证：不为空且长度合理
        return Boolean(token && token.trim().length > 10);
    }
}
