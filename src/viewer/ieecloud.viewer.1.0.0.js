/*
 * Viewer 1.0.0 plugin
 */

function Viewer(target, options) {
    var scope = this;
    this.target = target;
    this.options = options;
    this.threeEditor = undefined;


    /*
     * Private functions
     */

    var init = function ($this) {
        window.URL = window.URL || window.webkitURL;
        window.THREE = THREE;
        window.signals = signals;
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        $this.threeEditor = new Editor($this.options);
        var viewport = new Viewport($this.threeEditor);
        viewport.mainContainer.setTop('0px');
        viewport.mainContainer.setLeft('0px');
        viewport.mainContainer.setRight('0px');
        viewport.mainContainer.setBottom('0px');
        viewport.slaveContainer.setLeft('0px');
        viewport.slaveContainer.setBottom('0px');
        $this.target.append(viewport.mainContainer.dom);
        $this.target.append(viewport.slaveContainer.dom);
        onWindowResize($this.threeEditor);
        signalsListen($this);
    };
    var onWindowResize = function (editor) {
        editor.signals.windowResize.dispatch();
    };


    var signalsListen = function ($this) {
        $this.threeEditor.signals.selectTree.add(function (object, value) {
            if ($this.options.onSelectObject) {
                $this.options.onSelectObject(object, value);
            }

        });


        $this.threeEditor.signals.select3dPoint.add(function (point) {
            if ($this.options.onSelect3dPoint) {
                $this.options.onSelect3dPoint(point);
            }
        });

        $this.threeEditor.signals.startRender.add(function () {
            if ($this.options.onStartRender) {
                $this.options.onStartRender();
            }

        });

        $this.threeEditor.signals.endRender.add(function () {
            if ($this.options.onEndRender) {
                $this.options.onEndRender();
            }
        });


        $this.threeEditor.signals.treeLoad.add(function (tree) {
            if ($this.options.onTreeLoad) {
                $this.options.onTreeLoad(tree);
            }
        });

        $this.threeEditor.signals.onPrintScreenDone.add(function (urlRenderer) {
            if ($this.options.onPrintScreenDone) {
                $this.options.onPrintScreenDone(urlRenderer);
            }
        });

    };


    window.addEventListener('resize', function () {
        scope.threeEditor.signals.windowResize.dispatch();
    }, false);


    /*
     * Public methods
     */

    Viewer.prototype.addModel = function (modelJsn) {
        this.threeEditor.loader.handleJSONData(modelJsn);
    };

    Viewer.prototype.resize = function () {
        scope.threeEditor.signals.windowResize.dispatch();
    };

    Viewer.prototype.reloadModel = function (modelJsn) {
        this.threeEditor.loader.reloadModel(modelJsn);
    };

    Viewer.prototype.removeModel = function () {
        this.threeEditor.loader.removeModel();
    };

    Viewer.prototype.selectObject = function (objData) {
        this.threeEditor.loader.selectObject(objData);
    };

    Viewer.prototype.unSelectObject = function (objData) {
        this.threeEditor.loader.unSelectObject(objData);
    };

    Viewer.prototype.getTreeModel = function () {
        return this.threeEditor.loader.getObjectsTreeModel();
    };

    Viewer.prototype.changeAxisUpY = function () {
        this.threeEditor.changeAxis("upY");
    };

    Viewer.prototype.showRuler = function (show) {
        this.threeEditor.showRuler(show);
    };

    Viewer.prototype.showHProtractor = function (show) {
        this.threeEditor.showHProtractor(show);
    };

    Viewer.prototype.showVProtractor = function (show) {
        this.threeEditor.showVProtractor(show);
    };

    Viewer.prototype.toggleRotate = function (value) {
        this.threeEditor.toggleRotate(value);
    };

    Viewer.prototype.toggleSearchNearestMode = function (value) {
        this.threeEditor.toggleSearchNearestMode(value);
    };


    Viewer.prototype.changeAxisUpZ = function () {
        this.threeEditor.changeAxis("upZ");
    };

    Viewer.prototype.saveModelPosition = function () {
        this.threeEditor.saveModelPosition();
    };

    Viewer.prototype.printScreen = function (toFileName) {
        this.threeEditor.printScreen(toFileName);
    };

    Viewer.prototype.setMode = function (mode) {
        this.threeEditor.setMode(mode);
    };
    init(this);
}


(function ($) {

    $.fn.ieecloudEditor = function (method) {
        var args = arguments;
        var rv;
        var allObjs = this.each(function () {
            var viewer = $(this).data('ieecloudEditor');
            if (typeof method === 'object' || !method) {
                var options = $.extend({}, $.fn.ieecloudEditor.defaults, method || {});
                var viewer3d = new Viewer($(this), options);
                $(this).data('ieecloudEditor', viewer3d);
            } else {
                if (typeof Viewer.prototype[method] === "function") {
                    rv = Viewer.prototype[method].apply(viewer, Array.prototype.slice.call(args, 1));
                    return rv;
                } else {
                    $.error('Method ' + method + ' does not exist on jQuery.ieecloudEditor');
                }
            }
        });
        if (rv === undefined) {
            return allObjs;
        } else {
            return rv;
        }
    };

// Default Properties and Events
    $.fn.ieecloudEditor.defaults = {
        textureUrl: undefined,
        id: undefined,
        mode: "3d_point",
        resultDigits: 2,
        drawResults: true,
        gridVisible: true,
        resultTextColor: "white",
        backgroundColor: "#aaa",
        nearestPointColor: "red",
        resultPointColor: "white",
        resultPointSize: 0.005

    };

})(jQuery);


