/**
 * Italic command — built via the formatInline factory.
 *
 * element.ownerDocument.queryCommandState("italic") results:
 * firefox: only <i>
 * chrome:  <i>, <em>, <blockquote>, ...
 * ie:      <i>, <em>
 * opera:   only <i>
 */
wysihtml5.commands.italic = wysihtml5.commands.formatInline.build("i");
