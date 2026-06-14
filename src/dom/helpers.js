/**
 * Shared DOM helper utilities extracted from formatBlock.js and other command modules.
 * These functions are reusable across any module that needs to manipulate block-level
 * elements, detect line breaks, or swap CSS classes via regular expressions.
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Check whether the given node is a blank text node (whitespace-only).
   * @param {Node} node
   * @return {Boolean}
   */
  dom.isBlankTextNode = function(node) {
    return node && node.nodeType === wysihtml5.TEXT_NODE && !wysihtml5.lang.string(node.data).trim();
  };

  /**
   * Check whether the given node is a <br> element.
   * @param {Node} node
   * @return {Boolean}
   */
  dom.isLineBreak = function(node) {
    return node && node.nodeName === "BR";
  };

  /**
   * Check whether the given element causes a visual line break:
   * either a <br> or an element with display: block.
   * @param {Element} element
   * @return {Boolean}
   */
  dom.isLineBreakOrBlockElement = function(element) {
    if (dom.isLineBreak(element)) {
      return true;
    }
    if (dom.getStyle("display").from(element) === "block") {
      return true;
    }
    return false;
  };

  /**
   * Walk backwards through siblings, skipping blank text nodes.
   * @param {Node} node
   * @return {Node|null}
   */
  dom.getPreviousNonBlankSibling = function(node) {
    var previousSibling = node.previousSibling;
    while (previousSibling && dom.isBlankTextNode(previousSibling)) {
      previousSibling = previousSibling.previousSibling;
    }
    return previousSibling;
  };

  /**
   * Walk forwards through siblings, skipping blank text nodes.
   * @param {Node} node
   * @return {Node|null}
   */
  dom.getNextNonBlankSibling = function(node) {
    var nextSibling = node.nextSibling;
    while (nextSibling && dom.isBlankTextNode(nextSibling)) {
      nextSibling = nextSibling.nextSibling;
    }
    return nextSibling;
  };

  /**
   * Insert <br> elements before and/or after the given node if the adjacent
   * non-blank siblings are not already block-level or <br> elements.
   * This ensures visual separation when unwrapping a block element.
   * @param {Element} node
   */
  dom.addLineBreakBeforeAndAfter = function(node) {
    var doc             = node.ownerDocument,
        nextSibling     = dom.getNextNonBlankSibling(node),
        previousSibling = dom.getPreviousNonBlankSibling(node);

    if (nextSibling && !dom.isLineBreakOrBlockElement(nextSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), nextSibling);
    }
    if (previousSibling && !dom.isLineBreakOrBlockElement(previousSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), node);
    }
  };

  /**
   * Remove adjacent <br> elements immediately before and after the given node.
   * Used when wrapping a line in a block element so the <br> becomes redundant.
   * @param {Element} node
   */
  dom.removeLineBreakBeforeAndAfter = function(node) {
    var nextSibling     = dom.getNextNonBlankSibling(node),
        previousSibling = dom.getPreviousNonBlankSibling(node);

    if (nextSibling && dom.isLineBreak(nextSibling)) {
      nextSibling.parentNode.removeChild(nextSibling);
    }
    if (previousSibling && dom.isLineBreak(previousSibling)) {
      previousSibling.parentNode.removeChild(previousSibling);
    }
  };

  /**
   * Remove the last child of the given node if it is a <br>.
   * Block elements often get a trailing <br> from the browser; this cleans it up.
   * @param {Element} node
   */
  dom.removeLastChildIfLineBreak = function(node) {
    var lastChild = node.lastChild;
    if (lastChild && dom.isLineBreak(lastChild)) {
      lastChild.parentNode.removeChild(lastChild);
    }
  };

  /**
   * Remove CSS classes matching the given regular expression from an element.
   * @param {Element} element
   * @param {RegExp} classRegExp
   */
  dom.removeClassByRegExp = function(element, classRegExp) {
    if (element.className) {
      element.className = element.className.replace(classRegExp, "");
    }
  };

  /**
   * Remove classes matching classRegExp, then add the given className.
   * Useful for swapping mutually-exclusive class variants (e.g., alignment classes).
   * @param {Element} element
   * @param {String} className
   * @param {RegExp} [classRegExp]
   */
  dom.addClassByRegExp = function(element, className, classRegExp) {
    if (classRegExp) {
      dom.removeClassByRegExp(element, classRegExp);
    }
    if (element.className) {
      element.className += " " + className;
    } else {
      element.className = className;
    }
  };

  /**
   * Check whether an element has any non-whitespace class names.
   * @param {Element} element
   * @return {Boolean}
   */
  dom.hasClasses = function(element) {
    return !!wysihtml5.lang.string(element.className).trim();
  };
})(wysihtml5);
