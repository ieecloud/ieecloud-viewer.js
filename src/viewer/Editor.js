var Editor = function (options) {
    var SIGNALS = window.signals;

    this.signals = {
        // notifications
        sceneGraphChanged: new SIGNALS.Signal(),
        rendererChanged: new SIGNALS.Signal(),
        objectSelected: new SIGNALS.Signal(),
        objectAdded: new SIGNALS.Signal(),
        objectRemoved: new SIGNALS.Signal(),
        objectsRemoved: new SIGNALS.Signal(),
        objectChanged: new SIGNALS.Signal(),
        clearColorChanged: new SIGNALS.Signal(),
        windowResize: new SIGNALS.Signal(),
        axisChanged: new SIGNALS.Signal(),
        scaleChanged: new SIGNALS.Signal(),
        objectColorSelected: new SIGNALS.Signal(),
        objectColorUnSelected: new SIGNALS.Signal(),
        selectTree: new SIGNALS.Signal(),
        select3dPoint: new SIGNALS.Signal(),
        endRender: new SIGNALS.Signal(),
        treeLoad: new SIGNALS.Signal(),
        startRender: new SIGNALS.Signal(),
        onPrintScreenDone: new SIGNALS.Signal(),
        showRuler: new SIGNALS.Signal(),
        showVProtractor: new SIGNALS.Signal(),
        showHProtractor: new SIGNALS.Signal(),
        toggleRotate: new SIGNALS.Signal(),
        toggleSearchNearestMode: new SIGNALS.Signal(),
        saveModelPosition: new SIGNALS.Signal(),
        printScreen: new SIGNALS.Signal(),
        materialChanged: new SIGNALS.Signal(),
        setMode: new SIGNALS.Signal()

    };

    this.MODE_FACES_EDGES = "faces_and_nodes";
    this.MODE_3D_POINT = "3d_point";
    this.MODE_3D_GEOMETRY = "3d_geometry";

    this.options = options;
    this.id = options.id;
    this.mode = options.mode;
    this.resultDigits = options.resultDigits;

    this.loader = new Loader(this, options.textureUrl);

    this.scene = new THREE.Scene();
    this.sceneAxis = new THREE.Scene();
    this.sceneHelpers = new THREE.Scene();
    this.pickingScene = new THREE.Scene();
    this.octree = new THREE.Octree( {
        // uncomment below to see the octree (may kill the fps)
        //scene: scene,
        // when undeferred = true, objects are inserted immediately
        // instead of being deferred until next octree.update() call
        // this may decrease performance as it forces a matrix update
        undeferred: true,
        // set the max depth of tree
        depthMax: Infinity,
        // max number of objects before nodes split or merge
        objectsThreshold: 8,
        // percent between 0 and 1 that nodes will overlap each other
        // helps insert objects that lie over more than one node
        overlapPct: 0.15
    } );

    this.object = {};
    this.geometries = {};
    this.materials = {};
    this.textures = {};

    this.selected = null;
    this.lastAdded = null;
    this.lastModel = null;
    this.helpers = {};

};

Editor.prototype = {

    onRenderStart: function () {
        this.signals.startRender.dispatch();
    },

    onRenderDone: function () {
        this.signals.endRender.dispatch();
    },

    onPrintScreenDone: function (urlRenderer) {
        this.signals.onPrintScreenDone.dispatch(urlRenderer);
    },

    onTreeLoad: function (tree) {
        this.signals.treeLoad.dispatch(tree);
    },

    selectObject: function (object) {
        this.signals.objectColorSelected.dispatch(object);
    },

    selectTree: function (object) {
        this.signals.selectTree.dispatch(object, true);
    },

    select3dPoint: function (point) {
        this.signals.select3dPoint.dispatch(point);
    },

    saveModelPosition: function () {
        this.signals.saveModelPosition.dispatch();
    },


    unSelectObject: function (object) {
        this.signals.objectColorUnSelected.dispatch(object);
    },

    unSelectTree: function (object) {
        this.signals.selectTree.dispatch(object, false);
    },

    addObject: function (object) {

        var scope = this;
        this.scene.add(object);

        this.signals.objectAdded.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();
        this.lastAdded = object;
    },

    addModelGroup: function (object) {
        this.scene.add(object);

        this.signals.objectAdded.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();
        this.lastModel = object;
    },

    addPickingGroup: function (object) {
        var scope = this;
        this.pickingScene.add(object);

        // this.signals.objectAdded.dispatch(object);
        // this.signals.sceneGraphChanged.dispatch();
        // this.lastModel = object;
    },


    calculateSpaceScale: function (commonBoundingBox, calculateSpaceScale) {
        this.signals.scaleChanged.dispatch(commonBoundingBox, calculateSpaceScale);
    },

    reRender: function () {
        this.signals.sceneGraphChanged.dispatch();
    },

    changeAxis: function (direction) {
        this.signals.axisChanged.dispatch(direction);
        this.loader.computeBoundingBox();
    },

    showRuler: function (flag) {
        this.signals.showRuler.dispatch(flag);
    },

    showHProtractor: function (flag) {
        this.signals.showHProtractor.dispatch(flag);
    },

    showVProtractor: function (flag) {
        this.signals.showVProtractor.dispatch(flag);
    },

    toggleRotate: function (flag) {
        this.signals.toggleRotate.dispatch(flag);
    },

    toggleSearchNearestMode: function (flag) {
        this.signals.toggleSearchNearestMode.dispatch(flag);
    },

    setMode: function (mode) {
        this.mode = mode;
        this.signals.setMode.dispatch();
    },


    setOptions: function (newOptions) {
        this.options = newOptions;
        this.id = newOptions.id;
        this.mode = newOptions.mode;
        this.resultDigits = newOptions.resultDigits;
        this.loader.setTextureUrl(newOptions.textureUrl);
        this.signals.setMode.dispatch();
    },


    createJsonModelWithRotation: function (modelRotation) {
        this.loader.createJsonModelWithRotation(modelRotation);
    },

    printScreen: function (toFileName) {
        this.signals.printScreen.dispatch(toFileName);
    },


    removeObject: function (object) {

        if (object.parent === undefined) {
            return;
        }

        var scope = this;

        object.parent.remove(object);
        this.signals.objectRemoved.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();

    },


    removeAllObjects: function () {

        var objsToRemove = [];
        for (var i = this.scene.children.length - 1; i >= 0; i--) {
            var obj = this.scene.children[i];
            if (obj.parent !== undefined && !(obj instanceof THREE.Light) && !(obj instanceof THREE.PerspectiveCamera )) {
                objsToRemove.push(obj);
                obj.parent.remove(obj);
            }
        }
        this.lastModel = null;
        delete this.lastModel;
        this.signals.objectsRemoved.dispatch(objsToRemove);
        this.signals.sceneGraphChanged.dispatch();

    },


    addTexture: function (texture) {

        this.textures[texture.uuid] = texture;

    },


    parent: function (object, parent) {

        if (parent === undefined) {

            parent = this.scene;

        }

        parent.add(object);

        this.signals.sceneGraphChanged.dispatch();

    },


    select: function (object) {

        this.selected = object;
        this.signals.objectSelected.dispatch(object);

    },

    selectById: function (id) {

        var object = null;

        this.scene.traverse(function (child) {
            if (child.id === id) {
                object = child;
            }
        });

        this.select(object);

    },

    deselect: function () {

        this.select(null);

    }
};
