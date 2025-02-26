import { 
    SingletonAction, 
    action, 
    SendToPluginEvent, 
    WillAppearEvent, 
    JsonValue
} from '@elgato/streamdeck';
import { exec } from 'child_process';

interface Settings extends Record<string, JsonValue> {
    promptText?: string;
}

/**
 * Paste Prompt Action
 */
@action({ UUID: 'com.officetrickbox.prompts.paste' })
export class PastePromptAction extends SingletonAction<Settings> {
    private settings: Settings = { promptText: '' } as Settings;
    private context: string | undefined;

    constructor() {
        super();
        console.log('PastePromptAction initialized');
    }

    override async onWillAppear(ev: WillAppearEvent<Settings>) {
        this.context = ev.payload.context;
        console.log('Action appeared:', ev.payload.settings);
        this.settings = ev.payload.settings || {};
        await this.updateTitle();
    }

    private async setSettings(settings: Settings): Promise<void> {
        this.settings = settings;
        await this.settingsManager.setSettings(this.context!, settings);
    }

    private async setTitle(title: string): Promise<void> {
        await this.settingsManager.setTitle(this.context!, title);
    }

    private async updateTitle() {
        try {
            const title = this.settings.promptText || 'No Prompt';
            await this.setSettings(this.settings);
            await this.setTitle(title.substring(0, 10));
        } catch (error) {
            console.error('Error updating title:', error);
        }
    }

    override async onKeyDown() {
        try {
            console.log('Key pressed - starting paste operation');
            console.log('Current settings:', JSON.stringify(this.settings));
            
            const promptText = this.settings.promptText || '';
            console.log('Prompt text:', promptText);
            
            if (promptText) {
                console.log('Writing to clipboard...');
                await this.writeToClipboard(promptText);
                console.log('Clipboard write successful');
                
                console.log('Simulating paste...');
                await this.simulatePaste();
                console.log('Paste simulation complete');
            } else {
                console.log('No prompt text configured');
                console.warn('Please configure prompt text in the action settings');
            }
        } catch (error) {
            console.error('Error pasting prompt:', error);
            if (error instanceof Error) {
                console.error('Error stack:', error.stack);
            }
        }
    }

    override async onWillDisappear() {
        // Clean up when action disappears
    }

    override async onSendToPlugin(ev: SendToPluginEvent<JsonValue, Settings>) {
        // Update settings when changed in Property Inspector
        if (ev.payload && typeof ev.payload === 'object' && 'settings' in ev.payload) {
            const settings = ev.payload.settings;
            if (typeof settings === 'object' && settings !== null) {
                this.settings = {
                    promptText: 'promptText' in settings && typeof settings.promptText === 'string' 
                        ? settings.promptText 
                        : ''
                };
            }
        }
    }

    private writeToClipboard(text: string): Promise<void> {
        return new Promise((resolve, reject) => {
            try {
                const platform = process.platform;
                console.log(`Detected platform: ${platform}`);
                
                const command = platform === 'win32' 
                    ? `echo ${text.replace(/"/g, '\\"')} | clip`
                    : platform === 'darwin'
                        ? `echo "${text.replace(/"/g, '\\"')}" | pbcopy`
                        : `echo "${text.replace(/"/g, '\\"')}" | xclip -selection clipboard`;

                console.log(`Executing clipboard command: ${command}`);
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Clipboard command failed: ${error.message}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error);
                    } else {
                        console.log('Clipboard write successful');
                        console.log(`stdout: ${stdout}`);
                        resolve();
                    }
                });
            } catch (error) {
                console.error('Unexpected error in writeToClipboard:', error);
                reject(error);
            }
        });
    }

    private async checkCommandAvailability(command: string): Promise<void> {
        return new Promise((resolve, reject) => {
            exec(`which ${command}`, (error) => {
                if (error) {
                    reject(new Error(`${command} not found`));
                } else {
                    resolve();
                }
            });
        });
    }

    private async simulatePaste(): Promise<void> {
        return new Promise(async (resolve, reject) => {
            try {
                const platform = process.platform;
                console.log(`Detected platform: ${platform}`);
                
                // Check if required utilities are installed
                if (platform === 'linux') {
                    await this.checkCommandAvailability('xclip');
                    await this.checkCommandAvailability('xdotool');
                }

                const command = platform === 'win32'
                    ? `powershell -Command "Add-Type -AssemblyName System.Windows.Forms; [System.Windows.Forms.SendKeys]::SendWait('^v')"`
                    : platform === 'darwin'
                        ? `osascript -e 'tell application "System Events" to keystroke "v" using command down'`
                        : `xdotool key --clearmodifiers ctrl+v`;

                console.log(`Executing paste command: ${command}`);
                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        console.error(`Paste command failed: ${error.message}`);
                        console.error(`stderr: ${stderr}`);
                        reject(error);
                    } else {
                        console.log('Paste simulation successful');
                        console.log(`stdout: ${stdout}`);
                        resolve();
                    }
                });
            } catch (error) {
                console.error('Unexpected error in simulatePaste:', error);
                reject(error);
            }
        });
    }
}
