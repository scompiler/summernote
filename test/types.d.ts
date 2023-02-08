declare namespace Chai {
    interface ChaiStatic {
        dom: {
            equalsIgnoreCase?: (str1: string, str2: string) => boolean;
            equalsStyle?: ($node: JQuery, expected: string, style: string) => boolean;
        };
    }
    interface Assertion {
        equalsIgnoreCase: (expected: string) => void;
    }
    interface AssertStatic {
        equalsIgnoreCase: (val: any, exp: string, msg: string) => void;
        notequalsIgnoreCase: (val: any, exp: string, msg: string) => void;
    }
}
