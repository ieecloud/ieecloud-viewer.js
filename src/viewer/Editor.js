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
        dispatchModelPosition: new SIGNALS.Signal(),
        endRender: new SIGNALS.Signal(),
        treeLoad: new SIGNALS.Signal(),
        startRender: new SIGNALS.Signal(),
        onPrintScreenDone: new SIGNALS.Signal(),
        onZipUpdateStatus: new SIGNALS.Signal(),
        onFindNearestObject: new SIGNALS.Signal(),
        showRuler: new SIGNALS.Signal(),
        showVProtractor: new SIGNALS.Signal(),
        showHProtractor: new SIGNALS.Signal(),
        toggleRotate: new SIGNALS.Signal(),
        toggleSearchNearestMode: new SIGNALS.Signal(),
        saveModelPosition: new SIGNALS.Signal(),
        removeSelectedResults: new SIGNALS.Signal(),
        changeResultDigits: new SIGNALS.Signal(),
        resetCameraRotation: new SIGNALS.Signal(),
        printScreen: new SIGNALS.Signal(),
        materialChanged: new SIGNALS.Signal(),
        unHighlightGeometryObjects: new SIGNALS.Signal(),
        setMode: new SIGNALS.Signal(),
        setSearchNearestPointMode: new SIGNALS.Signal(),
        objectShow: new SIGNALS.Signal(),
        objectHide: new SIGNALS.Signal()
    };

    this.MODE_FACES_EDGES = "faces_and_nodes";
    this.MODE_3D_POINT = "3d_point";
    this.MODE_3D_GEOMETRY = "3d_geometry";

    this.options = options;
    this.id = options.id;
    this.mode = options.mode;
    this.searchNearestPointMode = options.searchNearestPointMode;
    this.resultDigits = options.resultDigits;

    this.loader = new Loader(this, options.textureUrl, options.textureBase64, options.texture, options.textures);

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(options.sceneBackgroundColor);
    this.sceneAxis = new THREE.Scene();
    this.sceneResults = new THREE.Scene();
    this.sceneHelpers = new THREE.Scene();
    this.pickingScene = new THREE.Scene();
    this.octree = new THREE.Octree({
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
    });

    this.object = {};
    this.geometries = {};
    this.materials = {};
    this.textures = {};

    this.selected = null;
    this.lastAdded = null;
    this.lastModel = null;
    this.helpers = {};
    this.showIsolinesFlag = false;
    this.mapTextureNameToDetails = {};
    // this.sumTime = 0;
    // this.startDate = new Date();

};

Editor.prototype = {

    onRenderStart: function () {
        this.signals.startRender.dispatch();
    },

    onRenderDone: function () {
        this.signals.endRender.dispatch();
    },

    onZipUpdateStatus: function (status, percent) {
        this.signals.onZipUpdateStatus.dispatch(status, percent);
    },

    onPrintScreenDone: function (urlRenderer) {
        this.signals.onPrintScreenDone.dispatch(urlRenderer);
    },

    onFindNearestObject: function (objProperties) {
        this.signals.onFindNearestObject.dispatch(objProperties);
    },

    onTreeLoad: function (tree) {
        this.signals.treeLoad.dispatch(tree);
    },

    selectObject: function (object) {
        this.signals.objectColorSelected.dispatch(object);
    },


    makeWholeObjectsChainVisible: function (object) {
        var me =  this;
        object.visible = true;
        var parentToShowObject = object.parent;
        if(parentToShowObject && !(parentToShowObject instanceof THREE.Scene)){
            me.makeWholeObjectsChainVisible(parentToShowObject);

        }
    },

    preShowObject: function (object) {
        var me = this;
        if (object !== null && !object.visible) {

            me.makeWholeObjectsChainVisible(object);

            if(!me.lastModel.visible){
                me.lastModel.visible = true;
            }
            if (me.loader.DRAW_RESULTS && !object.isModelContainerObj) {

                if (!(object instanceof THREE.Mesh)) {
                    return;
                }

                var maxGeometryResult = object.parent.userData.extremumResultData.maxGeometryResult;
                var minGeometryResult = object.parent.userData.extremumResultData.minGeometryResult;
                var resultInfo = me.getResultInfo();

                var maxResult = resultInfo.maxResult;
                var minResult = resultInfo.minResult;

                var maxChanged = maxGeometryResult >= maxResult || !maxResult;
                var minChanged = minGeometryResult <= minResult || !minResult;
                me.loader.pretenderMaxs.add(maxGeometryResult);
                if (maxChanged) {
                    maxResult = maxGeometryResult;
                }
                me.loader.pretenderMins.add(minGeometryResult);
                if (minChanged) {
                    minResult = minGeometryResult;
                }

                if (maxChanged || minChanged) {
                    me.setMinMaxResult(minResult, maxResult);
                }
            }
        }
    },


    showObject: function (object) {
        var me = this;
        if (object !== null) {
            me.preShowObject(object);
        }
    },

    updateModelTexture: function (object, isObjectShow) {
        var me = this;

        var resultInfo = me.getResultInfo();

        if (_.isUndefined(resultInfo)) {
            this.signals.objectChanged.dispatch(object);
            return;
        }

        var maxResult = resultInfo.maxResult;
        var minResult = resultInfo.minResult;
        var textureNeedToRecalculate = resultInfo.dirty;


        if (textureNeedToRecalculate) {
            // need recalculate the whole tree
            me.recalculateUvs(this.loader.objectsTree, maxResult, minResult, function (oNode) {
                if (oNode.object && oNode.object instanceof THREE.Mesh && oNode.object.visible /*&& oNode.object.isSimpleShape === false*/) return true;
            });
            resultInfo.dirty = false;
        } else {
            // need recalculate only object to show with untouched max/min
            if(isObjectShow){
                me.loader.traverseTree(object, function (child) {
                    if (child instanceof THREE.Mesh) {
                        var groups = child.userData.groups;
                        if (!_.isUndefined(groups)) {
                            me.recalculateMeshUvs(child, maxResult, minResult);
                        }
                    }
                });
            }
        }

        this.signals.objectChanged.dispatch(object);
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


    getNewUv: function (prevUv, newMaxResult, newMinResult, prevMaxResult, prevMinResult) {
        var me = this;
        var result = prevUv * (prevMaxResult - prevMinResult) + prevMinResult;
        return me.loader.getV(result, newMaxResult, newMinResult);
    },

    recalculateMeshUvs: function (object, maxResult, minResult) {
        var me = this;
        var groups = object.userData.groups;
        var faceGroups = object.userData.faces;
        var results = object.userData.totalObjResults;

        var uvs = [];

        for (var j = 0; j < groups.length; j++) {
            var faces = faceGroups[j];
            var offset = 0;
            while (offset < faces.length) {
                uvs.push(
                    0.0,
                    me.loader.getV(results[faces[offset]], maxResult, minResult),
                    0.0,
                    me.loader.getV(results[faces[offset + 1]], maxResult, minResult),
                    0.0,
                    me.loader.getV(results[faces[offset + 2]], maxResult, minResult));


                uvs.push(
                    0.0,
                    me.loader.getV(results[faces[offset]], maxResult, minResult),
                    0.0,
                    me.loader.getV(results[faces[offset + 2]], maxResult, minResult),
                    0.0,
                    me.loader.getV(results[faces[offset + 1]], maxResult, minResult));
                offset = offset + 3;
            }
        }
        object.geometry.addAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    },

    recalculateUvs: function (aTree, newMaxResult, newMinResult, fCompair) {


        var me = this;
        var aInnerTree = [];
        var oNode;

        if (_.isUndefined(newMinResult) || _.isUndefined(newMaxResult)) {
            return;
        }

        for (var keysTree in aTree) {
            aInnerTree.push(aTree[keysTree]);
        }
        while (aInnerTree.length > 0) {
            oNode = aInnerTree.pop();
            if (fCompair(oNode)) {
                var groups = oNode.object.userData.groups;

                if (_.isUndefined(groups)) {
                    continue;
                }
                me.recalculateMeshUvs(oNode.object, newMaxResult, newMinResult);
            } else {
                for (var keysNode in oNode) {
                    if (oNode[keysNode] instanceof Array) {
                        for (var i = 0; i < oNode[keysNode].length; i++) {
                            aInnerTree.push(oNode[keysNode][i]);
                        }
                    }
                }
            }
        }
    },

    toggleWholeModel: function(visible){
        var me = this;
        this.lastModel.visible = visible;

        // recalculate for Whole model not for every geometry object
        if (me.loader.DRAW_RESULTS) {
            var resultInfo = me.getResultInfo();

            var maxResult = resultInfo.maxResult;
            var minResult = resultInfo.minResult;
            me.recalculateUvs(this.loader.objectsTree, maxResult, minResult, function (oNode) {
                if (oNode.object && oNode.object instanceof THREE.Mesh /*&& oNode.object.isSimpleShape === false*/) return true;
            });
        }
        this.signals.objectChanged.dispatch(this.lastModel)

    },

    preHideObject: function (object) {
        var me = this;
        if (object !== null && object.visible) {

            if(!object.isIndeterminate){
                object.visible = false;
            }
            if (me.loader.DRAW_RESULTS && !object.isModelContainerObj) {

                var parentToHideObject = object.parent;

                var parentObjectAllChildren = parentToHideObject.children;

                var hasSomeVisibleChild = _.some(parentObjectAllChildren, function(child) {
                    return child.visible === true;
                });

                if(hasSomeVisibleChild){
                    return;
                }

                var maxGeometryResult = object.parent.userData.extremumResultData.maxGeometryResult;
                var minGeometryResult = object.parent.userData.extremumResultData.minGeometryResult;
                var resultInfo = me.getResultInfo();

                var maxResult = resultInfo.maxResult;
                var minResult = resultInfo.minResult;

                var maxChanged = maxGeometryResult === maxResult;
                var minChanged = minGeometryResult === minResult;
                if (me.loader.pretenderMaxs.has(maxGeometryResult)) {
                    me.loader.pretenderMaxs.delete(maxGeometryResult);
                }
                me.loader.pretenderMaxs = new Set(_.orderBy(Array.from(me.loader.pretenderMaxs), null, 'asc'));

                if (maxChanged) {
                    maxResult = _.last(Array.from(me.loader.pretenderMaxs)) || maxGeometryResult;
                }

                if (me.loader.pretenderMins.has(minGeometryResult)) {
                    me.loader.pretenderMins.delete(minGeometryResult);
                }
                me.loader.pretenderMins = new Set(_.orderBy(Array.from(me.loader.pretenderMins), null, 'desc'));

                if (minChanged) {
                    minResult = _.last(Array.from(me.loader.pretenderMins)) || minGeometryResult;
                }

                if (maxChanged || minChanged) {
                    me.setMinMaxResult(minResult, maxResult);
                }
            }
        }
    },

    hideObject: function (object) {
        var me = this;
        if (object !== null) {
            me.preHideObject(object);
        }
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

    removeSelectedResults: function () {
        this.signals.removeSelectedResults.dispatch();
    },

    resetCameraRotation: function () {
        this.signals.resetCameraRotation.dispatch();
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

    setSearchNearestPointMode: function (mode) {
        this.searchNearestPointMode = mode;
        this.signals.setSearchNearestPointMode.dispatch();
    },

    setResultDigits: function (resultDigits) {
        this.resultDigits = resultDigits;
        this.signals.changeResultDigits.dispatch();
    },

    setOptions: function (newOptions) {
        this.options = newOptions;
        this.id = newOptions.id;
        this.mode = newOptions.mode;
        this.searchNearestPointMode = newOptions.searchNearestPointMode;
        this.resultDigits = newOptions.resultDigits;
        this.loader.setTextureUrl(newOptions.textureUrl);
        this.loader.setTextureBase64(newOptions.textureBase64);
        this.loader.setTexture(newOptions.texture);
        this.loader.setTextures(newOptions.textures);
        this.signals.setMode.dispatch();
        this.signals.setSearchNearestPointMode.dispatch();
    },


    createJsonModelWithRotation: function (modelRotation) {
        this.loader.createJsonModelWithRotation(modelRotation);
    },


    dispatchModelPosition: function (modelRotation) {
        this.signals.dispatchModelPosition.dispatch(modelRotation);
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
        this.signals.objectsRemoved.dispatch(objsToRemove, this.scene, true);
        this.signals.sceneGraphChanged.dispatch();

    },

    getIsolineMaterialIfExist: function () {
        return this.isolineSpriteMaterial ? this.isolineSpriteMaterial : null;
    },

    getResultInfo: function () {
        return this.resultInfo;
    },


    addTexture: function (texture, minResult, maxResult) {
        this.isolineMaterial = new THREE.MeshLambertMaterial({
            map: texture,
            flatShading: true,
            side: THREE.FrontSide

        });
        this.isolineSpriteMaterial = new THREE.SpriteMaterial({map: texture});
        this.resultInfo = this.resultInfo || {};
        this.resultInfo.minResult = minResult;
        this.resultInfo.maxResult = maxResult;
    },

    getDefaultTexture: function () {
        for (var key in this.mapTextureNameToDetails) {
            if (this.mapTextureNameToDetails[key].default) {
                return this.mapTextureNameToDetails[key];
            }
        }
    },

    setTexture: function (textureName) {

        var texture = this.mapTextureNameToDetails[textureName] ? this.mapTextureNameToDetails[textureName] : this.getDefaultTexture();
        if (!texture) {
            console.log('Texture is not defined: ' + ': ' + texture);
            throw new Error('Texture is not defined: ' + ': ' + texture);
        }

        if (!texture.isolineMaterial) {

            var colorMapTexture;

            var self = this;
            if (texture.type == 'base64') {
                // Add texture hardcode for offline mode
                var image = new Image();
                image.src = texture.data;
                //image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP8AAAD/CAIAAACxapedAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAQqSURBVHhe7dMxiBAEGIbhN8ELlZQUjRQsLDRMsNAwycJCCSGHCxRyMLgoCSEHA4UcFBQMukEJwYYbFAxsuCHBwEAHGwwMMjC4QKGLDAwUMjBQv26/+eDge+GZ3uVfvp+3iNSJN4jUifVE6sQrROrEy0TqxCoideIFInXieSJ14lkidWIJkTrxFJE6MZ9InZhHpE7MIVInHidSJ2YQqRPMmPgAqRIzI5ViVqRSPBGpFE9GKsXCSKVYHKkUSyOVYlmkUiyPVIqVkUqxOlIp1kQqxbpIpXgtUik2RirFpkileDtSKd6JVIrBSKXYFqkU70Uqxc5IpRiKVIoPI5Xi40il+CRSKfZGKsW+SKX4LFIpDkYqxeFIpTgaqRRfRJoWhieVKTVxjmORSvFlpFKcjFSKkUilOBWpFGcileJspFKMRirFt5FKcT5SKS5EKsXFSKW4HKkUVyKV4mqkUvwcqRTXI5ViLFIpbkQqxe+RSvFnpFLcjlSKO5FK8U+kUtyPVIoHkUrx6KFUivwnlSL/SqXIXakU+VsqRf6SSpFxqdIfE+u/KZUiv0mlyK9SKfKLVIr8JJUiP0qlyA9SKXJJKkW+l0qR76RS5JxUioxKpcg3UinytVSKnJZKkRGpFPlKKkVOSKXIcakUGZZKkc+lUuSIVIockkqRA1Ipsl8qRfZKpcgeqRTZLZUiu6RS5AOpFHlfKkV2SKXIdqkUeVcqRbZKpcgWqRTZJJUib0qlyOtSKbJeKkXWSqXIS1IpskoqRVZIpchzUinyjFSKLJFKkUVSKbJAKkXmSaXIHKkUGZBKkRlSqccilWIg0rQwc1KZasyOVIq5kUoxP1IpFkUqxeJIpVgaqRTLIpViRaRSvBipFKsjlWJNpEZrJ9b/aqRSbIhUio2RSrE5Uim2RCrF1kilGIxUiu2RSrEjUil2RirFUKRS7IpUit2RSrEnUik+jVSK/ZFKcSBSKQ5GKsXhSKU4GqkUw5FKcSxSKU5EKsXJSKUYiVSKU5FKcSZSKc5GKsVopFKci1SK85FKcSFSKS5GKsXlSKW4EqkUVyOV4lqkUlyPVIqxSKW4EakU45FKcStSKW5HKsXdSNPCnUllqnEvUinuRyrFw0dSKR49kEqR+1Ipck8qRe5KpchtqRS5JZUi41IpclMqRcakUuS6VIpck0qRq1IpckUqRS5LpcglqRS5IJUi56VS5JxUioxKpchZqRQ5I5Uip6VSZEQqRU5KpcgJqRQ5LpUiw1IpclQqRY5IpcghqRQ5IJUi+6RSZK9UiuyRSpHdUinykVSKDEmlyE6pFNkhlSLbpFJkUCpFtkqlyBapFNkslSIbpVJkg1SKrJNKkTVSKbJaKkVWSqXIcqkUWSaVIkulUuRpqRRZKJUiC6TpYf6kMsXIXKkUmSVVmj2x/gGp0gD/A8JXBneznKjMAAAAAElFTkSuQmCC';

                colorMapTexture = new THREE.Texture();
                colorMapTexture.image = image;
                image.onload = function () {
                    colorMapTexture.needsUpdate = true;
                    self.reRender();
                };
            } else if (texture.type == 'url') {
                var imageName = texture.data;
                colorMapTexture = THREE.ImageUtils.loadTexture(imageName, null, function () {
                    self.reRender();
                }, function () {
                    console.log("error")
                });
            } else {
                console.log("selected texture or default is not found");
                return;
            }

            colorMapTexture.magFilter = THREE.NearestFilter;
            colorMapTexture.minFilter = THREE.LinearFilter;

            texture.colorMapTexture = colorMapTexture;

            texture.isolineMaterial = new THREE.MeshLambertMaterial({
                map: colorMapTexture,
                flatShading: true,
                side: THREE.FrontSide

            });

            texture.isolineSpriteMaterial = new THREE.SpriteMaterial({map: colorMapTexture});
            texture.isolineSpriteMaterial.nColors = texture.nColors;
        }

        this.isolineMaterial = texture.isolineMaterial;
        this.isolineSpriteMaterial = texture.isolineSpriteMaterial;

        this.signals.unHighlightGeometryObjects.dispatch();

        this.toggleIsolines(true);
        return colorMapTexture;
    },

    addTextures: function (textures) {
        for (var i = 0; i < textures.length; i++) {
            var texture = textures[i];
            this.mapTextureNameToDetails[texture.name] = texture;
        }
    },

    setMinMaxResult: function (minResult, maxResult) {
        this.resultInfo =  this.resultInfo || {};
        this.resultInfo.minResult = minResult;
        this.resultInfo.maxResult = maxResult;
        this.resultInfo.dirty  = true;
    },


    toggleIsolines: function (showFlag) {


        if(!_.isUndefined(showFlag)){
            this.showIsolinesFlag = showFlag;
        } else{
            this.showIsolinesFlag = !this.showIsolinesFlag ;
        }

        if (!this.options.drawResults || !this.scene.meshes) {
            return;
        }

        for (var i = 0; i < this.scene.meshes.length; i++) {
            if (this.scene.meshes[i].drawResults) {
                this.scene.meshes[i].material = this.showIsolinesFlag && this.isolineMaterial ? this.isolineMaterial : this.scene.meshes[i].facesMaterial;
            }
        }

        this.signals.materialChanged.dispatch();

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
