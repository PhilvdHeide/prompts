// Property Inspector for Prompts Plugin

// Variables to store references to UI elements
var promptTextElement;
var promptTitleElement;
var saveButtonElement;
var settings = {};

// WebSocket connection to Stream Deck
var websocket = null;

// Connect to Stream Deck
function connectElgatoStreamDeckSocket(inPort, inPropertyInspectorUUID, inRegisterEvent, inInfo, inActionInfo) {
    // Create WebSocket connection to StreamDeck
    websocket = new WebSocket("ws://127.0.0.1:" + inPort);

    // When connection is established
    websocket.onopen = function() {
        // Register the Property Inspector with Stream Deck
        const json = {
            event: inRegisterEvent,
            uuid: inPropertyInspectorUUID
        };
        websocket.send(JSON.stringify(json));

        // Request settings for this instance
        const getSettings = {
            "event": "getSettings",
            "context": inPropertyInspectorUUID
        };
        websocket.send(JSON.stringify(getSettings));
    };

    // When a message is received from Stream Deck
    websocket.onmessage = function(evt) {
        // Parse the message
        const jsonObj = JSON.parse(evt.data);
        const event = jsonObj.event;
        
        // Handle different event types
        if (event === "didReceiveSettings") {
            // Save the settings
            settings = jsonObj.payload.settings;
            
            // Update the UI with the stored settings
            updateUI();
        }
    };

    // Initialize the UI when the document is ready
    document.addEventListener('DOMContentLoaded', function() {
        // Get references to UI elements
        promptTextElement = document.getElementById('promptText');
        promptTitleElement = document.getElementById('promptTitle');
        saveButtonElement = document.getElementById('saveSettings');

        // Add event listeners
        saveButtonElement.addEventListener('click', saveSettings);
        
        // Parse the inActionInfo to get the current settings
        if (inActionInfo) {
            const actionInfo = JSON.parse(inActionInfo);
            settings = actionInfo.payload.settings || {};
            updateUI();
        }
    });
}

// Update the UI with the current settings
function updateUI() {
    if (promptTextElement && settings) {
        promptTextElement.value = settings.promptText || '';
        promptTitleElement.value = settings.promptTitle || '';
    }
}

// Save the settings to the Stream Deck
function saveSettings() {
    if (!websocket) return;

    // Get values from UI
    const promptText = promptTextElement.value;
    const promptTitle = promptTitleElement.value;

    // Save to settings object
    settings.promptText = promptText;
    settings.promptTitle = promptTitle;

    // Send settings to Stream Deck
    const json = {
        "event": "setSettings",
        "context": inPropertyInspectorUUID,
        "payload": settings
    };
    websocket.send(JSON.stringify(json));

    // If title is set, also update the button title
    if (promptTitle) {
        const setTitle = {
            "event": "setTitle",
            "context": inPropertyInspectorUUID,
            "payload": {
                "title": promptTitle,
                "target": 0
            }
        };
        websocket.send(JSON.stringify(setTitle));
    }
}