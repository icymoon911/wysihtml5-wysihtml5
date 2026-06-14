/**
 * document.execCommand("fontSize") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.formatInline.createCommand("fontSize", {
  tagName:         "span",
  classNamePrefix: "wysiwyg-font-size-",
  classRegExp:     /wysiwyg-font-size-[0-9a-z\-]+/g
});
