var Loader = function (editor, textureUrl) {

    var scope = this;
    var signals = editor.signals;
    var DRAW_RESULTS = true;
    this.textureUrl = textureUrl;
    this.objectsTree = null;
    this.coordFactor = 1;
    this.modelRotation = null;

    this.getObjectsTreeModel = function () {
        return scope.objectsTree;
    };


    this.selectObject = function (branch) {
        scope.traverseTree(branch, function (child) {
            scope.selectViewerObjects(child);
        });
    };

    this.showObject = function (branch) {
        scope.traverseTree(branch, function (child) {
            scope.showViewerObjects(child);
        });
    };


    this.hideObject = function (branch) {
        scope.traverseTree(branch, function (child) {
            scope.hideViewerObjects(child);
        });
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

            if(!value.objectPartsArray || value.objectPartsArray.length == 0) {
                return;
            }

            meshesData[key] = [];
            var totalObjectDataElement = value;
            var objectElement = totalObjectDataElement.objectPartsArray;
            var pointsTable = totalObjectDataElement.pointsTable;
            var vertices = totalObjectDataElement.totalObjVertices;
            var results = totalObjectDataElement.totalObjResults;
            var objectNames = totalObjectDataElement.objectNames;
            var pointsNumbers = totalObjectDataElement.pointsNumbers;

            for (var j = 0; j < objectElement.length; j++) {
                var objectGeometry = objectElement[j].objectGeometry;
                var facesMaterial = objectElement[j].facesMaterial;
                var drawResultsMaterial = objectElement[j].drawResultsMaterial;
                var edgesGeometry = objectElement[j].edgesGeometry;
                var edgesMaterial = objectElement[j].edgesMaterial;
                var drawResults = objectElement[j].drawResults;

                if (objectGeometry) {
                    var mesh = new THREE.Mesh(objectGeometry, drawResultsMaterial ? drawResultsMaterial: facesMaterial);
                    mesh.userData.pointsTable = pointsTable;
                    mesh.userData.name = objectElement[j].name;
                    mesh.userData.totalObjVertices = vertices;
                    mesh.userData.totalObjResults = results;
                    mesh.userData.objectNames = objectNames;
                    mesh.userData.pointsNumbers = pointsNumbers;

                    mesh.name = objectElement[j].name;
                    mesh.uniqueId = mesh.uuid;
                    mesh.parentName = objectElement[j].parentName;
                    mesh.defaultColor = facesMaterial.color.clone();
                    mesh.facesMaterial = facesMaterial;
                    mesh.drawResults = drawResults;

                    modelGroup.add(mesh);
                    editor.octree.add(mesh);
                }
                var lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                lines.userData.pointsTable = pointsTable;
                lines.userData.name = objectElement[j].name;
                lines.userData.totalObjVertices = vertices;
                lines.userData.totalObjResults = results;
                lines.userData.objectNames = objectNames;
                lines.userData.pointsNumbers = pointsNumbers;

                modelGroup.add(lines);
                editor.octree.add(lines);

                lines.name = objectElement[j].name;
                lines.uniqueId = lines.uuid;
                lines.parentName = objectElement[j].parentName;
                lines.defaultColor = edgesMaterial.color.clone();
                if (objectGeometry && objectGeometry.attributes.position.count > 0 && edgesGeometry.attributes.position.count > 0) {
                    lines.name = objectElement[j].name + ".EDGE";
                    mesh.name = objectElement[j].name + ".FACE";
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
                var textMesh = scope.createText2D(textElement[key].label, textElement[key].color, null, textElement[key].size);
                textMesh.userData = {};
                textMesh.userData.quaternion = "camera";
                textMesh.position.copy(textElement[key].position);
                modelGroup.add(textMesh);
            });
        });
        editor.addModelGroup(modelGroup);
        return meshesData;
    };

    this.createAndAddCommonObjects = function (pictureInfo) {
        var result = pictureInfo.geometryObjectData;
        var meshesData = {};
        var modelGroup = new THREE.Object3D();
        _.forEach(result, function(value, key) {

            if(!value.objectPartsArray || value.objectPartsArray.length == 0) {
                return;
            }

            meshesData[key] = [];
            var totalObjectDataElement = value;
            var objectElement = totalObjectDataElement.objectPartsArray;
            var pointsTable = totalObjectDataElement.pointsTable;
            var vertices = totalObjectDataElement.totalObjVertices;
            var results = totalObjectDataElement.totalObjResults;
            var objectNames = totalObjectDataElement.objectNames;
            var pointsNumbers = totalObjectDataElement.pointsNumbers;
            var lineCommonPositionsArray = totalObjectDataElement.lineCommonPositionsArray;
            var faceCommonGeometryData = totalObjectDataElement.faceCommonGeometryData;

            var geoCommonMeshGeometry = new THREE.BufferGeometry();
            geoCommonMeshGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( faceCommonGeometryData.positions, 3 ));
            geoCommonMeshGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( faceCommonGeometryData.colors, 3 ) );
            geoCommonMeshGeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( faceCommonGeometryData.normals, 3 ));
            geoCommonMeshGeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( faceCommonGeometryData.uvs, 2 ));


            var mesh = new THREE.Mesh(geoCommonMeshGeometry, objectElement[0].drawResultsMaterial  ?
                objectElement[0].drawResultsMaterial : objectElement[0].facesMaterial);
            mesh.userData.pointsTable = pointsTable;
            mesh.userData.totalObjVertices = vertices;
            mesh.userData.totalObjResults = results;
            mesh.userData.objectNames = objectNames;
            mesh.userData.pointsNumbers = pointsNumbers;

            mesh.name = totalObjectDataElement.name;
            mesh.uniqueId = mesh.uuid;
            mesh.parentName = totalObjectDataElement.name;
            mesh.defaultColor = objectElement[0].facesMaterial.color.clone();
            mesh.facesMaterial = objectElement[0].facesMaterial;
            mesh.drawResults = objectElement[0].drawResults;

            modelGroup.add(mesh);

            if(!editor.scene.meshes) {
                editor.scene.meshes = [];
            }
            editor.scene.meshes.push( mesh );

            editor.octree.add(mesh);
// TODO move to common geometry

            _.forEach(objectElement, function(objElement) {
                var simpleShapes = objElement.simpleShapes;
                var v = 0;
                var simpleShapesGeometry = new THREE.Geometry();
                for (var k = 0; k < simpleShapes.length; k++) {
                    for (var n = 0; n < simpleShapes[k].vertices.length; n++) {
                        simpleShapesGeometry.vertices.push(simpleShapes[k].vertices[n]);
                    }
                    for (var n = 0; n < simpleShapes[k].faces.length; n++) {
                        var face = simpleShapes[k].faces[n];
                        face.a += v;
                        face.b += v;
                        face.c += v;

                        simpleShapesGeometry.faces.push(simpleShapes[k].faces[n]);
                    }
                    v += simpleShapes[k].vertices.length;

                }

                var shapes = new THREE.Mesh(simpleShapesGeometry, objElement.facesMaterial);

                modelGroup.add(shapes);

            });


            var geoCommonLineGeometry = new THREE.BufferGeometry();
            geoCommonLineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( lineCommonPositionsArray, 3 ) );
            var lines = new THREE.LineSegments(geoCommonLineGeometry, objectElement[0].edgesMaterial);
            modelGroup.add(lines);
            lines.userData.pointsTable = pointsTable;
            lines.parentName = totalObjectDataElement.name;
            lines.defaultColor = objectElement[0].edgesMaterial.color.clone();
            lines.userData.totalObjVertices = vertices;
            lines.userData.totalObjResults = results;
            lines.userData.objectNames = objectNames;
            lines.userData.pointsNumbers = pointsNumbers;
            editor.octree.add(lines);

            if(!editor.scene.lines) {
                editor.scene.lines = [];
            }
            editor.scene.lines.push( lines );

            if (geoCommonMeshGeometry.attributes.position.count > 0 && geoCommonLineGeometry.attributes.position.count > 0) {
                lines.name = totalObjectDataElement.name + ".EDGE";
                mesh.name = totalObjectDataElement.name + ".FACE";
                meshesData[key].push(lines);
                meshesData[key].push(mesh);
            } else if (geoCommonMeshGeometry.attributes.position.count === 0 && geoCommonLineGeometry.attributes.position.count > 0) {
                if(_.trim(lines.name).length === 0){
                    lines.name = totalObjectDataElement.name + ".EDGE";
                }
                meshesData[key].push(lines);
            } else if (geoCommonMeshGeometry.attributes.position.count > 0 && geoCommonLineGeometry.attributes.position.count === 0) {
                if(_.trim(mesh.name).length === 0){
                    mesh.name = totalObjectDataElement.name + ".FACE";
                }
                meshesData[key].push(mesh);
            }
        });

        var textData = pictureInfo.textData;
        _.forEach(textData, function(value, key) {
            var textElement = value;
            _.forEach(textElement, function(value, key) {
                var textMesh = scope.createText2D(textElement[key].label, textElement[key].color, null, textElement[key].size);
                textMesh.userData = {};
                textMesh.userData.quaternion = "camera";
                textMesh.position.copy(textElement[key].position);
                modelGroup.add(textMesh);
            });
        });
        editor.addModelGroup(modelGroup);
        return meshesData;
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

    this.removeModel = function () {
        editor.removeAllObjects();
    };

    this.reloadModel = function (data) {
        editor.removeAllObjects();
        scope.handleJSONData(data);
        data = null;
        delete data;
    };


    this.handleJSONData = function (data) {
        editor.onRenderStart();



        var pictureInfo = this.parseModel(data);
        var result;
        if (editor.options.detailModelView) {
            result = scope.createAndAddAllObjects(pictureInfo);
        } else {
            result = scope.createAndAddCommonObjects(pictureInfo);
        }

        var traverse = function (obj) {
            if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (typeof obj[i] == "object" && obj[i] && !(obj[i] instanceof THREE.Mesh) && !(obj[i] instanceof THREE.LineSegments)) {
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
                            }

                        }else{
                            node.text = node.name;
                        }
                        traverse(obj[i]);
                    } else {
                    }
                }
            } else {
                for (var prop in obj) {
                    if (typeof obj[prop] == "object" && obj[prop] && !(obj[prop] instanceof THREE.Mesh) && !(obj[prop] instanceof THREE.LineSegments)) {
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

        data.tree.uniqueId = THREE.Math.generateUUID();

        scope.objectsTree = [data.tree];
        editor.onTreeLoad(data.tree);

        // TODO: improve
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
                var sphere = new THREE.SphereGeometry(simpleShapes[k].radius/this.coordFactor, simpleShapes[k].segments, simpleShapes[k].segments);
                var index = simpleShapes[k].index;
                var m = new THREE.Matrix4();
                var v = vertices[index];
                m.makeTranslation(v.x, v.y, v.z);
                sphere.applyMatrix(m);
                pictureGeometryElement.simpleShapes.push(sphere);
            }
            if (simpleShapes[k].shape == "cube") {
                var cubeCoord = simpleShapes[k].divideScalar (this.coordFactor );
                var cube = new THREE.CubeGeometry(cubeCoord.x, cubeCoord.y, cubeCoord.z);
                var index = simpleShapes[k].index;
                var m = new THREE.Matrix4();
                var v = vertices[index];
                m.makeTranslation(v.x, v.y, v.z);
                cube.applyMatrix(m);
                pictureGeometryElement.simpleShapes.push(cube);
            }
            if (simpleShapes[k].shape == "cylinder") {
                var cylinder = new THREE.CylinderGeometry(simpleShapes[k].r1/this.coordFactor, simpleShapes[k].r2/this.coordFactor, simpleShapes[k].h/this.coordFactor, simpleShapes[k].segments, 8);
                var index = simpleShapes[k].index;
                var m = new THREE.Matrix4();
                var v = vertices[index];
                m.makeTranslation(v.x, v.y, v.z);
                cylinder.applyMatrix(m);
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
            var transparencyValue =  settings.transparancy > 0 ? true : false;
            var opacityValue = settings.transparancy > 0 ? transparencyValue : 1;
            pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.FrontSide,
                flatShading: true,
                transparent: transparencyValue,
                opacity: opacityValue
            });
        }

    }

    this.parseModelFaces = function (faceGeometry, faces, vertices, uv, faceColor, results, maxResult, minResult,
                                     faceCommonGeometryData) {
        var offset = 0;
        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        var drawTexture = (!drawResults) && (uv && uv.length != 0);

        var positions = [];
        var colors = [];
        var normals = [];
        var uvs = [];
        while (offset < faces.length) {
            var cb = new THREE.Vector3();
            var ab = new THREE.Vector3();
            var vA = vertices[faces[offset]];
            var array1 = vA.toArray();
            positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            var vB = vertices[faces[offset + 1]];
            array1 = vertices[faces[offset + 1]].toArray();
            positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            var vC = vertices[faces[offset + 2]];
            array1 = vertices[faces[offset + 2]].toArray();
            positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();
            array1 = cb.toArray();
            normals.push( array1[0], array1[1], array1[2] );
            normals.push( array1[0], array1[1], array1[2] );
            normals.push( array1[0], array1[1], array1[2] );


            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );

            colors.push(faceColor, faceColor, faceColor);
            colors.push(faceColor, faceColor, faceColor);
            colors.push(faceColor, faceColor, faceColor);

            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);

            if (drawResults) { // if results exist generating vertex coordinates according to results.
                uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult));

                faceCommonGeometryData.uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult));
            }

            if (drawTexture) {
                uvs.push(uv[offset * 2], uv[offset * 2 + 1], uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
                faceCommonGeometryData.uvs.push(uv[offset * 2], uv[offset * 2 + 1], uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
            }

            // mirror faces
            cb = new THREE.Vector3();
            ab = new THREE.Vector3();
            vA = vertices[faces[offset]];
            array1 = vA.toArray();
            positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            vB = vertices[faces[offset + 2]];
            array1 = vertices[faces[offset + 2]].toArray();
            positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            vC = vertices[faces[offset + 1]];
            array1 = vertices[faces[offset + 1]].toArray();
            positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();
            array1 = cb.toArray();
            normals.push( array1[0], array1[1], array1[2]);
            normals.push( array1[0], array1[1], array1[2]);
            normals.push( array1[0], array1[1], array1[2]);


            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);

            colors.push(faceColor, faceColor, faceColor);
            colors.push(faceColor, faceColor, faceColor);
            colors.push(faceColor, faceColor, faceColor);


            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);

            if (drawResults) { // if results exist generating vertex coordinates according to results.
                uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult));

                faceCommonGeometryData.uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult));
            }

            if (drawTexture) {
                uvs.push(1 - uv[offset * 2], uv[offset * 2 + 1], 1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], 1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
                faceCommonGeometryData.uvs.push(1 - uv[offset * 2], uv[offset * 2 + 1], 1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], 1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
            }
            offset = offset + 3;

        }
        faceGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ));
        faceGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        faceGeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ));
        faceGeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ));
    };

    this.parseModelObjectEdgesFaces = function (geometryObject, colorMapTexture, vertices, maxResult, minResult,
                                                 objectPartsArray, lineCommonPositionsArray, faceCommonGeometryData) {

        var groups = geometryObject.groups; // group names
        var results = geometryObject.results; // group names

        var name = geometryObject.name;

        var edgeGroups = geometryObject.edges;
        var faceGroups = geometryObject.faces;
        var uvGroups = geometryObject.uvCoords;
        var groupSettings = geometryObject.groupSettings;
        var objectSettings = geometryObject.objectSettings;

        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        var transparencyValue = objectSettings.transparancy > 0 ? true : false;
        var opacityValue = objectSettings.transparancy > 0 ? (1 - objectSettings.transparancy) : 1;
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

        for (var j = 0; j < groups.length; j++) {  //reading edges and faces by groups

            var settings = groupSettings[j];
            var text3d = settings.text3d;
            if (settings.lineColor == undefined) {
                settings = objectSettings;
            }

            var pictureGeometryElement = {};
            //Creating THREE.geometry for faces and lines in group
            var faceGeometry = new THREE.BufferGeometry();
            var lineGeometry = new THREE.BufferGeometry();
            var edges = edgeGroups[j];
            var offset = 0;
            var positions = [];

            if(edges) {

                while (offset < edges.length) {
                    var array1 = vertices[edges[offset]].toArray();
                    positions.push(array1[0], array1[1], array1[2]);
                    lineCommonPositionsArray.push(array1[0], array1[1], array1[2]);
                    var array2 = vertices[edges[offset + 1]].toArray();
                    positions.push(array2[0], array2[1], array2[2]);
                    lineCommonPositionsArray.push(array2[0], array2[1], array2[2]);
                    offset += 2;
                }
                lineGeometry.addAttribute('position', new THREE.Float32BufferAttribute(positions, 3));

                var faces = faceGroups[j];
                var uv = uvGroups[j];
                var fi = faces.length;

                var drawTexture = (!drawResults) && (uv && uv.length != 0)

                scope.parseModelFaces(faceGeometry, faces, vertices, uv, settings.faceColor, results,
                    maxResult, minResult, faceCommonGeometryData);


                if (faceGeometry.attributes.position.count > 0) {
                    pictureGeometryElement.objectGeometry = faceGeometry;
                }
                pictureGeometryElement.edgesGeometry = lineGeometry;
                pictureGeometryElement.objectGeometryName = name + '.' + groups[j];
                pictureGeometryElement.name = groups[j];
                pictureGeometryElement.parentName = name;
                pictureGeometryElement.drawResults = drawResults;
                if (drawResults) { // Draw face with spectral texture according to results
                    pictureGeometryElement.drawResultsMaterial = new THREE.MeshLambertMaterial({
                        map: colorMapTexture,
                        flatShading: true,
                        side: THREE.FrontSide

                    });
                    pictureGeometryElement.facesMaterial = simpleFacesMaterial;
                } else {
                    if (drawTexture && settings.texture.name != undefined) {
                        // Draw face with texture
                        scope.createTexture(settings, pictureGeometryElement)
                    } else {

                        if (text3d != undefined) {  // face without texture with 3dText
                            var texture = new THREE.Texture(scope.createTextCanvas(text3d, settings.textColor, null, 256, settings.faceColor));
                            texture.flipY = true;
                            texture.needsUpdate = true;


                            pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                                map: texture,
                                flatShading: true,
                                side: THREE.FrontSide,
                                transparent: settings.transparancy > 0 ? true : false,
                                opacity: settings.transparancy > 0 ? (1 - settings.transparancy) : 1
                            });
                        }
                        else { // face without texture & 3dText
                            pictureGeometryElement.facesMaterial = simpleFacesMaterial;

                        }

                    }

                }
            }

            pictureGeometryElement.edgesMaterial = simpleLinesMaterial;
            pictureGeometryElement.facesMaterial = simpleFacesMaterial;
            pictureGeometryElement.simpleShapes = [];  //Simple shapes
            if (geometryObject.simpleShapes && geometryObject.simpleShapes[j]) {
                scope.parseSimpleShapes(geometryObject.simpleShapes, j, pictureGeometryElement, vertices);

            }
            objectPartsArray.push(pictureGeometryElement)

        }

    };


    this.parseModelPart = function (geometryObject, names, pictureInfo, colorMapTexture, index, maxResult, minResult) {
        var name = geometryObject.name;
        var scale = 1;
        names.push(name);
        var textPositionsData = {};
        var coords = geometryObject.coords;
        var edges = geometryObject.edges;
        var results = geometryObject.results;
        var pointsTable = geometryObject.pointsTable;
        var objectNames = geometryObject.objectNames;
        var pointsNumbers = geometryObject.pointsNumbers;
        var vertices = [];

        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        var offset = 0;
        while (offset < coords.length) { //reading vertices
            var vertex = new THREE.Vector3();
            vertex.x = coords[offset++] * scale;
            vertex.y = coords[offset++] * scale;
            vertex.z = coords[offset++] * scale;
            var dividedVertex = vertex.divideScalar (this.coordFactor );
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
            textPositionsData[ind].size = objectSettings.textSize / this.coordFactor * 10;
            textPositionsData[ind].color = objectSettings.textColor;
        }
        var objectPartsArray = [];
        var lineCommonPositionsArray = [];
        var faceCommonGeometryData = {};

        faceCommonGeometryData.positions = [];
        faceCommonGeometryData.colors = [];
        faceCommonGeometryData.normals = [];
        faceCommonGeometryData.uvs = [];

        scope.parseModelObjectEdgesFaces(geometryObject, colorMapTexture, vertices, maxResult, minResult, objectPartsArray, lineCommonPositionsArray,
            faceCommonGeometryData);
        var totalGeometryObj = {};
        totalGeometryObj.objectPartsArray = objectPartsArray;
        totalGeometryObj.pointsTable = pointsTable;
        totalGeometryObj.objectNames = objectNames;
        totalGeometryObj.pointsNumbers = pointsNumbers;
        totalGeometryObj.totalObjVertices = vertices;
        totalGeometryObj.totalObjResults = results;
        totalGeometryObj.lineCommonPositionsArray = lineCommonPositionsArray;
        totalGeometryObj.faceCommonGeometryData = faceCommonGeometryData;
        totalGeometryObj.name = name;

        pictureInfo.geometryObjectData[index] = totalGeometryObj;

        pictureInfo.textData[index] = textPositionsData;


    }

    this.getV = function (result, maxResult, minResult) {
        return (result - minResult) / (maxResult - minResult);
    }

    this.setTextureUrl = function (url) {
        this.textureUrl = url;
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
    }


    this.parseModel = function (json) {
        var pictureData = json.pictureData; // reading array for all geometry objects
        var minResult = json.minResult;
        var maxResult = json.maxResult;
        DRAW_RESULTS = (!(/^(false|0)$/i).test(json.drawResults) && !!json.drawResults) || editor.options.drawResults;
        this.modelRotation = json.modelRotation;

        var names = [];
        var links = [];
        var pictureInfo = {};
        pictureInfo.geometryObjectData = {}
        pictureInfo.textData = {}
        pictureInfo.scaleFactor = 0;
        pictureInfo.modelRotation = this.modelRotation;

        var colorMapTexture;
        if (DRAW_RESULTS) {
            var imageName = scope.textureUrl ? scope.textureUrl + 'color-spectrum.png' : 'color-spectrum.png';
            colorMapTexture = THREE.ImageUtils.loadTexture(imageName, null, function () {
                editor.reRender();
            }, function () {
                console.log("error")
            });

            // Add texture hardcode for offline mode
            // var image = new Image();
            // image.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAP8AAAD/CAIAAACxapedAAAABGdBTUEAALGPC/xhBQAAAAlwSFlzAAAOwgAADsIBFShKgAAAABl0RVh0U29mdHdhcmUAcGFpbnQubmV0IDQuMC4xNkRpr/UAAAQqSURBVHhe7dMxiBAEGIbhN8ELlZQUjRQsLDRMsNAwycJCCSGHCxRyMLgoCSEHA4UcFBQMukEJwYYbFAxsuCHBwEAHGwwMMjC4QKGLDAwUMjBQv26/+eDge+GZ3uVfvp+3iNSJN4jUifVE6sQrROrEy0TqxCoideIFInXieSJ14lkidWIJkTrxFJE6MZ9InZhHpE7MIVInHidSJ2YQqRPMmPgAqRIzI5ViVqRSPBGpFE9GKsXCSKVYHKkUSyOVYlmkUiyPVIqVkUqxOlIp1kQqxbpIpXgtUik2RirFpkileDtSKd6JVIrBSKXYFqkU70Uqxc5IpRiKVIoPI5Xi40il+CRSKfZGKsW+SKX4LFIpDkYqxeFIpTgaqRRfRJoWhieVKTVxjmORSvFlpFKcjFSKkUilOBWpFGcileJspFKMRirFt5FKcT5SKS5EKsXFSKW4HKkUVyKV4mqkUvwcqRTXI5ViLFIpbkQqxe+RSvFnpFLcjlSKO5FK8U+kUtyPVIoHkUrx6KFUivwnlSL/SqXIXakU+VsqRf6SSpFxqdIfE+u/KZUiv0mlyK9SKfKLVIr8JJUiP0qlyA9SKXJJKkW+l0qR76RS5JxUioxKpcg3UinytVSKnJZKkRGpFPlKKkVOSKXIcakUGZZKkc+lUuSIVIockkqRA1Ipsl8qRfZKpcgeqRTZLZUiu6RS5AOpFHlfKkV2SKXIdqkUeVcqRbZKpcgWqRTZJJUib0qlyOtSKbJeKkXWSqXIS1IpskoqRVZIpchzUinyjFSKLJFKkUVSKbJAKkXmSaXIHKkUGZBKkRlSqccilWIg0rQwc1KZasyOVIq5kUoxP1IpFkUqxeJIpVgaqRTLIpViRaRSvBipFKsjlWJNpEZrJ9b/aqRSbIhUio2RSrE5Uim2RCrF1kilGIxUiu2RSrEjUil2RirFUKRS7IpUit2RSrEnUik+jVSK/ZFKcSBSKQ5GKsXhSKU4GqkUw5FKcSxSKU5EKsXJSKUYiVSKU5FKcSZSKc5GKsVopFKci1SK85FKcSFSKS5GKsXlSKW4EqkUVyOV4lqkUlyPVIqxSKW4EakU45FKcStSKW5HKsXdSNPCnUllqnEvUinuRyrFw0dSKR49kEqR+1Ipck8qRe5KpchtqRS5JZUi41IpclMqRcakUuS6VIpck0qRq1IpckUqRS5LpcglqRS5IJUi56VS5JxUioxKpchZqRQ5I5Uip6VSZEQqRU5KpcgJqRQ5LpUiw1IpclQqRY5IpcghqRQ5IJUi+6RSZK9UiuyRSpHdUinykVSKDEmlyE6pFNkhlSLbpFJkUCpFtkqlyBapFNkslSIbpVJkg1SKrJNKkTVSKbJaKkVWSqXIcqkUWSaVIkulUuRpqRRZKJUiC6TpYf6kMsXIXKkUmSVVmj2x/gGp0gD/A8JXBneznKjMAAAAAElFTkSuQmCC';
            //
            // colorMapTexture = new THREE.Texture();
            // colorMapTexture.image = image;
            // image.onload = function() {
            //     colorMapTexture.needsUpdate = true;
            //     editor.reRender();
            // };

            colorMapTexture.magFilter = THREE.NearestFilter;
            colorMapTexture.minFilter = THREE.LinearFilter;
            editor.addTexture(colorMapTexture);
        }

        // calculate scaleFactor
        for (var i = 0; i < pictureData.length; i++) {
            var coords = pictureData[i].coords;
            var maxCoordinate = _.max(coords);
            if(this.coordFactor < maxCoordinate) {
                this.coordFactor = maxCoordinate;
            }
        }
        for (var i = 0; i < pictureData.length; i++) {

            var geometryObject = pictureData[i];
            scope.parseModelPart(geometryObject, names, pictureInfo, colorMapTexture, i, maxResult, minResult);
        }
        return pictureInfo;
    }
};
