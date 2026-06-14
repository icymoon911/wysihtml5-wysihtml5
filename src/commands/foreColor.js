/**
 * document.execCommand("foreColor") will create either inline styles (firefox, chrome) or use font tags
 * which we don't want
 * Instead we set a css class
 */
wysihtml5.commands.formatInline.createCommand("foreColor", {
  tagName:         "span",
  classNamePrefix: "wysiwyg-color-",
  classRegExp:     /wysiwyg-color-[0-9a-z]+/g
});
