import * as vscode from 'vscode';
import { ConfigManager, AugmentBalanceConfig } from './configManager';
import { StateManager } from './stateManager';
import { StatusBarManager } from './statusBarManager';
import { ApiError } from './apiService';

export class AugmentBalanceExtension {
    private configManager: ConfigManager;
    private stateManager: StateManager;
    private statusBarManager: StatusBarManager;
    private updateTimer: NodeJS.Timeout | undefined;
    private isUpdating: boolean = false;
    private lastToken: string = '';

    constructor(private context: vscode.ExtensionContext) {
        this.configManager = new ConfigManager();
        this.stateManager = new StateManager(context);
        this.statusBarManager = new StatusBarManager();

        this.initialize();
    }

    private initialize(): void {
        // 注册命令
        this.registerCommands();

        // 监听配置变更
        this.configManager.onConfigChanged(config => {
            this.onConfigChanged(config);
        });

        // 监听状态变更
        this.stateManager.onStateChanged(() => {
            this.updateStatusBar();
        });

        // 初始化状态
        this.initializeState();
    }

    private registerCommands(): void {
        // 打开设置命令
        const openSettingsCommand = vscode.commands.registerCommand(
            'augmentBalance.openSettings',
            () => {
                this.configManager.openSettings();
            }
        );

        // 刷新余额命令
        const refreshBalanceCommand = vscode.commands.registerCommand(
            'augmentBalance.refreshBalance',
            () => {
                this.refreshBalance(true);
            }
        );

        this.context.subscriptions.push(openSettingsCommand, refreshBalanceCommand);
    }

    private async initializeState(): Promise<void> {
        const config = this.configManager.getConfig();
        const validation = this.configManager.validateConfig(config);

        // 初始化lastToken
        this.lastToken = config.token;

        // 清理过期缓存
        await this.stateManager.cleanupExpiredCache();

        if (!validation.isValid) {
            this.statusBarManager.setNotConfigured();
            return;
        }

        // 从缓存更新状态栏
        this.updateStatusBar();

        // 开始定期更新
        this.startPeriodicUpdate(config);

        // 立即刷新一次
        await this.refreshBalance();
    }

    private async onConfigChanged(config: AugmentBalanceConfig): Promise<void> {
        const validation = this.configManager.validateConfig(config);

        if (!validation.isValid) {
            this.configManager.showConfigError(validation.errors);
            this.statusBarManager.setNotConfigured();
            this.stopPeriodicUpdate();
            return;
        }

        // 检查token是否发生变化
        const tokenChanged = this.lastToken !== config.token;
        const oldToken = this.lastToken; // 保存旧token用于清理缓存
        this.lastToken = config.token;

        let forceRefresh = tokenChanged;

        if (tokenChanged) {
            // Token变化时，清除旧token的缓存并强制刷新
            console.log('Token已变更，清除旧token缓存并强制刷新');
            if (oldToken) {
                await this.stateManager.clearAccountCache(oldToken);
            }
        } else {
            // 即使token没变，也要验证缓存有效性
            const cacheValidation = this.stateManager.validateCache(config.token);
            if (!cacheValidation.isAccountInfoValid) {
                console.log('账号信息缓存无效，强制刷新');
                forceRefresh = true;
            }
        }

        // 配置有效，显示成功消息
        this.configManager.showConfigSuccess();

        // 重新开始定期更新
        this.startPeriodicUpdate(config);

        // 立即刷新（根据token变化或缓存有效性决定是否强制刷新）
        await this.refreshBalance(forceRefresh);
    }

    private startPeriodicUpdate(config: AugmentBalanceConfig): void {
        this.stopPeriodicUpdate();

        const intervalMs = config.updateInterval * 1000;
        this.updateTimer = setInterval(() => {
            this.refreshBalance();
        }, intervalMs);
    }

    private stopPeriodicUpdate(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = undefined;
        }
    }

    private async refreshBalance(forceRefresh: boolean = false): Promise<void> {
        if (this.isUpdating) {
            return;
        }

        const config = this.configManager.getConfig();
        const validation = this.configManager.validateConfig(config);

        if (!validation.isValid) {
            this.statusBarManager.setNotConfigured();
            return;
        }

        this.isUpdating = true;

        try {
            // 获取当前缓存数据用于加载状态显示
            const cachedData = this.stateManager.getCachedAccountData(config.token);
            this.statusBarManager.setLoading(cachedData);

            const accountData = await this.stateManager.fetchAccountInfo(config.token, forceRefresh);
            this.statusBarManager.setNormal(accountData);

        } catch (error) {
            const apiError = error as ApiError;
            const errorMessage = apiError.message || '未知错误';

            // 获取当前缓存数据用于错误状态显示
            const cachedData = this.stateManager.getCachedAccountData(config.token);
            await this.stateManager.cacheError(errorMessage, config.token);
            this.statusBarManager.setError(errorMessage, cachedData);

            // 如果是认证错误，提示用户检查配置
            if (apiError.statusCode === 401 || apiError.statusCode === 403) {
                vscode.window.showErrorMessage(
                    `Augment Balance认证失败: ${errorMessage}`,
                    '打开设置'
                ).then(selection => {
                    if (selection === '打开设置') {
                        this.configManager.openSettings();
                    }
                });
            }
        } finally {
            this.isUpdating = false;
        }
    }

    private updateStatusBar(): void {
        const config = this.configManager.getConfig();
        const validation = this.configManager.validateConfig(config);
        const accountData = this.stateManager.getCachedAccountData(config.token);

        this.statusBarManager.updateFromCache(accountData, validation.isValid);
    }

    public dispose(): void {
        this.stopPeriodicUpdate();
        this.configManager.dispose();
        this.stateManager.dispose();
        this.statusBarManager.dispose();
    }
}

let extension: AugmentBalanceExtension | undefined;

export function activate(context: vscode.ExtensionContext) {
    console.log('Augment Balance扩展已激活');

    try {
        extension = new AugmentBalanceExtension(context);
        
        // 将扩展实例添加到订阅列表，确保正确清理
        context.subscriptions.push({
            dispose: () => {
                if (extension) {
                    extension.dispose();
                    extension = undefined;
                }
            }
        });

    } catch (error) {
        console.error('Augment Balance扩展激活失败:', error);
        vscode.window.showErrorMessage(`Augment Balance扩展激活失败: ${error}`);
    }
}

export function deactivate() {
    console.log('Augment Balance扩展已停用');
    
    if (extension) {
        extension.dispose();
        extension = undefined;
    }
}
