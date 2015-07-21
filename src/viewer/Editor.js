var Editor = function (options) {
    var SIGNALS = signals;

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
        updateSelectTree: new SIGNALS.Signal(),
        endRender: new SIGNALS.Signal(),
        startRender: new SIGNALS.Signal(),
        showRuler: new SIGNALS.Signal(),
        showVProtractor: new SIGNALS.Signal(),
        showHProtractor: new SIGNALS.Signal(),
        toggleRotate: new SIGNALS.Signal(),
        saveModelPosition: new SIGNALS.Signal(),
        printScreen: new SIGNALS.Signal(),
        materialChanged: new SIGNALS.Signal()

    };

    this.MODE_VIEWER = "viewer";
    this.MODE_EDITOR = "editor";

    this.options = options;
    this.id = options.id;
    this.mode = options.mode;
    this.resultDigits = options.resultDigits;

    this.loader = new Loader(this, options.textureUrl);

    this.scene = new THREE.Scene();
    this.sceneAxis = new THREE.Scene();
    this.sceneHelpers = new THREE.Scene();

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

    selectObject: function (object) {
        this.signals.objectColorSelected.dispatch(object);
        this.signals.updateSelectTree.dispatch(object);
    },

    saveModelPosition : function(){
       this.signals.saveModelPosition.dispatch();
    },


    unSelectObject: function (object) {
        this.signals.objectColorUnSelected.dispatch(object);
        this.signals.updateSelectTree.dispatch(object);
    },

    addObject: function (object) {

        var scope = this;
        this.scene.add(object);

        this.signals.objectAdded.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();
        this.lastAdded = object;
    },

    addModelGroup : function (object) {
        var scope = this;
        this.scene.add(object);

        this.signals.objectAdded.dispatch(object);
        this.signals.sceneGraphChanged.dispatch();
        this.lastModel = object;
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


    createJsonModelWithRotation: function (modelRotation) {
        this.loader.createJsonModelWithRotation(modelRotation);
    },

     printScreen: function (url) {
       this.signals.printScreen.dispatch(url);
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
         for ( i = this.scene.children.length - 1; i >= 0 ; i -- ) {
              obj = this.scene.children[ i ];
              if (obj.parent !== undefined && !(obj instanceof THREE.Light) && !(obj instanceof THREE.PerspectiveCamera )) {
                  objsToRemove.push(obj);
                  obj.parent.remove(obj);
               }
         }

        this.signals.objectsRemoved.dispatch(objsToRemove);
        this.signals.sceneGraphChanged.dispatch();

     },


    addTexture: function (texture) {

        this.textures[ texture.uuid ] = texture;

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
