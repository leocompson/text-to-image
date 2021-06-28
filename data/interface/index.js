var config  = {
  "resize": {"timeout": null},
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "resize": {
    "timeout": null,
    "method": function () {
      var context = document.documentElement.getAttribute("context");
      if (context === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(function () {
          config.storage.write("interface.size", {
            "width": window.innerWidth || window.outerWidth,
            "height": window.innerHeight || window.outerHeight
          });
        }, 300);
      }
    }
  },
  "clear": {
    "interface": function () {
      var flag = window.confirm("Are you sure you want to clear the app?");
      if (flag) {
        config.editor.elements.color.fore.value =  "#555555";
        config.editor.elements.color.back.value =  "#ffffff";
        config.editor.elements.select.value =  "arial, sans-serif";
        config.editor.elements.editable.outerHTML = "<div xmlns='http://www.w3.org/1999/xhtml' contenteditable></div>";
        /*  */
        config.editor.store.metrics();
        window.setTimeout(function () {
          document.location.reload();
        }, 300);
      }
    }
  },
  "editor": {
    "elements": {
      "drop": null,
      "buttons": [],
      "reader": null,
      "color": {"fore": null, "back": null},
      get editable () {
        var textarea = document.querySelector(".textarea");
        return textarea.querySelector("div");
      }
    },
    "store": {
      "metrics": function () {
        config.storage.write("editor-select-value", config.editor.elements.select.value);
        config.storage.write("editor-color-fore", config.editor.elements.color.fore.value);
        config.storage.write("editor-color-back", config.editor.elements.color.back.value);
        config.storage.write("editor-outer-html", config.editor.elements.editable.outerHTML);
      }
    }
  },
  "storage": {
    "local": {},
    "read": function (id) {return config.storage.local[id]},
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          var tmp = {};
          tmp[id] = data;
          config.storage.local[id] = data;
          chrome.storage.local.set(tmp, function () {});
        } else {
          delete config.storage.local[id];
          chrome.storage.local.remove(id, function () {});
        }
      }
    }
  },
  "listeners": {
    "drop": function (e) {
      if (e && e.target) {
        if (e.target.files) {
          var file = e.target.files[0];
          if (file) {
            config.editor.elements.reader = new FileReader();
            config.editor.elements.reader.onload = function (e) {
              if (e && e.target) {
                if (e.target.result) {
                  config.editor.elements.editable.style.backgroundImage = "url('" + e.target.result + "')";
                  config.editor.store.metrics();
                }
              }
            };
            /*  */
            config.editor.elements.reader.readAsDataURL(file);
          }
        }
      }
    }
  },
  "convert": {
    "to": {
      "png": function () {
        try {
          var textarea = document.querySelector(".textarea");
          /*  */
          textarea.setAttribute("print", '');
          html2canvas(textarea, {"useCORS": true, "logging": false, "scale": 1}).then(canvas => {
            canvas.toBlob(function (blob) {
              var a = document.createElement('a');
              var url = window.URL.createObjectURL(blob);
              /*  */
              a.href = url;
              a.download = "result.png";
              document.body.appendChild(a);
              a.click();
              /*  */
              window.setTimeout(function () {
                window.URL.revokeObjectURL(url);
                document.location.reload();
              }, 300);
            });
          }).catch(function () {});
        } catch (e) {}
      }
    }
  },
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      var context = document.documentElement.getAttribute("context");
      /*  */
      if (chrome.runtime) {
        if (chrome.runtime.connect) {
          if (context !== config.port.name) {
            if (document.location.search === '') config.port.name = "form";
            if (document.location.search === "?tab") config.port.name = "tab";
            if (document.location.search === "?win") config.port.name = "win";
            if (document.location.search === "?popup") config.port.name = "popup";
            /*  */
            if (config.port.name === "popup") {
              document.documentElement.style.width = "770px";
              document.documentElement.style.height = "570px";
            }
            /*  */
            chrome.runtime.connect({"name": config.port.name});
          }
        }
      }
      /*  */
      document.documentElement.setAttribute("context", config.port.name);
    }
  },
  "app": {
    "start": function () {
      config.editor.elements.color.fore.value = config.storage.read("editor-color-fore") !== undefined ? config.storage.read("editor-color-fore") : "#555555";
      config.editor.elements.color.back.value = config.storage.read("editor-color-back") !== undefined ? config.storage.read("editor-color-back") : "#ffffff";
      config.editor.elements.select.value = config.storage.read("editor-select-value") !== undefined ? config.storage.read("editor-select-value") : "arial, sans-serif";
      config.editor.elements.editable.outerHTML = config.storage.read("editor-outer-html") !== undefined ? config.storage.read("editor-outer-html") : "<div xmlns='http://www.w3.org/1999/xhtml' contenteditable></div>";
      /*  */
      config.editor.elements.editable.focus();
      config.editor.elements.editable.addEventListener("keyup", config.editor.store.metrics);
      config.editor.elements.color.fore.addEventListener("input", config.style.textarea, false);
      config.editor.elements.color.back.addEventListener("input", config.style.textarea, false);
      /*  */
      config.editor.elements.buttons.map(function (e) {
        e.addEventListener("click", config.style.textarea);
        e.addEventListener("mousedown", function (e) {
          if (e.target.nodeName.toLowerCase() === "select") return;
          e = e || window.event;
          e.preventDefault();
        });
      });
      /*  */
      config.editor.elements.editable.addEventListener("click", function (e) {
        var parent = e.target.closest("font[size]");
        if (parent) {
          var size = parent.getAttribute("size");
          if (size) {
            config.style.font.value = Number(parent.getAttribute("size"));
            return;
          }
        }
        /*  */
        config.style.font.value = 2;
      });
    }
  },
  "load": function () {
    var reload = document.getElementById("reload");
    var support = document.getElementById("support");
    var convert = document.getElementById("convert");
    var donation = document.getElementById("donation");
    var clear = document.querySelector(".container .clear");
    var buttons = document.querySelector(".container > table");
    /*  */
    config.editor.elements.buttons = [...buttons.querySelectorAll("span")];
    config.editor.elements.color.fore = document.querySelector("input[class='fore']");
    config.editor.elements.color.back = document.querySelector("input[class='back']");
    /*  */
    config.editor.elements.select = document.querySelector("select");
    config.editor.elements.drop = document.querySelector("input[type='file']");
    config.editor.elements.drop.addEventListener("change", config.listeners.drop, false);
    config.editor.elements.select.addEventListener("change", config.style.textarea, false);
    /*  */
    clear.addEventListener("click", config.clear.interface, false);
    convert.addEventListener("click", config.convert.to.png, false);
    reload.addEventListener("click", function () {document.location.reload()}, false);
    /*  */
    support.addEventListener("click", function () {
      var url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      var url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    config.storage.load(config.app.start);
    window.removeEventListener("load", config.load, false);
  },
  "style": {
    "font": {
      "value": 2,
      "size": function (increment) {
        config.style.font.value = config.style.font.value + increment;
        if (config.style.font.value < 1) config.style.font.value = 1;
        if (config.style.font.value > 7) config.style.font.value = 7;
        /*  */
        return config.style.font.value;
      }
    },
    "textarea": function (e) {
      var span = e.target.closest("span");
      if (span) {
        var key = span.getAttribute("id");
        var command = span.getAttribute("class");
        /*  */
        if (command) document.execCommand(command, false, null);
        else {
          if (key === "decreaseFontSize") document.execCommand("fontSize", false, config.style.font.size(-1));
          if (key === "increaseFontSize") document.execCommand("fontSize", false, config.style.font.size(+1));
          if (key === "fontName") document.execCommand("fontName", false, config.editor.elements.select.value);
          /*  */
          if (key === "fileio") {
            var input = span.querySelector("input");
            if (input) input.click();
          }
          /*  */
          if (key === "foreColor") {
            var color = span.querySelector("input").value;
            if (color) document.execCommand(key, false, color);
          }
          /*  */
          if (key === "backColor") {
            var color = span.querySelector("input").value;
            if (color) config.editor.elements.editable.style.backgroundColor = color;
          }
        }
        /*  */
        config.editor.store.metrics();
      }
    }
  }
};

config.port.connect();

window.addEventListener("load", config.load, false);
window.addEventListener("resize", config.resize.method, false);
window.addEventListener("dragover", function (e) {e.preventDefault()});
window.addEventListener("drop", function (e) {if (e.target.id !== "fileio") e.preventDefault()});
