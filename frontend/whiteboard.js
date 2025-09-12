class EnhancedWhiteboardApp {
    constructor() {
        this.canvas = document.getElementById('whiteboard');
        this.ctx = this.canvas.getContext('2d');
        this.isDrawing = false;
        this.isShapeDrawing = false;
        this.currentTool = 'pen';
        this.currentColor = '#000000';
        this.brushSize = 2;
        this.paths = [];
        this.currentPath = [];
        this.undoStack = [];
        this.redoStack = [];
        this.members = [{ name: 'You', avatar: 'You', online: true }];
        this.messages = [];
        
        // Shape drawing variables
        this.startX = 0;
        this.startY = 0;
        this.currentX = 0;
        this.currentY = 0;
        this.tempCanvas = null;
        
        // Text tool variables
        this.textInput = document.getElementById('textInput');
        this.isTextMode = false;
        this.textX = 0;
        this.textY = 0;
        this.activeTextBox = null;
        this.isDraggingText = false;
        this.textDragOffset = { x: 0, y: 0 };

        // Sidebar state
        this.leftSidebarOpen = false;
        this.rightSidebarOpen = false;

        this.initCanvas();
        this.initEventListeners();
        this.initSidebars();
        this.initChat();
    }

    initCanvas() {
        // Set canvas size - larger for enhanced experience
        this.canvas.width = 1400;
        this.canvas.height = 800;
        
        // Set drawing properties
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.imageSmoothingEnabled = true;
        
        // Set white background
        this.ctx.fillStyle = '#ffffff';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Create temporary canvas for shape preview
        this.tempCanvas = document.createElement('canvas');
        this.tempCanvas.width = this.canvas.width;
        this.tempCanvas.height = this.canvas.height;
        this.tempCtx = this.tempCanvas.getContext('2d');
    }

    initEventListeners() {
        // Tool selection
        document.querySelectorAll('.tool-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tool-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTool = btn.dataset.tool;
                this.handleToolChange();
            });
        });

        // Color selection
        document.querySelectorAll('.color-swatch').forEach(swatch => {
            swatch.addEventListener('click', (e) => {
                document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                this.currentColor = swatch.dataset.color;
                document.getElementById('customColor').value = this.currentColor;
            });
        });

        // Custom color picker
        document.getElementById('customColor').addEventListener('change', (e) => {
            this.currentColor = e.target.value;
            document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('active'));
        });

        // Brush size
        const brushSizeSlider = document.getElementById('brushSize');
        const brushSizeValue = document.getElementById('brushSizeValue');
        
        brushSizeSlider.addEventListener('input', (e) => {
            this.brushSize = parseInt(e.target.value);
            brushSizeValue.textContent = `${this.brushSize}px`;
        });

        // Canvas drawing events
        this.canvas.addEventListener('mousedown', this.startDrawing.bind(this));
        this.canvas.addEventListener('mousemove', this.draw.bind(this));
        this.canvas.addEventListener('mouseup', this.stopDrawing.bind(this));
        this.canvas.addEventListener('mouseout', this.stopDrawing.bind(this));

        // Touch events for mobile
        this.canvas.addEventListener('touchstart', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchmove', this.handleTouch.bind(this));
        this.canvas.addEventListener('touchend', this.stopDrawing.bind(this));

        // Action buttons
        document.getElementById('undoBtn').addEventListener('click', this.undo.bind(this));
        document.getElementById('redoBtn').addEventListener('click', this.redo.bind(this));
        document.getElementById('clearBtn').addEventListener('click', this.clearCanvas.bind(this));
        document.getElementById('saveBtn').addEventListener('click', this.saveCanvas.bind(this));
        document.getElementById('inviteBtn').addEventListener('click', this.showInviteModal.bind(this));

        // Modal events
        document.getElementById('closeModal').addEventListener('click', this.hideInviteModal.bind(this));
        document.getElementById('sendInvite').addEventListener('click', this.sendInvitation.bind(this));
        
        // Close modal when clicking outside
        document.getElementById('inviteModal').addEventListener('click', (e) => {
            if (e.target.id === 'inviteModal') {
                this.hideInviteModal();
            }
        });

        // Add member button
        document.getElementById('addMemberBtn').addEventListener('click', this.showInviteModal.bind(this));

        // Enhanced text input events
        this.textInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.addTextToCanvas();
            }
        });

        this.textInput.addEventListener('blur', () => {
            setTimeout(() => {
                if (this.activeTextBox && !this.isDraggingText) {
                    this.addTextToCanvas();
                }
            }, 100);
        });

        // Enhanced text box dragging
        this.textInput.addEventListener('mousedown', this.startTextDrag.bind(this));
        document.addEventListener('mousemove', this.dragText.bind(this));
        document.addEventListener('mouseup', this.stopTextDrag.bind(this));

        // Click outside to close text input
        document.addEventListener('click', (e) => {
            if (this.activeTextBox && !this.textInput.contains(e.target) && e.target !== this.canvas && !this.isDraggingText) {
                this.addTextToCanvas();
            }
        });

        // Window resize
        window.addEventListener('resize', this.handleResize.bind(this));
    }

    initSidebars() {
        const leftToggle = document.getElementById('leftToggle');
        const rightToggle = document.getElementById('rightToggle');
        const membersSidebar = document.getElementById('membersSidebar');
        const chatSidebar = document.getElementById('chatSidebar');

        // Left sidebar toggle
        leftToggle.addEventListener('click', () => {
            this.leftSidebarOpen = !this.leftSidebarOpen;
            membersSidebar.classList.toggle('open', this.leftSidebarOpen);
            leftToggle.classList.toggle('hidden', this.leftSidebarOpen);
        });

        // Right sidebar toggle
        rightToggle.addEventListener('click', () => {
            this.rightSidebarOpen = !this.rightSidebarOpen;
            chatSidebar.classList.toggle('open', this.rightSidebarOpen);
            rightToggle.classList.toggle('hidden', this.rightSidebarOpen);
        });

        // Close sidebar buttons
        document.getElementById('closeMembersBtn').addEventListener('click', () => {
            this.leftSidebarOpen = false;
            membersSidebar.classList.remove('open');
            leftToggle.classList.remove('hidden');
        });

        document.getElementById('closeChatBtn').addEventListener('click', () => {
            this.rightSidebarOpen = false;
            chatSidebar.classList.remove('open');
            rightToggle.classList.remove('hidden');
        });
    }

    initChat() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessage');

        // Send message events
        sendButton.addEventListener('click', this.sendMessage.bind(this));
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Add welcome message
        this.addMessage('system', 'System', 'Welcome to the whiteboard! Start collaborating!');
    }

    handleToolChange() {
        this.isTextMode = this.currentTool === 'text';
        this.canvas.style.cursor = this.isTextMode ? 'text' : 'crosshair';
        
        // Hide any active text input when switching tools
        if (this.currentTool !== 'text' && this.activeTextBox) {
            this.addTextToCanvas();
        }
    }

    getCanvasPoint(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    }

    handleTouch(e) {
        e.preventDefault();
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent(e.type === 'touchstart' ? 'mousedown' : 
                                        e.type === 'touchmove' ? 'mousemove' : 'mouseup', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        this.canvas.dispatchEvent(mouseEvent);
    }

    startDrawing(e) {
        const point = this.getCanvasPoint(e);
        
        if (this.currentTool === 'text') {
            this.handleTextClick(point, e);
            return;
        }

        this.isDrawing = true;
        this.currentPath = [point];
        this.startX = point.x;
        this.startY = point.y;
        
        // Save state for undo
        this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
        this.redoStack = [];

        if (this.isShapeTool()) {
            this.isShapeDrawing = true;
        } else {
            this.ctx.beginPath();
            this.ctx.moveTo(point.x, point.y);
        }
    }

    draw(e) {
        if (!this.isDrawing) return;

        const point = this.getCanvasPoint(e);
        this.currentX = point.x;
        this.currentY = point.y;

        if (this.isShapeDrawing) {
            this.drawShapePreview();
        } else {
            this.currentPath.push(point);
            this.setDrawingProperties();
            this.ctx.lineTo(point.x, point.y);
            this.ctx.stroke();
        }
    }

    stopDrawing() {
        if (!this.isDrawing) return;
        
        this.isDrawing = false;
        
        if (this.isShapeDrawing) {
            this.drawFinalShape();
            this.isShapeDrawing = false;
        }
        
        // Save the path for potential redrawing
        if (this.currentPath.length > 0) {
            this.paths.push({
                points: [...this.currentPath],
                color: this.currentColor,
                width: this.brushSize,
                tool: this.currentTool
            });
        }
        
        this.currentPath = [];
    }

    isShapeTool() {
        return ['rectangle', 'circle', 'line', 'arrow'].includes(this.currentTool);
    }

    drawShapePreview() {
        // Restore original canvas
        this.ctx.putImageData(this.undoStack[this.undoStack.length - 1], 0, 0);
        
        // Set drawing properties
        this.setDrawingProperties();
        
        // Draw shape preview
        this.ctx.beginPath();
        
        switch (this.currentTool) {
            case 'rectangle':
                this.ctx.rect(this.startX, this.startY, this.currentX - this.startX, this.currentY - this.startY);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2));
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                break;
            case 'line':
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(this.currentX, this.currentY);
                break;
            case 'arrow':
                this.drawArrow(this.startX, this.startY, this.currentX, this.currentY);
                break;
        }
        
        this.ctx.stroke();
    }

    drawFinalShape() {
        this.setDrawingProperties();
        this.ctx.beginPath();
        
        switch (this.currentTool) {
            case 'rectangle':
                this.ctx.rect(this.startX, this.startY, this.currentX - this.startX, this.currentY - this.startY);
                break;
            case 'circle':
                const radius = Math.sqrt(Math.pow(this.currentX - this.startX, 2) + Math.pow(this.currentY - this.startY, 2));
                this.ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                break;
            case 'line':
                this.ctx.moveTo(this.startX, this.startY);
                this.ctx.lineTo(this.currentX, this.currentY);
                break;
            case 'arrow':
                this.drawArrow(this.startX, this.startY, this.currentX, this.currentY);
                break;
        }
        
        this.ctx.stroke();
    }

    drawArrow(fromX, fromY, toX, toY) {
        const headLength = 20;
        const angle = Math.atan2(toY - fromY, toX - fromX);
        
        // Draw the line
        this.ctx.moveTo(fromX, fromY);
        this.ctx.lineTo(toX, toY);
        
        // Draw the arrowhead
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle - Math.PI / 6), toY - headLength * Math.sin(angle - Math.PI / 6));
        this.ctx.moveTo(toX, toY);
        this.ctx.lineTo(toX - headLength * Math.cos(angle + Math.PI / 6), toY - headLength * Math.sin(angle + Math.PI / 6));
    }

    handleTextClick(point, e) {
        // If there's already an active text box, save it first
        if (this.activeTextBox) {
            this.addTextToCanvas();
        }

        const rect = this.canvas.getBoundingClientRect();
        
        // Calculate absolute position for the text input
        const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
        const scrollY = window.pageYOffset || document.documentElement.scrollTop;
        
        const canvasX = rect.left + scrollX + (point.x * rect.width / this.canvas.width);
        const canvasY = rect.top + scrollY + (point.y * rect.height / this.canvas.height);
        
        // Create and position the enhanced text input
        this.textInput.style.position = 'absolute';
        this.textInput.style.display = 'block';
        this.textInput.style.left = canvasX + 'px';
        this.textInput.style.top = canvasY + 'px';
        this.textInput.style.fontSize = Math.max(14, this.brushSize * 4) + 'px';
        this.textInput.style.color = this.currentColor;
        this.textInput.style.border = '2px solid ' + this.currentColor;
        this.textInput.style.minWidth = '200px';
        this.textInput.style.minHeight = '40px';
        this.textInput.style.padding = '10px';
        this.textInput.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
        this.textInput.style.borderRadius = '8px';
        this.textInput.style.outline = 'none';
        this.textInput.style.zIndex = '1000';
        this.textInput.style.fontFamily = 'Arial, sans-serif';
        this.textInput.style.resize = 'both';
        this.textInput.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        this.textInput.style.cursor = 'text';
        this.textInput.style.transition = 'all 0.2s ease';
        this.textInput.value = '';
        
        // Add helper text as placeholder
        this.textInput.placeholder = 'Type your text here... (Ctrl+Enter to add, drag borders to move)';
        
        // Focus and select the text input
        setTimeout(() => {
            this.textInput.focus();
        }, 10);
        
        this.textX = point.x;
        this.textY = point.y;
        this.activeTextBox = true;
        
        // Show helper notification
        this.showNotification('Text box created! Drag the borders to move, resize by corners, Ctrl+Enter to add to canvas');
    }

    addTextToCanvas() {
        if (this.textInput.value.trim() && this.textX !== undefined && this.activeTextBox) {
            // Save state for undo
            this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.redoStack = [];
            
            // Set text properties
            const fontSize = Math.max(14, this.brushSize * 4);
            this.ctx.font = `${fontSize}px Arial`;
            this.ctx.fillStyle = this.currentColor;
            this.ctx.textAlign = 'left';
            this.ctx.textBaseline = 'top';
            
            // Handle multi-line text
            const lines = this.textInput.value.split('\n');
            const lineHeight = fontSize * 1.2;
            
            lines.forEach((line, index) => {
                this.ctx.fillText(line, this.textX, this.textY + (index * lineHeight));
            });
            
            this.showNotification('Text added to canvas');
        }
        
        // Hide the text input
        this.textInput.style.display = 'none';
        this.textX = undefined;
        this.textY = undefined;
        this.activeTextBox = null;
        this.isDraggingText = false;
    }

    setDrawingProperties() {
        switch (this.currentTool) {
            case 'pen':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.brushSize;
                this.ctx.globalAlpha = 1;
                break;
            case 'marker':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.brushSize * 3;
                this.ctx.globalAlpha = 0.6;
                break;
            case 'brush':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.brushSize * 2;
                this.ctx.globalAlpha = 0.8;
                break;
            case 'eraser':
                this.ctx.globalCompositeOperation = 'destination-out';
                this.ctx.lineWidth = this.brushSize * 4;
                this.ctx.globalAlpha = 1;
                break;
            case 'rectangle':
            case 'circle':
            case 'line':
            case 'arrow':
                this.ctx.globalCompositeOperation = 'source-over';
                this.ctx.strokeStyle = this.currentColor;
                this.ctx.lineWidth = this.brushSize;
                this.ctx.globalAlpha = 1;
                break;
        }
    }

    undo() {
        if (this.undoStack.length > 0) {
            this.redoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            const previousState = this.undoStack.pop();
            this.ctx.putImageData(previousState, 0, 0);
            this.showNotification('Undo applied');
        }
    }

    redo() {
        if (this.redoStack.length > 0) {
            this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            const nextState = this.redoStack.pop();
            this.ctx.putImageData(nextState, 0, 0);
            this.showNotification('Redo applied');
        }
    }

    clearCanvas() {
        if (confirm('Are you sure you want to clear the canvas?')) {
            this.undoStack.push(this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height));
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.paths = [];
            this.redoStack = [];
            this.showNotification('Canvas cleared');
        }
    }

    saveCanvas() {
        const link = document.createElement('a');
        link.download = `enhanced-whiteboard-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
        link.href = this.canvas.toDataURL();
        link.click();
        this.showNotification('Canvas saved successfully!');
    }

    showInviteModal() {
        document.getElementById('inviteModal').classList.add('show');
    }

    hideInviteModal() {
        document.getElementById('inviteModal').classList.remove('show');
        document.getElementById('inviteEmail').value = '';
    }

    sendInvitation() {
        const email = document.getElementById('inviteEmail').value.trim();
        if (!email) {
            alert('Please enter an email address');
            return;
        }

        if (!this.isValidEmail(email)) {
            alert('Please enter a valid email address');
            return;
        }

        // Simulate sending invitation
        this.showNotification(`Invitation sent to ${email}!`);
        
        // Add as a member
        const name = email.split('@')[0];
        this.addMember(name, true);
        
        // Add system message to chat
        this.addMessage('system', 'System', `${name} has been invited to the whiteboard`);
        
        this.hideInviteModal();
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    addMember(name, online = false) {
        if (!this.members.find(m => m.name === name)) {
            this.members.push({ name, avatar: name.charAt(0).toUpperCase(), online });
            this.updateMembersList();
            
            // Simulate member joining after a delay
            if (online) {
                setTimeout(() => {
                    this.addMessage('system', 'System', `${name} joined the whiteboard`);
                }, 1000);
            }
        }
    }

    updateMembersList() {
        const membersList = document.getElementById('membersList');
        membersList.innerHTML = '';

        this.members.forEach(member => {
            const memberDiv = document.createElement('div');
            memberDiv.className = `member ${member.online ? 'online' : 'offline'}`;
            
            memberDiv.innerHTML = `
                <div class="member-avatar">${member.avatar}</div>
                <span class="member-name">${member.name}</span>
                <span class="member-status ${member.online ? 'online' : 'offline'}"></span>
            `;
            
            membersList.appendChild(memberDiv);
        });
    }

    sendMessage() {
        const input = document.getElementById('chatInput');
        const message = input.value.trim();
        
        if (!message) return;

        this.addMessage('user', 'You', message);
        input.value = '';

        // Simulate responses from online members (for demo)
        setTimeout(() => {
            const onlineMembers = this.members.filter(m => m.online && m.name !== 'You');
            if (onlineMembers.length > 0 && Math.random() > 0.4) {
                const responses = [
                    'Great work!',
                    'I like that drawing',
                    'Nice color choice!',
                    'Let me add something here',
                    'What do you think about this?',
                    'This looks amazing!',
                    'Good collaboration!',
                    'Can you move that a bit?',
                    'Perfect!'
                ];
                const randomMember = onlineMembers[Math.floor(Math.random() * onlineMembers.length)];
                const randomResponse = responses[Math.floor(Math.random() * responses.length)];
                this.addMessage('other', randomMember.name, randomResponse);
            }
        }, 1000 + Math.random() * 3000);
    }

    addMessage(type, sender, text) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        
        let messageHTML = '';
        if (type !== 'system' && type !== 'user') {
            messageHTML += `<div class="message-author">${this.escapeHtml(sender)}</div>`;
        }
        
        messageHTML += `
            <div class="message-text">${this.escapeHtml(text)}</div>
            <span class="message-time">${timeString}</span>
        `;
        
        messageDiv.innerHTML = messageHTML;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;

        this.messages.push({ type, sender, text, time: now });
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #007bff;
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            z-index: 3000;
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    handleResize() {
        // Save current canvas content
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
        
        // Resize canvas
        this.initCanvas();
        
        // Restore content
        this.ctx.putImageData(imageData, 0, 0);
    }

    startTextDrag(e) {
        if (e.target === this.textInput || this.textInput.contains(e.target)) {
            // Only start dragging if clicking on the border area (not the text area)
            const rect = this.textInput.getBoundingClientRect();
            const borderWidth = 8; // Approximate border area
            
            if (e.clientX - rect.left < borderWidth || 
                e.clientY - rect.top < borderWidth || 
                rect.right - e.clientX < borderWidth || 
                rect.bottom - e.clientY < borderWidth) {
                
                this.isDraggingText = true;
                this.textDragOffset.x = e.clientX - rect.left;
                this.textDragOffset.y = e.clientY - rect.top;
                e.preventDefault();
                
                // Add visual feedback
                this.textInput.style.cursor = 'move';
                this.textInput.style.borderColor = '#007bff';
                this.textInput.style.borderWidth = '3px';
            }
        }
    }

    dragText(e) {
        if (this.isDraggingText && this.activeTextBox) {
            e.preventDefault();
            
            const newX = e.clientX - this.textDragOffset.x;
            const newY = e.clientY - this.textDragOffset.y;
            
            this.textInput.style.left = newX + 'px';
            this.textInput.style.top = newY + 'px';
            
            // Update canvas coordinates
            const rect = this.canvas.getBoundingClientRect();
            const scrollX = window.pageXOffset || document.documentElement.scrollLeft;
            const scrollY = window.pageYOffset || document.documentElement.scrollTop;
            
            this.textX = ((newX - rect.left - scrollX) * this.canvas.width) / rect.width;
            this.textY = ((newY - rect.top - scrollY) * this.canvas.height) / rect.height;
        }
    }

    stopTextDrag(e) {
        if (this.isDraggingText) {
            this.isDraggingText = false;
            
            // Remove visual feedback
            this.textInput.style.cursor = 'text';
            this.textInput.style.borderColor = this.currentColor;
            this.textInput.style.borderWidth = '2px';
            
            // Refocus the text input
            setTimeout(() => {
                this.textInput.focus();
            }, 10);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const app = new EnhancedWhiteboardApp();
});
