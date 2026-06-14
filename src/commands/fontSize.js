/**
 * document.execCommand("fontSize") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 *
 * Built via the formatInline factory.
 */
wysihtml5.commands.fontSize = wysihtml5.commands.formatInline.build(
  "span",
  "wysiwyg-font-size-",
  /wysiwyg-font-size-[0-9a-z\-]+/g
);
