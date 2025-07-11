import * as vscode from 'vscode';
import { BalanceData } from './stateManager';

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
     * 设置加载状态
     */
    public setLoading(): void {
        this.currentState = StatusBarState.Loading;
        this.statusBarItem.text = '⏳ Augment余额加载中...';
        this.statusBarItem.tooltip = '正在获取Augment余额信息...';
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = undefined;
    }

    /**
     * 设置正常状态（显示余额）
     */
    public setNormal(balance: string): void {
        this.currentState = StatusBarState.Normal;

        // 格式化余额显示
        const formattedBalance = this.formatBalance(balance);

        // 使用Unicode电池字符，确保在所有环境下都能显示
        this.statusBarItem.text = `🔋 ${formattedBalance}.00`;
        this.statusBarItem.tooltip = `Augment剩余额度: ${formattedBalance}.00\n点击打开设置`;
        this.statusBarItem.backgroundColor = undefined;
        this.statusBarItem.color = this.getBalanceColor(balance);
    }

    /**
     * 设置未配置状态
     */
    public setNotConfigured(): void {
        this.currentState = StatusBarState.NotConfigured;
        this.statusBarItem.text = '⚙️ Augment未配置';
        this.statusBarItem.tooltip = 'Augment Balance未配置\n点击打开设置页面配置API token';
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
        this.statusBarItem.color = undefined;
    }

    /**
     * 设置错误状态
     */
    public setError(error: string): void {
        this.currentState = StatusBarState.Error;
        this.statusBarItem.text = '❌ Augment错误';
        this.statusBarItem.tooltip = `Augment Balance错误:\n${error}\n点击打开设置`;
        this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        this.statusBarItem.color = undefined;
    }

    /**
     * 根据缓存数据更新显示
     */
    public updateFromCache(balanceData: BalanceData | null, hasValidConfig: boolean): void {
        if (!hasValidConfig) {
            this.setNotConfigured();
            return;
        }

        if (!balanceData) {
            this.setLoading();
            return;
        }

        if (balanceData.error) {
            this.setError(balanceData.error);
            return;
        }

        this.setNormal(balanceData.balance);
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

            // 如果是整数，不显示小数点
            if (numBalance === Math.floor(numBalance)) {
                return numBalance.toString();
            }

            // 保留2位小数
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
     * 更新显示
     */
    private updateDisplay(): void {
        // 确保状态栏项目可见
        this.statusBarItem.show();
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
