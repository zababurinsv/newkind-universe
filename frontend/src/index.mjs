import events from "@newkind/events";
import {IDBFS} from '@newkind/fs'
import IsEmpty from './modules/isEmpty/isEmpty.mjs'
export default () => {
    return new Promise(async (resolve, reject) => {
        let isEmpty = IsEmpty
        let self = {
            import: (path = '') => {
                return new Promise(async (resolve, reject) => {
                    resolve(await import(path))
                })
            },
            dom: (win = window, params ="default" | {
                status: undefined,
                progress: undefined,
                spinner: undefined,
                canvas: undefined,
                onerror: undefined,
                element: undefined
            }) => {
                return new Promise(async (resolve, reject) => {
                    if(params === 0) {
                        self.data.status = win.document.getElementById('status');
                        self.data.progress = win.document.getElementById('progress');
                        self.data.spinner = win.document.getElementById('spinner');
                        self.data.element = win.document.getElementById('output');
                        self.data.canvas = win.document.getElementById('canvas');
                        self.data.onerror = win.onerror = () => {}
                    } else {

                    }
                    resolve(true)
                })
            },
            data: new Proxy({
                    status: undefined,
                    progress: undefined,
                    spinner: undefined,
                    canvas: undefined,
                    onerror: undefined,
                    element: undefined,
                    wasmBinary: false
                },  {
                    get: (obj, prop) => {
                        if(self.is.debug) {
                            console.log({
                                _:'proxy get',
                                prop:prop,
                                obj:obj,
                                value:obj[prop]
                            })
                        }
                        return obj[prop];
                    },
                    set: (obj, prop, value) => {
                        if(isEmpty(obj[prop])){
                            obj[prop] = []
                        }

                        self.is[`${prop}`] = true
                        obj[prop] = value;
                        let ready = true
                        for(let key in self.data) {
                            if(self.is.strict) {
                                if(isEmpty(self.is[key])) {
                                    ready = false
                                    break
                                }
                            }
                        }
                        self.is.ready = ready
                        if(!self.is.strict) {
                            self.is.ready = true
                        }
                        return true
                    }
                }
            ),
            is: {
                wasmBinary: false,
                strict: true,
                status: false,
                progress: false,
                spinner: false,
                canvas: false,
                onerror: false,
                element: false,
                ready: false,
                debug: false,
                IDBFS: (disabled = true) => {
                    return new Promise(async (resolve, reject) => {
                        resolve(true)
                    })
                },
                events: (disabled = true) => {
                    return new Promise(async (resolve, reject) => {
                        resolve(true)
                    })
                }
            },
            totalDependencies: 0,
            init: () => {
                return new Promise(async (resolve, reject) => {
                    try {
                        if(self.is.ready) {
                            let Module = {
                                wasmBinary: self.data.wasmBinary,
                                locateFile: function () {

                                },
                                preRun: [],
                                postRun: [],
                                print: (function() {
                                    if (self.data.element) self.data.element.value = ''; // clear browser cache
                                    return function(text) {
                                        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                                        // These replacements are necessary if you render to raw HTML
                                        //text = text.replace(/&/g, "&amp;");
                                        //text = text.replace(/</g, "&lt;");
                                        //text = text.replace(/>/g, "&gt;");
                                        //text = text.replace('\n', '<br>', 'g');
                                        console.log(text);
                                        if (self.data.element) {
                                            self.data.element.value += text + "\n";
                                            self.data.element.scrollTop = self.data.element.scrollHeight; // focus on bottom
                                        }
                                    };
                                })(),
                                printErr: function(text) {
                                    if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
                                    console.error(text);
                                },
                                canvas: (function() {
                                    console.log('canvas',this)
                                    // let canvas = document.getElementById('canvas');

                                    // As a default initial behavior, pop up an alert when webgl context is lost. To make your
                                    // application robust, you may want to override this behavior before shipping!
                                    // See http://www.khronos.org/registry/webgl/specs/latest/1.0/#5.15.2
                                    self.data.canvas.addEventListener("webglcontextlost", function(e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);

                                    return self.data.canvas;
                                })(),
                                setStatus: function(text) {
                                    if (!Module.setStatus.last) Module.setStatus.last = { time: Date.now(), text: '' };
                                    if (text === Module.setStatus.last.text) return;
                                    let m = text.match(/([^(]+)\((\d+(\.\d+)?)\/(\d+)\)/);
                                    let now = Date.now();
                                    if (m && now - Module.setStatus.last.time < 30) return; // if this is a progress update, skip it if too soon
                                    Module.setStatus.last.time = now;
                                    Module.setStatus.last.text = text;
                                    if (m) {
                                        text = m[1];
                                        self.data.progress.value = parseInt(m[2])*100;
                                        self.data.progress.max = parseInt(m[4])*100;
                                        self.data.progress.hidden = false;
                                        self.data.spinner.hidden = false;
                                    } else {
                                        self.data.progress.value = null;
                                        self.data.progress.max = null;
                                        self.data.progress.hidden = true;
                                        if (!text) self.data.spinner.style.display = 'none';
                                    }
                                    self.data.status.innerHTML = text;
                                },
                                monitorRunDependencies: function(left) {
                                    self.totalDependencies = Math.max(self.totalDependencies, left);
                                    Module.setStatus(left ? 'Preparing... (' + (self.totalDependencies-left) + '/' + self.totalDependencies + ')' : 'All downloads complete.');
                                }
                            };
                            Module.setStatus('Downloading...');

                           self.data.onerror =  function(event) {
                                //TODO: do not warn on ok events like simulating an infinite loop or exitStatus
                                Module.setStatus('Exception thrown, see JavaScript console');
                                Module.data.spinner.style.display = 'none';
                                Module.setStatus = function(text) {
                                    if (text) Module.printErr('[post-exception status] ' + text);
                                };
                            };
                            resolve(Module)
                        } else {
                            console.warn('нет все объекты подключенны', self.data)
                            resolve(self)
                        }

                    } catch (e) {
                        console.error(e)
                    }
                })
            }
        }
        resolve(self)
    })
}