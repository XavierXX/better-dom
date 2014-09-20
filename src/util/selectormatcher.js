import { HTML } from "../const";

/*
 * Helper for css selectors
 */

/*es6-transpiler has-iterators:false, has-generators: false*/
var rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\[([\w\-\=]+)\])?(?:\.([\w\-]+))?$/,
    propName = "m oM msM mozM webkitM".split(" ").reduce((result, prefix) => {
            var propertyName = prefix + "atchesSelector";

            return result || HTML[propertyName] && propertyName;
        }, null);
// Quick matching inspired by jQuery
export default function(selector, context) {
    if (typeof selector !== "string") return null;

    var quick = rquickIs.exec(selector);

    if (quick) {
        //   0  1    2   3          4
        // [ _, tag, id, attribute, class ]
        if (quick[1]) quick[1] = quick[1].toLowerCase();
        if (quick[3]) quick[3] = quick[3].split("=");
        if (quick[4]) quick[4] = " " + quick[4] + " ";
    }

    return function(node) {
        var result, found;

        if (!quick && !propName) {
            found = (context || document).querySelectorAll(selector);
        }

        for (; node && node.nodeType === 1; node = node.parentNode) {
            if (quick) {
                result = (
                    (!quick[1] || node.nodeName.toLowerCase() === quick[1]) &&
                    (!quick[2] || node.id === quick[2]) &&
                    (!quick[3] || (quick[3][1] ? node.getAttribute(quick[3][0]) === quick[3][1] : node.hasAttribute(quick[3][0]))) &&
                    (!quick[4] || (" " + node.className + " ").indexOf(quick[4]) >= 0)
                );
            } else {
                if (propName) {
                    result = node[propName](selector);
                } else {
                    for (let n of found) {
                        if (n === node) return n;
                    }
                }
            }

            if (result || !context || node === context) break;
        }

        return result && node;
    };
}
