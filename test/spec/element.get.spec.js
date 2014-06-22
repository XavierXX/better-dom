describe("get", function() {
    "use strict";

    var link, input, textarea, form;

    beforeEach(function() {
        jasmine.sandbox.set("<a id='test' href='test.html' data-attr='val'>get-test</a><form id='get_form' method='post'><input type='email' id='get_input' value='test'/><textarea id='get_textarea'></textarea></form>");

        link = DOM.find("#test");
        input = DOM.find("#get_input");
        textarea = DOM.find("#get_textarea");
        form = DOM.find("#get_form");
    });

    it("should read an attribute value(s)", function() {
        expect(link.get("id")).toBe("test");
        expect(link.get("data-attr")).toBe("val");
        expect(link.get("tagName")).toBe("A");

        expect(link.get(["id", "data-attr", "tagName"])).toEqual({
            id: "test",
            "data-attr": "val",
            "tagName": "A"
        });

        expect(input.get("type")).toBe("email");
        expect(textarea.get("type")).toBe("textarea");
    });

    it("should try to read property value first", function() {
        expect(link.get("href")).not.toBe("test.html");
        expect(input.get("tabIndex")).toBe(0);
        expect(input.get("form").nodeType).toBe(1);
    });

    it("could absent any parameter", function() {
        expect(link.get()).toBe("get-test");
        expect(input.get()).toBe("test");
        expect(textarea.get()).toBe("");
        textarea.set("value", "123");
        expect(textarea.get()).toBe("123");
    });

    it("should handle select value correctly", function() {
        var select = DOM.create("<select><option>a2</option><option>a3</option></select>");
        expect(select.get()).toBe("a2");

        select = DOM.create("<select><option>a2</option><option selected>a3</option></select>");
        expect(select.get()).toBe("a3");

        select.set("selectedIndex", -1);
        expect(select.get()).toBe("");
    });

    it("should handle option value correctly", function() {
        var select = DOM.create("<select><option value='a1'>a2</option><option selected>a3</option></select>");
        expect(select.child(0).get()).toBe("a1");
        expect(select.child(1).get()).toBe("a3");
    });

    it("should throw error if argument is invalid", function() {
        expect(function() { link.get(1); }).toThrow();
        expect(function() { link.get(true); }).toThrow();
        expect(function() { link.get({}); }).toThrow();
        expect(function() { link.get(function() {}); }).toThrow();
    });

    it("should polyfill textContent", function() {
        expect(link.get("textContent")).toBe("get-test");
        expect(form.get("textContent")).toBe("");
    });

    it("should return null if attribute doesn't exist", function() {
        expect(link.get("xxx")).toBeNull();
        expect(link.get("data-test")).toBeNull();
    });

    describe("private props", function() {
        beforeEach(function() {
            input = DOM.create("input[data-a1=x data-a2='{\"a\":\"b\",\"c\":1,\"d\":null}' data-a3=1=2=3 data-a4=/url?q=:q]");
        });

        it("should read an appropriate data-* attribute if it exists", function() {
            expect(input.get("-a1")).toEqual("x");
            expect(input.get("-a2")).toEqual({ a: "b", c: 1, d: null });
            expect(input.get("-a3")).toBe("1=2=3");
            expect(input.get("-a4")).toBe("/url?q=:q");
            expect(input.get("-a5")).toBeNull();
        });
    });

    describe("style", function() {
        var links;

        beforeEach(function() {
            jasmine.sandbox.set("<a id='test0' style='z-index:2;line-height:2;color:red;padding:5px;margin:2px;border:1px solid;float:left;display:block;width:100px'>test</a><a id='test1' style='line-height:2;color:red;padding:5px;margin:2px;border:1px solid;float:left;display:block;width:100px'>test</a>");

            link = DOM.find("#test0");
            links = DOM.findAll("#test0, #test1");
        });

        it("should read style property", function() {
            expect(link.get("color")).toBe("red");
        });

        it("should read properties by dash-separated key", function() {
            expect(link.get("line-height")).toBe("2");
        });

        it("should handle vendor-prefixed properties", function() {
            // TODO
        });

        it("should handle composite properties", function() {
            expect(link.get("padding")).toBe("5px 5px 5px 5px");
            expect(link.get("margin")).toBe("2px 2px 2px 2px");
            expect(link.get("border-width")).toBe("1px 1px 1px 1px");
            expect(link.get("border-style")).toBe("solid solid solid solid");
        });

        it("should read runtime style property if style doesn't contain any value", function() {
            expect(link.get("font-size")).toBeTruthy();
        });

        it("should fix float property name", function() {
            expect(link.get("float")).toBe("left");
        });

        it("should support array", function() {
            expect(link.get(["float","line-height"])).toEqual({"float": "left", "line-height": "2"});
        });
    });

});