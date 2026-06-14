/**
 * insertTable command
 *
 * Inserts a table with the specified number of rows and columns.
 * Also provides helper methods for table manipulation (add/delete rows and columns).
 * Tab key navigation between cells is handled in composer.observe.js.
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Find the closest ancestor element with the given tag name.
   */
  function _findParent(node, tagName) {
    while (node && node.nodeName !== "BODY") {
      if (node.nodeName === tagName) {
        return node;
      }
      node = node.parentNode;
    }
    return null;
  }

  /**
   * Get the next cell (td/th) in table order (left-to-right, top-to-bottom).
   * When at the last cell, returns null (caller can decide to add a row).
   */
  function _getNextCell(currentCell, table) {
    var row = _findParent(currentCell, "TR");
    if (!row) { return null; }

    // Try next sibling cell in the same row
    var next = currentCell.nextElementSibling;
    while (next) {
      if (next.nodeName === "TD" || next.nodeName === "TH") {
        return next;
      }
      next = next.nextElementSibling;
    }

    // Move to the first cell of the next row
    var nextRow = row.nextElementSibling;
    while (nextRow) {
      if (nextRow.nodeName === "TR") {
        var firstCell = nextRow.querySelector("td, th");
        if (firstCell) { return firstCell; }
      }
      nextRow = nextRow.nextElementSibling;
    }

    return null;
  }

  /**
   * Get the previous cell (td/th) in table order (reverse).
   */
  function _getPrevCell(currentCell, table) {
    var row = _findParent(currentCell, "TR");
    if (!row) { return null; }

    // Try previous sibling cell in the same row
    var prev = currentCell.previousElementSibling;
    while (prev) {
      if (prev.nodeName === "TD" || prev.nodeName === "TH") {
        return prev;
      }
      prev = prev.previousElementSibling;
    }

    // Move to the last cell of the previous row
    var prevRow = row.previousElementSibling;
    while (prevRow) {
      if (prevRow.nodeName === "TR") {
        var cells = prevRow.querySelectorAll("td, th");
        if (cells.length > 0) { return cells[cells.length - 1]; }
      }
      prevRow = prevRow.previousElementSibling;
    }

    return null;
  }

  /**
   * Get the first cell in the table (checking thead, tbody, tfoot, or direct tr children).
   */
  function _getFirstCell(table) {
    return table.querySelector("tr td, tr th");
  }

  /**
   * Add a new row at the end of the table (or in the first tbody).
   * Each cell contains a <br> for proper cursor placement in contentEditable.
   */
  function _addRow(table, cols) {
    var doc = table.ownerDocument;
    var tbody = table.querySelector("tbody") || table;
    var row = doc.createElement("tr");
    var colCount = cols || (table.querySelector("tr") ? table.querySelector("tr").querySelectorAll("td, th").length : 1);

    for (var i = 0; i < colCount; i++) {
      var cell = doc.createElement("td");
      cell.innerHTML = "<br>";
      row.appendChild(cell);
    }
    tbody.appendChild(row);
    return row;
  }

  /**
   * Delete a row from the table. Removes the table if no rows remain.
   */
  function _deleteRow(table, rowIndex) {
    var tbody = table.querySelector("tbody") || table;
    var rows = tbody.querySelectorAll("tr");

    if (rowIndex < 0 || rowIndex >= rows.length) { return; }

    tbody.removeChild(rows[rowIndex]);

    // Remove the table if no rows remain
    var remainingRows = tbody.querySelectorAll("tr");
    if (remainingRows.length === 0) {
      table.parentNode.removeChild(table);
    }
  }

  /**
   * Add a new column at the specified index (default: at the end).
   */
  function _addColumn(table, colIndex) {
    var doc = table.ownerDocument;
    var rows = table.querySelectorAll("tr");

    if (rows.length === 0) { return; }

    if (colIndex === undefined || colIndex === null) {
      colIndex = rows[0].querySelectorAll("td, th").length;
    }

    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll("td, th");
      var isHeader = (i === 0 && rows[i].querySelector("th"));
      var cell = doc.createElement(isHeader ? "th" : "td");
      cell.innerHTML = "<br>";

      if (colIndex >= cells.length) {
        rows[i].appendChild(cell);
      } else {
        rows[i].insertBefore(cell, cells[colIndex]);
      }
    }
  }

  /**
   * Delete a column at the specified index. Removes the table if no columns remain.
   */
  function _deleteColumn(table, colIndex) {
    var rows = table.querySelectorAll("tr");

    for (var i = 0; i < rows.length; i++) {
      var cells = rows[i].querySelectorAll("td, th");
      if (colIndex < cells.length) {
        rows[i].removeChild(cells[colIndex]);
      }
    }

    // Remove the table if no columns remain in any row
    var remainingCells = table.querySelectorAll("td, th");
    if (remainingCells.length === 0) {
      table.parentNode.removeChild(table);
    }
  }

  /**
   * Place the cursor at the start of a table cell.
   */
  function _selectCell(composer, cell) {
    var br = cell.querySelector("br");
    if (br) {
      composer.selection.setBefore(br);
    } else if (cell.firstChild) {
      composer.selection.selectNode(cell, true);
    }
  }

  // Expose table helper methods for use by composer.observe.js (tab navigation)
  wysihtml5.commands._tableHelpers = {
    findParent:     _findParent,
    getNextCell:    _getNextCell,
    getPrevCell:    _getPrevCell,
    getFirstCell:   _getFirstCell,
    addRow:         _addRow,
    deleteRow:      _deleteRow,
    addColumn:      _addColumn,
    deleteColumn:   _deleteColumn,
    selectCell:     _selectCell
  };

  wysihtml5.commands.insertTable = {
    /**
     * Insert a table or perform table operations.
     *
     * @param {Object} composer  The composer instance
     * @param {String} command   The command name ("insertTable")
     * @param {Object|String} value  Either:
     *   - { rows: Number|String, cols: Number|String }  → insert a new table
     *   - "deleteTable"                                  → remove the current table
     *   - "addRow"                                       → add a row below
     *   - "deleteRow"                                    → delete the current row
     *   - "addColumn"                                    → add a column to the right
     *   - "deleteColumn"                                 → delete the current column
     */
    exec: function(composer, command, value) {
      // When no value is provided (toolbar button without dialog, or
      // state=true exec from toolbar), prompt the user for dimensions.
      if (value === undefined || value === null) {
        var input = prompt("Enter table size (rows x cols):", "3x3");
        if (!input) { return; }
        var parts = input.split("x");
        value = { rows: parseInt(parts[0], 10) || 3, cols: parseInt(parts[1], 10) || 3 };
      }

      if (typeof value === "object" && value !== null) {
        var rows = parseInt(value.rows, 10) || 3;
        var cols = parseInt(value.cols, 10) || 3;

        // Constrain to reasonable limits
        rows = Math.max(1, Math.min(rows, 99));
        cols = Math.max(1, Math.min(cols, 99));

        var doc = composer.doc;

        // Build table element via DOM (more reliable than insertHTML for cursor placement)
        var table = doc.createElement("table");
        table.className = "wysiwyg-border";
        var tbody = doc.createElement("tbody");

        for (var i = 0; i < rows; i++) {
          var tr = doc.createElement("tr");
          for (var j = 0; j < cols; j++) {
            var td = doc.createElement("td");
            td.innerHTML = "<br>";
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);

        // Insert the table element at the current cursor position
        composer.selection.insertNode(table);

        // Add a paragraph/br after the table so the user can type below it
        var afterElement;
        if (composer.config.useLineBreaks) {
          afterElement = doc.createElement("br");
        } else {
          afterElement = doc.createElement("p");
          afterElement.innerHTML = "<br>";
        }
        table.parentNode.insertBefore(afterElement, table.nextSibling);

        // Move cursor into the first cell of the newly inserted table
        var firstCell = _getFirstCell(table);
        if (firstCell) {
          _selectCell(composer, firstCell);
        }
      } else if (value === "deleteTable") {
        var selectedNode = composer.selection.getSelectedNode();
        var table = _findParent(selectedNode, "TABLE");
        if (table) {
          var parent = table.parentNode;
          parent.removeChild(table);
          composer.selection.setBefore(parent.lastChild || parent);
        }
      } else if (value === "addRow") {
        var selectedNode = composer.selection.getSelectedNode();
        var table = _findParent(selectedNode, "TABLE");
        if (table) {
          var cols = table.querySelector("tr")
            ? table.querySelector("tr").querySelectorAll("td, th").length
            : 1;
          var newRow = _addRow(table, cols);
          var firstCell = newRow.querySelector("td, th");
          if (firstCell) {
            _selectCell(composer, firstCell);
          }
        }
      } else if (value === "deleteRow") {
        var selectedNode = composer.selection.getSelectedNode();
        var table = _findParent(selectedNode, "TABLE");
        var row = _findParent(selectedNode, "TR");
        if (table && row) {
          var tbody = table.querySelector("tbody") || table;
          var rows = tbody.querySelectorAll("tr");
          var rowIndex = -1;
          for (var k = 0; k < rows.length; k++) {
            if (rows[k] === row) { rowIndex = k; break; }
          }
          if (rowIndex >= 0) {
            _deleteRow(table, rowIndex);
          }
        }
      } else if (value === "addColumn") {
        var selectedNode = composer.selection.getSelectedNode();
        var table = _findParent(selectedNode, "TABLE");
        var cell = _findParent(selectedNode, "TD") || _findParent(selectedNode, "TH");
        if (table && cell) {
          var row = _findParent(cell, "TR");
          var cells = row.querySelectorAll("td, th");
          var cellIndex = -1;
          for (var k = 0; k < cells.length; k++) {
            if (cells[k] === cell) { cellIndex = k; break; }
          }
          // Insert new column after the current cell
          _addColumn(table, cellIndex + 1);
        }
      } else if (value === "deleteColumn") {
        var selectedNode = composer.selection.getSelectedNode();
        var table = _findParent(selectedNode, "TABLE");
        var cell = _findParent(selectedNode, "TD") || _findParent(selectedNode, "TH");
        if (table && cell) {
          var row = _findParent(cell, "TR");
          var cells = row.querySelectorAll("td, th");
          var cellIndex = -1;
          for (var k = 0; k < cells.length; k++) {
            if (cells[k] === cell) { cellIndex = k; break; }
          }
          if (cellIndex >= 0) {
            _deleteColumn(table, cellIndex);
          }
        }
      }
    },

    state: function(composer, command) {
      // Return false so that the toolbar always allows clicking the "insert table"
      // button (even when inside a table). This ensures the dialog can be shown
      // to insert a new table, and table operation buttons work via their
      // command-value without being blocked by a truthy state.
      return false;
    }
  };
})(wysihtml5);
