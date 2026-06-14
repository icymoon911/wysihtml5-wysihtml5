/**
 * DOM utility for class manipulation with regular expression support.
 * Used when CSS class names follow a pattern that needs to be matched
 * and replaced (e.g., "wysiwyg-color-red", "wysiwyg-font-size-large").
 *
 * Extracted from formatBlock.js and html_applier.js to eliminate duplication.
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Remove classes matching the given regular expression from an element
   */
  dom.removeClassWithRegExp = function(element, classRegExp) {
    if (element.className) {
      element.className = element.className.replace(classRegExp, "");
    }
  };

  /**
   * Remove classes matching the regular expression, then add the new class.
   * This is used when applying a new variant of a class family
   * (e.g., switching from "wysiwyg-color-red" to "wysiwyg-color-blue").
   */
  dom.addClassWithRegExp = function(element, className, classRegExp) {
    if (element.className) {
      dom.removeClassWithRegExp(element, classRegExp);
      element.className += " " + className;
    } else {
      element.className = className;
    }
  };
})(wysihtml5);
