/**
 * @fileoverview An object that creates fix commands for rules.
 * @author Nicholas C. Zakas
 */
"use strict";

//------------------------------------------------------------------------------
// Requirements
//------------------------------------------------------------------------------

// none!

//------------------------------------------------------------------------------
// Helpers
//------------------------------------------------------------------------------

/**
 * Creates a fix command that inserts text at the specified index in the source text.
 * @param {int} index The 0-based index at which to insert the new text.
 * @param {string} text The text to insert.
 * @returns {Object} The fix command.
 * @private
 */
function insertTextAt(index, text) {
    return {
        range: [index, index],
        text
    };
}

//------------------------------------------------------------------------------
// Public Interface
//------------------------------------------------------------------------------

/**
 * The class to create code fixing commands for rules.
 */
class RuleFixer {
    constructor(sourceCode) {
        this.sourceCode = sourceCode;
    }

    /**
     * Creates a fix command that inserts text after the given node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to insert after.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextAfter(nodeOrToken, text) {
        return this.insertTextAfterRange(nodeOrToken.range, text);
    }

    /**
     * Creates a fix command that inserts text after the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    // eslint-disable-next-line class-methods-use-this
    insertTextAfterRange(range, text) {
        return insertTextAt(range[1], text);
    }

    /**
     * Creates a fix command that inserts text before the given node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to insert before.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    insertTextBefore(nodeOrToken, text) {
        return this.insertTextBeforeRange(nodeOrToken.range, text);
    }

    /**
     * Creates a fix command that inserts text before the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    // eslint-disable-next-line class-methods-use-this
    insertTextBeforeRange(range, text) {
        return insertTextAt(range[0], text);
    }

    /**
     * Creates a fix command that replaces text at the node or token.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to remove.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    replaceText(nodeOrToken, text) {
        return this.replaceTextRange(nodeOrToken.range, text);
    }

    /**
     * Creates a fix command that replaces text at the specified range in the source text.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to replace, first item is start of range, second
     *      is end of range.
     * @param {string} text The text to insert.
     * @returns {Object} The fix command.
     */
    // eslint-disable-next-line class-methods-use-this
    replaceTextRange(range, text) {
        return {
            range,
            text
        };
    }

    /**
     * Creates a fix command that removes the node or token from the source.
     * The fix is not applied until applyFixes() is called.
     * @param {ASTNode|Token} nodeOrToken The node or token to remove.
     * @returns {Object} The fix command.
     */
    remove(nodeOrToken) {
        return this.removeRange(nodeOrToken.range);
    }

    /**
     * Creates a fix command that removes the specified range of text from the source.
     * The fix is not applied until applyFixes() is called.
     * @param {int[]} range The range to remove, first item is start of range, second
     *      is end of range.
     * @returns {Object} The fix command.
     */
    // eslint-disable-next-line class-methods-use-this
    removeRange(range) {
        return {
            range,
            text: ""
        };
    }

    /**
     * Creates a fix command that keeps the node or token in the source.
     * This fix is used to check overlapping with other fixes in applyFixes().
     * @param {ASTNode|Token} nodeOrToken The node or token to keep.
     * @returns {Object} The fix command.
     */
    keep(nodeOrToken) {
        return this.keepRange(nodeOrToken.range);
    }

    /**
     * Creates a fix command that keeps the specified range of text in the source.
     * This fix is used to check overlapping with other fixes in applyFixes().
     * @param {int[]} range The range to remove, first item is start of range, second
     *      is end of range.
     * @returns {Object} The fix command.
     */
    keepRange(range) {
        return {
            range,
            text: this.sourceCode.text.slice(range[0], range[1])
        };
    }
}

module.exports = RuleFixer;
