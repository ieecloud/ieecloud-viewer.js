var Loader = function (editor, textureUrl, textureBase64, texture, textures) {

    var scope = this;
    var signals = editor.signals;
    this.DRAW_RESULTS = true;
    this.textureUrl = textureUrl;
    this.textureBase64 = textureBase64;
    this.texture = texture;
    this.textures = textures;
    this.objectsTree = null;
    this.coordFactor = 1;
    this.pretenderMins = new Set();
    this.pretenderMaxs = new Set();
    this.modelRotation = null;
    this.camera = null;

    this.getObjectsTreeModel = function () {
        return scope.objectsTree;
    };


    this.selectObject = function (branch) {
        scope.traverseTree(branch, function (child) {
            scope.selectViewerObjects(child);
        });
    };

    this.showObject = function (branch) {
        editor.showObject(branch);
    };


    this.hideObject = function (object) {
        editor.hideObject(object);
    };

    // TODO:refactor
    this.showViewerObjects = function (object) {
        if (object && object instanceof Array) {
            for (var i = 0; i < object.length; i++) {
                editor.showObject(object[i]);
            }
        } else if (typeof object == "object") {
            editor.showObject(object);
        }
    };


    this.hideViewerObjects = function (object) {
        if (object && object instanceof Array) {
            for (var i = 0; i < object.length; i++) {
                editor.hideObject(object[i]);
            }
        } else if (typeof object == "object") {
            editor.hideObject(object);
        }
    };



    this.selectViewerObjects = function (object) {
        if (object && object instanceof Array) {
            for (var i = 0; i < object.length; i++) {
                editor.selectObject(object[i]);
            }
        } else if (typeof object == "object") {
            editor.selectObject(object);
        }
    };

    this.traverseTree = function (node, callback) {

        callback(node);
        for (var i = 0, l = node.children.length; i < l; i++) {
            scope.traverseTree(node.children[i], callback);

        }
    };


    this.unSelectObject = function (branch) {
        scope.traverseTree(branch, function (child) {
            scope.unSelectViewerObjects(child);
        });
    };

    this.unSelectViewerObjects = function (object) {
        if (object && object instanceof Array) {
            for (var i = 0; i < object.length; i++) {
                editor.unSelectObject(object[i]);
            }
        } else if (typeof object == "object") {
            editor.unSelectObject(object);
        }
    };

    this.setCamera = function (camera) {
        this.camera = camera;
    };


    this.createTextCanvas = function (text, color, font, size, backColor) {

        size = size || 24;
        var canvas = document.createElement('canvas');

        var ctx = canvas.getContext('2d');


        var fontStr = (size + 'px ') + (font || 'Arial');
        ctx.font = fontStr;
        var w = ctx.measureText(text).width;
        var h = Math.ceil(size);

        canvas.width = w;
        canvas.height = h;

        ctx.font = fontStr;

        if (backColor) {
            ctx.fillStyle = backColor;
            ctx.fillRect(0, 0, w, h);
        }


        ctx.fillStyle = color || 'black';

        ctx.fillText(text, 0, Math.ceil(size * 0.8));

        return canvas;

    };

    this.computeBoundingBox = function (modelRotation) {
        var commonBoundingBox = new THREE.Box3().setFromObject(editor.lastModel);
        if (commonBoundingBox.max.length() < Infinity && commonBoundingBox.min.length() < Infinity) {
            editor.calculateSpaceScale(commonBoundingBox, modelRotation);
        }
    };


    this.createAndAddAllObjects = function (pictureInfo) {
        var result = pictureInfo.geometryObjectData;
        var meshesData = {};
        var modelGroup = new THREE.Object3D();
        _.forEach(result, function (value, key) {

            meshesData[key] = [];
            var totalObjectDataElement = value;
            var geometryElement = new THREE.Object3D();
            var objectGroupElements = totalObjectDataElement.groups;
            var pointsTable = totalObjectDataElement.pointsTable;
            var vertices = totalObjectDataElement.totalObjVertices;
            var results = totalObjectDataElement.totalObjResults;
            var objectNames = totalObjectDataElement.objectNames;
            var pointsNumbers = totalObjectDataElement.pointsNumbers;


            for (var j = 0; j < objectGroupElements.length; j++) {
                var facesMaterial = objectGroupElements[j].facesMaterial;
                var drawResultsMaterial = objectGroupElements[j].drawResultsMaterial;
                var edgesMaterial = objectGroupElements[j].edgesMaterial;
                var drawResults = objectGroupElements[j].drawResults;


                var objectGroupElement = objectGroupElements[j];

                var objectGeometry;
                var edgesGeometry;

                if (objectGroupElement.faceGeometryData && objectGroupElement.faceGeometryData.positions.length > 0) {


                    objectGeometry = new THREE.BufferGeometry();
                    objectGeometry.addAttribute('position', new THREE.Float32BufferAttribute(objectGroupElement.faceGeometryData.positions, 3));
                    // objectGeometry.addAttribute('color', new THREE.Float32BufferAttribute(objectGroupElement.faceGeometryData.colors, 3));
                    objectGeometry.addAttribute('normal', new THREE.Float32BufferAttribute(objectGroupElement.faceGeometryData.normals, 3));
                    objectGeometry.addAttribute('uv', new THREE.Float32BufferAttribute(objectGroupElement.faceGeometryData.uvs, 2));

                    var mesh = new THREE.Mesh(objectGeometry, drawResultsMaterial ? drawResultsMaterial :  facesMaterial);
                    mesh.userData.pointsTable = pointsTable;
                    mesh.userData.name = objectGroupElement.name;
                    mesh.userData.totalObjVertices = vertices;
                    mesh.userData.totalObjResults = results;
                    mesh.userData.objectNames = objectNames;
                    mesh.userData.pointsNumbers = pointsNumbers;

                    mesh.name = objectGroupElement.name;
                    mesh.uniqueId = mesh.uuid;
                    mesh.parentName = objectGroupElement.parentName;
                    // mesh.defaultColor = facesMaterial.color.clone();
                    mesh.facesMaterial = facesMaterial;
                    mesh.drawResults = drawResults;

                    geometryElement.add(mesh);


                    if (!editor.scene.meshes) {
                        editor.scene.meshes = [];
                    }
                    editor.scene.meshes.push(mesh);

                    // modelGroup.add(mesh);
                    editor.octree.add(mesh);
                }

                if (objectGroupElement.lineGeometryData && objectGroupElement.lineGeometryData.positions.length > 0) {
                    edgesGeometry = new THREE.BufferGeometry();
                    edgesGeometry.addAttribute('position', new THREE.Float32BufferAttribute(objectGroupElement.lineGeometryData.positions, 3));


                    var lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                    lines.userData.pointsTable = pointsTable;
                    lines.userData.name = objectGroupElement.name;
                    lines.userData.totalObjVertices = vertices;
                    lines.userData.totalObjResults = results;
                    lines.userData.objectNames = objectNames;
                    lines.userData.pointsNumbers = pointsNumbers;

                    geometryElement.add(lines);


                    if (!editor.scene.lines) {
                        editor.scene.lines = [];
                    }
                    editor.scene.lines.push(lines);


                    // modelGroup.add(lines);
                    editor.octree.add(lines);

                    lines.name = objectGroupElement.name;
                    lines.uniqueId = lines.uuid;
                    lines.parentName = objectGroupElement.parentName;
                    lines.defaultColor = edgesMaterial.color.clone();
                }

                if (objectGeometry && objectGeometry.attributes.position.count > 0 && edgesGeometry.attributes.position.count > 0) {
                    lines.name = objectGroupElement.name + ".EDGE";
                    mesh.name = objectGroupElement.name + ".FACE";
                    meshesData[key].push(lines);
                    meshesData[key].push(mesh);
                } else if ((objectGeometry || (objectGeometry && objectGeometry.attributes.position.count === 0)) && edgesGeometry.attributes.position.count > 0) {
                    meshesData[key].push(lines);
                } else if (objectGeometry && objectGeometry.attributes.position.count > 0 && edgesGeometry.attributes.position.count === 0) {
                    meshesData[key].push(mesh);
                }
// TODO move to common geometry
//             var simpleShapes = objectElement[j].simpleShapes;
//             var v = 0;
//             var simpleShapesGeometry = new THREE.Geometry();
//             for (var k = 0; k < simpleShapes.length; k++) {
//                 for (var n = 0; n < simpleShapes[k].vertices.length; n++) {
//                     simpleShapesGeometry.vertices.push(simpleShapes[k].vertices[n]);
//                 }
//                 for (var n = 0; n < simpleShapes[k].faces.length; n++) {
//                     var face = simpleShapes[k].faces[n];
//                     face.a += v;
//                     face.b += v;
//                     face.c += v;
//
//                     simpleShapesGeometry.faces.push(simpleShapes[k].faces[n]);
//                 }
//                 v += simpleShapes[k].vertices.length;
//
//             }
//
//             var shapes = new THREE.Mesh(simpleShapesGeometry, facesMaterial);
//             modelGroup.add(shapes);
            }
        });

        var textData = pictureInfo.textData;
        _.forEach(textData, function (value, key) {
            var textElement = value;
            _.forEach(textElement, function (value, key) {
                if (textElement[key].label) {
                    var textMesh = scope.createText2D(textElement[key].label, textElement[key].color, null, textElement[key].size);
                    textMesh.userData = {};
                    textMesh.userData.quaternion = "camera";
                    textMesh.position.copy(textElement[key].position);
                    modelGroup.add(textMesh);
                }
            });
        });
        // editor.addModelGroup(modelGroup);
        // return meshesData;
        return {meshesData: meshesData, modelGroup: modelGroup};
    };


    this.createMeshFromCommonFace = function (totalObjectDataElement, geometryElement) {


        var pointsTable = totalObjectDataElement.pointsTable;
        var vertices = totalObjectDataElement.totalObjVertices;
        var results = totalObjectDataElement.totalObjResults;
        var maxGeometryResult = totalObjectDataElement.pretenderMaxElement.value;
        var minGeometryResult = totalObjectDataElement.pretenderMinElement.value;
        var objectNames = totalObjectDataElement.objectNames;
        var pointsNumbers = totalObjectDataElement.pointsNumbers;
        var faceCommonDataForMesh = totalObjectDataElement.faceCommonDataForMesh;
        var groups = totalObjectDataElement.groups;


        var faces = totalObjectDataElement.faces;


        var geoCommonMeshGeometry = new THREE.BufferGeometry();
        geoCommonMeshGeometry.addAttribute('position', new THREE.Float32BufferAttribute(faceCommonDataForMesh.positions, 3));
        geoCommonMeshGeometry.addAttribute('normal', new THREE.Float32BufferAttribute(faceCommonDataForMesh.normals, 3));
        geoCommonMeshGeometry.addAttribute('uv', new THREE.Float32BufferAttribute(faceCommonDataForMesh.uvs, 2));


        var mesh = new THREE.Mesh(geoCommonMeshGeometry, faceCommonDataForMesh.drawResultsMaterial ?
            faceCommonDataForMesh.drawResultsMaterial : faceCommonDataForMesh.facesMaterial);
        mesh.userData.pointsTable = pointsTable;
        mesh.userData.totalObjVertices = vertices;
        mesh.userData.totalObjResults = results;
        mesh.userData.maxGeometryResult = maxGeometryResult;
        mesh.userData.minGeometryResult = minGeometryResult;
        mesh.userData.objectNames = objectNames;
        mesh.userData.pointsNumbers = pointsNumbers;
        mesh.userData.groups = groups;
        mesh.userData.faces = faces;

        mesh.name = totalObjectDataElement.name;
        mesh.uniqueId = mesh.uuid;
        mesh.parentName = totalObjectDataElement.name;
        mesh.defaultColor = faceCommonDataForMesh.facesMaterial.color.clone();
        mesh.facesMaterial = faceCommonDataForMesh.facesMaterial;
        mesh.drawResults = faceCommonDataForMesh.drawResults;

        geometryElement.add(mesh);

        if (!editor.scene.meshes) {
            editor.scene.meshes = [];
        }
        editor.scene.meshes.push(mesh);

        return mesh;
    };

    this.createLineFromCommonLineData = function (totalObjectDataElement, geometryElement) {


        var pointsTable = totalObjectDataElement.pointsTable;
        var vertices = totalObjectDataElement.totalObjVertices;
        var results = totalObjectDataElement.totalObjResults;
        var maxGeometryResult = totalObjectDataElement.pretenderMaxElement.value;
        var minGeometryResult = totalObjectDataElement.pretenderMinElement.value;
        var objectNames = totalObjectDataElement.objectNames;
        var pointsNumbers = totalObjectDataElement.pointsNumbers;
        var lineCommonDataForLine = totalObjectDataElement.lineCommonDataForLine;

        var geoCommonLineGeometry = new THREE.BufferGeometry();
        geoCommonLineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(lineCommonDataForLine.positions, 3));
        var lines = new THREE.LineSegments(geoCommonLineGeometry, lineCommonDataForLine.edgesMaterial);
        geometryElement.add(lines);
        // modelGroup.add(lines);
        lines.userData.pointsTable = pointsTable;
        lines.parentName = totalObjectDataElement.name;
        lines.defaultColor = lineCommonDataForLine.edgesMaterial.color.clone();
        lines.userData.totalObjVertices = vertices;
        lines.userData.totalObjResults = results;
        lines.userData.maxGeometryResult = maxGeometryResult;
        lines.userData.minGeometryResult = minGeometryResult;
        lines.userData.objectNames = objectNames;
        lines.userData.pointsNumbers = pointsNumbers;
        editor.octree.add(lines);

        if (!editor.scene.lines) {
            editor.scene.lines = [];
        }
        editor.scene.lines.push(lines);
        return lines;
    };


    this.createAndAddCommonObjects = function (pictureInfo) {
        var me = this;
        var result = pictureInfo.geometryObjectData;
        var meshesData = {};
        var modelGroup = new THREE.Object3D();
        _.forEach(result, function (value, key) {


            meshesData[key] = [];
            var geometryElement = new THREE.Object3D();
            var totalObjectDataElement = value;
            var objectGroupElements = totalObjectDataElement.groups;
            var maxGeometryResult = totalObjectDataElement.pretenderMaxElement.value;
            var minGeometryResult = totalObjectDataElement.pretenderMinElement.value;
            var lineCommonDataForLine = totalObjectDataElement.lineCommonDataForLine;
            var faceCommonDataForMesh = totalObjectDataElement.faceCommonDataForMesh;

// TODO move to common geometry

            // TODO: align different types of meshes collectors
            if (!editor.scene.simpleShapes) {
                editor.scene.simpleShapes = [];
            }

            _.forEach(objectGroupElements, function (objElement) {
                var simpleShapes = objElement.simpleShapes;
                if (!simpleShapes || simpleShapes.length === 0) {
                    return;
                }
                for (let k = 0; k < simpleShapes.length; k++) {
                    var shapes = new THREE.Mesh(simpleShapes[k], objElement.facesMaterial);

                    shapes.name = simpleShapes[k].name;
                    shapes.position.copy(simpleShapes[k].position);

                    meshesData[key].push(shapes);
                    // modelGroup.add(shapes);
                    shapes.userData = {"type" : 'simpleShape', id : simpleShapes[k].simpleShapeId};

                    editor.scene.simpleShapes.push(shapes);
                    geometryElement.add(shapes);
                }
            });

            if (faceCommonDataForMesh.positions.length > 0 && lineCommonDataForLine.positions.length > 0) {

                var mesh = me.createMeshFromCommonFace(totalObjectDataElement, geometryElement);
                mesh.name = totalObjectDataElement.name + ".FACE";
                meshesData[key].push(mesh);


                var lines = me.createLineFromCommonLineData(totalObjectDataElement, geometryElement);
                lines.name = totalObjectDataElement.name + ".EDGE";
                meshesData[key].push(lines);

            } else if (faceCommonDataForMesh.positions.length === 0 && lineCommonDataForLine.positions.length > 0) {

                var lines = me.createLineFromCommonLineData(totalObjectDataElement, geometryElement);

                if (_.trim(lines.name).length === 0) {
                    lines.name = totalObjectDataElement.name + ".EDGE";
                }
                meshesData[key].push(lines);
            } else if (faceCommonDataForMesh.positions.length > 0 && lineCommonDataForLine.positions.length === 0) {

                var mesh = me.createMeshFromCommonFace(totalObjectDataElement, geometryElement);

                if (_.trim(mesh.name).length === 0) {
                    mesh.name = totalObjectDataElement.name + ".FACE";
                }
                meshesData[key].push(mesh);
            }

            geometryElement.name = totalObjectDataElement.name;


            geometryElement.userData.extremumResultData = {};
            geometryElement.userData.extremumResultData.minGeometryResult =  totalObjectDataElement.pretenderMinElement;
            geometryElement.userData.extremumResultData.maxGeometryResult =  totalObjectDataElement.pretenderMaxElement;

        });

        var textData = pictureInfo.textData;
        _.forEach(textData, function (value, key1) {
            var textElement = value;
            _.forEach(textElement, function (value, key2) {

                if (textElement[key2].label) {

                    var textMesh = new THREE.ResultTextObject3d(scope.camera, {
                        value: textElement[key2].label,
                        color: editor.options.resultTextColor
                    });


                    textMesh.userData = {};
                    textMesh.userData = {"text": true};
                    textMesh.position.copy(textElement[key2].position);
                    meshesData[key1].push(textMesh);
                    modelGroup.add(textMesh);
                }
            });
        });
        // editor.addModelGroup(modelGroup);
        // return meshesData;
        return {meshesData: meshesData, modelGroup: modelGroup};
    };

    this.createText2D = function (text, color, font, size, camera) {

        var canvas = scope.createTextCanvas(text, color, font, 256);

        var plane = new THREE.PlaneBufferGeometry(canvas.width / canvas.height * size, size);
        var tex = new THREE.Texture(canvas);

        tex.needsUpdate = true;

        var planeMat = new THREE.MeshBasicMaterial({
            map: tex,
            overdraw: true,
            side: THREE.DoubleSide,
            transparent: true
        });

        var mesh = new THREE.Mesh(plane, planeMat);

        return mesh;

    };


    function convertBytesToGeometryMetadata(dataview, size, currentIndex) {
        var ints = new Float32Array(size);
        for (var i = 0; i < ints.length; i++) {
            ints[i] = dataview.getFloat32(i * 4 + currentIndex);
        }

        return ints;
    }



    function parseGeometryObjectGz(geometryObject, file, value) {


        var linePositionSize = geometryObject.linePositionsSize;
        var positionsSize = geometryObject.positionsSize;
        var normalsSize = geometryObject.normalsSize;
        var uvsSize = geometryObject.uvsSize;
        var coordsSize = geometryObject.coordsSize;
        var resultsSize = geometryObject.resultsSize;

        return file.async("uint8array").then(
            function success(contentIn) {
                var content = pako.ungzip(contentIn);
                content = content.buffer;

                var dataview = new DataView(content);
                var currentIndex = 0;


                // fill line_positions_iee
                if(!geometryObject.lineGeometryData){
                    geometryObject.lineGeometryData = {};
                }
                geometryObject.lineGeometryData.positions  = convertBytesToGeometryMetadata(dataview, linePositionSize, currentIndex);

                currentIndex = linePositionSize * 4;

                // fill positions_iee
                if(!geometryObject.faceGeometryData){
                    geometryObject.faceGeometryData = {};
                }
                geometryObject.faceGeometryData.positions = convertBytesToGeometryMetadata(dataview, positionsSize, currentIndex);
                currentIndex = currentIndex + positionsSize * 4;

                // fill line_positions_iee
                geometryObject.faceGeometryData.normals = convertBytesToGeometryMetadata(dataview, normalsSize, currentIndex);
                currentIndex = currentIndex + normalsSize * 4;

                // fill uvs_iee
                geometryObject.faceGeometryData.uvs = convertBytesToGeometryMetadata(dataview, uvsSize, currentIndex);
                currentIndex = currentIndex + uvsSize * 4;

                // fill coords
                geometryObject.coords = convertBytesToGeometryMetadata(dataview, coordsSize, currentIndex);
                currentIndex = currentIndex + coordsSize * 4;

                // fill results
                geometryObject.results = convertBytesToGeometryMetadata(dataview, resultsSize, currentIndex);

            },
            function error(e) {
                // handle the error↵});"
            }).finally(function () {
                editor.onZipUpdateStatus("parsing  " + geometryObject.name, value);
        })
    }




    this.removeModel = function () {
        editor.removeAllObjects();
    };

    this.reloadModel = function (data) {
        editor.removeAllObjects();
        scope.handleJSONData(data);
        data = null;
        delete data;
        editor.onZipUpdateStatus("stop", 1.0);
    };


    this.loadZipModel = function (zip) {
        var me = this;
        editor.onZipUpdateStatus("loading model configuration...", 0.1);
        var filterResults = zip.filter(function (relativePath, file) {
            var fileName = file.name;
            return fileName.startsWith('view.json');

        });

        if (filterResults.length > 0) {
            var configurationEntry = filterResults[0];

            configurationEntry.async("string").then(function (dataString) {

                var data = JSON.parse(dataString);

                var pictureData = data.pictureData;

                var promises = [];


                var progressValue = 0.7;

                editor.onZipUpdateStatus("loading model metadata...", progressValue);

                for (var i = 0; i < pictureData.length; i++) {
                    var geometryObject = pictureData[i];
                    var geomObjUuid = geometryObject.uuid;

                    var foundedGZArray = zip.filter(function (relativePath, file) {
                        var fileName = file.name;
                        return fileName.includes("data_" + geomObjUuid);
                    });

                    if (foundedGZArray.length > 0) {
                        var foundedGZ = foundedGZArray[0];

                        var factor = i / pictureData.length;

                        progressValue = progressValue + factor / 100000;

                        promises.push(parseGeometryObjectGz(geometryObject, foundedGZ, progressValue));
                    }
                }

                Promise.all(promises).then(function (object) {
                    setTimeout(function() { editor.onZipUpdateStatus("loading model...", 0.9); me.reloadModel(data) }, 0);
                });
            });
        }
    };


    this.loadBase64Model = function (base64Str) {
        var me = this;
        JSZip.loadAsync(base64Str, {base64: true}).then(function (zip) {
            me.loadZipModel(zip);

        });
    };

    this.loadBinaryModel = function (url) {
        var me = this;
        editor.onZipUpdateStatus("loading binary model content ...");
        JSZipUtils.getBinaryContent(url, {
            progress: function(e) {
                editor.onZipUpdateStatus("loading binary model content " + Math.round(e.percent) +  " % loaded");
            },
            callback: function (err, data) {
                if(err) {
                    throw err; // or handle err
                }
                JSZip.loadAsync(data).then(function (zip) {
                    me.loadZipModel(zip);
                });
            }
        });
    };


    this.handleJSONData = function (data) {
        editor.onRenderStart();


        var pictureInfo = this.parseModel(data);

        var result;
        var resultCommon;
        var modelGroup;
        if (editor.options.detailModelView) {
            resultCommon = scope.createAndAddAllObjects(pictureInfo);
        } else {
            resultCommon = scope.createAndAddCommonObjects(pictureInfo);
        }

        result = resultCommon.meshesData;

        modelGroup = resultCommon.modelGroup;
        var newModelGroup = new THREE.Object3D();

        newModelGroup.add(modelGroup);

        var traverse = function (obj) {
            if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (typeof obj[i] == "object" && obj[i] && !(obj[i] instanceof THREE.Mesh) && !(obj[i] instanceof THREE.LineSegments)
                        && !(obj[i] instanceof THREE.Object3D)) {
                        var node = obj[i];
                        if (node.index != -1) {
                            if (result[node.index]) {
                                var treejsNodes = result[node.index];
                                var treeNodes = [];
                                _.forEach(treejsNodes, function(value, key) {
                                    treeNodes.push({text:  value.name, object: value})
                                });
                                node.children = treeNodes;
                                node.uniqueId = THREE.Math.generateUUID();
                                node.text = node.name;
                                node.object = treejsNodes[0] ? treejsNodes[0].parent : undefined;
                                if(node.object){
                                    node.object.isModelContainerObj = true;
                                    newModelGroup.add(node.object);
                                }
                            }

                        }else{
                            node.text = node.name;

                            if (i > 0) {
                                var prevNode = obj[i - 1];
                                if (prevNode.children && prevNode.children.length > 0) {
                                    var upperNodeContainer = new THREE.Object3D();
                                    for (var k = 0; k < prevNode.children.length; k++) {
                                        if (prevNode.children[k].object) {
                                            upperNodeContainer.add(prevNode.children[k].object);
                                        }
                                    }
                                    prevNode.object = upperNodeContainer;
                                    if(prevNode.object){
                                        prevNode.object.isModelContainerObj = true;
                                    }
                                }

                                newModelGroup.add(prevNode.object);
                            }
                            // TODO:refactor with above
                            if(i ===  (obj.length  - 1)){
                                var currentNode = obj[i];
                                if (currentNode.children && currentNode.children.length > 0) {
                                    var upperNodeContainer = new THREE.Object3D();
                                    for (var k = 0; k < currentNode.children.length; k++) {
                                        if (currentNode.children[k].object) {
                                            upperNodeContainer.add(currentNode.children[k].object);
                                        }
                                    }
                                    currentNode.object = upperNodeContainer;
                                    if(currentNode.object){
                                        currentNode.object.isModelContainerObj = true;
                                    }
                                }

                                newModelGroup.add(currentNode.object);
                            }

                        }
                        traverse(obj[i]);
                    } else {
                    }
                }
            } else {
                for (var prop in obj) {
                    if (typeof obj[prop] == "object" && obj[prop] && !(obj[prop] instanceof THREE.Mesh) && !(obj[prop] instanceof THREE.LineSegments)
                        && !(obj[prop] instanceof THREE.Object3D)) {
                        var node = obj[prop];
                        if (node.index != -1) {
                            if (result[node.index]) {

                                var treejsNodes = result[node.index];
                                var treeNodes = [];
                                _.forEach(treejsNodes, function(value, key) {
                                    treeNodes.push({text:  value.name, object: value})
                                });

                                node.children = treeNodes;
                                node.text = node.name;
                                node.object = treejsNodes[0] ? treejsNodes[0].parent : undefined;
                                node.object.isModelContainerObj = true;
                                node.uniqueId = THREE.Math.generateUUID();
                            }
                        }else{
                            node.text = node.name;
                        }
                        traverse(obj[prop]);
                    } else {
                    }
                }
            }
        };

        traverse(data.tree);


        editor.addModelGroup(newModelGroup);
        // editor.addModelGroup(modelGroup);

        data.tree.uniqueId = THREE.Math.generateUUID();

        scope.objectsTree = [data.tree];
        editor.onTreeLoad(data.tree);

        // TODO: improve
        scope.computeBoundingBox(pictureInfo.modelRotation);
        scope.computeBoundingBox(pictureInfo.modelRotation);
        scope.computeBoundingBox(pictureInfo.modelRotation);
        scope.computeBoundingBox(pictureInfo.modelRotation);
        editor.onRenderDone();
        data = null;
        pictureInfo = null;
        delete data;
        delete pictureInfo;
    };

    this.parseSimpleShapes = function (simpleShapes, groupIndex, pictureGeometryElement, vertices) {
        var simpleShapes = simpleShapes[groupIndex];
        for (var k = 0; k < simpleShapes.length; k++) {
            if (simpleShapes[k].shape == "sphere") {
                var sphere = new THREE.SphereGeometry(simpleShapes[k].radius / this.coordFactor, simpleShapes[k].segments, simpleShapes[k].segments);
                var index = simpleShapes[k].index;
                var v = vertices[index];
                sphere.name = simpleShapes[k].name;
                sphere.simpleShapeId = simpleShapes[k].id || null;
                sphere.position = v;
                pictureGeometryElement.simpleShapes.push(sphere);
            }
            if (simpleShapes[k].shape == "cube") {
                var cubeCoord = simpleShapes[k].divideScalar(this.coordFactor);
                var cube = new THREE.CubeGeometry(cubeCoord.x, cubeCoord.y, cubeCoord.z);
                var index = simpleShapes[k].index;
                var v = vertices[index];
                cube.name = simpleShapes[k].name;
                cube.simpleShapeId = simpleShapes[k].id || null;
                cube.position = v;
                pictureGeometryElement.simpleShapes.push(cube);
            }
            if (simpleShapes[k].shape == "cylinder") {
                var cylinder = new THREE.CylinderGeometry(simpleShapes[k].r1 / this.coordFactor, simpleShapes[k].r2 / this.coordFactor, simpleShapes[k].h / this.coordFactor, simpleShapes[k].segments, 8);
                var index = simpleShapes[k].index;
                var v = vertices[index];
                cylinder.name = simpleShapes[k].name;
                cylinder.simpleShapeId = simpleShapes[k].id || null;
                cylinder.position = v;
                pictureGeometryElement.simpleShapes.push(cylinder);
            }
        }

    };

    this.createTexture = function (settings, pictureGeometryElement) {
        var imageName = scope.textureUrl ? scope.textureUrl + settings.texture.name + '.gif' : 'css/images/' + settings.texture.name + '.gif';
        var texture = THREE.ImageUtils.loadTexture(imageName, null, function () {
            editor.reRender();
        }, function () {
            console.log("error")
        });


        texture.repeat = new THREE.Vector2(settings.texture.repeatX, settings.texture.repeatY);
        texture.offset = new THREE.Vector2(settings.texture.offsetX, settings.texture.offsetY);
        texture.flipY = settings.texture.flip;

        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;

        if (settings.text3d) {  //Texture & 3dText using shader
            var texture2 = new THREE.Texture(scope.createTextCanvas(settings.text3d, settings.textColor, null, 256));
            texture2.flipY = true;
            texture2.needsUpdate = true;
            var transparencyValue = (settings.transparancy > 0 ? (1 - settings.transparancy) : 1.0);
            // uniforms
            var uniforms = {
                texture: {type: "t", value: texture},
                texture2: {type: "t", value: texture2},
                offsetRepeat: {
                    type: "v4", value: new THREE.Vector4(settings.texture.offsetX, settings.texture.offsetY,
                        settings.texture.repeatX, settings.texture.repeatY),
                    transparency: {type: "f", value: transparencyValue}
                }
            };

            // attributes
            var attributes = {};
            var material = new THREE.ShaderMaterial({
                attributes: attributes,
                uniforms: uniforms,
                vertexShader: document.getElementById('vertex_shader').textContent,
                fragmentShader: document.getElementById('fragment_shader').textContent
            });


            material.side = THREE.FrontSide;
            pictureGeometryElement.facesMaterial = material;

        }
        else {  // only texture without 3dText
            var transparencyValue = settings.transparancy > 0 ? true : false;
            var opacityValue = settings.transparancy > 0 ? transparencyValue : 1;
            pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.FrontSide,
                flatShading: true,
                transparent: transparencyValue,
                opacity: opacityValue
            });
        }

    };

    //
    // function generateTexture(color) {
    //
    //     // draw a circle in the center of the canvas
    //     var size = 256;
    //
    //     // create canvas
    //     var canvas = document.createElement( 'canvas' );
    //     canvas.width = size;
    //     canvas.height = size;
    //
    //     // get context
    //     var context = canvas.getContext( '2d' );
    //
    //     // draw background
    //     context.fillStyle = color;
    //     context.fillRect( 0, 0, size, size );
    //
    //     return canvas;
    //
    // }

    this.parseModelObjectEdgesFaces = function (geometryObject, colorMapTexture, vertices) {

        var results = geometryObject.results; // results

        var name = geometryObject.name;

        var edgeGroups = geometryObject.edges;
        var uvGroups = geometryObject.uvCoords;
        var groupSettings = geometryObject.groupSettings;
        var objectSettings = geometryObject.objectSettings;

        var drawResults = (scope.DRAW_RESULTS && results && (results.length != 0));
        var transparencyValue = objectSettings.transparancy > 0 ? true : false;
        var opacityValue = objectSettings.transparancy > 0 ? (1 - objectSettings.transparancy) : 1;


        // var texture = new THREE.Texture( generateTexture(objectSettings.faceColor) );
        // texture.needsUpdate = true; // important

        var simpleFacesMaterial = new THREE.MeshLambertMaterial({
            color: objectSettings.faceColor,
            flatShading: true,
            side: THREE.FrontSide,
            transparent: transparencyValue,
            opacity: opacityValue

        });

        var simpleLinesMaterial = new THREE.LineBasicMaterial({
            color: objectSettings.lineColor,
            opacity: 1,
            linewidth: objectSettings.lineWidth
        });


        var drawResultsMaterial = drawResults ? new THREE.CustomSelectionMaterial({
            map: colorMapTexture,
            flatShading: true,
            side: THREE.FrontSide

        }) : null;

        if(drawResultsMaterial){
            drawResultsMaterial.setSourceTexture(colorMapTexture);
        }

        //
        // drawResultsMaterial.onBeforeCompile = function ( shader ) {
        //
        //     shader.uniforms.limitUvs = { value: new THREE.Vector2( 0.0, 1.0 ) };
        //
        //     shader.fragmentShader = 'uniform vec2 limitUvs;\n' + shader.vertexShader;
        //     shader.fragmentShader = shader.fragmentShader.replace(
        //         '#include <begin_vertex>',
        //         [
        //             "vec4 texelColor = texture2D( map, vUv );",
        //             "if( vUv.y > limitUvs.x && vUv.y < limitUvs.y )",
        //             "texelColor = mapTexelToLinear( texelColor );",
        //             "else",
        //             "texelColor = vec4( color, 1.0 );",
        //             "diffuseColor *= texelColor;",
        //         ].join( '\n' )
        //     );
        //
        //     drawResultsMaterial = shader;
        //
        // };


        if (!editor.options.detailModelView) {

            geometryObject.facesMaterial = simpleFacesMaterial;
            if (drawResults) {
                geometryObject.drawResultsMaterial = drawResultsMaterial;
                geometryObject.drawResults = true;
            }

            geometryObject.edgesMaterial = simpleLinesMaterial;

            var groupsObjects = [];
            for (var j = 0; j < geometryObject.groups.length; j++) {  // tmp for simple shapes only common model view

                var groupElement  = {};
                groupElement.simpleShapes  = [];
                groupElement.name  = geometryObject.groups[j];
                groupElement.facesMaterial = simpleFacesMaterial;
                if (geometryObject.simpleShapes && geometryObject.simpleShapes[j]) {
                    scope.parseSimpleShapes(geometryObject.simpleShapes, j, groupElement, vertices);
                }

                groupsObjects.push(groupElement);
            }
            geometryObject.groups  = groupsObjects;

        } else {

            for (var j = 0; j < geometryObject.groups.length; j++) {  //reading edges and faces by groups

                var settings = groupSettings[j];
                var text3d = settings.text3d;
                if (settings.lineColor == undefined) {
                    settings = objectSettings;
                }

                var edges = edgeGroups[j];

                if (edges) {
                    var uv = uvGroups[j];
                    var drawTexture = (!drawResults) && (uv && uv.length != 0);

                    // pictureGeometryElement.edgesGeometry = lineGeometry;
                    // pictureGeometryElement.edgesGeometryData = positions;
                    // pictureGeometryElement.objectGeometryName = name + '.' + geometryObject.groups[j];
                    // pictureGeometryElement.name = geometryObject.groups[j];
                    // pictureGeometryElement.parentName = name;
                    // pictureGeometryElement.drawResults = drawResults;
                    if (drawResults) { // Draw face with spectral texture according to results
                        geometryObject.groups[j].drawResultsMaterial = drawResultsMaterial;
                        geometryObject.groups[j].drawResults = drawResults;
                        geometryObject.groups[j].facesMaterial = simpleFacesMaterial;
                    } else {
                        if (drawTexture && settings.texture.name != undefined) {
                            // Draw face with texture
                            scope.createTexture(settings, geometryObject.groups[j])
                        } else {
                            if (text3d != undefined) {  // face without texture with 3dText
                                var texture = new THREE.Texture(scope.createTextCanvas(text3d, settings.textColor, null, 256, settings.faceColor));
                                texture.flipY = true;
                                texture.needsUpdate = true;


                                geometryObject.groups[j].facesMaterial = new THREE.MeshLambertMaterial({
                                    map: texture,
                                    flatShading: true,
                                    side: THREE.FrontSide,
                                    transparent: settings.transparancy > 0 ? true : false,
                                    opacity: settings.transparancy > 0 ? (1 - settings.transparancy) : 1
                                });
                            }
                            else { // face without texture & 3dText
                                geometryObject.groups[j].facesMaterial = simpleFacesMaterial;

                            }
                        }
                    }
                }

                geometryObject.groups[j].edgesMaterial = simpleLinesMaterial;
                geometryObject.groups[j].facesMaterial = simpleFacesMaterial;


                geometryObject.groups[j].simpleShapes = [];  //Simple shapes
                if (geometryObject.simpleShapes && geometryObject.simpleShapes[j]) {
                    scope.parseSimpleShapes(geometryObject.simpleShapes, j, geometryObject.groups[j], vertices);
                }
            }
        }

    };

    this.parseModelPart = function (geometryObject, names, pictureInfo, colorMapTexture, index) {
        var name = geometryObject.name;
        var scale = 1;
        names.push(name);
        var textPositionsData = {};
        var coords = geometryObject.coords;
        // var edges = geometryObject.edges; TODO:remove edges from model
        var results = geometryObject.results;
        var pointsTable = geometryObject.pointsTable;
        var objectNames = geometryObject.objectNames;
        var pointsNumbers = geometryObject.pointsNumbers;
        var faces = geometryObject.faces;
        var groups = geometryObject.groups;
        var vertices = [];

        var drawResults = (scope.DRAW_RESULTS && results && (results.length != 0));
        var offset = 0;
        while (offset < coords.length) { //reading vertices
            var vertex = new THREE.Vector3();
            vertex.x = coords[offset++] * scale;
            vertex.y = coords[offset++] * scale;
            vertex.z = coords[offset++] * scale;
            var dividedVertex = vertex.divideScalar(this.coordFactor);
            vertices.push(dividedVertex);
        }

        var objectSettings = geometryObject.objectSettings;

        var text2d = geometryObject.text2d;
        for (var j = 0; j < text2d.length; j += 2) {
            var ind = text2d[j];
            var label = text2d[j + 1];
            textPositionsData[ind] = {};
            textPositionsData[ind].label = label;
            textPositionsData[ind].position = new THREE.Vector3(0, 0, 0);
            textPositionsData[ind].position.copy(vertices[ind]);
            // textPositionsData[ind].size = objectSettings.textSize / this.coordFactor * 10;
            textPositionsData[ind].size = objectSettings.textSize;
            textPositionsData[ind].color = objectSettings.textColor;
        }


        var lineCommonDataForLine = {};
        lineCommonDataForLine.positions = geometryObject.lineGeometryData.positions;

        var faceCommonDataForMesh = {};

        faceCommonDataForMesh.positions = geometryObject.faceGeometryData.positions;
        faceCommonDataForMesh.normals = geometryObject.faceGeometryData.normals;
        faceCommonDataForMesh.uvs = geometryObject.faceGeometryData.uvs;

        // pass vertices for simpleShapes only
        scope.parseModelObjectEdgesFaces(geometryObject, colorMapTexture, vertices);

        faceCommonDataForMesh.facesMaterial = geometryObject.facesMaterial;
        faceCommonDataForMesh.drawResultsMaterial = geometryObject.drawResultsMaterial;
        faceCommonDataForMesh.drawResults = geometryObject.drawResults;

        lineCommonDataForLine.edgesMaterial = geometryObject.edgesMaterial;


        var totalGeometryObj = {};
        totalGeometryObj.pointsTable = pointsTable;
        totalGeometryObj.objectNames = objectNames;
        totalGeometryObj.pointsNumbers = pointsNumbers;
        totalGeometryObj.totalObjVertices = vertices;
        totalGeometryObj.totalObjResults = results;
        totalGeometryObj.faces = faces;
        totalGeometryObj.groups  = geometryObject.groups;


        totalGeometryObj.lineCommonDataForLine = lineCommonDataForLine;
        totalGeometryObj.faceCommonDataForMesh = faceCommonDataForMesh;

        totalGeometryObj.pretenderMinElement = {position: vertices[geometryObject.minResultIndex],
            value: geometryObject.minResult};

        totalGeometryObj.pretenderMaxElement = {position: vertices[geometryObject.maxResultIndex],
            value: geometryObject.maxResult};

        totalGeometryObj.name = name;

        pictureInfo.geometryObjectData[index] = totalGeometryObj;

        pictureInfo.textData[index] = textPositionsData;

    };

    this.getV = function (result, maxResult, minResult) {
        var normalizedResult = result === "NaN" || _.isUndefined(result) ? 0 : result;
        return (normalizedResult - minResult) / (maxResult - minResult);
    };

    this.setTextureUrl = function (url) {
        this.textureUrl = url;
    };

    this.setTextureBase64 = function (base64) {
        this.textureBase64 = base64;
    };

    this.setTexture = function (texture) {
        this.texture = texture;
    };

    this.setTextures = function (textures) {
        this.textures = textures;
    };

    this.createJsonModelWithRotation = function (currentModelRotation) {

        var modelRotation = this.modelRotation;
        if (!modelRotation) {
            return;
        }
        var message = "position:  x = " + currentModelRotation.position.x + " y =" + currentModelRotation.position.y + " z =" + currentModelRotation.position.z + ",  fov =" + currentModelRotation.fov + "\n";
        if (modelRotation.results) {
            for (var i = 0; i < modelRotation.results.length; i++) {
                var result = modelRotation.results[i];
                message += "result = " + result.resultValue + "  position: x = " + result.position.x + " y =" + result.position.y + " z =" + result.position.z + "\n";
            }
        }
        alert(message)
    };

    this.getDefaultTexture = function (textures) {
        for (var k = 0; k < scope.textures.length; k++) {
            if (scope.textures[k].default) {
                return scope.textures[k];
            }
        }
    };

    this.parseModel = function (json) {
        var pictureData = json.pictureData; // reading array for all geometry objects
        var minResult = json.minResult;
        var maxResult = json.maxResult;
        this.coordFactor  = json.coordFactor;
        scope.DRAW_RESULTS = (!(/^(false|0)$/i).test(json.drawResults) && !!json.drawResults) || editor.options.drawResults
            && maxResult > minResult;
        this.modelRotation = json.modelRotation;

        editor.minUserInput = undefined;
        editor.maxUserInput = undefined;

        var names = [];
        var links = [];
        var pictureInfo = {};
        pictureInfo.geometryObjectData = {}
        pictureInfo.textData = {}
        pictureInfo.scaleFactor = 0;
        pictureInfo.modelRotation = this.modelRotation;
        pictureInfo.minResult = minResult;
        pictureInfo.maxResult = maxResult;

        scope.pretenderMins = new Set();
        scope.pretenderMaxs = new Set();

        var colorMapTexture;
        if (scope.DRAW_RESULTS && scope.textures) {
            editor.addTextures(scope.textures);
            var currentTextureName = scope.texture ? scope.texture : this.getDefaultTexture(textures);
            colorMapTexture = editor.setTexture(currentTextureName);
        }

        for (var i = 0; i < pictureData.length; i++) {

            var geometryObject = pictureData[i];
            scope.parseModelPart(geometryObject, names, pictureInfo, colorMapTexture, i);
            scope.pretenderMins.add(pictureInfo.geometryObjectData[i].pretenderMinElement);
            scope.pretenderMaxs.add(pictureInfo.geometryObjectData[i].pretenderMaxElement);
        }

        scope.pretenderMins = new Set(_.orderBy(Array.from(scope.pretenderMins), ['value'], 'desc'));
        scope.pretenderMaxs = new Set(_.orderBy(Array.from(scope.pretenderMaxs), ['value'], 'asc'));

        editor.setMinMaxResult(_.last(Array.from(scope.pretenderMins)), _.last(Array.from(scope.pretenderMaxs)));

        return pictureInfo;
    }
};
