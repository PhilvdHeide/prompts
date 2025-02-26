import { action, KeyDownEvent, SingletonAction, WillAppearEvent, DidReceiveSettingsEvent } from "@elgato/streamdeck";

/**
 * Settings interface for the PastePrompt action.
 * Defines the structure of settings that will be saved and retrieved.
 */
type PromptSettings = {
  promptText?: string;
  promptTitle?: string;
};

/**
 * The PastePrompt action allows users to define AI prompt templates
 * that can be quickly pasted at the cursor position when the Stream Deck button is pressed.
 */
@action({ UUID: "com.officetrickbox.prompts.paste" })
export class PastePrompt extends SingletonAction<PromptSettings> {
  /**
   * When the action appears in the Stream Deck (e.g., when navigating to a page containing this action),
   * we set the title to match the custom title from settings if one exists.
   */
  override onWillAppear(ev: WillAppearEvent<PromptSettings>): void | Promise<void> {
    // If we have a custom title in settings, use that for the button
    const title = ev.payload.settings.promptTitle || "";
    return ev.action.setTitle(title);
  }

  /**
   * When settings are updated (e.g., from the Property Inspector), update the button title
   * to reflect any changes to the promptTitle.
   */
  override onDidReceiveSettings(ev: DidReceiveSettingsEvent<PromptSettings>): void | Promise<void> {
    // Update the title when settings change
    const title = ev.payload.settings.promptTitle || "";
    return ev.action.setTitle(title);
  }

  /**
   * When the button is pressed, this method is called.
   * We retrieve the prompt text from settings and initiate the paste operation.
   */
  override async onKeyDown(ev: KeyDownEvent<PromptSettings>): Promise<void> {
    const { settings } = ev.payload;
    
    // Default message if no prompt text is defined
    const promptText = settings.promptText || "Please define your prompt text in the settings.";
    
    try {
      // Use the Stream Deck SDK's clipboard API
      // Note: The actual implementation depends on the SDK's capabilities
      await this.pastePromptText(promptText);
      
      // Show success feedback on the button
      await ev.action.showOk();
    } catch (error) {
      // Log error and show failure feedback
      streamDeck.logger.error(`Failed to paste prompt: ${error}`);
      await ev.action.showAlert();
    }
  }

  /**
   * Helper method that handles the actual clipboard and paste operation.
   * This encapsulates the platform-specific functionality.
   */
  private async pastePromptText(text: string): Promise<void> {
    // First approach: Using the navigator.clipboard API if available
    try {
      // Copy text to clipboard
      await navigator.clipboard.writeText(text);
      
      // The SDK doesn't provide a direct way to simulate keypresses outside its context
      // We'll use a combination of available APIs to try to achieve this
      
      // Option 1: Use the system.executeCommand API if available
      if (typeof streamDeck.system?.executeCommand === 'function') {
        // On Windows, we might use something like:
        if (navigator.platform.indexOf('Win') !== -1) {
          // This is a conceptual placeholder - actual implementation will depend on SDK capabilities
          await streamDeck.system.executeCommand('powershell', [
            '-command', 
            'Add-Type -AssemblyName System.Windows.Forms;' +
            '[System.Windows.Forms.SendKeys]::SendWait("^v");'
          ]);
        } 
        // On macOS, we might use:
        else if (navigator.platform.indexOf('Mac') !== -1) {
          await streamDeck.system.executeCommand('osascript', [
            '-e', 
            'tell application "System Events" to keystroke "v" using command down'
          ]);
        }
      } 
      // Option 2: If executeCommand isn't available, log a warning
      else {
        streamDeck.logger.warn("System command execution not available. Text copied to clipboard but paste not automated.");
      }
      
      return;
    } catch (error) {
      streamDeck.logger.error(`Clipboard operation failed: ${error}`);
      throw new Error(`Failed to access clipboard: ${error}`);
    }
  }
}