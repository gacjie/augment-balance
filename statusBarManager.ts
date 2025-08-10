import * as vscode from 'vscode';
import { CachedAccountData } from './stateManager';

export enum StatusBarState {
    Loading = 'loading',
    Normal = 'normal',
    NotConfigured = 'notConfigured',
    Error = 'error'
}

export class StatusBarManager {
    private statusBarItem: vscode.StatusBarItem;
    private currentState: StatusBarState = StatusBarState.NotConfigured;

    constructor() {
        // 创建状态栏项目，显示在右侧
        this.statusBarItem = vscode.window.createStatusBarItem(
            vscode.StatusBarAlignment.Right,
            100 // 优先级
        );

        // 设置点击命令
        this.statusBarItem.command = 'augmentBalance.openSettings';

        // 设置初始状态为未配置
        this.setNotConfigured();

        // 显示状态栏项目
        this.statusBarItem.show();
    }

    /**
     * 生成统一的 tooltip 格式
     */
    private generateTooltip(accountData: CachedAccountData | null, statusMessage: string): string {
        const email = accountData?.email || '待获取';
        const planName = accountData?.plan_name || '待获取';
        const endDate = accountData?.end_date === null ? '无期限' : (accountData?.end_date || '待获取');
        const balance = accountData?.balance || '待获取';

        return `Augment账号基础信息
邮箱账号：${email}
套餐名称：${planName}
到期时间：${endDate}
剩余套餐额度：${balance}
${statusMessage}`;
    }

    /**
     * 设置加载状态
     */
    public setLoading(accountData: CachedAccountData | null = null): void {
        this.currentState = StatusBarState.Loading;
        this.statusBarItem.text = '⏳ Augment余额加载中...';
        this.statusBarItem.tooltip = this.generateTooltip(accountData, '正在获取最新数据...');
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = undefined;
    }

    /**
     * 设置正常状态（显示余额）
     */
    public setNormal(accountData: CachedAccountData): void {
        this.currentState = StatusBarState.Normal;

        // 格式化余额显示
        const formattedBalance = this.formatBalance(accountData.balance);

        // 使用Unicode电池字符，确保在所有环境下都能显示
        this.statusBarItem.text = `🔋 ${formattedBalance}`;
        this.statusBarItem.tooltip = this.generateTooltip(accountData, '点击打开设置');
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = this.getBalanceColor(accountData.balance);
    }

    /**
     * 设置未配置状态
     */
    public setNotConfigured(accountData: CachedAccountData | null = null): void {
        this.currentState = StatusBarState.NotConfigured;
        this.statusBarItem.text = '⚙️ Augment未配置';
        this.statusBarItem.tooltip = this.generateTooltip(accountData, '参数未配置\n点击打开设置页面配置API token');
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.color = undefined;
    }

    /**
     * 设置错误状态
     */
    public setError(error: string, accountData: CachedAccountData | null = null): void {
        this.currentState = StatusBarState.Error;
        this.statusBarItem.text = '❌ Augment错误';
        this.statusBarItem.tooltip = this.generateTooltip(accountData, `${error}\n点击打开设置`);
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.color = undefined;
    }

    /**
     * 根据缓存数据更新显示
     */
    public updateFromCache(accountData: CachedAccountData | null, hasValidConfig: boolean): void {
        if (!hasValidConfig) {
            this.setNotConfigured(accountData);
            return;
        }

        if (!accountData) {
            this.setLoading();
            return;
        }

        if (accountData.error) {
            this.setError(accountData.error, accountData);
            return;
        }

        this.setNormal(accountData);
    }

    /**
     * 格式化余额显示
     */
    private formatBalance(balance: string): string {
        try {
            const numBalance = parseFloat(balance);

            if (isNaN(numBalance)) {
                return balance;
            }

            // 始终显示两位小数格式
            return numBalance.toFixed(2);
        } catch (error) {
            return balance;
        }
    }

    /**
     * 根据余额获取颜色
     */
    private getBalanceColor(balance: string): vscode.ThemeColor | undefined {
        try {
            const numBalance = parseFloat(balance);
            
            if (isNaN(numBalance)) {
                return undefined;
            }

            // 余额警告阈值
            if (numBalance <= 0) {
                return new vscode.ThemeColor('statusBarItem.errorForeground');
            } else if (numBalance < 10) {
                return new vscode.ThemeColor('statusBarItem.warningForeground');
            }

            return undefined; // 使用默认颜色
        } catch (error) {
            return undefined;
        }
    }



    /**
     * 获取当前状态
     */
    public getCurrentState(): StatusBarState {
        return this.currentState;
    }

    /**
     * 隐藏状态栏项目
     */
    public hide(): void {
        this.statusBarItem.hide();
    }

    /**
     * 显示状态栏项目
     */
    public show(): void {
        this.statusBarItem.show();
    }

    /**
     * 销毁状态栏项目
     */
    public dispose(): void {
        this.statusBarItem.dispose();
    }
}
