declare namespace Chai {
    interface ChaiStatic {
        dom: {
            equalsIgnoreCase?: (str1: string, str2: string) => boolean;
            equalsStyle?: ($node: JQuery, expected: string, style: string) => boolean;
        };
    }
    interface Assertion {
        await: (done: DoneFn) => Chai.Assertion;
        equalsIgnoreCase: (expected: string) => void;
        equalsStyle: (expected: string, style: string) => void;
    }
    interface AssertStatic {
        equalsIgnoreCase: (val: any, exp: string, msg: string) => void;
        notequalsIgnoreCase: (val: any, exp: string, msg: string) => void;
    }
}
