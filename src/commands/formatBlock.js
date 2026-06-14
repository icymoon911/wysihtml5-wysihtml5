(function(wysihtml5) {
  var dom                     = wysihtml5.dom,
      // Following elements are grouped
      // when the caret is within a H1 and the H4 is invoked, the H1 should turn into H4
      // instead of creating a H4 within a H1 which would result in semantically invalid html
      BLOCK_ELEMENTS_GROUP    = ["H1", "H2", "H3", "H4", "H5", "H6", "P", "BLOCKQUOTE", "DIV"];

  /**
   * Execute native query command
   * and if necessary modify the inserted node's className
   */
  function _execCommand(doc, command, nodeName, className) {
    if (className) {
      var eventListener = dom.observe(doc, "DOMNodeInserted", function(event) {
        var target = event.target,
            displayStyle;
        if (target.nodeType !== wysihtml5.ELEMENT_NODE) {
          return;
        }
        displayStyle = dom.getStyle("display").from(target);
        if (displayStyle.substr(0, 6) !== "inline") {
          // Make sure that only block elements receive the given class
          target.className += " " + className;
        }
      });
    }
    doc.execCommand(command, false, nodeName);
    if (eventListener) {
      eventListener.stop();
    }
  }

  function _selectLineAndWrap(composer, element) {
    composer.selection.selectLine();
    composer.selection.surround(element);
    dom.removeLineBreakBeforeAndAfter(element);
    dom.removeLastChildIfLineBreak(element);
    composer.selection.selectNode(element, wysihtml5.browser.displaysCaretInEmptyContentEditableCorrectly());
  }

  wysihtml5.commands.formatBlock = {
    exec: function(composer, command, nodeName, className, classRegExp) {
      var doc             = composer.doc,
          blockElement    = this.state(composer, command, nodeName, className, classRegExp),
          useLineBreaks   = composer.config.useLineBreaks,
          defaultNodeName = useLineBreaks ? "DIV" : "P",
          selectedNode;

      nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;

      if (blockElement) {
        composer.selection.executeAndRestoreSimple(function() {
          if (classRegExp) {
            dom.removeClassWithRegExp(blockElement, classRegExp);
          }
          var hasClasses = dom.hasClasses(blockElement);
          if (!hasClasses && (useLineBreaks || nodeName === "P")) {
            // Insert a line break afterwards and beforewards when there are siblings
            // that are not of type line break or block element
            dom.addLineBreakBeforeAndAfter(blockElement);
            dom.replaceWithChildNodes(blockElement);
          } else {
            // Make sure that styling is kept by renaming the element to a <div> or <p> and copying over the class name
            dom.renameElement(blockElement, nodeName === "P" ? "DIV" : defaultNodeName);
          }
        });
        return;
      }

      // Find similiar block element and rename it (<h2 class="foo"></h2>  =>  <h1 class="foo"></h1>)
      if (nodeName === null || wysihtml5.lang.array(BLOCK_ELEMENTS_GROUP).contains(nodeName)) {
        selectedNode = composer.selection.getSelectedNode();
        blockElement = dom.getParentElement(selectedNode, {
          nodeName: BLOCK_ELEMENTS_GROUP
        });

        if (blockElement) {
          composer.selection.executeAndRestore(function() {
            // Rename current block element to new block element and add class
            if (nodeName) {
              blockElement = dom.renameElement(blockElement, nodeName);
            }
            if (className) {
              dom.addClassWithRegExp(blockElement, className, classRegExp);
            }
          });
          return;
        }
      }

      if (composer.commands.support(command)) {
        _execCommand(doc, command, nodeName || defaultNodeName, className);
        return;
      }

      blockElement = doc.createElement(nodeName || defaultNodeName);
      if (className) {
        blockElement.className = className;
      }
      _selectLineAndWrap(composer, blockElement);
    },

    state: function(composer, command, nodeName, className, classRegExp) {
      nodeName = typeof(nodeName) === "string" ? nodeName.toUpperCase() : nodeName;
      var selectedNode = composer.selection.getSelectedNode();
      return dom.getParentElement(selectedNode, {
        nodeName:     nodeName,
        className:    className,
        classRegExp:  classRegExp
      });
    },

    /**
     * Factory for creating alignment (justify) commands.
     * Returns a command object with exec/state methods for a given alignment value.
     *
     * @param {String} alignment The alignment value (e.g., "left", "center", "right", "justify")
     * @return {Object} A command object with exec and state methods
     *
     * @example
     *    wysihtml5.commands.justifyLeft = wysihtml5.commands.formatBlock.buildAlign("left");
     */
    buildAlign: function(alignment) {
      var className = "wysiwyg-text-align-" + alignment,
          regExp    = /wysiwyg-text-align-[0-9a-z]+/g;
      return {
        exec: function(composer, command) {
          return wysihtml5.commands.formatBlock.exec(composer, "formatBlock", null, className, regExp);
        },
        state: function(composer, command) {
          return wysihtml5.commands.formatBlock.state(composer, "formatBlock", null, className, regExp);
        }
      };
    }
  };
})(wysihtml5);
