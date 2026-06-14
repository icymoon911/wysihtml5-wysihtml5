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
      // Use a nested object cache to avoid key collisions when className contains ":"
      // Structure: htmlApplierCache[tagName][className || ""] = HTMLApplier instance
      htmlApplierCache = {};

  function _getTagNames(tagName) {
    var alias = ALIAS_MAPPING[tagName];
    return alias ? [tagName.toLowerCase(), alias.toLowerCase()] : [tagName.toLowerCase()];
  }

  function _getApplier(tagName, className, classRegExp) {
    // Use a two-level nested lookup to avoid collision when className contains ":"
    var tagBucket = htmlApplierCache[tagName];
    if (!tagBucket) {
      tagBucket = htmlApplierCache[tagName] = {};
    }
    var classKey = className || "";
    if (!tagBucket[classKey]) {
      tagBucket[classKey] = new wysihtml5.selection.HTMLApplier(_getTagNames(tagName), className, classRegExp, true);
    }
    return tagBucket[classKey];
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
     * Factory method to create a command object that wraps formatInline.
     * Eliminates boilerplate for simple inline formatting commands (bold, italic, etc.)
     * and class-based inline commands (foreColor, fontSize, etc.).
     *
     * @param {String} commandName  The command name to register (e.g. "bold", "foreColor")
     * @param {Object} config       Configuration object:
     *   @param {String}  config.tagName         The HTML tag to apply (e.g. "b", "i", "span")
     *   @param {String}  [config.classNamePrefix]  Optional class name prefix (e.g. "wysiwyg-color-")
     *                                              When set, the value passed to exec/state is appended
     *                                              to produce the final class name.
     *   @param {RegExp}  [config.classRegExp]   Optional regex to match similar classes for removal
     *
     * @example
     *   // Simple tag-based command (bold, italic, underline):
     *   wysihtml5.commands.formatInline.createCommand("bold", { tagName: "b" });
     *
     *   // Class-based command (foreColor, fontSize):
     *   wysihtml5.commands.formatInline.createCommand("foreColor", {
     *     tagName: "span",
     *     classNamePrefix: "wysiwyg-color-",
     *     classRegExp: /wysiwyg-color-[0-9a-z]+/g
     *   });
     */
    createCommand: function(commandName, config) {
      var tagName         = config.tagName,
          classNamePrefix = config.classNamePrefix,
          classRegExp     = config.classRegExp;

      wysihtml5.commands[commandName] = {
        exec: function(composer, command, value) {
          var className = classNamePrefix ? classNamePrefix + value : undefined;
          return wysihtml5.commands.formatInline.exec(composer, command, tagName, className, classRegExp);
        },

        state: function(composer, command, value) {
          var className = classNamePrefix ? classNamePrefix + value : undefined;
          return wysihtml5.commands.formatInline.state(composer, command, tagName, className, classRegExp);
        }
      };
    }
  };
})(wysihtml5);