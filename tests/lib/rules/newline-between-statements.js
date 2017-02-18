/**
 * @fileoverview Tests for newline-between-statements rule.
 * @author Toru Nagashima
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const rule = require("../../../lib/rules/newline-between-statements");
const RuleTester = require("../../../lib/testers/rule-tester");

//------------------------------------------------------------------------------
// Tests
//------------------------------------------------------------------------------

const ruleTester = new RuleTester();

ruleTester.run("newline-between-statements", rule, {
    valid: [

        // do nothing if no options.
        "'use strict'; foo(); if (a) { bar(); }",

        // do nothing for single statement.
        {
            code: "foo()",
            options: [[
                ["never", "*", "*"]
            ]]
        },
        {
            code: "foo()",
            options: [[
                ["always", "*", "*"]
            ]]
        },
        {
            code: "foo()",
            options: [[
                ["blankline", "*", "*"]
            ]]
        },

        //----------------------------------------------------------------------
        // wildcard
        //----------------------------------------------------------------------

        {
            code: "foo(); bar();",
            options: [[
                ["never", "*", "*"]
            ]]
        },
        {
            code: "foo();\nbar();",
            options: [[
                ["always", "*", "*"]
            ]]
        },
        {
            code: "foo();\n\nbar();",
            options: [[
                ["blankline", "*", "*"]
            ]]
        },
        {
            code: "foo();\n\n//comment\nbar();",
            options: [[
                ["blankline", "*", "*"]
            ]]
        },

        //----------------------------------------------------------------------
        // block-like
        //----------------------------------------------------------------------

        {
            code: "foo();\n{ foo() }\nfoo();",
            options: [[
                ["never", "block-like", "block-like"]
            ]]
        },
        {
            code: "{ foo() } { foo() }",
            options: [[
                ["never", "block-like", "block-like"]
            ]]
        },
        {
            code: "{ foo() }\n{ foo() }",
            options: [[
                ["always", "block-like", "block-like"]
            ]]
        },
        {
            code: "{ foo() }\n\n{ foo() }",
            options: [[
                ["blankline", "block-like", "block-like"]
            ]]
        },
        {
            code: "{ foo() }\n\n//comment\n{ foo() }",
            options: [[
                ["blankline", "block-like", "block-like"]
            ]]
        }
    ],
    invalid: [

        //----------------------------------------------------------------------
        // wildcard
        //----------------------------------------------------------------------

        {
            code: "foo();\nfoo();",
            output: "foo();foo();",
            options: [[
                ["never", "*", "*"]
            ]],
            errors: ["Unexpected linebreaks before this statement."]
        },
        {
            code: "foo();//comment\nfoo();",
            output: "foo();//comment\nfoo();", // not fixed.
            options: [[
                ["never", "*", "*"]
            ]],
            errors: ["Unexpected linebreaks before this statement."]
        },
        {
            code: "if (a) {}\nfor (;;) {}",
            output: "if (a) {}for (;;) {}",
            options: [[
                ["never", "*", "*"]
            ]],
            errors: ["Unexpected linebreaks before this statement."]
        },
        {
            code: "foo();foo();",
            output: "foo();\nfoo();",
            options: [[
                ["always", "*", "*"]
            ]],
            errors: ["Expected one or more linebreaks before this statement."]
        },
        {
            code: "function a() {} do {} while (a)",
            output: "function a() {}\n do {} while (a)",
            options: [[
                ["always", "*", "*"]
            ]],
            errors: ["Expected one or more linebreaks before this statement."]
        },
        {
            code: "foo();foo();",
            output: "foo();\n\nfoo();",
            options: [[
                ["blankline", "*", "*"]
            ]],
            errors: ["Expected one or more blank lines before this statement."]
        }

    ]
});
