class Renderer {
  constructor(markup, children, options, callback) {
    this.markup = markup;
    this.children = children;
    this.options = options;
    this.callback = callback;
  }

  render2(parentEls) {
    const templateEl = document.createElement('template');
    templateEl.innerHTML = this.markup;
    const nodeEls = [].slice.call(templateEl.content.childNodes);

    if (this.options && this.options.contents) {
      nodeEls.forEach(x => {
        if (x instanceof Element) {
          x.innerHTML = this.options.contents;
        }
      });
    }

    if (this.options && this.options.className) {
      nodeEls.forEach(nodeEl => {
        if (nodeEl instanceof Element) {
          this.options.className.trim().replace(/ +/, ' ').split(' ').forEach(className => {
            nodeEl.classList.add(className);
          });
        }
      });
    }

    if (this.options && this.options.data) {
      nodeEls.forEach(nodeEl => {
        if (nodeEl instanceof Element) {
          for (let attribute in this.options.data) {
            nodeEl.setAttribute('data-' + attribute, this.options.data[attribute]);
          }
        }
      });
    }

    if (this.options && this.options.click) {
      nodeEls.forEach(nodeEl => {
        if (nodeEl instanceof Element) {
          nodeEl.addEventListener('click', this.options.click);
        }
      });
    }

    if (this.children) {
      const containerEl = nodeEls.map((nodeEl) => {
        if (nodeEl instanceof Element) {
          return nodeEl.querySelector('.note-children-container');
        }

        return null;
      }).filter(x => x)[0];

      this.children.forEach((child) => {
        child.render2(containerEl ? [containerEl] : nodeEls);
      });
    }

    if (this.callback) {
      this.callback(nodeEls, this.options);
    }

    if (this.options && this.options.callback2) {
      this.options.callback2(nodeEls);
    }

    if (parentEls) {
      parentEls.forEach((parentEl) => {
        nodeEls.forEach((nodeEl) => parentEl.appendChild(nodeEl));
      });
    }

    return nodeEls[0];
  }
}

export default {
  create: (markup, callback) => {
    return function() {
      const options = typeof arguments[1] === 'object' ? arguments[1] : arguments[0];
      let children = Array.isArray(arguments[0]) ? arguments[0] : [];
      if (options && options.children) {
        children = options.children;
      }
      return new Renderer(markup, children, options, callback);
    };
  },
};
