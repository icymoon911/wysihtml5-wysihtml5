// element.ownerDocument.queryCommandState("italic") results:
// firefox: only <i>
// chrome:  <i>, <em>, <blockquote>, ...
// ie:      <i>, <em>
// opera:   only <i>
wysihtml5.commands.formatInline.createCommand("italic", {
  tagName: "i"
});
