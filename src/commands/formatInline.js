/**
 * formatInline scenarios for tag "B" (| = caret, |foo| = selected text)
 *
 *   #1 caret in unformatted text:
 *      abcdefg|
 *   output:
 *      abcdefg<b>|</b>
 *
 *   #2 unformatted text selected:
 *      abc|deg|h
 *   output:
 *      abc<b>|deg|</b>h
 *
 *   #3 unformatted text selected across boundaries:
 *      ab|c <span>defg|h</span>
 *   output:
 *      ab<b>|c </b><span><b>defg</b>|h</span>
 *
 *   #4 formatted text entirely selected
 *      <b>|abc|</b>
 *   output:
 *      |abc|
 *
 *   #5 formatted text partially selected
 *      <b>ab|c|</b>
 *   output:
 *      <b>ab</b>|c|
 *
 *   #6 formatted text selected across boundaries
 *      <span>ab|c</span> <b>de|fgh</b>
 *   output:
 *      <span>ab|c</span> de|<b>fgh</b>
 */
(function(wysihtml5) {
  var // Treat <b> as <strong> and vice versa
      ALIAS_MAPPING = {
        "strong": "b",
        "em":     "i",
        "b":      "strong",
        "i":      "em"
      },
      htmlApplier = {};

  function _getTagNames(tagName) {
    var alias = ALIAS_MAPPING[tagName];
    return alias ? [tagName.toLowerCase(), alias.toLowerCase()] : [tagName.toLowerCase()];
  }

  /**
   * Get or create a cached HTMLApplier instance.
   * Uses a nested object keyed by tagName then className to avoid
   * collisions when className contains special characters like colons.
   */
  function _getApplier(tagName, className, classRegExp) {
    if (!htmlApplier[tagName]) {
      htmlApplier[tagName] = {};
    }
    var classKey = className || "";
    if (!htmlApplier[tagName][classKey]) {
      htmlApplier[tagName][classKey] = new wysihtml5.selection.HTMLApplier(
        _getTagNames(tagName), className, classRegExp, true
      );
    }
    return htmlApplier[tagName][classKey];
  }

  wysihtml5.commands.formatInline = {
    exec: function(composer, command, tagName, className, classRegExp) {
      var range = composer.selection.getRange();
      if (!range) {
        return false;
      }
      _getApplier(tagName, className, classRegExp).toggleRange(range);
      composer.selection.setSelection(range);
    },

    state: function(composer, command, tagName, className, classRegExp) {
      var doc           = composer.doc,
          aliasTagName  = ALIAS_MAPPING[tagName] || tagName,
          range;

      // Check whether the document contains a node with the desired tagName
      if (!wysihtml5.dom.hasElementWithTagName(doc, tagName) &&
          !wysihtml5.dom.hasElementWithTagName(doc, aliasTagName)) {
        return false;
      }

       // Check whether the document contains a node with the desired className
      if (className && !wysihtml5.dom.hasElementWithClassName(doc, className)) {
         return false;
      }

      range = composer.selection.getRange();
      if (!range) {
        return false;
      }

      return _getApplier(tagName, className, classRegExp).isAppliedToRange(range);
    },

    /**
     * Factory for creating inline formatting commands.
     * Returns a command object with exec/state methods for a given tag and optional class.
     *
     * For simple tag-based commands (bold, italic, underline):
     *    formatInline.build("b")
     *
     * For class-based commands with a prefix (foreColor, fontSize):
     *    formatInline.build("span", "wysiwyg-color-", /wysiwyg-color-[0-9a-z]+/g)
     *
     * @param {String} tagName The HTML tag to apply (e.g., "b", "i", "span")
     * @param {String} [classNamePrefix] Optional class name prefix (value is appended at runtime)
     * @param {RegExp} [classRegExp] Optional regex to match similar classes for replacement
     * @return {Object} A command object with exec and state methods
     */
    build: function(tagName, classNamePrefix, classRegExp) {
      return {
        exec: function(composer, command, value) {
          var className = classNamePrefix ? classNamePrefix + value : null;
          return wysihtml5.commands.formatInline.exec(composer, command, tagName, className, classRegExp);
        },
        state: function(composer, command, value) {
          var className = classNamePrefix ? classNamePrefix + value : null;
          return wysihtml5.commands.formatInline.state(composer, command, tagName, className, classRegExp);
        }
      };
    }
  };
})(wysihtml5);
