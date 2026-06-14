/**
 * document.execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 *
 * Built via the formatInline factory.
 */
wysihtml5.commands.foreColor = wysihtml5.commands.formatInline.build(
  "span",
  "wysiwyg-color-",
  /wysiwyg-color-[0-9a-z]+/g
);
