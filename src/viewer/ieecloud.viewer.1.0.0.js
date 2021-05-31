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
        window.BlobBuilder = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder;
        $this.threeEditor = new Editor($this.options);
        $this.viewport = new Viewport($this.threeEditor);
        $this.viewport.mainContainer.setTop('0px');
        $this.viewport.mainContainer.setLeft('0px');
        $this.viewport.mainContainer.setRight('0px');
        $this.viewport.mainContainer.setBottom('0px');
        $this.viewport.slaveContainer.setLeft('0px');
        $this.viewport.slaveContainer.setBottom('0px');
        $this.viewport.slave2Container.setLeft('20px');
        $this.viewport.slave2Container.setTop('60px');
        $this.target.append($this.viewport.mainContainer.dom);
        $this.target.append($this.viewport.slaveContainer.dom);
        $this.target.append($this.viewport.slave2Container.dom);
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

        $this.threeEditor.signals.selectSimpleShape.add(function (id) {
            if ($this.options.onSelectSimpleShape) {
                $this.options.onSelectSimpleShape(id);
            }
        });

        $this.threeEditor.signals.dispatchModelPosition.add(function (modelPosition) {
            if ($this.options.onSaveModelPosition) {
                $this.options.onSaveModelPosition(modelPosition);
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

        $this.threeEditor.signals.onPrintScreenDone.add(function (urlRenderer, printScreenMetadata) {
            if ($this.options.onPrintScreenDone) {
                $this.options.onPrintScreenDone(urlRenderer, printScreenMetadata);
            }
        });

        $this.threeEditor.signals.onZipUpdateStatus.add(function (status, percent) {
            if ($this.options.onZipUpdateStatus) {
                $this.options.onZipUpdateStatus(status, percent);
            }
        });

        $this.threeEditor.signals.onFindNearestObject.add(function (objProperties) {
            if ($this.options.onFindNearestObject) {
                $this.options.onFindNearestObject(objProperties);
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

    Viewer.prototype.attachTo = function (divTarget, options) {
        this.removeSelectedResults();
        this.resetCameraRotation();
        $(this.target).remove( "#main" + this.threeEditor.id );
        this.threeEditor.setOptions(options);
        this.options = options;
        this.target = divTarget;
        this.target.append(this.viewport.mainContainer.dom);
        this.target.append(this.viewport.slaveContainer.dom);
    };

    Viewer.prototype.resize = function () {
        scope.threeEditor.signals.windowResize.dispatch();
    };

    Viewer.prototype.reloadModel = function (modelJsn) {
        this.threeEditor.loader.reloadModel(modelJsn);
    };

    Viewer.prototype.changeColorForSimpleShapes = function (simpleShapeId, colorHex) {
        this.threeEditor.changeColorForSimpleShapes(simpleShapeId, colorHex);
    };

    Viewer.prototype.changeMaterialForSimpleShapes = function (simpleShapeId) {
        this.threeEditor.changeMaterialForSimpleShapes(simpleShapeId);
    };

    Viewer.prototype.loadBinaryModel = function (zipModelUrl) {
        this.threeEditor.loader.loadBinaryModel(zipModelUrl);
    };

    Viewer.prototype.loadBase64Model = function (zipModelUrl) {
        this.threeEditor.loader.loadBase64Model(zipModelUrl);
    };

    Viewer.prototype.changeRotationScale = function (rotationScale) {
        if(rotationScale) {
            this.options.rotationScale = rotationScale;
            this.threeEditor.setOptions(this.options);
        }
    };

    Viewer.prototype.removeModel = function () {
        this.threeEditor.loader.removeModel();
    };

    Viewer.prototype.toggleWholeModel = function (objData) {
        this.threeEditor.toggleWholeModel(objData);
    };

    Viewer.prototype.selectObject = function (objData) {
        this.threeEditor.loader.selectObject(objData);
    };

    Viewer.prototype.unSelectObject = function (objData) {
        this.threeEditor.loader.unSelectObject(objData);
    };


    Viewer.prototype.preShowObject = function (objData) {
        this.threeEditor.preShowObject(objData);
    };

    Viewer.prototype.showObject = function (objData) {
        this.threeEditor.loader.showObject(objData);
    };

    Viewer.prototype.updateModelTexture = function (objData, isObjectShow) {
        this.threeEditor.updateModelTexture(objData, isObjectShow);
    };

    Viewer.prototype.preHideObject = function (objData) {
        this.threeEditor.preHideObject(objData);
    };

    Viewer.prototype.hideObject = function (objData) {
        this.threeEditor.loader.hideObject(objData);
    };


    Viewer.prototype.getTreeModel = function () {
        return this.threeEditor.loader.getObjectsTreeModel();
    };


    Viewer.prototype.removeSelectedResults = function () {
       this.threeEditor.removeSelectedResults();
    };

    Viewer.prototype.resetCameraRotation = function () {
       this.threeEditor.resetCameraRotation();
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

    Viewer.prototype.toggleIsolines = function (value) {
        this.threeEditor.toggleIsolines(value);
    };

    Viewer.prototype.setMinMaxUserInput = function (min,max) {
        this.threeEditor.setMinMaxUserInput(min,max);
    };

    Viewer.prototype.toggleMinMaxResults = function (value) {
        this.threeEditor.toggleMinMaxResults(value);
    };

    Viewer.prototype.setTexture = function (textureName) {
        this.threeEditor.setTexture(textureName);
    };

    Viewer.prototype.reloadTexture = function () {
        this.threeEditor.reloadTexture();
    };

    Viewer.prototype.printScreen = function (toFileName) {
        this.threeEditor.printScreen(toFileName);
    };

    Viewer.prototype.setMode = function (mode) {
        this.threeEditor.setMode(mode);
    };

    Viewer.prototype.setSearchNearestPointMode = function (mode) {
        this.threeEditor.setSearchNearestPointMode(mode);
    };

    Viewer.prototype.setResultDigits = function (resultDigits) {
        this.threeEditor.setResultDigits(resultDigits);
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
        textureBase64: undefined,
        texture: undefined,
        textures: undefined,
        id: undefined,
        mode: "3d_point",
        resultDigits: 2,
        modeInfoVisible: true,
        rulerInfoVisible: true,
        nearestPointInfoVisible: true,
        drawResults: true,
        gridVisible: false,
        axisVisible: false,
        resultTextColor: "black",
        sceneBackgroundColor:"white",
        infoTextColor:"black",
        backgroundColor: "#aaa",
        nearestPointColor: "red",
        resultPointColor: "white",
        resultPointSize: 0.005,
        searchNearestPointMode: "MESHES"

    };

})(jQuery);


