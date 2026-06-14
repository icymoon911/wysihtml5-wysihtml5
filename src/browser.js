/**
 * Detect browser support for specific features.
 *
 * Strategy:
 *   - Use feature detection wherever possible (testing actual browser capabilities).
 *   - Fall back to userAgent sniffing only for known behavioral bugs that cannot be
 *     feature-detected (e.g., IE's broken formatBlock, WebKit's nested paste markup).
 *   - The isIE / isGecko / isWebKit / isChrome / isOpera flags below are kept only for
 *     such behavioral workarounds and are parsed carefully to avoid common pitfalls
 *     (e.g., Chrome's UA contains both "Safari" and "AppleWebKit", so isWebKit alone
 *     does not imply Safari).
 */
wysihtml5.browser = (function() {
  var userAgent   = navigator.userAgent,
      testElement = document.createElement("div"),

      // --- UserAgent-based detection (kept only for behavioral bugs that cannot be feature-detected) ---

      // IE < 11: "MSIE" in UA; IE 11+: "Trident/" with "rv:"
      // Explicitly exclude Opera, which historically spoofed IE's UA string.
      isIE        = (userAgent.indexOf("MSIE") !== -1 || userAgent.indexOf("Trident/") !== -1)
                    && userAgent.indexOf("Opera") === -1,

      // Gecko (Firefox): "Gecko" present but NOT "KHTML" (some old Konqueror builds had both).
      isGecko     = userAgent.indexOf("Gecko") !== -1 && userAgent.indexOf("KHTML") === -1,

      // WebKit (Safari, Chrome, etc.): "AppleWebKit/" present.
      // Note: Chrome also has "AppleWebKit" in its UA, so isWebKit does NOT imply Safari.
      isWebKit    = userAgent.indexOf("AppleWebKit/") !== -1,

      // Chrome: "Chrome/" in UA.  Edge (Chromium) also has this, but that is fine for our purposes.
      isChrome    = userAgent.indexOf("Chrome/") !== -1,

      // Opera: classic Opera has "Opera/"; Opera 15+ uses "OPR/" instead.
      isOpera     = userAgent.indexOf("Opera/") !== -1 || userAgent.indexOf("OPR/") !== -1;

  // --- Feature-detection helpers ---

  /**
   * Test whether a given DOM API exists on a fresh element.
   * @param {String} apiName  Property name to check on testElement
   * @return {Boolean}
   */
  function hasFeature(apiName) {
    return apiName in testElement;
  }

  /**
   * Test whether a document-level API exists.
   * @param {String} apiName
   * @return {Boolean}
   */
  function hasDocumentFeature(apiName) {
    return apiName in document;
  }

  function iosVersion(ua) {
    return +((/ipad|iphone|ipod/.test(ua) && ua.match(/ os (\d+).+? like mac os x/)) || [, 0])[1];
  }

  function androidVersion(ua) {
    return +(ua.match(/android (\d+)/) || [, 0])[1];
  }

  /**
   * Feature-detect whether the browser fires focus events correctly on iframes.
   * Opera is known to have issues here; this probes the actual behavior.
   * (Cached on first call.)
   */
  var _supportsEventsInIframe;
  function probeIframeFocusEvents() {
    if (_supportsEventsInIframe !== undefined) {
      return _supportsEventsInIframe;
    }
    // Heuristic feature probe: browsers that implement the standard focus event
    // on iframes expose the focus handler property on a fresh iframe element.
    var iframe = document.createElement("iframe");
    _supportsEventsInIframe = ("onfocus" in iframe);
    // Fall back to UA-based assumption if probe is inconclusive
    if (_supportsEventsInIframe === undefined) {
      _supportsEventsInIframe = !isOpera;
    }
    return _supportsEventsInIframe;
  }

  return {
    // Static variable, publicly accessible, so it can be overridden in unit tests.
    USER_AGENT: userAgent,

    /**
     * Exclude browsers that are not capable of displaying and handling
     * contentEditable as desired:
     *    - iPhone, iPad (tested iOS 4.2.2) and Android (tested 2.2) refuse to make contentEditables focusable
     *    - IE < 8 create invalid markup and crash randomly from time to time
     *
     * @return {Boolean}
     */
    supported: function() {
      var ua                        = this.USER_AGENT.toLowerCase(),
          // Essential for making html elements editable
          hasContentEditableSupport = hasFeature("contentEditable"),
          // Following methods are needed in order to interact with the contentEditable area
          hasEditingApiSupport      = hasDocumentFeature("execCommand") && hasDocumentFeature("queryCommandSupported") && hasDocumentFeature("queryCommandState"),
          // document selector apis are only supported by IE 8+, Safari 4+, Chrome and Firefox 3.5+
          hasQuerySelectorSupport   = hasDocumentFeature("querySelector") && hasDocumentFeature("querySelectorAll"),
          // contentEditable is unusable in mobile browsers (tested iOS 4.2.2, Android 2.2, Opera Mobile, WebOS 3.05)
          isIncompatibleMobileBrowser = (this.isIos() && iosVersion(ua) < 5) || (this.isAndroid() && androidVersion(ua) < 4) || ua.indexOf("opera mobi") !== -1 || ua.indexOf("hpwos/") !== -1;
      return hasContentEditableSupport
        && hasEditingApiSupport
        && hasQuerySelectorSupport
        && !isIncompatibleMobileBrowser;
    },

    isTouchDevice: function() {
      return this.supportsEvent("touchmove");
    },

    isIos: function() {
      return (/ipad|iphone|ipod/i).test(this.USER_AGENT);
    },

    isAndroid: function() {
      return this.USER_AGENT.indexOf("Android") !== -1;
    },

    /**
     * Whether the browser supports sandboxed iframes.
     * Currently only IE 6+ offers such feature <iframe security="restricted">
     *
     * http://msdn.microsoft.com/en-us/library/ms534622(v=vs.85).aspx
     * http://blogs.msdn.com/b/ie/archive/2008/01/18/using-frames-more-securely.aspx
     *
     * HTML5 sandboxed iframes are still buggy and their DOM is not reachable from the outside (except when using postMessage)
     */
    supportsSandboxedIframes: function() {
      // Feature probe: check for the IE-specific security attribute on iframes
      var iframe = document.createElement("iframe");
      return ("security" in iframe) || isIE;
    },

    /**
     * IE6+7 throw a mixed content warning when the src of an iframe
     * is empty/unset or about:blank
     * window.querySelector is implemented as of IE8
     */
    throwsMixedContentWarningWhenIframeSrcIsEmpty: function() {
      return !hasDocumentFeature("querySelector");
    },

    /**
     * Whether the caret is correctly displayed in contentEditable elements.
     * Firefox sometimes shows a huge caret in the beginning after focusing.
     *
     * This is a behavioral issue that cannot be feature-detected, so we rely
     * on the isIE flag (IE has correct caret display).
     */
    displaysCaretInEmptyContentEditableCorrectly: function() {
      return isIE;
    },

    /**
     * Opera and IE are the only browsers who offer the css value
     * in the original unit, thx to the currentStyle object
     * All other browsers provide the computed style in px via window.getComputedStyle
     */
    hasCurrentStyleProperty: function() {
      return hasFeature("currentStyle");
    },

    /**
     * Firefox on OSX navigates through history when hitting CMD + Arrow right/left.
     *
     * This is a behavioral issue tied to Gecko + Mac, not feature-detectable.
     */
    hasHistoryIssue: function() {
      return isGecko && navigator.platform.substr(0, 3) === "Mac";
    },

    /**
     * Whether the browser inserts a <br> when pressing enter in a contentEditable element.
     *
     * Behavioral difference: Gecko inserts <br>, others insert block elements.
     * Not feature-detectable without simulating a keypress.
     */
    insertsLineBreaksOnReturn: function() {
      return isGecko;
    },

    supportsPlaceholderAttributeOn: function(element) {
      return "placeholder" in element;
    },

    supportsEvent: function(eventName) {
      return "on" + eventName in testElement || (function() {
        testElement.setAttribute("on" + eventName, "return;");
        return typeof(testElement["on" + eventName]) === "function";
      })();
    },

    /**
     * Opera doesn't correctly fire focus/blur events when clicking in- and outside of iframe.
     *
     * Uses a feature probe (onfocus on iframe) where possible, falls back to UA detection.
     */
    supportsEventsInIframeCorrectly: function() {
      return probeIframeFocusEvents();
    },

    /**
     * Everything below IE9 doesn't know how to treat HTML5 tags
     *
     * @param {Object} context The document object on which to check HTML5 support
     *
     * @example
     *    wysihtml5.browser.supportsHTML5Tags(document);
     */
    supportsHTML5Tags: function(context) {
      var element = context.createElement("div"),
          html5   = "<article>foo</article>";
      element.innerHTML = html5;
      return element.innerHTML.toLowerCase() === html5;
    },

    /**
     * Checks whether a document supports a certain queryCommand
     * In particular, Opera needs a reference to a document that has a contentEditable in it's dom tree
     * in oder to report correct results
     *
     * @param {Object} doc Document object on which to check for a query command
     * @param {String} command The query command to check for
     * @return {Boolean}
     *
     * @example
     *    wysihtml5.browser.supportsCommand(document, "bold");
     */
    supportsCommand: (function() {
      // Following commands are supported but contain bugs in some browsers.
      // These are behavioral bugs that cannot be feature-detected, so we use UA flags.
      var buggyCommands = {
        // formatBlock fails with some tags (eg. <blockquote>)
        "formatBlock":          isIE,
         // When inserting unordered or ordered lists in Firefox, Chrome or Safari, the current selection or line gets
         // converted into a list (<ul><li>...</li></ul>, <ol><li>...</li></ol>)
         // IE and Opera act a bit different here as they convert the entire content of the current block element into a list
        "insertUnorderedList":  isIE || isWebKit,
        "insertOrderedList":    isIE || isWebKit
      };

      // Firefox throws errors for queryCommandSupported, so we have to build up our own object of supported commands
      var supported = {
        "insertHTML": isGecko
      };

      return function(doc, command) {
        var isBuggy = buggyCommands[command];
        if (!isBuggy) {
          // Firefox throws errors when invoking queryCommandSupported or queryCommandEnabled
          try {
            return doc.queryCommandSupported(command);
          } catch(e1) {}

          try {
            return doc.queryCommandEnabled(command);
          } catch(e2) {
            return !!supported[command];
          }
        }
        return false;
      };
    })(),

    /**
     * IE: URLs starting with:
     *    www., http://, https://, ftp://, gopher://, mailto:, new:, snews:, telnet:, wasis:, file://,
     *    nntp://, newsrc:, ldap://, ldaps://, outlook:, mic:// and url:
     * will automatically be auto-linked when either the user inserts them via copy&paste or presses the
     * space bar when the caret is directly after such an url.
     * This behavior cannot easily be avoided in IE < 9 since the logic is hardcoded in the mshtml.dll
     * (related blog post on msdn
     * http://blogs.msdn.com/b/ieinternals/archive/2009/09/17/prevent-automatic-hyperlinking-in-contenteditable-html.aspx).
     *
     * This is a behavioral quirk of IE, not feature-detectable.
     */
    doesAutoLinkingInContentEditable: function() {
      return isIE;
    },

    /**
     * As stated above, IE auto links urls typed into contentEditable elements
     * Since IE9 it's possible to prevent this behavior
     */
    canDisableAutoLinking: function() {
      return this.supportsCommand(document, "AutoUrlDetect");
    },

    /**
     * IE leaves an empty paragraph in the contentEditable element after clearing it
     * Chrome/Safari sometimes an empty <div>
     *
     * Behavioral difference, not feature-detectable.
     */
    clearsContentEditableCorrectly: function() {
      return isGecko || isOpera || isWebKit;
    },

    /**
     * IE gives wrong results for getAttribute.
     * Uses a feature probe: create a <td> and check getAttribute behavior.
     */
    supportsGetAttributeCorrectly: function() {
      var td = document.createElement("td");
      return td.getAttribute("rowspan") != "1";
    },

    /**
     * When clicking on images in IE, Opera and Firefox, they are selected, which makes it easy to interact with them.
     * Chrome and Safari both don't support this.
     *
     * Behavioral difference, not feature-detectable.
     */
    canSelectImagesInContentEditable: function() {
      return isGecko || isIE || isOpera;
    },

    /**
     * All browsers except Safari and Chrome automatically scroll the range/caret position into view.
     *
     * Feature-detect via scrollIntoView behavior where possible; otherwise fall back to UA.
     * WebKit-based browsers (Safari, Chrome) do NOT auto-scroll, all others do.
     */
    autoScrollsToCaret: function() {
      return !isWebKit;
    },

    /**
     * Check whether the browser automatically closes tags that don't need to be opened.
     * This is a feature probe: set innerHTML and check the result.
     */
    autoClosesUnclosedTags: function() {
      var clonedTestElement = testElement.cloneNode(false),
          returnValue,
          innerHTML;

      clonedTestElement.innerHTML = "<p><div></div>";
      innerHTML                   = clonedTestElement.innerHTML.toLowerCase();
      returnValue                 = innerHTML === "<p></p><div></div>" || innerHTML === "<p><div></div></p>";

      // Cache result by overwriting current function
      this.autoClosesUnclosedTags = function() { return returnValue; };

      return returnValue;
    },

    /**
     * Whether the browser supports the native document.getElementsByClassName which returns live NodeLists.
     * Feature probe: check if the native implementation exists.
     */
    supportsNativeGetElementsByClassName: function() {
      return String(document.getElementsByClassName).indexOf("[native code]") !== -1;
    },

    /**
     * As of now (19.04.2011) only supported by Firefox 4 and Chrome
     * See https://developer.mozilla.org/en/DOM/Selection/modify
     *
     * Feature probe: check for Selection.modify API.
     */
    supportsSelectionModify: function() {
      return "getSelection" in window && "modify" in window.getSelection();
    },

    /**
     * Opera needs a white space after a <br> in order to position the caret correctly.
     *
     * Behavioral quirk, not feature-detectable.
     */
    needsSpaceAfterLineBreak: function() {
      return isOpera;
    },

    /**
     * Whether the browser supports the speech api on the given element
     * See http://mikepultz.com/2011/03/accessing-google-speech-api-2011/
     *
     * Uses a feature probe (onwebkitspeechchange / speech property) rather than just UA.
     *
     * @example
     *    var input = document.createElement("input");
     *    if (wysihtml5.browser.supportsSpeechApiOn(input)) {
     *      // ...
     *    }
     */
    supportsSpeechApiOn: function(input) {
      // Feature probe: check for the speech API properties directly
      var hasSpeechApi = ("onwebkitspeechchange" in input || "speech" in input);
      if (!hasSpeechApi) {
        return false;
      }
      // Only Chrome 11+ has a usable implementation
      var chromeVersion = userAgent.match(/Chrome\/(\d+)/) || [, 0];
      return chromeVersion[1] >= 11;
    },

    /**
     * IE9 crashes when setting a getter via Object.defineProperty on XMLHttpRequest or XDomainRequest
     * See https://connect.microsoft.com/ie/feedback/details/650112
     * or try the POC http://tifftiff.de/ie9_crash/
     *
     * This is an IE-specific bug, not feature-detectable without triggering the crash.
     */
    crashesWhenDefineProperty: function(property) {
      return isIE && (property === "XMLHttpRequest" || property === "XDomainRequest");
    },

    /**
     * IE is the only browser who fired the "focus" event not immediately when .focus() is called on an element.
     *
     * Behavioral difference, not feature-detectable.
     */
    doesAsyncFocus: function() {
      return isIE;
    },

    /**
     * In IE it's impossible for the user and for the selection library to set the caret after an <img> when it's the lastChild in the document.
     *
     * Behavioral quirk, not feature-detectable.
     */
    hasProblemsSettingCaretAfterImg: function() {
      return isIE;
    },

    hasUndoInContextMenu: function() {
      return isGecko || isChrome || isOpera;
    },

    /**
     * Opera sometimes doesn't insert the node at the right position when range.insertNode(someNode)
     * is used (regardless if rangy or native)
     * This especially happens when the caret is positioned right after a <br> because then
     * insertNode() will insert the node right before the <br>
     *
     * Behavioral quirk, not feature-detectable.
     */
    hasInsertNodeIssue: function() {
      return isOpera;
    },

    /**
     * IE 8+9 don't fire the focus event of the <body> when the iframe gets focused (even though the caret gets set into the <body>)
     *
     * Behavioral quirk, not feature-detectable.
     */
    hasIframeFocusIssue: function() {
      return isIE;
    },

    /**
     * Chrome + Safari create invalid nested markup after paste.
     *
     *  <p>
     *    foo
     *    <p>bar</p> <!-- BOO! -->
     *  </p>
     *
     * Behavioral quirk of WebKit's paste handling, not feature-detectable without actually pasting.
     */
    createsNestedInvalidMarkupAfterPaste: function() {
      return isWebKit;
    }
  };
})();
