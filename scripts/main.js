// Document Management System - Main JavaScript File

class DocumentManager {
    constructor() {
        this.documents = this.loadDocuments();
        this.currentSection = 'home';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStats();
        this.renderDocuments();
        this.showSection('home');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const section = link.getAttribute('href').substring(1);
                this.showSection(section);
            });
        });

        // File upload
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');

        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('drag-over');
        });

        dropZone.addEventListener('dragleave', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
        });

        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Search
        const searchInput = document.getElementById('searchInput');
        searchInput.addEventListener('input', debounce(() => {
            this.performSearch();
        }, 300));

        // Filters
        document.getElementById('typeFilter').addEventListener('change', () => {
            this.filterDocuments();
        });
        document.getElementById('dateFilter').addEventListener('change', () => {
            this.filterDocuments();
        });

        // Search filters
        document.querySelectorAll('#searchTitles, #searchContent, #searchTags').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                if (searchInput.value.trim()) {
                    this.performSearch();
                }
            });
        });
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.page-section').forEach(section => {
            section.classList.remove('active');
        });

        // Show target section
        const targetSection = document.getElementById(sectionName);
        if (targetSection) {
            targetSection.classList.add('active');
        }

        // Update navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.classList.remove('active');
        });
        document.querySelector(`[href="#${sectionName}"]`).classList.add('active');

        this.currentSection = sectionName;
    }

    handleFiles(files) {
        if (files.length === 0) return;

        const validFiles = Array.from(files).filter(file => {
            const validTypes = ['application/pdf', 'application/msword', 
                              'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                              'text/plain', 'image/jpeg', 'image/png', 'image/jpg'];
            return validTypes.includes(file.type) || file.name.toLowerCase().match(/\.(pdf|doc|docx|txt|png|jpg|jpeg)$/);
        });

        if (validFiles.length === 0) {
            this.showToast('אנא בחר קבצים תקינים (PDF, DOC, DOCX, TXT, תמונות)', 'error');
            return;
        }

        this.uploadFiles(validFiles);
    }

    async uploadFiles(files) {
        const progressContainer = document.getElementById('uploadProgress');
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');

        progressContainer.style.display = 'block';

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const progress = ((i + 1) / files.length) * 100;

            progressFill.style.width = `${progress}%`;
            progressText.textContent = `מעלה קובץ ${i + 1} מתוך ${files.length}: ${file.name}`;

            // Simulate upload delay
            await this.simulateUpload(file);
            
            // Add document to storage
            const document = {
                id: Date.now() + Math.random(),
                name: file.name,
                type: this.getFileType(file),
                size: file.size,
                uploadDate: new Date().toISOString(),
                content: await this.extractContent(file),
                tags: []
            };

            this.documents.push(document);
        }

        this.saveDocuments();
        this.updateStats();
        this.renderDocuments();
        
        setTimeout(() => {
            progressContainer.style.display = 'none';
            this.showToast(`${files.length} קבצים הועלו בהצלחה!`, 'success');
        }, 500);
    }

    async simulateUpload(file) {
        // Simulate processing time based on file size
        const delay = Math.min(Math.max(file.size / 100000, 500), 2000);
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    async extractContent(file) {
        return new Promise((resolve) => {
            if (file.type === 'text/plain') {
                const reader = new FileReader();
                reader.onload = (e) => resolve(e.target.result);
                reader.readAsText(file);
            } else {
                // For other file types, we'd normally use external APIs
                // For demo purposes, return filename as content
                resolve(`תוכן מקובץ: ${file.name}`);
            }
        });
    }

    getFileType(file) {
        if (file.type.includes('pdf')) return 'pdf';
        if (file.type.includes('word') || file.name.toLowerCase().match(/\.(doc|docx)$/)) return 'doc';
        if (file.type.includes('text')) return 'txt';
        if (file.type.includes('image')) return 'image';
        return 'unknown';
    }

    getFileIcon(type) {
        const icons = {
            pdf: '📄',
            doc: '📝',
            txt: '📃',
            image: '🖼️',
            unknown: '📁'
        };
        return icons[type] || icons.unknown;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateStats() {
        const totalDocs = this.documents.length;
        const totalSize = this.documents.reduce((sum, doc) => sum + (doc.size || 0), 0);
        
        // Calculate recent uploads (last 7 days)
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const recentUploads = this.documents.filter(doc => 
            new Date(doc.uploadDate) > weekAgo
        ).length;

        document.getElementById('total-docs').textContent = totalDocs;
        document.getElementById('total-size').textContent = this.formatFileSize(totalSize);
        document.getElementById('recent-uploads').textContent = recentUploads;
    }

    renderDocuments() {
        const grid = document.getElementById('documentsGrid');
        
        if (this.documents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>אין מסמכים עדיין. התחל בהעלאת המסמך הראשון!</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.documents.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="document-icon">${this.getFileIcon(doc.type)}</div>
                <div class="document-title">${doc.name}</div>
                <div class="document-meta">
                    <div>גודל: ${this.formatFileSize(doc.size || 0)}</div>
                    <div>הועלה: ${new Date(doc.uploadDate).toLocaleDateString('he-IL')}</div>
                </div>
                <div class="document-actions">
                    <button class="btn-small btn-view" onclick="docManager.viewDocument('${doc.id}')">
                        צפייה
                    </button>
                    <button class="btn-small btn-download" onclick="docManager.downloadDocument('${doc.id}')">
                        הורדה
                    </button>
                    <button class="btn-small btn-delete" onclick="docManager.deleteDocument('${doc.id}')">
                        מחיקה
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterDocuments() {
        const typeFilter = document.getElementById('typeFilter').value;
        const dateFilter = document.getElementById('dateFilter').value;

        let filtered = [...this.documents];

        if (typeFilter) {
            filtered = filtered.filter(doc => doc.type === typeFilter);
        }

        if (dateFilter) {
            const filterDate = new Date(dateFilter);
            filtered = filtered.filter(doc => {
                const docDate = new Date(doc.uploadDate);
                return docDate.toDateString() === filterDate.toDateString();
            });
        }

        this.renderFilteredDocuments(filtered);
    }

    renderFilteredDocuments(documents) {
        const grid = document.getElementById('documentsGrid');
        
        if (documents.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>לא נמצאו מסמכים המתאימים לקריטריונים שנבחרו</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = documents.map(doc => `
            <div class="document-card" data-id="${doc.id}">
                <div class="document-icon">${this.getFileIcon(doc.type)}</div>
                <div class="document-title">${doc.name}</div>
                <div class="document-meta">
                    <div>גודל: ${this.formatFileSize(doc.size || 0)}</div>
                    <div>הועלה: ${new Date(doc.uploadDate).toLocaleDateString('he-IL')}</div>
                </div>
                <div class="document-actions">
                    <button class="btn-small btn-view" onclick="docManager.viewDocument('${doc.id}')">
                        צפייה
                    </button>
                    <button class="btn-small btn-download" onclick="docManager.downloadDocument('${doc.id}')">
                        הורדה
                    </button>
                    <button class="btn-small btn-delete" onclick="docManager.deleteDocument('${doc.id}')">
                        מחיקה
                    </button>
                </div>
            </div>
        `).join('');
    }

    performSearch() {
        const query = document.getElementById('searchInput').value.trim();
        const searchTitles = document.getElementById('searchTitles').checked;
        const searchContent = document.getElementById('searchContent').checked;
        const searchTags = document.getElementById('searchTags').checked;

        if (!query) {
            document.getElementById('searchResults').innerHTML = '';
            return;
        }

        const results = this.documents.filter(doc => {
            let matches = false;

            if (searchTitles && doc.name.toLowerCase().includes(query.toLowerCase())) {
                matches = true;
            }

            if (searchContent && doc.content && doc.content.toLowerCase().includes(query.toLowerCase())) {
                matches = true;
            }

            if (searchTags && doc.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase()))) {
                matches = true;
            }

            return matches;
        });

        this.renderSearchResults(results, query);
    }

    renderSearchResults(results, query) {
        const container = document.getElementById('searchResults');

        if (results.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>לא נמצאו תוצאות עבור "${query}"</p>
                </div>
            `;
            return;
        }

        container.innerHTML = `
            <h3>נמצאו ${results.length} תוצאות עבור "${query}":</h3>
            ${results.map(doc => {
                const snippet = this.generateSnippet(doc, query);
                return `
                    <div class="search-result-item" onclick="docManager.viewDocument('${doc.id}')">
                        <div class="result-title">
                            ${this.getFileIcon(doc.type)} ${this.highlightText(doc.name, query)}
                        </div>
                        <div class="result-snippet">${snippet}</div>
                    </div>
                `;
            }).join('')}
        `;
    }

    generateSnippet(doc, query) {
        if (!doc.content) return 'אין תוכן זמין';
        
        const content = doc.content.toLowerCase();
        const queryLower = query.toLowerCase();
        const index = content.indexOf(queryLower);
        
        if (index === -1) return doc.content.substring(0, 150) + '...';
        
        const start = Math.max(0, index - 50);
        const end = Math.min(doc.content.length, index + query.length + 50);
        const snippet = doc.content.substring(start, end);
        
        return (start > 0 ? '...' : '') + this.highlightText(snippet, query) + (end < doc.content.length ? '...' : '');
    }

    highlightText(text, query) {
        const regex = new RegExp(`(${query})`, 'gi');
        return text.replace(regex, '<span class="highlight">$1</span>');
    }

    viewDocument(id) {
        const doc = this.documents.find(d => d.id == id);
        if (!doc) return;

        // In a real application, this would open a document viewer
        alert(`צפייה במסמך: ${doc.name}\n\nתוכן:\n${doc.content || 'אין תוכן זמין'}`);
    }

    downloadDocument(id) {
        const doc = this.documents.find(d => d.id == id);
        if (!doc) return;

        // In a real application, this would trigger file download
        this.showToast(`הורדת המסמך "${doc.name}" תתחיל בקרוב...`, 'success');
    }

    deleteDocument(id) {
        if (!confirm('האם אתה בטוח שברצונך למחוק את המסמך?')) return;

        this.documents = this.documents.filter(d => d.id != id);
        this.saveDocuments();
        this.updateStats();
        this.renderDocuments();
        this.showToast('המסמך נמחק בהצלחה', 'success');
    }

    showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.remove();
        }, 5000);
    }

    showLoading() {
        document.getElementById('loadingOverlay').classList.add('show');
    }

    hideLoading() {
        document.getElementById('loadingOverlay').classList.remove('show');
    }

    loadDocuments() {
        try {
            const stored = localStorage.getItem('documents');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading documents:', e);
            return [];
        }
    }

    saveDocuments() {
        try {
            localStorage.setItem('documents', JSON.stringify(this.documents));
        } catch (e) {
            console.error('Error saving documents:', e);
            this.showToast('שגיאה בשמירת המסמכים', 'error');
        }
    }
}

// Utility functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

function performSearch() {
    docManager.performSearch();
}

// Initialize the application
let docManager;

document.addEventListener('DOMContentLoaded', () => {
    docManager = new DocumentManager();
});

// Service Worker registration for PWA capabilities
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then((registration) => {
                console.log('SW registered: ', registration);
            })
            .catch((registrationError) => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}