var background = {
  "port": null,
  "message": {},
  "receive": function (id, callback) {
    if (id) {
      background.message[id] = callback;
    }
  },
  "connect": function (port) {
    chrome.runtime.onMessage.addListener(background.listener); 
    /*  */
    if (port) {
      background.port = port;
      background.port.onMessage.addListener(background.listener);
      background.port.onDisconnect.addListener(function () {
        background.port = null;
      });
    }
  },
  "send": function (id, data) {
    if (id) {
      if (background.port) {
        if (background.port.name !== "webapp") {
          chrome.runtime.sendMessage({
            "method": id,
            "data": data,
            "path": "interface-to-background"
          }, function () {
            return chrome.runtime.lastError;
          });
        }
      }
    }
  },
  "post": function (id, data) {
    if (id) {
      if (background.port) {
        background.port.postMessage({
          "method": id,
          "data": data,
          "port": background.port.name,
          "path": "interface-to-background"
        });
      }
    }
  },
  "listener": function (e) {
    if (e) {
      for (let id in background.message) {
        if (background.message[id]) {
          if ((typeof background.message[id]) === "function") {
            if (e.path === "background-to-interface") {
              if (e.method === id) {
                background.message[id](e.data);
              }
            }
          }
        }
      }
    }
  }
};

var config  = {
  "addon": {
    "homepage": function () {
      return chrome.runtime.getManifest().homepage_url;
    }
  },
  "clear": {
    "interface": function () {
      const flag = window.confirm("Are you sure you want to clear the app?");
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
  "resize": {
    "timeout": null,
    "method": function () {
      if (config.port.name === "win") {
        if (config.resize.timeout) window.clearTimeout(config.resize.timeout);
        config.resize.timeout = window.setTimeout(async function () {
          const current = await chrome.windows.getCurrent();
          /*  */
          config.storage.write("interface.size", {
            "top": current.top,
            "left": current.left,
            "width": current.width,
            "height": current.height
          });
        }, 1000);
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
        const textarea = document.querySelector(".textarea");
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
    "read": function (id) {
      return config.storage.local[id];
    },
    "load": function (callback) {
      chrome.storage.local.get(null, function (e) {
        config.storage.local = e;
        callback();
      });
    },
    "write": function (id, data) {
      if (id) {
        if (data !== '' && data !== null && data !== undefined) {
          let tmp = {};
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
  "port": {
    "name": '',
    "connect": function () {
      config.port.name = "webapp";
      const context = document.documentElement.getAttribute("context");
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
  "listeners": {
    "drop": function (e) {
      if (e && e.target) {
        if (e.target.files) {
          const file = e.target.files[0];
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
          const textarea = document.querySelector(".textarea");
          /*  */
          textarea.setAttribute("print", '');
          document.documentElement.removeAttribute("theme");
          /*  */
          html2canvas(textarea, {"useCORS": true, "logging": false, "scale": 1}).then(canvas => {
            canvas.toBlob(function (blob) {
              const a = document.createElement('a');
              const url = window.URL.createObjectURL(blob);
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
  "app": {
    "start": function () {
      const theme = config.storage.read("theme") !== undefined ? config.storage.read("theme") : "light";
      /*  */
      config.editor.elements.color.fore.value = config.storage.read("editor-color-fore") !== undefined ? config.storage.read("editor-color-fore") : "#555555";
      config.editor.elements.color.back.value = config.storage.read("editor-color-back") !== undefined ? config.storage.read("editor-color-back") : "#ffffff";
      config.editor.elements.select.value = config.storage.read("editor-select-value") !== undefined ? config.storage.read("editor-select-value") : "arial, sans-serif";
      config.editor.elements.editable.outerHTML = config.storage.read("editor-outer-html") !== undefined ? config.storage.read("editor-outer-html") : "<div xmlns='http://www.w3.org/1999/xhtml' contenteditable></div>";
      /*  */
      config.editor.elements.editable.focus();
      document.documentElement.setAttribute("theme", theme !== undefined ? theme : "light");
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
        const parent = e.target.closest("font[size]");
        if (parent) {
          const size = parent.getAttribute("size");
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
    const theme = document.getElementById("theme");
    const reload = document.getElementById("reload");
    const support = document.getElementById("support");
    const convert = document.getElementById("convert");
    const donation = document.getElementById("donation");
    const clear = document.querySelector(".container .clear");
    const buttons = document.querySelector(".container > table");
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
    /*  */
    reload.addEventListener("click", function () {
      document.location.reload();
    }, false);
    /*  */
    support.addEventListener("click", function () {
      const url = config.addon.homepage();
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    donation.addEventListener("click", function () {
      const url = config.addon.homepage() + "?reason=support";
      chrome.tabs.create({"url": url, "active": true});
    }, false);
    /*  */
    theme.addEventListener("click", function () {
      let attribute = document.documentElement.getAttribute("theme");
      attribute = attribute === "dark" ? "light" : "dark";
      /*  */
      document.documentElement.setAttribute("theme", attribute);
      config.storage.write("theme", attribute);
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
      const span = e.target.closest("span");
      if (span) {
        const key = span.getAttribute("id");
        const command = span.getAttribute("class");
        /*  */
        if (command) {
          document.execCommand(command, false, null);
        } else {
          if (key === "decreaseFontSize") document.execCommand("fontSize", false, config.style.font.size(-1));
          if (key === "increaseFontSize") document.execCommand("fontSize", false, config.style.font.size(+1));
          if (key === "fontName") document.execCommand("fontName", false, config.editor.elements.select.value);
          /*  */
          if (key === "fileio") {
            const input = span.querySelector("input");
            if (input) input.click();
          }
          /*  */
          if (key === "foreColor") {
            const color = span.querySelector("input").value;
            if (color) document.execCommand(key, false, color);
          }
          /*  */
          if (key === "backColor") {
            const color = span.querySelector("input").value;
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
