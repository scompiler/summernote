import func from "src/js/core/func";

interface TooltipUIOptions {
    container?: string;
    trigger?: string;
    target?: string;
    title?: string;
    placement?: string;
}

class TooltipUI {
    nodeEl: HTMLElement;

    tooltipEl: HTMLElement;

    tooltipContentEl: HTMLElement;

    options: TooltipUIOptions;

    constructor(nodeEl: HTMLElement, options: TooltipUIOptions) {
        this.nodeEl = nodeEl;

        this.options = Object.assign({}, {
            title: '',
            target: options.container,
            trigger: 'hover focus',
            placement: 'bottom',
        }, options);

        // create tooltip node
        this.tooltipEl = func.makeElement([
            '<div class="note-tooltip">',
            '<div class="note-tooltip-arrow"></div>',
            '<div class="note-tooltip-content"></div>',
            '</div>',
        ].join(''));
        this.tooltipContentEl = this.tooltipEl.querySelector('.note-tooltip-content');

        // define event
        if (this.options.trigger !== 'manual') {
            const showCallback = this.show.bind(this);
            const hideCallback = this.hide.bind(this);
            const toggleCallback = this.toggle.bind(this);

            this.options.trigger.split(' ').forEach((eventName) => {
                if (eventName === 'hover') {
                    this.nodeEl.addEventListener('mouseenter', showCallback);
                    this.nodeEl.addEventListener('mouseleave', hideCallback);
                } else if (eventName === 'click') {
                    this.nodeEl.addEventListener('click', toggleCallback);
                } else if (eventName === 'focus') {
                    this.nodeEl.addEventListener('focus', showCallback);
                    this.nodeEl.addEventListener('blur', hideCallback);
                }
            });
        }
    }

    show() {
        const target = typeof this.options.target === 'string' ? document.querySelector(this.options.target) : this.options.target;

        const offset = func.getElementOffset(this.nodeEl);
        const targetOffset = func.getElementOffset(target);
        offset.top -= targetOffset.top;
        offset.left -= targetOffset.left;

        const title = this.options.title || this.nodeEl.getAttribute('title') || this.nodeEl.getAttribute('data-title');
        const placement = this.options.placement || this.nodeEl.getAttribute('data-placement');

        this.tooltipEl.classList.add(placement);
        this.tooltipContentEl.textContent = title;
        target.appendChild(this.tooltipEl);

        const nodeWidth = this.nodeEl.offsetWidth;
        const nodeHeight = this.nodeEl.offsetHeight;
        const tooltipWidth = this.tooltipEl.offsetWidth;
        const tooltipHeight = this.tooltipEl.offsetHeight;

        if (placement === 'bottom') {
            this.tooltipEl.style.top = (offset.top + nodeHeight) + 'px';
            this.tooltipEl.style.left = (offset.left + (nodeWidth / 2 - tooltipWidth / 2)) + 'px';
        } else if (placement === 'top') {
            this.tooltipEl.style.top = (offset.top - tooltipHeight) + 'px';
            this.tooltipEl.style.left = (offset.left + (nodeWidth / 2 - tooltipWidth / 2)) + 'px';
        } else if (placement === 'left') {
            this.tooltipEl.style.top = (offset.top + (nodeHeight / 2 - tooltipHeight / 2)) + 'px';
            this.tooltipEl.style.left = (offset.left - tooltipWidth) + 'px';
        } else if (placement === 'right') {
            this.tooltipEl.style.top = (offset.top + (nodeHeight / 2 - tooltipHeight / 2)) + 'px';
            this.tooltipEl.style.left = (offset.left + nodeWidth) + 'px';
        }

        this.tooltipEl.classList.add('in');
    }

    hide() {
        this.tooltipEl.classList.remove('in');

        setTimeout(() => {
            this.tooltipEl.remove();
        }, 200);
    }

    toggle() {
        if (this.tooltipEl.classList.contains('in')) {
            this.hide();
        } else {
            this.show();
        }
    }
}

export default TooltipUI;
