/**
 * Table Operations Commands
 *
 * Provides commands for manipulating table structure:
 * - addRowBefore / addRowAfter: Insert a new row relative to the current cell
 * - addColBefore / addColAfter: Insert a new column relative to the current cell
 * - deleteRow: Remove the row containing the current cell
 * - deleteCol: Remove the column containing the current cell
 * - deleteTable: Remove the entire table
 *
 * @example
 *    wysihtml5.commands.addRowAfter.exec(composer, "addRowAfter");
 *    wysihtml5.commands.deleteRow.exec(composer, "deleteRow");
 */
(function(wysihtml5) {
  var dom = wysihtml5.dom;

  /**
   * Get the cell (TD or TH) containing the current selection.
   */
  function _getCurrentCell(composer) {
    var selectedNode = composer.selection.getSelectedNode();
    return dom.getParentElement(selectedNode, { nodeName: ["TD", "TH"] });
  }

  /**
   * Get the row (TR) containing the given cell.
   */
  function _getRow(cell) {
    return dom.getParentElement(cell, { nodeName: "TR" });
  }

  /**
   * Get the table element containing the given cell.
   */
  function _getTable(cell) {
    return dom.getParentElement(cell, { nodeName: "TABLE" });
  }

  /**
   * Get the column index of a cell within its row, accounting for colspan.
   */
  function _getColIndex(cell) {
    var row   = _getRow(cell),
        cells = row.cells,
        index = 0,
        i;
    for (i = 0; i < cells.length; i++) {
      if (cells[i] === cell) {
        return index;
      }
      index += (cells[i].colSpan || 1);
    }
    return index;
  }

  /**
   * Count the total number of columns in a table (based on first row or max).
   */
  function _getTableColCount(table) {
    var rows   = table.rows,
        maxCols = 0,
        i, j, rowCols;
    for (i = 0; i < rows.length; i++) {
      rowCols = 0;
      for (j = 0; j < rows[i].cells.length; j++) {
        rowCols += (rows[i].cells[j].colSpan || 1);
      }
      if (rowCols > maxCols) {
        maxCols = rowCols;
      }
    }
    return maxCols;
  }

  /**
   * Create a new cell element (TD by default).
   */
  function _createCell(doc, tagName) {
    var cell = doc.createElement(tagName || "td");
    cell.innerHTML = "<br>";
    return cell;
  }

  /**
   * Create a new row with the given number of columns.
   */
  function _createRow(doc, colCount) {
    var row = doc.createElement("tr"),
        i;
    for (i = 0; i < colCount; i++) {
      row.appendChild(_createCell(doc));
    }
    return row;
  }

  // ---------- addRowBefore ----------
  wysihtml5.commands.addRowBefore = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var row       = _getRow(cell),
          table     = _getTable(cell),
          colCount  = _getTableColCount(table),
          newRow    = _createRow(composer.doc, colCount);

      row.parentNode.insertBefore(newRow, row);

      // Restore focus to the original cell
      composer.selection.selectNode(cell, true);
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- addRowAfter ----------
  wysihtml5.commands.addRowAfter = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var row       = _getRow(cell),
          table     = _getTable(cell),
          colCount  = _getTableColCount(table),
          newRow    = _createRow(composer.doc, colCount),
          nextRow   = row.nextSibling;

      if (nextRow) {
        row.parentNode.insertBefore(newRow, nextRow);
      } else {
        row.parentNode.appendChild(newRow);
      }

      // Restore focus to the original cell
      composer.selection.selectNode(cell, true);
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- addColBefore ----------
  wysihtml5.commands.addColBefore = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var colIndex = _getColIndex(cell),
          table    = _getTable(cell),
          rows     = table.rows,
          i, row, newCell, refCell;

      for (i = 0; i < rows.length; i++) {
        row     = rows[i];
        refCell = row.cells[colIndex] || null;
        newCell = _createCell(composer.doc);
        if (refCell) {
          row.insertBefore(newCell, refCell);
        } else {
          row.appendChild(newCell);
        }
      }

      // Restore focus to the original cell (it may have shifted)
      composer.selection.selectNode(cell, true);
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- addColAfter ----------
  wysihtml5.commands.addColAfter = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var colIndex = _getColIndex(cell),
          table    = _getTable(cell),
          rows     = table.rows,
          i, row, newCell, refCell;

      for (i = 0; i < rows.length; i++) {
        row     = rows[i];
        refCell = row.cells[colIndex + 1] || null;
        newCell = _createCell(composer.doc);
        if (refCell) {
          row.insertBefore(newCell, refCell);
        } else {
          row.appendChild(newCell);
        }
      }

      // Restore focus to the original cell
      composer.selection.selectNode(cell, true);
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- deleteRow ----------
  wysihtml5.commands.deleteRow = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var row      = _getRow(cell),
          table    = _getTable(cell),
          tbody    = row.parentNode,
          allRows  = table.rows,
          cellBelow;

      // If this is the only row, delete the entire table instead
      if (allRows.length <= 1) {
        wysihtml5.commands.deleteTable.exec(composer, command);
        return;
      }

      // Try to focus the cell in the next or previous row at the same column
      var colIndex = _getColIndex(cell);
      var nextRow  = row.nextSibling || row.previousSibling;

      row.parentNode.removeChild(row);

      if (nextRow && nextRow.cells && nextRow.cells[colIndex]) {
        composer.selection.selectNode(nextRow.cells[colIndex], true);
      }
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- deleteCol ----------
  wysihtml5.commands.deleteCol = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var colIndex = _getColIndex(cell),
          table    = _getTable(cell),
          colCount = _getTableColCount(table),
          rows     = table.rows,
          i, rowCell;

      // If this is the only column, delete the entire table
      if (colCount <= 1) {
        wysihtml5.commands.deleteTable.exec(composer, command);
        return;
      }

      // Try to focus an adjacent cell before deleting
      var focusCell = null;
      if (rows[0] && rows[0].cells[colIndex + 1]) {
        focusCell = rows[0].cells[colIndex + 1];
      } else if (rows[0] && rows[0].cells[colIndex - 1]) {
        focusCell = rows[0].cells[colIndex - 1];
      }

      for (i = 0; i < rows.length; i++) {
        rowCell = rows[i].cells[colIndex];
        if (rowCell) {
          rows[i].removeChild(rowCell);
        }
      }

      if (focusCell) {
        composer.selection.selectNode(focusCell, true);
      }
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

  // ---------- deleteTable ----------
  wysihtml5.commands.deleteTable = {
    exec: function(composer, command) {
      var cell = _getCurrentCell(composer);
      if (!cell) { return; }

      var table     = _getTable(cell),
          parentNode = table.parentNode,
          nextNode   = table.nextSibling;

      table.parentNode.removeChild(table);

      // Place cursor after where the table was
      if (nextNode) {
        composer.selection.setBefore(nextNode);
      } else if (parentNode.lastChild) {
        composer.selection.setAfter(parentNode.lastChild);
      }
    },

    state: function(composer) {
      return !!_getCurrentCell(composer);
    }
  };

})(wysihtml5);
