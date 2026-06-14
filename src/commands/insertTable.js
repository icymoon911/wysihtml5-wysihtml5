/**
 * insertTable Command
 *
 * Inserts a <table> element at the current caret position.
 *
 * @example
 *    wysihtml5.commands.insertTable.exec(composer, "insertTable", { rows: 3, cols: 3 });
 *    wysihtml5.commands.insertTable.exec(composer, "insertTable", { rows: 3, cols: 3, className: "wysiwyg-table-bordered" });
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Build a table HTML string with the given number of rows and columns.
   * Each cell gets a <br> placeholder so the caret can land inside it.
   *
   * @param {Number} rows Number of rows
   * @param {Number} cols Number of columns
   * @param {String} [className] Optional CSS class for the table
   * @return {String} The table HTML
   */
  function _buildTableHTML(rows, cols, className) {
    var html = '<table',
        i, j;

    if (className) {
      html += ' class="' + className + '"';
    }

    html += '>';

    for (i = 0; i < rows; i++) {
      html += '<tr>';
      for (j = 0; j < cols; j++) {
        html += '<td><br></td>';
      }
      html += '</tr>';
    }

    html += '</table>';
    return html;
  }

  wysihtml5.commands.insertTable = {
    /**
     * Insert a table at the current caret position.
     *
     * @param {Object} composer The wysihtml5 composer instance
     * @param {String} command The command name ("insertTable")
     * @param {Object} value An object with { rows, cols } and optional { className }
     */
    exec: function(composer, command, value) {
      var doc       = composer.doc,
          rows, cols, className,
          tableHTML,
          tableElement,
          firstCell;

      if (!value) {
        return;
      }

      rows      = parseInt(value.rows, 10) || 2;
      cols      = parseInt(value.cols, 10) || 2;
      className = value.className || "wysiwyg-table wysiwyg-table-bordered";

      // Clamp to reasonable values
      rows = Math.max(1, Math.min(rows, 50));
      cols = Math.max(1, Math.min(cols, 20));

      tableHTML = _buildTableHTML(rows, cols, className);

      // Insert the table HTML
      composer.selection.insertHTML(tableHTML);

      // Find the inserted table and place cursor in first cell
      tableElement = composer.element.querySelector("table");
      if (tableElement) {
        firstCell = tableElement.querySelector("td");
        if (firstCell) {
          composer.selection.selectNode(firstCell, true);
        }
      }
    },

    /**
     * insertTable is an action command, not a toggle.
     * Always return false so the dialog opens every time.
     *
     * @return {Boolean} Always false
     */
    state: function(composer) {
      return false;
    }
  };
})(wysihtml5);
