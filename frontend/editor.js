// Sample data
let members = [];

let chatMessages = [];

let currentMargins = 'normal';
let pageCount = 1;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    renderMembers();
    renderChatMessages();
    initializeEditor();
    updateDocumentDates();
    loadDocumentContent();
});

// Create initial page
function createInitialPage() {
    const pagesContainer = document.getElementById('documentPages');
    const page = createNewPage(1);
    pagesContainer.appendChild(page);

    const editorArea = page.querySelector('.editor-area');
    if (editorArea) setupEditorEvents(editorArea); 
}

// Create new page element
function createNewPage(pageNumber) {
    const page = document.createElement('div');
    page.className = `document-page ${currentMargins}-margins`;
    page.id = `page-${pageNumber}`;

    page.innerHTML = `
        <div class="editor-area" contenteditable="true" data-page="${pageNumber}">
            ${pageNumber === 1 
                ? `<p>Welcome to your document!</p><p>Start typing here...</p>` 
                : `<p><br></p>`}
        </div>
        <div class="page-number">Page ${pageNumber}</div>
    `;

    return page;
}


// Add new page
function addNewPage() {
    pageCount++;
    const pagesContainer = document.getElementById('documentPages');
    const newPage = createNewPage(pageCount);
    pagesContainer.appendChild(newPage);
    
    // Setup editor for new page
    const editorArea = newPage.querySelector('.editor-area');
    setupEditorEvents(editorArea);
    
    // Focus on new page
    editorArea.focus();
    
    showToast(`Page ${pageCount} added successfully!`);
}

// Change document margins
function changeMargins(marginType) {
    currentMargins = marginType;
    const pages = document.querySelectorAll('.document-page');
    
    pages.forEach(page => {
        page.className = `document-page ${marginType}-margins`;
    });
    
    const marginText = marginType === 'normal' ? 'Normal (2.5cm)' : 'Narrow (1.25cm)';
    showToast(`Margins changed to ${marginText}`);
}

// Setup editor events for a page
function setupEditorEvents(editorArea) {
    editorArea.addEventListener('input', function() {
        saveAllPagesContent();
        updateModifiedDate();
    });
    
    editorArea.addEventListener('keydown', function(e) {
        // Handle page break on Ctrl+Enter
        if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            e.preventDefault();
            addNewPage();
        }
    });
}

// Save all pages content
function saveAllPagesContent() {
    const pages = document.querySelectorAll('.editor-area');
    const allContent = Array.from(pages).map(page => page.innerHTML).join('\n<!-- PAGE_BREAK -->\n');
    localStorage.setItem('documentContent', allContent);
}

// Initialize editor for all pages
function initializeEditor() {
    // Auto-save functionality will be handled by setupEditorEvents
    
    // Load saved content
    // const savedContent = localStorage.getItem('documentContent');
    // if (savedContent && savedContent.includes('<!-- PAGE_BREAK -->')) {
    //     loadMultiPageContent(savedContent);
    // }
    createInitialPage();

    // Update toolbar state on selection change
    document.addEventListener('selectionchange', updateToolbarState);
    
    // Setup events for existing editor areas
    setTimeout(() => {
        const editorAreas = document.querySelectorAll('.editor-area');
        editorAreas.forEach(area => setupEditorEvents(area));
    }, 100);
}

// Load multi-page content
function loadMultiPageContent(content) {
    const pageContents = content.split('\n<!-- PAGE_BREAK -->\n');
    const pagesContainer = document.getElementById('documentPages');
    
    // Clear existing pages
    pagesContainer.innerHTML = '';
    pageCount = 0;
    
    // Create pages with content
    pageContents.forEach((pageContent, index) => {
        pageCount++;
        const page = createNewPage(pageCount);
        const editorArea = page.querySelector('.editor-area');
        if (pageContent.trim()) {
            editorArea.innerHTML = pageContent;
        }
        pagesContainer.appendChild(page);
        setupEditorEvents(editorArea);
    });
}

// Member management functions
function renderMembers() {
    const membersList = document.getElementById('membersList');
    membersList.innerHTML = members.map(member => `
        <div class="member-item">
            <div class="member-avatar" style="background: ${member.online ? '#34a853' : '#9aa0a6'}">
                ${member.avatar}
            </div>
            <div class="member-info">
                <div class="member-name">${member.name}</div>
                <div class="member-role">${member.email}</div>
            </div>
            <button class="permission-toggle ${member.permission}" onclick="togglePermission(${member.id})">
                ${member.permission === 'edit' ? 'Can Edit' : 'Can View'}
            </button>
        </div>
    `).join('');
}

function togglePermission(memberId) {
    const member = members.find(m => m.id === memberId);
    if (member) {
        member.permission = member.permission === 'edit' ? 'read' : 'edit';
        renderMembers();
        showToast(`${member.name}'s permission updated to ${member.permission === 'edit' ? 'Can Edit' : 'Can View'}`);
    }
}

function openAddMemberModal() {
    document.getElementById('addMemberModal').style.display = 'block';
}

function addMember() {
    const email = document.getElementById('memberEmail').value;
    const permission = document.getElementById('memberPermission').value;
    
    if (!email) {
        showToast('Please enter an email address', 'error');
        return;
    }
    
    if (members.some(m => m.email === email)) {
        showToast('This member is already added', 'error');
        return;
    }

    const newMember = {
        id: Date.now(),
        name: email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email: email,
        permission: permission,
        online: true,
        avatar: email.substring(0, 2).toUpperCase()
    };

    members.push(newMember);
    renderMembers();
    closeModal('addMemberModal');
    showToast(`${newMember.name} has been added to the document`);
}

// Update document dates
function updateDocumentDates() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    
    document.querySelectorAll('.created-date').forEach(el => {
        el.textContent = dateString;
    });
    document.querySelectorAll('.modified-date').forEach(el => {
        el.textContent = dateString;
    });
}

function updateModifiedDate() {
    const now = new Date();
    const dateString = now.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    });
    document.querySelectorAll('.modified-date').forEach(el => {
        el.textContent = dateString;
    });
}

// Chat functions
function renderChatMessages() {
    const chatContainer = document.getElementById('chatMessages');
    chatContainer.innerHTML = chatMessages.map(msg => `
        <div class="message">
            <div class="message-header">
                <div class="message-avatar">${msg.avatar}</div>
                <div class="message-name">${msg.user}</div>
                <div class="message-time">${msg.time}</div>
            </div>
            <div class="message-text">${msg.message}</div>
        </div>
    `).join('');
    chatContainer.scrollTop = chatContainer.scrollHeight;
}

function sendMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;

    const newMessage = {
        id: Date.now(),
        user: 'You',
        avatar: 'YU',
        message: message,
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    chatMessages.push(newMessage);
    renderChatMessages();
    input.value = '';
}

// Handle Enter key in chat input
document.getElementById('chatInput').addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
    }
});

// Editor functions
function formatText(command) {
    document.execCommand(command, false, null);
    updateToolbarState();
}

function updateToolbarState() {
    const commands = ['bold', 'italic', 'underline', 'strikeThrough'];
    commands.forEach(command => {
        const button = document.getElementById(command + 'Btn');
        if (button) {
            if (document.queryCommandState(command)) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }
    });
}

function insertTable() {
    const rows = prompt('Number of rows:', '3');
    const cols = prompt('Number of columns:', '3');
    
    if (rows && cols) {
        let tableHTML = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;">';
        for (let i = 0; i < parseInt(rows); i++) {
            tableHTML += '<tr>';
            for (let j = 0; j < parseInt(cols); j++) {
                tableHTML += '<td style="padding: 8px; border: 1px solid #ccc;">Cell</td>';
            }
            tableHTML += '</tr>';
        }
        tableHTML += '</table>';
        
        document.execCommand('insertHTML', false, tableHTML);
    }
}

function insertLink() {
    const url = prompt('Enter URL:', 'https://');
    const text = prompt('Enter link text:', 'Link');
    
    if (url && text) {
        const linkHTML = `<a href="${url}" target="_blank">${text}</a>`;
        document.execCommand('insertHTML', false, linkHTML);
    }
}

function insertImage(input) {
    const file = input.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
            const wrapperId = 'img-' + Date.now();
            const imageHTML = `
                <div class="resizable-image-wrapper" contenteditable="false" id="${wrapperId}">
                    <img src="${e.target.result}" class="resizable-image" />
                    <div class="resize-handle bottom-right"></div>
                </div>
            `;
            document.execCommand('insertHTML', false, imageHTML);

            setTimeout(() => {
                makeImageResizableAndDraggable(document.getElementById(wrapperId));
            }, 100); // Delay to ensure DOM is updated
        };
        reader.readAsDataURL(file);
    }
}

function makeImageResizableAndDraggable(wrapper) {
    const img = wrapper.querySelector('img');
    const handle = wrapper.querySelector('.resize-handle');

    // Drag functionality
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    wrapper.addEventListener('mousedown', function (e) {
        if (e.target === handle) return; // skip resize handle
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        const rect = wrapper.getBoundingClientRect();
        initialLeft = rect.left + window.scrollX;
        initialTop = rect.top + window.scrollY;
        wrapper.style.position = 'absolute';
        wrapper.style.zIndex = 999;
        wrapper.style.left = initialLeft + 'px';
        wrapper.style.top = initialTop + 'px';
    });

    document.addEventListener('mousemove', function (e) {
        if (isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            wrapper.style.left = initialLeft + dx + 'px';
            wrapper.style.top = initialTop + dy + 'px';
        }
    });

    document.addEventListener('mouseup', function () {
        isDragging = false;
    });

    // Resize functionality
    let isResizing = false;
    let startWidth, startHeight;

    handle.addEventListener('mousedown', function (e) {
        e.stopPropagation();
        isResizing = true;
        startX = e.clientX;
        startY = e.clientY;
        startWidth = img.offsetWidth;
        startHeight = img.offsetHeight;
    });

    document.addEventListener('mousemove', function (e) {
        if (isResizing) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            img.style.width = startWidth + dx + 'px';
            img.style.height = startHeight + dy + 'px';
        }
    });

    document.addEventListener('mouseup', function () {
        isResizing = false;
    });
}



function downloadDocument() {
    const title = document.getElementById('documentTitle').value || 'Document';
    const allPages = document.querySelectorAll('.editor-area');

    let combinedContent = '';
    allPages.forEach((page, index) => {
        combinedContent += `
            <div style="page-break-before: ${index > 0 ? 'always' : 'auto'}; margin-bottom: 40px;">
                ${page.innerHTML}
            </div>
        `;
    });

    const html = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>${title}</title>
            <style>
                @page {
                    size: A4;
                    margin: ${currentMargins === 'normal' ? '2.5cm' : '1.25cm'};
                }
                body {
                    font-family: Calibri, Arial, sans-serif;
                    line-height: 1.6;
                    font-size: 12pt;
                }
                h1 { font-size: 18pt; font-weight: bold; margin: 24pt 0 12pt 0; }
                h2 { font-size: 16pt; font-weight: bold; margin: 18pt 0 6pt 0; }
                h3 { font-size: 14pt; font-weight: bold; margin: 12pt 0 6pt 0; }
                p { margin: 0 0 12pt 0; text-align: justify; }
                ul, ol { margin: 12pt 0; padding-left: 24pt; }
                li { margin-bottom: 6pt; }
                table { border-collapse: collapse; width: 100%; margin: 12pt 0; }
                td, th { border: 1pt solid #000; padding: 6pt; text-align: left; }
                th { background-color: #f2f2f2; font-weight: bold; }
                img { max-width: 100%; height: auto; }
            </style>
        </head>
        <body>
            ${combinedContent}
        </body>
        </html>
    `;

    // Convert HTML to .docx
    const converted = htmlDocx.asBlob(html, { orientation: 'portrait', margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 } }); // 1440 = 1 inch

    const a = document.createElement('a');
    a.href = URL.createObjectURL(converted);
    a.download = `${title}.docx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);

    showToast('Document downloaded successfully as .docx!');
    console.log('Document downloaded:', title);
}





// Sidebar functions
function toggleLeftSidebar() {
    const sidebar = document.getElementById('leftSidebar');
    sidebar.classList.toggle('collapsed');
}

function toggleRightSidebar() {
    const sidebar = document.getElementById('rightSidebar');
    sidebar.classList.toggle('collapsed');
}

// Modal functions
function openShareModal() {
    document.getElementById('shareModal').style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
    // Clear form inputs
    const inputs = document.querySelectorAll(`#${modalId} input, #${modalId} select`);
    inputs.forEach(input => {
        if (input.type !== 'button' && input.type !== 'submit') {
            input.value = '';
        }
    });
}

function copyShareLink() {
    const linkInput = document.querySelector('#shareModal input[readonly]');
    linkInput.select();
    document.execCommand('copy');
    showToast('Share link copied to clipboard!');
    closeModal('shareModal');
}

// Utility functions
function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#dc3545' : '#28a745'};
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 10000;
        font-size: 14px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.2);
    `;
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.remove();
    }, 3000);
}

// Handle document title changes
document.getElementById('documentTitle').addEventListener('blur', function() {
    document.title = this.value + ' - DocEditor';
});

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'b':
                e.preventDefault();
                formatText('bold');
                break;
            case 'i':
                e.preventDefault();
                formatText('italic');
                break;
            case 'u':
                e.preventDefault();
                formatText('underline');
                break;
            case 's':
                e.preventDefault();
                saveDocument();
                break;
            case 'd':
                e.preventDefault();
                downloadDocument();
                break;
            case 'Enter':
                if (e.target.classList.contains('editor-area')) {
                    // Ctrl+Enter adds new page
                    e.preventDefault();
                    addNewPage();
                }
                break;
        }
    }
});

// Auto-save notification
// setInterval(() => {
//     const editor = document.getElementById('editor');
//     if (editor.innerHTML !== localStorage.getItem('documentContent')) {
//         localStorage.setItem('documentContent', editor.innerHTML);
//         updateModifiedDate();
//     }
// }, 30000); // Auto-save every 30 seconds

console.log('Document Editor initialized successfully!');










// Load content from S3 using presigned URL
async function loadDocumentContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const docId = urlParams.get("docId");
  const isNew = urlParams.get("new") === "true";

  if (!docId) {
    console.warn("No docId in URL.");
    return;
  }

  if (isNew) {
    console.log("New document detected via URL. Creating blank page...");
    createInitialPage(); // ✅ skip backend call
    return;
  }

  // Existing document: Load from backend
  try {
    const response = await fetch(`http://localhost:3000/api/get-document?docId=${docId}`);

    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.document || !data.document.content) {
      console.log("Document is empty.");
      createInitialPage(); // fallback
      return;
    }

    const signedHtmlUrl = data.document.content;
    const htmlResponse = await fetch(signedHtmlUrl);

    if (!htmlResponse.ok) {
      throw new Error("Failed to fetch HTML file from S3.");
    }

    const fullHtml = await htmlResponse.text();
    const parser = new DOMParser();
    const htmlDoc = parser.parseFromString(fullHtml, "text/html");
    const bodyContent = htmlDoc.body.innerHTML;

    const pageContents = bodyContent.split("<!-- PAGE_BREAK -->");

    const container = document.getElementById("documentPages");
    container.innerHTML = "";
    pageCount = 0;

    pageContents.forEach((content, index) => {
      pageCount++;
      const page = document.createElement("div");
      page.className = `document-page ${currentMargins}-margins`;
      page.id = `page-${pageCount}`;

      page.innerHTML = `
        <div class="editor-area" contenteditable="true" data-page="${pageCount}">
          ${content}
        </div>
        <div class="page-number">Page ${pageCount}</div>
      `;

      container.appendChild(page);
      const editorArea = page.querySelector('.editor-area');
      setupEditorEvents(editorArea);
    });

  } catch (err) {
    console.error("Error loading document:", err);
    showToast("Failed to load document", "error");
    createInitialPage(); // fallback for errors
  }
}





const urlParams = new URLSearchParams(window.location.search);
const access = urlParams.get("access");

if (access === "read") {
  // disable editing
  document.getElementById("editor").setAttribute("contenteditable", "false");
}












function getDocumentIdFromURL() {
  const params = new URLSearchParams(window.location.search);
  return params.get('docId');
}



// Save document to server
async function saveDocument() {
  const docId = getDocumentIdFromURL();
  const title = document.getElementById('documentTitle')?.value || 'Untitled Document';
  const owner = JSON.parse(localStorage.getItem('user'));
  const ownerEmail = owner?.email || "anonymous@example.com";
  const timestamp = new Date().toISOString();

  const editorAreas = document.querySelectorAll('.editor-area');
  const allContent = Array.from(editorAreas)
    .map(page => page.innerHTML.trim())
    .join('\n<!-- PAGE_BREAK -->\n');

  const payload = {
    docId,
    title,
    ownerEmail,
    content: allContent,
    timestamp
  };

  try {
    const response = await fetch('http://localhost:3000/api/save-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Server error: ${errorData.error || response.statusText}`);
    }

    const result = await response.json();
    showToast('Document saved successfully!');
    console.log('Saved Document:', result);
  } catch (error) {
    console.error('Save failed:', error);
    showToast('Failed to save document: ' + error.message, 'error');
  }
}

// Handle document title from URL
document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const titleFromURL = urlParams.get("title");
  if (titleFromURL) {
    const decodedTitle = decodeURIComponent(titleFromURL);
    const titleInput = document.getElementById("documentTitle");
    titleInput.value = decodedTitle;
    document.title = decodedTitle + " - DocEditor";
  }

  loadDocumentContent(); // ✅ Important: Call this on load
});




// Save shortcut
document.addEventListener('keydown', function (e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault();
    saveDocument();
  }
});
