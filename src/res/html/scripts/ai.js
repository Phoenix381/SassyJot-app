
// ============================================================================
// web channel init
// ============================================================================

//TODO: remove freeze when model is thinking
var aiController;

// Make sure the response handler is properly set up BEFORE the channel is created
window.receiveAIResponse = function(response) {
    console.log("AI Response received:", response);
    addMessage(response, 'ai');
    scrollToBottom();
};

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", Object.keys(channel.objects));
    
    // Check if ai_controller exists
    if (channel.objects.ai_controller) {
        aiController = channel.objects.ai_controller;
        console.log("ai_controller found:", aiController);
        console.log("predict method exists:", typeof aiController.predict === 'function');
        
        // Connect to the response signal
        aiController.aiResponseReady.connect(function(response) {
            console.log("Signal received:", response);
            if (window.receiveAIResponse) {
                window.receiveAIResponse(response);
            } else {
                console.error("receiveAIResponse function not found");
                // Fallback: add message directly
                addMessage(response, 'ai');
                scrollToBottom();
            }
        });
    } else {
        console.error("ai_controller NOT found in channel.objects!");
    }
    
    // Wait for DOM to be fully ready before initializing chat
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initChat);
    } else {
        initChat();
    }
});

// ============================================================================
// chat functionality
// ============================================================================

// Move these to global scope so they can be accessed by receiveAIResponse
var chatMessages;

function initChat() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    chatMessages = document.getElementById('chat-messages'); // Make global
    const clearChatButton = document.getElementById('clear-chat');
    
    messageInput.addEventListener('input', function() {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        
        sendButton.disabled = this.value.trim() === '';
    });
    
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!sendButton.disabled) {
                sendMessage();
            }
        }
    });
    
    sendButton.addEventListener('click', sendMessage);
    
    clearChatButton.addEventListener('click', function() {
        if (confirm("Are you sure you want to clear the conversation?")) {
            while (chatMessages.children.length > 1) {
                chatMessages.removeChild(chatMessages.lastChild);
            }
        }
    });
    
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message === '') return;
        
        addMessage(message, 'user');
        
        messageInput.value = '';
        messageInput.style.height = 'auto';
        sendButton.disabled = true;
        
        scrollToBottom();
        
        if (aiController) {
            console.log("Calling predict with:", message);
            // Call the correct method name - predict instead of predict
            try {
                var result = aiController.predict(message);
                console.log("predict returned:", result);
            } catch (error) {
                console.error("Error calling predict:", error);
                // Fallback: show simulated response
                setTimeout(() => {
                    addMessage("Error connecting to AI. This is a simulated response.", 'ai');
                    scrollToBottom();
                }, 1000);
            }
        } else {
            console.error("AI Controller not available");
            setTimeout(() => {
                addMessage("This is a simulated response from the LLM.", 'ai');
                scrollToBottom();
            }, 1000);
        }
    }
    
    // Make scrollToBottom available globally
    window.scrollToBottom = function() {
        if (chatMessages) {
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
    };
}

// Make addMessage available globally
window.addMessage = function(text, sender) {
    if (!chatMessages) {
        console.error("chatMessages not initialized");
        return;
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    
    const avatarIcon = document.createElement('span');
    avatarIcon.className = 'material-symbols-outlined';
    avatarIcon.textContent = sender === 'user' ? 'person' : 'robot';
    avatar.appendChild(avatarIcon);
    
    const content = document.createElement('div');
    content.className = 'message-content';
    
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    content.appendChild(paragraph);
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    
    chatMessages.appendChild(messageDiv);
};

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    if (messageInput && sendButton) {
        messageInput.addEventListener('input', function() {
            sendButton.disabled = this.value.trim() === '';
        });
    }
});