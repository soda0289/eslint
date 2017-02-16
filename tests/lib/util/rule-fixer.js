/**
 * @fileoverview Tests for rule fixer.
 * @author Nicholas C. Zakas
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const assert = require("chai").assert,
    espree = require("espree"),
    SourceCode = require("../../../lib/util/source-code"),
    RuleFixer = require("../../../lib/util/rule-fixer");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const DEFAULT_CONFIG = {
    ecmaVersion: 6,
    comment: true,
    tokens: true,
    range: true,
    loc: true
};
const TEXT = "let foo = bar;";
const AST = espree.parse(TEXT, DEFAULT_CONFIG);
const SOURCE_CODE = new SourceCode(TEXT, AST);

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

describe("RuleFixer", () => {
    const ruleFixer = new RuleFixer(SOURCE_CODE);

    describe("insertTextBefore", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.insertTextBefore({ range: [0, 1] }, "Hi");

            assert.deepEqual(result, {
                range: [0, 0],
                text: "Hi"
            });

        });

    });

    describe("insertTextBeforeRange", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.insertTextBeforeRange([0, 1], "Hi");

            assert.deepEqual(result, {
                range: [0, 0],
                text: "Hi"
            });

        });

    });

    describe("insertTextAfter", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.insertTextAfter({ range: [0, 1] }, "Hi");

            assert.deepEqual(result, {
                range: [1, 1],
                text: "Hi"
            });

        });

    });

    describe("insertTextAfterRange", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.insertTextAfterRange([0, 1], "Hi");

            assert.deepEqual(result, {
                range: [1, 1],
                text: "Hi"
            });

        });

    });

    describe("removeAfter", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.remove({ range: [0, 1] });

            assert.deepEqual(result, {
                range: [0, 1],
                text: ""
            });

        });

    });

    describe("removeAfterRange", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.removeRange([0, 1]);

            assert.deepEqual(result, {
                range: [0, 1],
                text: ""
            });

        });

    });


    describe("replaceText", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.replaceText({ range: [0, 1] }, "Hi");

            assert.deepEqual(result, {
                range: [0, 1],
                text: "Hi"
            });

        });

    });

    describe("replaceTextRange", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.replaceTextRange([0, 1], "Hi");

            assert.deepEqual(result, {
                range: [0, 1],
                text: "Hi"
            });

        });

    });

    describe("keep", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.keep(AST.tokens[1]);

            assert.deepEqual(result, {
                range: [4, 7],
                text: "foo"
            });

        });

    });

    describe("keepRange", () => {

        it("should return an object with the correct information when called", () => {

            const result = ruleFixer.keepRange([0, 7]);

            assert.deepEqual(result, {
                range: [0, 7],
                text: "let foo"
            });

        });

    });

});
