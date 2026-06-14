/**
 * Unified justify commands: config-driven implementation for all text alignment variants.
 *
 * Instead of having a separate file per alignment (justifyLeft, justifyCenter, justifyRight,
 * justifyFull), this module registers all variants from a single configuration table.
 *
 * To add a new alignment variant, simply add an entry to JUSTIFY_CONFIGS below — no new
 * file is needed.
 */
(function(wysihtml5) {
  var REG_EXP = /wysiwyg-text-align-[0-9a-z]+/g;

  /**
   * Configuration table for all justify commands.
   * Key:   the command name registered on wysihtml5.commands
   * Value: the CSS class name applied to the block element
   */
  var JUSTIFY_CONFIGS = {
    justifyLeft:   "wysiwyg-text-align-left",
    justifyCenter: "wysiwyg-text-align-center",
    justifyRight:  "wysiwyg-text-align-right",
    justifyFull:   "wysiwyg-text-align-justify"
  };

  /**
   * Factory: create a justify command object from a class name.
   * @param {String} className  The CSS class to apply (e.g. "wysiwyg-text-align-center")
   * @return {Object} command object with exec and state methods
   */
  function createJustifyCommand(className) {
    return {
      exec: function(composer, command) {
        return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", null, className, REG_EXP);
      },

      state: function(composer, command) {
        return wysihtml5.commands.formatBlock.state(composer, "formatBlock", null, className, REG_EXP);
      }
    };
  }

  // Register all justify commands from the config table
  var commandName;
  for (commandName in JUSTIFY_CONFIGS) {
    if (JUSTIFY_CONFIGS.hasOwnProperty(commandName)) {
      wysihtml5.commands[commandName] = createJustifyCommand(JUSTIFY_CONFIGS[commandName]);
    }
  }
})(wysihtml5);
