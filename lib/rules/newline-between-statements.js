/**
 * @fileoverview Rule to require or disallow newlines between statements
 * @author Toru Nagashima
 */

"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

const astUtils = require("../ast-utils");

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

const COMMENT_ONLY = { includeComments: true, filter: astUtils.isCommentToken };

/**
 * Creates tester which check if a node starts with specific keyword.
 *
 * @param {string} keyword The keyword to test.
 * @returns {Object} the created tester.
 */
function newKeywordTester(keyword) {
    return {
        test(node, sourceCode) {
            const token = sourceCode.getFirstToken(node);

            return token.type === "Keyword" && token.value === keyword;
        }
    };
}

/**
 * Creates tester which check if a node is specific type.
 *
 * @param {string} type The node type to test.
 * @returns {Object} the created tester.
 */
function newNodeTypeTester(type) {
    return {
        test(node) {
            return node.type === type;
        }
    };
}

/**
 * Gets the actual last token.
 *
 * If a semicolon is semicolon-less style's semicolon, this ignores it.
 * For example:
 *
 *     foo()
 *     ;[1, 2, 3].forEach(bar)
 *
 * @param {SourceCode} sourceCode The source code to get tokens.
 * @param {ASTNode} node The node to get.
 * @returns {Token} The actual last token.
 */
function getActualLastToken(sourceCode, node) {
    const token = sourceCode.getLastToken(node);
    const prevToken = sourceCode.getTokenBefore(token);
    const nextToken = sourceCode.getTokenAfter(token);
    const isSemicolonLessStyle = Boolean(
        prevToken &&
        nextToken &&
        astUtils.isSemicolonToken(token) &&
        token.loc.start.line !== prevToken.loc.end.line &&
        token.loc.end.line === nextToken.loc.start.line
    );

    return isSemicolonLessStyle ? prevToken : token;
}

// The types of line breaks.
const NewlineTypes = {
    any: {
        message: "",
        test: () => true,
        fix: () => null
    },

    never: {
        message: "Unexpected linebreaks before this statement.",
        test: linebreaks => linebreaks === 0,
        fix: (previous, current, sourceCode, fixer) => {
            const commentsExist = sourceCode.getFirstTokenBetween(previous, current, COMMENT_ONLY);

            if (commentsExist) {
                return null;
            }
            return fixer.removeRange([previous.range[1], current.range[0]]);
        }
    },

    always: {
        message: "Expected one or more linebreaks before this statement.",
        test: linebreaks => linebreaks >= 1,
        fix: (previous, current, sourceCode, fixer) =>
            fixer.insertTextAfter(previous, "\n")
    },

    blankline: {
        message: "Expected one or more blank lines before this statement.",
        test: linebreaks => linebreaks >= 2,
        fix: (previous, current, sourceCode, fixer) => {
            const prevToken = getActualLastToken(sourceCode, previous);
            const nextToken = sourceCode.getTokenAfter(prevToken);
            const linebreaks =
                (prevToken.loc.end.line === nextToken.loc.start.line)
                    ? "\n\n"
                    : "\n";

            return fixer.insertTextAfter(prevToken, linebreaks);
        }
    }
};

// The types of statements.
const StatementTypes = {
    "*": { test: () => true },
    "block-like": {
        test(node, sourceCode) {
            const lastToken =
                sourceCode.getLastToken(node, astUtils.isNotSemicolonToken);
            const belongingNode = astUtils.isClosingBraceToken(lastToken)
                ? sourceCode.getNodeByRangeIndex(lastToken.range[0])
                : null;

            return Boolean(belongingNode && (
                belongingNode.type === "BlockStatement" ||
                belongingNode.type === "SwitchStatement" ||
                belongingNode.type === "ClassBody"
            ));
        }
    },
    "multiline-block-like": {
        test: (node, sourceCode) =>
            node.loc.start.line !== node.loc.end.line &&
            StatementTypes["block-like"].test(node, sourceCode)
    },
    directive: {
        test: node =>
            node.type === "ExpressionStatement" &&
            node.expression === "Literal" &&
            typeof node.expression.value === "string"
    },
    block: newNodeTypeTester("BlockStatement"),
    empty: newNodeTypeTester("EmptyStatement"),
    expression: newNodeTypeTester("ExpressionStatement"),
    break: newKeywordTester("break"),
    class: newKeywordTester("class"),
    const: newKeywordTester("const"),
    continue: newKeywordTester("continue"),
    debugger: newKeywordTester("debugger"),
    do: newKeywordTester("do"),
    export: newKeywordTester("export"),
    for: newKeywordTester("for"),
    function: newKeywordTester("function"),
    if: newKeywordTester("if"),
    import: newKeywordTester("import"),
    let: newKeywordTester("let"),
    return: newKeywordTester("return"),
    switch: newKeywordTester("switch"),
    throw: newKeywordTester("throw"),
    try: newKeywordTester("try"),
    var: newKeywordTester("var"),
    while: newKeywordTester("while"),
    with: newKeywordTester("with")
};

/**
 * Checks whether the given node matches the given type.
 *
 * @param {SourceCode} sourceCode The source code object to get tokens.
 * @param {ASTNode} node The statement node to check.
 * @param {string|string[]} type The statement type to check.
 * @returns {boolean} `true` if the statement node matched the type.
 */
function match(sourceCode, node, type) {
    while (node.type === "LabeledStatement") {
        node = node.body;
    }
    if (Array.isArray(type)) {
        return type.some(match.bind(null, sourceCode, node));
    }
    return StatementTypes[type].test(node, sourceCode);
}

/**
 * Finds the last matched configure from configureList.
 *
 * @param {SourceCode} sourceCode The source code object to get tokens.
 * @param {(string[])[]} configureList The configuration.
 * @param {ASTNode} previous The previous statement to match.
 * @param {ASTNode} current The current statement to match.
 * @returns {Object} The tester of the last matched configure.
 */
function getNewlineType(sourceCode, configureList, previous, current) {
    for (let i = configureList.length - 1; i >= 0; --i) {
        const configure = configureList[i];
        const matched =
            match(sourceCode, previous, configure[1]) &&
            match(sourceCode, current, configure[2]);

        if (matched) {
            return NewlineTypes[configure[0]];
        }
    }
    return NewlineTypes.any;
}

/**
 * Counts line breaks between the given 2 statements.
 * This will skip lines that comments exist.
 *
 * @param {SourceCode} sourceCode The source code to get tokens.
 * @param {ASTNode} previous The previous statement to count line breaks.
 * @param {ASTNode} current The current statement to count line breaks.
 * @returns {number} The count of line breaks.
 */
function countLinebreaks(sourceCode, previous, current) {
    let prevToken = getActualLastToken(sourceCode, previous);
    const lineA = prevToken.loc.end.line;
    const lineB = current.loc.start.line;

    if (lineA === lineB) {
        return 0;
    }
    if (lineA + 1 === lineB) {
        return 1;
    }

    // skip lines that comments exist.
    do {
        const token = sourceCode.getTokenAfter(prevToken, { includeComments: true });

        if (token.loc.start.line - prevToken.loc.end.line >= 2) {
            return 2;
        }
        prevToken = token;

    } while (prevToken.range[0] < current.range[0]);

    return 1;
}

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "require or disallow newlines between statements",
            category: "Stylistic Issues",
            recommended: false
        },
        fixable: "whitespace",
        schema: [
            {
                type: "array",
                items: {
                    type: "array",
                    items: [
                        { enum: Object.keys(NewlineTypes) },
                        {
                            anyOf: [
                                { enum: Object.keys(StatementTypes) },
                                {
                                    type: "array",
                                    items: { enum: Object.keys(StatementTypes) },
                                    minItems: 1,
                                    uniqueItems: true,
                                    additionalItems: false
                                }
                            ]
                        },
                        {
                            anyOf: [
                                { enum: Object.keys(StatementTypes) },
                                {
                                    type: "array",
                                    items: { enum: Object.keys(StatementTypes) },
                                    minItems: 1,
                                    uniqueItems: true,
                                    additionalItems: false
                                }
                            ]
                        }
                    ],
                    minItems: 3,
                    maxItems: 3,
                    additionalItems: false
                },
                minItems: 1,
                additionalItems: false
            }
        ]
    },

    create(context) {
        const sourceCode = context.getSourceCode();
        const configureList = context.options[0] || [];
        let scopeInfo = null;

        /**
         * Processes to enter scope.
         * This manages the current previous statement.
         * @returns {void}
         */
        function enterScope() {
            scopeInfo = {
                upper: scopeInfo,
                previous: null
            };
        }

        /**
         * Processes to exit scope.
         * @returns {void}
         */
        function exitScope() {
            scopeInfo = scopeInfo.upper;
        }

        /**
         * Verify linebreaks between the given node and the previous node.
         *
         * @param {ASTNode} node The node to verify.
         * @returns {void}
         */
        function verify(node) {
            if (!astUtils.STATEMENT_LIST_PARENTS.has(node.parent.type)) {
                return;
            }

            // Save this node as the current previous statement.
            const previous = scopeInfo.previous;

            scopeInfo.previous = node;

            if (!previous) {
                return;
            }

            // Verify.
            const type = getNewlineType(sourceCode, configureList, previous, node);
            const count = countLinebreaks(sourceCode, previous, node);

            if (!type.test(count)) {
                context.report({
                    node,
                    message: type.message,
                    fix: type.fix.bind(type, previous, node, sourceCode)
                });
            }
        }

        return {
            BlockStatement(node) {
                verify(node);
                enterScope();
            },
            "BlockStatement:exit": exitScope,
            Program: enterScope,
            "Program:exit": exitScope,
            SwitchCase: enterScope,
            "SwitchCase:exit": exitScope,

            BreakStatement: verify,
            ContinueStatement: verify,
            DebuggerStatement: verify,
            DoWhileStatement: verify,
            EmptyStatement: verify,
            ExpressionStatement: verify,
            ForInStatement: verify,
            ForOfStatement: verify,
            ForStatement: verify,
            IfStatement: verify,
            LabeledStatement: verify,
            ReturnStatement: verify,
            SwitchStatement: verify,
            ThrowStatement: verify,
            TryStatement: verify,
            WhileStatement: verify,
            WithStatement: verify,

            ClassDeclaration: verify,
            ExportAllDeclaration: verify,
            ExportDefaultDeclaration: verify,
            ExportNamedDeclaration: verify,
            FunctionDeclaration: verify,
            ImportDeclaration: verify,
            VariableDeclaration: verify
        };
    }
};
