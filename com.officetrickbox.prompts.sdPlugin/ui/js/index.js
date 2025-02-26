// Stream Deck Property Inspector JavaScript
const connectElgatoStreamDeckSocket = (inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) => {
    const websocket = new WebSocket(`ws://localhost:${inPort}`);
    let settings = {};

    // Handle incoming messages from Stream Deck
    websocket.onmessage = (event) => {
        const json = JSON.parse(event.data);
        if (json.event === 'didReceiveSettings') {
            // Update settings from Stream Deck
            settings = json.payload.settings;
            updateUI(settings);
        }
    };

    // Update UI elements with current settings
    function updateUI(settings) {
        document.getElementById('promptTitle').value = settings.promptTitle || '';
        document.getElementById('promptText').value = settings.promptText || '';
    }

    // Send settings to Stream Deck when changed
    function sendSettings() {
        const payload = {
            event: 'setSettings',
            context: inUUID,
            payload: {
                promptTitle: document.getElementById('promptTitle').value,
                promptText: document.getElementById('promptText').value
            }
        };
        websocket.send(JSON.stringify(payload));
    }

    // Setup event listeners for UI changes
    document.getElementById('promptTitle').addEventListener('input', sendSettings);
    document.getElementById('promptText').addEventListener('input', sendSettings);

    // Register with Stream Deck
    websocket.onopen = () => {
        const registerMessage = {
            event: inRegisterEvent,
            uuid: inUUID
        };
        websocket.send(JSON.stringify(registerMessage));

        // Request current settings
        const getSettingsMessage = {
            event: 'getSettings',
            context: inUUID
        };
        websocket.send(JSON.stringify(getSettingsMessage));
    };
};
