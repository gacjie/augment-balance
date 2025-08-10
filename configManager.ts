import * as vscode from 'vscode';

export interface AugmentBalanceConfig {
    token: string;
    updateInterval: number;
}

export class ConfigManager {
    private static readonly SECTION = 'augmentBalance';
    private _onConfigChanged = new vscode.EventEmitter<AugmentBalanceConfig>();
    public readonly onConfigChanged = this._onConfigChanged.event;

    constructor() {
        // 监听配置变更
        vscode.workspace.onDidChangeConfiguration(event => {
            if (event.affectsConfiguration(ConfigManager.SECTION)) {
                this._onConfigChanged.fire(this.getConfig());
            }
        });
    }

    /**
     * 获取当前配置
     */
    public getConfig(): AugmentBalanceConfig {
        const config = vscode.workspace.getConfiguration(ConfigManager.SECTION);
        return {
            token: config.get<string>('token', ''),
            updateInterval: config.get<number>('updateInterval', 600)
        };
    }

    /**
     * 验证配置是否有效
     */
    public validateConfig(config?: AugmentBalanceConfig): { isValid: boolean; errors: string[] } {
        const currentConfig = config || this.getConfig();
        const errors: string[] = [];

        // 验证token
        if (!currentConfig.token || currentConfig.token.trim() === '') {
            errors.push('API token不能为空');
        }

        // 验证更新间隔
        if (currentConfig.updateInterval < 60) {
            errors.push('更新间隔不能少于60秒');
        } else if (currentConfig.updateInterval > 3600) {
            errors.push('更新间隔不能超过3600秒');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * 检查token是否已更改
     */
    public hasTokenChanged(oldToken: string): boolean {
        const currentConfig = this.getConfig();
        return oldToken !== currentConfig.token;
    }

    /**
     * 打开设置页面
     */
    public openSettings(): void {
        vscode.commands.executeCommand('workbench.action.openSettings', ConfigManager.SECTION);
    }

    /**
     * 显示配置错误信息
     */
    public showConfigError(errors: string[]): void {
        const message = `Augment Balance配置错误：\n${errors.join('\n')}`;
        vscode.window.showErrorMessage(message, '打开设置').then(selection => {
            if (selection === '打开设置') {
                this.openSettings();
            }
        });
    }

    /**
     * 显示配置成功信息
     */
    public showConfigSuccess(): void {
        vscode.window.showInformationMessage('Augment Balance配置已更新');
    }

    public dispose(): void {
        this._onConfigChanged.dispose();
    }
}
