// element.ownerDocument.queryCommandState("bold") results:
// firefox: only <b>
// chrome:  <b>, <strong>, <h1>, <h2>, ...
// ie:      <b>, <strong>
// opera:   <b>, <strong>
wysihtml5.commands.formatInline.createCommand("bold", {
  tagName: "b"
});
