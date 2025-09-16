
// ============================================================================
// web channel init
// ============================================================================

var aiController;

// async channel creation
var channel = new QWebChannel(qt.webChannelTransport, function(channel) {
    console.log("QWebChannel created for controls");
    console.log("Available objects:", Object.keys(channel.objects));
    
    // Check if ai_controller exists
    if (channel.objects.ai_controller) {
        aiController = channel.objects.ai_controller;
        console.log("ai_controller found:", aiController);
        console.log("test_predict method exists:", typeof aiController.test_predict === 'function');
        
        // Test calling the method directly
        try {
            aiController.test_predict("test message");
            console.log("test_predict called successfully");
        } catch (error) {
            console.error("Error calling test_predict:", error);
        }
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

function initChat() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const chatMessages = document.getElementById('chat-messages');
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
            // Call the correct method name - test_predict instead of predict
            aiController.test_predict(message);
        } else {
            console.error("AI Controller not available");
            setTimeout(() => {
                addMessage("This is a simulated response from the LLM.", 'ai');
                scrollToBottom();
            }, 1000);
        }
    }
    
    function addMessage(text, sender) {
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
    }
    
    function scrollToBottom() {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    // Make sure the response handler is properly set up
    if (window.receiveAIResponse === undefined) {
        window.receiveAIResponse = function(response) {
            addMessage(response, 'ai');
            scrollToBottom();
        };
    }
}

document.addEventListener('DOMContentLoaded', function() {
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    
    if (messageInput && sendButton) {
        messageInput.addEventListener('input', function() {
            sendButton.disabled = this.value.trim() === '';
        });
    }
});