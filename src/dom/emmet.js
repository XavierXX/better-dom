import { StaticMethodError } from "../errors";
import { DOM } from "../types";

/* es6-transpiler has-iterators:false, has-generators: false */

var // operator type / priority object
    operators = {"(": 1,")": 2,"^": 3,">": 4,"+": 4,"*": 5,"`": 6,"]": 5,"[": 6,".": 7,"#": 8},
    reAttr = /([\w\-]+)(?:=((?:`((?:\\?.)*)?`)|[^\s]+))?/g,
    reIndex = /(\$+)(?:@(-)?(\d+)?)?/g,
    // populate empty tags
    tagCache = "area base br col hr img input link meta param command keygen source".split(" ").reduce((tagCache, tag) => {
        tagCache[tag] = "<" + tag + ">";

        return tagCache;
    }, {}),
    normalizeAttrs = (_, name, value, singleValue) => {
        var quotes = value && value.indexOf("\"") >= 0 ? "'" : "\"";
        // always wrap attribute values with quotes if they don't exist
        // replace ` quotes with " except when it's a single quotes case
        return name + "=" + quotes + (singleValue || value || name) + quotes;
    },
    injectTerm = (term, append) => (el) => {
        var index = append ? el.lastIndexOf("<") : el.indexOf(">");
        // inject term into the html string
        return el.substr(0, index) + term + el.substr(index);
    },
    makeTerm = (tag) => {
        var result = tagCache[tag];

        if (!result) result = tagCache[tag] = "<" + tag + "></" + tag + ">";

        return result;
    },
    makeIndexedTerm = (n, term) => {
        var result = [], i;

        for (i = 0; i < n; ++i) {
            result.push(term.replace(reIndex, (expr, fmt, sign, base) => {
                var index = (sign ? n - i - 1 : i) + (base ? +base : 1);
                // handle zero-padded strings
                return (fmt + index).slice(-fmt.length).split("$").join("0");
            }));
        }

        return result;
    };

/**
 * Parse emmet-like template and return resulting HTML string
 * @memberof DOM
 * @alias DOM.emmet
 * @param  {String}       template  input EmmetString
 * @param  {Object|Array} [varMap]  key/value map of variables
 * @return {String} a resulting HTML string
 * @see https://github.com/chemerisuk/better-dom/wiki/Microtemplating
 * @see http://docs.emmet.io/cheat-sheet/
 * @example
 * DOM.emmet("a");                                 // => "<a></a>"
 * DOM.emmet("ul>li*2");                           // => "<ul><li></li><li></li></ul>"
 * DOM.emmet("b>`hello {user}`", {user: "world"}); // => "<b>hello world</b>
 * DOM.emmet("i.{0}+span", ["icon"]);              // => <i class="icon"></i&gt<span></span>;
 */
DOM.emmet = function(template, varMap) {
    if (typeof template !== "string") throw new StaticMethodError("emmet");

    if (!template) return template;
    // handle varMap
    if (varMap) template = DOM.format(template, varMap);

    var stack = [],
        output = [],
        term = "",
        skip;

    if (template in tagCache) return tagCache[template];

    // parse expression into RPN

    for (let str of template) {
        // concat .c1.c2 into single space separated class string
        if (str === "." && stack[0] === ".") str = " ";

        let priority = operators[str];

        if (priority && (!skip || skip === str)) {
            // remove redundat ^ operators from the stack when more than one exists
            if (str === "^" && stack[0] === "^") stack.shift();

            if (term) {
                output.push(term);
                term = "";
            } else if (str === skip) {
                // process empty `...` and [...] sections
                if (str === "`") {
                    // for `` add dummy term into the output
                    output.push("");
                } else {
                    // for [] simply remove it from the stack
                    stack.shift();
                }
            }

            if (str !== "(") {
                while (operators[stack[0]] > priority) {
                    output.push(stack.shift());
                    // for ^ operator stop shifting when the first > is found
                    if (str === "^" && output[output.length - 1] === ">") break;
                }
            }

            if (str === ")") {
                stack.shift(); // remove "(" symbol from stack
            } else if (!skip) {
                stack.unshift(str);

                if (str === "[") skip = "]";
                if (str === "`") skip = "`";
            } else {
                skip = false;
            }
        } else {
            term += str;
        }
    }

    if (term) output.push(term);

    output = output.concat(stack);

    // handle single tag case
    if (output.length === 1) return makeTerm(output[0]);

    // transform RPN into html nodes

    stack = [];

    for (let str of output) {
        if (str in operators) {
            let term = stack.shift();
            let node = stack.shift();

            if (typeof node === "string") node = [ makeTerm(node) ];

            switch(str) {
            case ".":
                term = injectTerm(" class=\"" + term + "\"");
                break;

            case "#":
                term = injectTerm(" id=\"" + term + "\"");
                break;

            case "[":
                term = injectTerm(" " + term.replace(reAttr, normalizeAttrs));
                break;

            case "`":
                stack.unshift(node);
                node = [ term ];
                break;

            case "*":
                node = makeIndexedTerm(+term, node.join(""));
                break;

            default:
                term = typeof term === "string" ? makeTerm(term) : term.join("");

                if (str === ">") {
                    term = injectTerm(term, true);
                } else {
                    node.push(term);
                }
            }

            str = typeof term === "function" ? node.map(term) : node;
        }

        stack.unshift(str);
    }

    output = stack[0].join("");
    // cache static string results
    if (varMap) tagCache[template] = output;

    return output;
};
