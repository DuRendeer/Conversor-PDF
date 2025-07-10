// converter-script.js - Conversor HTML para PDF
class HTMLtoPDFConverter {
    constructor() {
        this.htmlContent = null;
        this.slides = [];
        this.currentSlide = 0;
        this.pdfDoc = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.updateStatus('Pronto para converter! Carregue um arquivo HTML.', 'info');
    }

    setupEventListeners() {
        // Upload área
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');

        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // Botões
        document.getElementById('previewBtn').addEventListener('click', this.showPreview.bind(this));
        document.getElementById('convertBtn').addEventListener('click', this.convertToPDF.bind(this));
        document.getElementById('downloadBtn').addEventListener('click', this.downloadPDF.bind(this));
        document.getElementById('prevSlide').addEventListener('click', this.prevSlide.bind(this));
        document.getElementById('nextSlide').addEventListener('click', this.nextSlide.bind(this));
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
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    async processFile(file) {
        if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
            this.updateStatus('Por favor, selecione um arquivo HTML válido.', 'error');
            return;
        }

        this.updateStatus('Carregando arquivo...', 'info');
        
        try {
            const text = await file.text();
            this.htmlContent = text;
            this.extractSlides();
            
            document.getElementById('previewBtn').disabled = false;
            document.getElementById('convertBtn').disabled = false;
            
            // Auto-preencher título se não estiver definido
            const titleInput = document.getElementById('title');
            if (!titleInput.value) {
                const titleMatch = text.match(/<title>(.*?)<\/title>/i);
                if (titleMatch) {
                    titleInput.value = titleMatch[1];
                }
            }
            
            this.updateStatus(`✅ Arquivo carregado! ${this.slides.length} slides detectados.`, 'success');
        } catch (error) {
            this.updateStatus('Erro ao carregar o arquivo: ' + error.message, 'error');
        }
    }

    extractSlides() {
        // Criar um parser DOM temporário
        const parser = new DOMParser();
        const doc = parser.parseFromString(this.htmlContent, 'text/html');
        
        // Procurar por slides (assumindo que slides têm a classe 'slide')
        const slideElements = doc.querySelectorAll('.slide');
        
        this.slides = Array.from(slideElements).map((slide, index) => {
            // Criar uma versão standalone do slide
            const slideHTML = this.createStandaloneSlide(slide, doc, index);
            return {
                index: index,
                element: slide,
                html: slideHTML,
                title: this.extractSlideTitle(slide) || `Slide ${index + 1}`
            };
        });
    }

    createStandaloneSlide(slideElement, originalDoc, index) {
        // Extrair estilos CSS
        const styles = Array.from(originalDoc.querySelectorAll('style, link[rel="stylesheet"]'))
            .map(el => el.outerHTML)
            .join('\n');

        // Clonar o slide e remover a classe 'active' de outros slides
        const clonedSlide = slideElement.cloneNode(true);
        clonedSlide.classList.add('active');
        
        // Criar HTML completo para o slide
        return `
        <!DOCTYPE html>
        <html lang="pt-BR">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Slide ${index + 1}</title>
            ${styles}
            <style>
                body { 
                    margin: 0; 
                    padding: 20px; 
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
                    font-family: Arial, sans-serif;
                    overflow: hidden;
                }
                .slide { 
                    display: block !important; 
                    width: 100%;
                    max-width: none;
                    height: auto;
                    min-height: 80vh;
                }
                .stars, .little-prince, .navigation, .slide-counter, .school-logo {
                    display: none !important;
                }
                video {
                    background: #333;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                video::before {
                    content: "🎬 Vídeo";
                    color: white;
                    font-size: 24px;
                }
            </style>
        </head>
        <body>
            ${clonedSlide.outerHTML}
        </body>
        </html>`;
    }

    extractSlideTitle(slideElement) {
        const h1 = slideElement.querySelector('h1');
        const h2 = slideElement.querySelector('h2');
        const title = h1 || h2;
        return title ? title.textContent.trim() : null;
    }

    showPreview() {
        if (this.slides.length === 0) return;

        const previewArea = document.getElementById('previewArea');
        const slideContainer = document.getElementById('slideContainer');
        
        previewArea.style.display = 'block';
        this.currentSlide = 0;
        this.renderPreviewSlide();
    }

    renderPreviewSlide() {
        const slideContainer = document.getElementById('slideContainer');
        const slideCounter = document.getElementById('slideCounter');
        
        slideCounter.textContent = `Slide ${this.currentSlide + 1} de ${this.slides.length}: ${this.slides[this.currentSlide].title}`;
        
        // Criar iframe para mostrar o slide
        slideContainer.innerHTML = `
            <iframe 
                src="data:text/html;charset=utf-8,${encodeURIComponent(this.slides[this.currentSlide].html)}"
                style="width: 100%; height: 500px; border: none; border-radius: 10px;"
            ></iframe>
        `;
    }

    prevSlide() {
        if (this.currentSlide > 0) {
            this.currentSlide--;
            this.renderPreviewSlide();
        }
    }

    nextSlide() {
        if (this.currentSlide < this.slides.length - 1) {
            this.currentSlide++;
            this.renderPreviewSlide();
        }
    }

    async convertToPDF() {
        if (this.slides.length === 0) {
            this.updateStatus('Nenhum slide encontrado para converter.', 'error');
            return;
        }

        this.updateStatus('Iniciando conversão...', 'info');
        this.showProgress(0);

        try {
            const { jsPDF } = window.jspdf;
            
            // Configurações
            const format = document.getElementById('pageFormat').value;
            const orientation = document.getElementById('orientation').value;
            const quality = parseInt(document.getElementById('quality').value);
            const margin = parseInt(document.getElementById('margin').value);
            const title = document.getElementById('title').value || 'Apresentação';
            const author = document.getElementById('author').value || '';

            // Criar PDF
            this.pdfDoc = new jsPDF({
                orientation: orientation,
                unit: 'mm',
                format: format
            });

            // Metadados
            this.pdfDoc.setProperties({
                title: title,
                author: author,
                creator: 'HTML to PDF Converter',
                producer: 'jsPDF'
            });

            // Converter cada slide
            for (let i = 0; i < this.slides.length; i++) {
                await this.convertSlide(i, quality, margin);
                this.showProgress((i + 1) / this.slides.length * 100);
                
                // Pequena pausa para não travar o navegador
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            document.getElementById('downloadBtn').disabled = false;
            this.updateStatus(`✅ PDF gerado com sucesso! ${this.slides.length} slides convertidos.`, 'success');
            this.hideProgress();

        } catch (error) {
            this.updateStatus('Erro na conversão: ' + error.message, 'error');
            this.hideProgress();
        }
    }

    async convertSlide(slideIndex, quality, margin) {
        return new Promise((resolve, reject) => {
            // Criar elemento temporário para renderizar o slide
            const tempDiv = document.createElement('div');
            tempDiv.style.cssText = `
                position: fixed;
                top: -10000px;
                left: -10000px;
                width: 1200px;
                height: 800px;
                background: white;
                z-index: -1000;
            `;
            
            // Inserir o HTML do slide
            tempDiv.innerHTML = this.slides[slideIndex].html;
            document.body.appendChild(tempDiv);

            // Aguardar um momento para renderização
            setTimeout(() => {
                html2canvas(tempDiv, {
                    scale: quality,
                    useCORS: true,
                    allowTaint: true,
                    backgroundColor: '#1a1a2e',
                    width: 1200,
                    height: 800
                }).then(canvas => {
                    // Adicionar nova página se não for o primeiro slide
                    if (slideIndex > 0) {
                        this.pdfDoc.addPage();
                    }

                    // Calcular dimensões
                    const pdfWidth = this.pdfDoc.internal.pageSize.getWidth();
                    const pdfHeight = this.pdfDoc.internal.pageSize.getHeight();
                    const imgWidth = pdfWidth - (margin * 2);
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;

                    // Adicionar imagem ao PDF
                    this.pdfDoc.addImage(
                        canvas.toDataURL('image/jpeg', 0.95),
                        'JPEG',
                        margin,
                        margin,
                        imgWidth,
                        Math.min(imgHeight, pdfHeight - (margin * 2))
                    );

                    // Limpar elemento temporário
                    document.body.removeChild(tempDiv);
                    resolve();
                }).catch(error => {
                    document.body.removeChild(tempDiv);
                    reject(error);
                });
            }, 500);
        });
    }

    downloadPDF() {
        if (!this.pdfDoc) {
            this.updateStatus('Nenhum PDF foi gerado ainda.', 'error');
            return;
        }

        const title = document.getElementById('title').value || 'apresentacao';
        const filename = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        
        this.pdfDoc.save(filename);
        this.updateStatus('✅ PDF baixado com sucesso!', 'success');
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
    new HTMLtoPDFConverter();
});