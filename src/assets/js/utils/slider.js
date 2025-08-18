/**
 * @author Luuxis
 * Luuxis License v1.0 (voir fichier LICENSE pour les détails en FR/EN)/
 */

'use strict';

export default class Slider {
    constructor(id, minValue, maxValue) {
        console.log('Initialisation du Slider avec:', { id, minValue, maxValue });
        
        this.slider = document.querySelector(id);
        if (!this.slider) {
            console.error('Slider element non trouvé pour:', id);
            return;
        }

        this.touchLeft = this.slider.querySelector('.slider-touch-left');
        this.touchRight = this.slider.querySelector('.slider-touch-right');
        this.lineSpan = this.slider.querySelector('.slider-line span');

        if (!this.touchLeft || !this.touchRight || !this.lineSpan) {
            console.error('Éléments du slider manquants');
            return;
        }

        this.min = parseFloat(this.slider.getAttribute('min')) || 0.5;
        this.max = parseFloat(this.slider.getAttribute('max')) || 8;
        this.step = parseFloat(this.slider.getAttribute('step')) || 0.5;

        this.minValue = minValue || this.min;
        this.maxValue = maxValue || this.max;

        this.dragging = false;
        this.currentHandle = null;

        console.log('Valeurs du slider:', {
            min: this.min,
            max: this.max,
            step: this.step,
            minValue: this.minValue,
            maxValue: this.maxValue
        });

        this.init();
    }

    init() {
        // Positionner les poignées initialement
        this.updatePositions();
        
        // Ajouter les événements
        this.touchLeft.addEventListener('mousedown', (e) => this.startDrag(e, 'left'));
        this.touchRight.addEventListener('mousedown', (e) => this.startDrag(e, 'right'));
        
        // Événements globaux
        document.addEventListener('mousemove', (e) => this.drag(e));
        document.addEventListener('mouseup', () => this.stopDrag());
        
        console.log('Slider initialisé');
    }

    updatePositions() {
        const sliderWidth = this.slider.offsetWidth - 48;
        const minRatio = (this.minValue - this.min) / (this.max - this.min);
        const maxRatio = (this.maxValue - this.min) / (this.max - this.min);

        const leftPos = minRatio * sliderWidth;
        const rightPos = maxRatio * sliderWidth;

        this.touchLeft.style.left = leftPos + 'px';
        this.touchRight.style.left = rightPos + 'px';
        this.updateLine();
    }

    startDrag(e, handle) {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('Début drag:', handle);
        
        this.dragging = true;
        this.currentHandle = handle;
        this.startX = e.clientX;
        this.startLeft = handle === 'left' ? 
            parseInt(this.touchLeft.style.left) || 0 : 
            parseInt(this.touchRight.style.left) || 0;
    }

    drag(e) {
        if (!this.dragging || !this.currentHandle) return;

        e.preventDefault();
        
        const deltaX = e.clientX - this.startX;
        const newLeft = this.startLeft + deltaX;
        const sliderWidth = this.slider.offsetWidth - 48;
        
        if (this.currentHandle === 'left') {
            const rightPos = parseInt(this.touchRight.style.left) || 0;
            const maxLeft = rightPos - 24;
            const clampedLeft = Math.max(0, Math.min(newLeft, maxLeft));
            this.touchLeft.style.left = clampedLeft + 'px';
        } else {
            const leftPos = parseInt(this.touchLeft.style.left) || 0;
            const minRight = leftPos + 24;
            const clampedRight = Math.max(minRight, Math.min(newLeft, sliderWidth));
            this.touchRight.style.left = clampedRight + 'px';
        }
        
        this.updateLine();
        this.updateValues();
    }

    stopDrag() {
        if (!this.dragging) return;
        
        console.log('Fin drag');
        this.dragging = false;
        this.currentHandle = null;
    }

    updateLine() {
        const leftPos = parseInt(this.touchLeft.style.left) || 0;
        const rightPos = parseInt(this.touchRight.style.left) || 0;
        
        this.lineSpan.style.marginLeft = leftPos + 'px';
        this.lineSpan.style.width = (rightPos - leftPos) + 'px';
    }

    updateValues() {
        const sliderWidth = this.slider.offsetWidth - 48;
        const leftPos = parseInt(this.touchLeft.style.left) || 0;
        const rightPos = parseInt(this.touchRight.style.left) || 0;
        
        const minRatio = leftPos / sliderWidth;
        const maxRatio = rightPos / sliderWidth;
        
        this.minValue = this.min + (minRatio * (this.max - this.min));
        this.maxValue = this.min + (maxRatio * (this.max - this.min));
        
        // Appliquer le step
        if (this.step > 0) {
            this.minValue = Math.round(this.minValue / this.step) * this.step;
            this.maxValue = Math.round(this.maxValue / this.step) * this.step;
        }
        
        console.log('Nouvelles valeurs:', { min: this.minValue, max: this.maxValue });
        this.emit('change', this.minValue, this.maxValue);
    }

    func = [];

    on(name, func) {
        this.func[name] = func;
    }

    emit(name, ...args) {
        if (this.func[name]) this.func[name](...args);
    }
}