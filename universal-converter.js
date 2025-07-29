class UniversalConverter {
    constructor() {
        this.files = [];
        this.convertedFiles = [];
        this.currentMode = 'to-pdf';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.updateStatus('Pronto para converter! Selecione seus arquivos.', 'info');
    }

    setupEventListeners() {
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        const modeRadios = document.querySelectorAll('input[name="conversionMode"]');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        modeRadios.forEach(radio => {
            radio.addEventListener('change', this.handleModeChange.bind(this));
        });

        document.getElementById('convertBtn').addEventListener('click', this.startConversion.bind(this));
        document.getElementById('downloadBtn').addEventListener('click', this.downloadFile.bind(this));
        document.getElementById('downloadAllBtn').addEventListener('click', this.downloadAll.bind(this));
        document.getElementById('previewBtn').addEventListener('click', this.showPreview.bind(this));
    }

    handleModeChange(e) {
        this.currentMode = e.target.value;
        this.updateUI();
        this.files = [];
        this.convertedFiles = [];
        this.updateFileDisplay();
        this.updateButtons();
    }

    updateUI() {
        const uploadText = document.getElementById('uploadText');
        const uploadSubtext = document.getElementById('uploadSubtext');
        const fileInput = document.getElementById('fileInput');

        switch(this.currentMode) {
            case 'to-pdf':
                uploadText.textContent = 'Arraste arquivos para converter em PDF';
                uploadSubtext.textContent = 'Suporta: HTML, JPG, PNG, DOCX, TXT';
                fileInput.accept = '.html,.htm,.jpg,.jpeg,.png,.docx,.txt';
                break;
            case 'from-pdf':
                uploadText.textContent = 'Arraste arquivos PDF para converter';
                uploadSubtext.textContent = 'Suporta: PDF → JPG, PNG, TXT, HTML';
                fileInput.accept = '.pdf';
                break;
            case 'image-convert':
                uploadText.textContent = 'Arraste imagens para converter';
                uploadSubtext.textContent = 'Suporta: JPG ↔ PNG ↔ WebP';
                fileInput.accept = '.jpg,.jpeg,.png,.webp';
                break;
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        document.getElementById('uploadArea').classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const validFiles = files.filter(file => this.isValidFile(file));
        
        if (validFiles.length === 0) {
            this.updateStatus('Nenhum arquivo válido selecionado!', 'error');
            return;
        }

        this.files.push(...validFiles);
        this.updateFileDisplay();
        this.updateButtons();
        this.updateStatus(`${this.files.length} arquivo(s) carregado(s)`, 'success');
    }

    isValidFile(file) {
        const validTypes = {
            'to-pdf': ['text/html', 'image/jpeg', 'image/jpg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
            'from-pdf': ['application/pdf'],
            'image-convert': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        };

        return validTypes[this.currentMode].some(type => {
            return file.type === type || 
                   (type === 'text/html' && (file.name.endsWith('.html') || file.name.endsWith('.htm'))) ||
                   (type === 'image/jpg' && file.name.endsWith('.jpg'));
        });
    }

    updateFileDisplay() {
        const container = document.getElementById('previewArea') || this.createPreviewArea();
        
        if (this.files.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        container.innerHTML = `
            <h3>Arquivos Selecionados (${this.files.length})</h3>
            <div class="files-grid">
                ${this.files.map((file, index) => `
                    <div class="file-item">
                        <div class="file-icon">${this.getFileIcon(file)}</div>
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                        <button onclick="converter.removeFile(${index})" style="margin-top: 8px; padding: 4px 8px; background: #333; color: white; border: none; border-radius: 4px; cursor: pointer;">✕</button>
                    </div>
                `).join('')}
            </div>
        `;
    }

    createPreviewArea() {
        const existing = document.getElementById('previewArea');
        if (existing) return existing;

        const area = document.createElement('div');
        area.id = 'previewArea';
        area.className = 'preview-area';
        document.querySelector('.button-group').parentNode.insertBefore(area, document.querySelector('.button-group'));
        return area;
    }

    getFileIcon(file) {
        const type = file.type || file.name.split('.').pop();
        const icons = {
            'application/pdf': '📄',
            'text/html': '🌐',
            'image/jpeg': '🖼️',
            'image/jpg': '🖼️',
            'image/png': '🖼️',
            'image/webp': '🖼️',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '📝',
            'text/plain': '📋'
        };
        return icons[type] || '📁';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.updateFileDisplay();
        this.updateButtons();
    }

    updateButtons() {
        const hasFiles = this.files.length > 0;
        document.getElementById('convertBtn').disabled = !hasFiles;
        document.getElementById('previewBtn').disabled = !hasFiles;
        
        const hasConverted = this.convertedFiles.length > 0;
        document.getElementById('downloadBtn').disabled = !hasConverted;
        document.getElementById('downloadAllBtn').style.display = hasConverted && this.convertedFiles.length > 1 ? 'inline-block' : 'none';
    }

    async startConversion() {
        if (this.files.length === 0) return;

        const convertBtn = document.getElementById('convertBtn');
        convertBtn.disabled = true;
        convertBtn.textContent = '🔄 Convertendo...';

        this.showProgress(0);
        this.convertedFiles = [];

        try {
            for (let i = 0; i < this.files.length; i++) {
                const file = this.files[i];
                this.updateStatus(`Convertendo ${file.name}...`, 'info');
                
                const converted = await this.convertFile(file);
                if (converted) {
                    this.convertedFiles.push(converted);
                }
                
                this.showProgress((i + 1) / this.files.length * 100);
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            this.updateStatus(`✅ ${this.convertedFiles.length} arquivo(s) convertido(s) com sucesso!`, 'success');
            this.updateButtons();

        } catch (error) {
            this.updateStatus('Erro na conversão: ' + error.message, 'error');
        } finally {
            convertBtn.disabled = false;
            convertBtn.textContent = '🔄 Converter';
            this.hideProgress();
        }
    }

    async convertFile(file) {
        const outputFormat = document.getElementById('outputFormat').value;
        
        try {
            switch (this.currentMode) {
                case 'to-pdf':
                    return await this.convertToPDF(file);
                case 'from-pdf':
                    return await this.convertFromPDF(file, outputFormat);
                case 'image-convert':
                    return await this.convertImage(file, outputFormat);
            }
        } catch (error) {
            console.error(`Erro ao converter ${file.name}:`, error);
            return null;
        }
    }

    async convertToPDF(file) {
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF({
            orientation: document.getElementById('orientation').value,
            unit: 'mm',
            format: document.getElementById('pageFormat').value
        });

        if (file.type.startsWith('image/')) {
            return await this.imageToPDF(file, pdf);
        } else if (file.type === 'text/html' || file.name.endsWith('.html')) {
            return await this.htmlToPDF(file, pdf);
        } else if (file.type === 'text/plain') {
            return await this.textToPDF(file, pdf);
        }

        return null;
    }

    async imageToPDF(file, pdf) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const margin = parseInt(document.getElementById('margin').value);
                    
                    const imgWidth = pdfWidth - (margin * 2);
                    const imgHeight = (img.height * imgWidth) / img.width;
                    
                    pdf.addImage(e.target.result, 'JPEG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - (margin * 2)));
                    
                    const blob = pdf.output('blob');
                    resolve({
                        name: file.name.replace(/\.[^/.]+$/, '.pdf'),
                        blob: blob,
                        type: 'application/pdf'
                    });
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    async textToPDF(file, pdf) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const text = e.target.result;
                const margin = parseInt(document.getElementById('margin').value);
                const lines = pdf.splitTextToSize(text, pdf.internal.pageSize.getWidth() - (margin * 2));
                
                pdf.text(lines, margin, margin + 10);
                
                const blob = pdf.output('blob');
                resolve({
                    name: file.name.replace(/\.[^/.]+$/, '.pdf'),
                    blob: blob,
                    type: 'application/pdf'
                });
            };
            reader.readAsText(file);
        });
    }

    async htmlToPDF(file, pdf) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = e.target.result;
                tempDiv.style.cssText = 'position: fixed; top: -10000px; width: 1200px; background: white;';
                document.body.appendChild(tempDiv);

                try {
                    const canvas = await html2canvas(tempDiv, {
                        scale: parseInt(document.getElementById('quality').value),
                        useCORS: true,
                        backgroundColor: '#ffffff'
                    });

                    const imgData = canvas.toDataURL('image/jpeg', 0.95);
                    const pdfWidth = pdf.internal.pageSize.getWidth();
                    const pdfHeight = pdf.internal.pageSize.getHeight();
                    const margin = parseInt(document.getElementById('margin').value);
                    
                    const imgWidth = pdfWidth - (margin * 2);
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    
                    pdf.addImage(imgData, 'JPEG', margin, margin, imgWidth, Math.min(imgHeight, pdfHeight - (margin * 2)));
                    
                    document.body.removeChild(tempDiv);
                    
                    const blob = pdf.output('blob');
                    resolve({
                        name: file.name.replace(/\.[^/.]+$/, '.pdf'),
                        blob: blob,
                        type: 'application/pdf'
                    });
                } catch (error) {
                    document.body.removeChild(tempDiv);
                    throw error;
                }
            };
            reader.readAsText(file);
        });
    }

    async convertFromPDF(file, outputFormat) {
        // Esta é uma implementação básica - PDFs complexos requerem bibliotecas mais avançadas
        this.updateStatus('Conversão de PDF ainda não implementada completamente', 'error');
        return null;
    }

    async convertImage(file, outputFormat) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    const quality = parseInt(document.getElementById('quality').value) / 3;
                    const mimeType = `image/${outputFormat}`;
                    
                    canvas.toBlob((blob) => {
                        resolve({
                            name: file.name.replace(/\.[^/.]+$/, `.${outputFormat}`),
                            blob: blob,
                            type: mimeType
                        });
                    }, mimeType, quality);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    }

    downloadFile() {
        if (this.convertedFiles.length === 0) return;
        
        const file = this.convertedFiles[0];
        this.triggerDownload(file.name, file.blob);
    }

    downloadAll() {
        if (this.convertedFiles.length <= 1) return;
        
        // Para múltiplos arquivos, criar um ZIP seria ideal
        // Por simplicidade, baixar um por vez
        this.convertedFiles.forEach((file, index) => {
            setTimeout(() => {
                this.triggerDownload(file.name, file.blob);
            }, index * 500);
        });
    }

    triggerDownload(filename, blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    showPreview() {
        // Implementar preview conforme necessário
        this.updateStatus('Preview em desenvolvimento', 'info');
    }

    showProgress(percent) {
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        
        progressBar.style.display = 'block';
        progressFill.style.width = percent + '%';
    }

    hideProgress() {
        const progressBar = document.getElementById('progressBar');
        progressBar.style.display = 'none';
    }

    updateStatus(message, type) {
        const status = document.getElementById('status');
        status.textContent = message;
        status.className = `status ${type}`;
    }
}

// Inicializar quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    window.converter = new UniversalConverter();
});