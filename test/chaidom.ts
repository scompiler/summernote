import env from 'src/js/core/env';

export default function(chai: Chai.ChaiStatic) {
    chai.dom = chai.dom || {};

    chai.dom.equalsIgnoreCase = (str1: string, str2: string) => {
        str1 = str1.toUpperCase();
        str2 = str2.toUpperCase();

        // [workaround] IE8-10 use &nbsp; instead of bogus br
        if (env.isMSIE && env.browserVersion < 11) {
            str2 = str2.replace(/<BR\/?>/g, '&NBSP;');
            str1 = str1.replace(/<BR\/?>/g, '&NBSP;');
        }

        // [workaround] IE8 str1 markup has newline between tags
        if (env.isMSIE && env.browserVersion < 9) {
            str1 = str1.replace(/\r\n/g, '');
        }

        return str1 === str2;
    };

    chai.dom.equalsStyle = (nodeEl: HTMLElement, expected: string, style: string) => {
        const nodeStyle = window.getComputedStyle(nodeEl).getPropertyValue(style);
        const divEl = document.createElement('div');
        divEl.style.setProperty(style, expected);
        const testerStyle = divEl.style.getPropertyValue(style);
        return nodeStyle === testerStyle;
    };

    chai.Assertion.addChainableMethod('await', (done) => {
        try {
            setTimeout(() => { done(); }, 10);
        } catch (e) {
            done(e);
        }
    });

    chai.Assertion.addChainableMethod('equalsIgnoreCase', function(expected: string) {
        const actual = this._obj;

        return this.assert(
            chai.dom.equalsIgnoreCase(actual, expected),
            'expected ' + this._obj + ' to equal ' + expected + ' ignoring case',
            'expected ' + this._obj + ' not to equal ' + expected + ' ignoring case',
            expected,
        );
    });

    chai.Assertion.addChainableMethod('equalsStyle', function(expected: string, style: string) {
        const nodeEl = this._obj as HTMLElement;

        return this.assert(
            chai.dom.equalsStyle(nodeEl, expected, style),
            'expected ' + nodeEl.style.getPropertyValue(style) + ' to equal ' + expected + ' style',
            'expected ' + nodeEl.style.getPropertyValue(style) + ' not to equal ' + expected + ' style',
            expected
        );
    });

    chai.assert.equalsIgnoreCase = (val: any, exp: string, msg: string) => {
        new chai.Assertion(val, msg).to.be.equalsIgnoreCase(exp);
    };

    chai.assert.notequalsIgnoreCase = (val: any, exp: string, msg: string) => {
        new chai.Assertion(val, msg).to.not.be.equalsIgnoreCase(exp);
    };
}
