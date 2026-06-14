/**
 * DOM utility functions for node traversal and classification.
 * Extracted from formatBlock.js closures for reuse across the codebase.
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Check whether given node is a text node and whether its content is blank
   */
  dom.isBlankTextNode = function(node) {
    return node &&
      node.nodeType === wysihtml5.TEXT_NODE &&
      !wysihtml5.lang.string(node.data).trim();
  };

  /**
   * Check whether given node is a <br> element
   */
  dom.isLineBreak = function(node) {
    return node && node.nodeName === "BR";
  };

  /**
   * Checks whether the element causes a visual line break
   * (<br> or block elements with display:block)
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
   * Returns previous sibling node that is not a blank text node
   */
  dom.getPreviousSiblingThatIsNotBlank = function(node) {
    var previousSibling = node.previousSibling;
    while (previousSibling && dom.isBlankTextNode(previousSibling)) {
      previousSibling = previousSibling.previousSibling;
    }
    return previousSibling;
  };

  /**
   * Returns next sibling node that is not a blank text node
   */
  dom.getNextSiblingThatIsNotBlank = function(node) {
    var nextSibling = node.nextSibling;
    while (nextSibling && dom.isBlankTextNode(nextSibling)) {
      nextSibling = nextSibling.nextSibling;
    }
    return nextSibling;
  };

  /**
   * Adds line breaks before and after the given node if the previous and next
   * siblings aren't already causing a visual line break (block element or <br>)
   */
  dom.addLineBreakBeforeAndAfter = function(node) {
    var doc             = node.ownerDocument,
        nextSibling     = dom.getNextSiblingThatIsNotBlank(node),
        previousSibling = dom.getPreviousSiblingThatIsNotBlank(node);

    if (nextSibling && !dom.isLineBreakOrBlockElement(nextSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), nextSibling);
    }
    if (previousSibling && !dom.isLineBreakOrBlockElement(previousSibling)) {
      node.parentNode.insertBefore(doc.createElement("br"), node);
    }
  };

  /**
   * Removes line breaks before and after the given node
   */
  dom.removeLineBreakBeforeAndAfter = function(node) {
    var nextSibling     = dom.getNextSiblingThatIsNotBlank(node),
        previousSibling = dom.getPreviousSiblingThatIsNotBlank(node);

    if (nextSibling && dom.isLineBreak(nextSibling)) {
      nextSibling.parentNode.removeChild(nextSibling);
    }
    if (previousSibling && dom.isLineBreak(previousSibling)) {
      previousSibling.parentNode.removeChild(previousSibling);
    }
  };

  /**
   * Removes the last child of a node if it is a <br>
   */
  dom.removeLastChildIfLineBreak = function(node) {
    var lastChild = node.lastChild;
    if (lastChild && dom.isLineBreak(lastChild)) {
      lastChild.parentNode.removeChild(lastChild);
    }
  };

  /**
   * Check whether an element has any non-whitespace class names
   */
  dom.hasClasses = function(element) {
    return !!wysihtml5.lang.string(element.className).trim();
  };
})(wysihtml5);
