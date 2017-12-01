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

    this.loadMeshes = function (pictureInfo) {

        var result = pictureInfo.geometryObjectData;
        var scaleFactor = pictureInfo.scaleFactor;
        var meshesData = {};
        var modelGroup = new THREE.Object3D();
        _.forEach(result, function(value, key) {
            meshesData[key] = [];
            var totalObjectDataElement = value;
            var objectElement = totalObjectDataElement.objectPartsArray;
            var pointsTable = totalObjectDataElement.pointsTable;
            var vertices = totalObjectDataElement.totalObjVertices;
            var results = totalObjectDataElement.totalObjResults;
            var lineCommonPositionsArray = totalObjectDataElement.lineCommonPositionsArray;
            var faceCommonGeometryData = totalObjectDataElement.faceCommonGeometryData;

            var geoCommonMeshGeometry = new THREE.BufferGeometry();


            geoCommonMeshGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( faceCommonGeometryData.positions, 3 ));
            geoCommonMeshGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( faceCommonGeometryData.colors, 3 ) );
            geoCommonMeshGeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( faceCommonGeometryData.normals, 3 ));
            geoCommonMeshGeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( faceCommonGeometryData.uvs, 2 ));


            var mesh = new THREE.Mesh(geoCommonMeshGeometry, objectElement[0].facesMaterial);
            mesh.userData.pointsTable = pointsTable;
            // mesh.userData.name = objectElement[j].name;
            mesh.userData.totalObjVertices = vertices;
            mesh.userData.totalObjResults = results;

            // mesh.name = objectElement[j].name;
            mesh.uniqueId = mesh.uuid;
            // mesh.parentName = objectElement[j].parentName;
            mesh.defaultColor = objectElement[0].facesMaterial.color.clone();

            modelGroup.add(mesh);
            editor.octree.add(mesh);

            // for (var j = 0; j < objectElement.length; j++) {
                // var objectGeometry = objectElement[j].objectGeometry;
                // var facesMaterial = objectElement[j].facesMaterial;
                // var edgesGeometry = objectElement[j].edgesGeometry;
                // var edgesMaterial = objectElement[j].edgesMaterial;

               // if(objectGeometry){
               //     var mesh = new THREE.Mesh(objectGeometry, facesMaterial);
               //     mesh.userData.pointsTable = pointsTable;
               //     mesh.userData.name = objectElement[j].name;
               //     mesh.userData.totalObjVertices = vertices;
               //     mesh.userData.totalObjResults = results;
               //
               //     mesh.name = objectElement[j].name;
               //     mesh.uniqueId = mesh.uuid;
               //     mesh.parentName = objectElement[j].parentName;
               //     mesh.defaultColor = facesMaterial.color.clone();
               //
               //     modelGroup.add(mesh);
               // }

//            http://stackoverflow.com/questions/17146650/combining-multiple-line-geometries-into-a-single-geometry

                // var lines = new THREE.LineSegments(edgesGeometry, edgesMaterial);
                //
                // lines.userData.pointsTable = pointsTable;
                // lines.userData.name = objectElement[j].name;
                // lines.userData.totalObjVertices = vertices;
                // lines.userData.totalObjResults = results;
                //
                // modelGroup.add(lines);



                // editor.octree.add(mesh);
                // editor.octree.add(lines);

                // lines.name = objectElement[j].name;
                // lines.uniqueId = lines.uuid;
                // lines.parentName = objectElement[j].parentName;
                // lines.defaultColor = edgesMaterial.color.clone();



//                 if (objectGeometry.attributes.position.count > 0 && edgesGeometry.attributes.position.count > 0) {
//                     lines.name = objectElement[j].name + ".EDGE";
//                     mesh.name = objectElement[j].name + ".FACE";
//                     meshesData[key].push(lines);
//                     meshesData[key].push(mesh);
//                 } else if (objectGeometry.attributes.position.count === 0 && edgesGeometry.attributes.position.count > 0) {
//                     meshesData[key].push(lines);
//                 } else if (objectGeometry.attributes.position.count > 0 && edgesGeometry.attributes.position.count === 0) {
//                     meshesData[key].push(mesh);
//                 }
// TODO move to common geometry
                // var simpleShapes = objectElement[j].simpleShapes;
                // var v = 0;
                // var simpleShapesGeometry = new THREE.Geometry();
                // for (var k = 0; k < simpleShapes.length; k++) {
                //     for (var n = 0; n < simpleShapes[k].vertices.length; n++) {
                //         simpleShapesGeometry.vertices.push(simpleShapes[k].vertices[n]);
                //     }
                //     for (var n = 0; n < simpleShapes[k].faces.length; n++) {
                //         var face = simpleShapes[k].faces[n];
                //         face.a += v;
                //         face.b += v;
                //         face.c += v;
                //
                //         simpleShapesGeometry.faces.push(simpleShapes[k].faces[n]);
                //     }
                //     v += simpleShapes[k].vertices.length;
                //
                // }
                //
                // var shapes = new THREE.Mesh(simpleShapesGeometry, facesMaterial);

                // modelGroup.add(shapes);
            // }


            var geoLineGeometry = new THREE.BufferGeometry();
            geoLineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( lineCommonPositionsArray, 3 ) );
            var lines = new THREE.LineSegments(geoLineGeometry, objectElement[0].edgesMaterial);
            modelGroup.add(lines);
            lines.userData.pointsTable = pointsTable;
            // lines.userData.name = objectElement[j].name;
            lines.userData.totalObjVertices = vertices;
            lines.userData.totalObjResults = results;
            editor.octree.add(lines);
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
        var result = scope.loadMeshes(pictureInfo);

        var traverse = function (obj) {
            if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (typeof obj[i] == "object" && obj[i] && !(obj[i] instanceof THREE.Mesh) && !(obj[i] instanceof THREE.LineSegments)) {
                        var node = obj[i];
                        if (node.index != -1) {
                            if (result[node.index]) {
                                node.children = result[node.index];
                                node.uniqueId = THREE.Math.generateUUID();
                            }

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
                                node.children = result[node.index];
                                node.uniqueId = THREE.Math.generateUUID();
                            }
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
                var sphere = new THREE.SphereGeometry(simpleShapes[k].radius, simpleShapes[k].segments, simpleShapes[k].segments);
                var index = simpleShapes[k].index;
                var m = new THREE.Matrix4();
                var v = vertices[index];
                m.makeTranslation(v.x, v.y, v.z);
                sphere.applyMatrix(m);
                pictureGeometryElement.simpleShapes.push(sphere);
            }
            if (simpleShapes[k].shape == "cube") {
                var cube = new THREE.CubeGeometry(simpleShapes[k].x, simpleShapes[k].y, simpleShapes[k].z);
                var index = simpleShapes[k].index;
                var m = new THREE.Matrix4();
                var v = vertices[index];
                m.makeTranslation(v.x, v.y, v.z);
                cube.applyMatrix(m);
                pictureGeometryElement.simpleShapes.push(cube);
            }
            if (simpleShapes[k].shape == "cylinder") {
                var cylinder = new THREE.CylinderGeometry(simpleShapes[k].r1, simpleShapes[k].r2, simpleShapes[k].h, simpleShapes[k].segments, 8);
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

    this.parseModelFaces = function (/*faceGeometry, */faces, vertices, uv, faceColor, results, maxResult, minResult,
                                     faceCommonGeometryData) {
        var offset = 0;
        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        var drawTexture = (!drawResults) && (uv.length != 0);

        // var positions = [];
        // var colors = [];
        // var normals = [];
        // var uvs = [];
        while (offset < faces.length) {
            var cb = new THREE.Vector3();
            var ab = new THREE.Vector3();
            var vA = vertices[faces[offset]];
            var array1 = vA.toArray();
            // positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            var vB = vertices[faces[offset + 1]];
            array1 = vertices[faces[offset + 1]].toArray();
            // positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            var vC = vertices[faces[offset + 2]];
            array1 = vertices[faces[offset + 2]].toArray();
            // positions.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2] );

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();
            array1 = cb.toArray();
            // normals.push( array1[0], array1[1], array1[2] );
            // normals.push( array1[0], array1[1], array1[2] );
            // normals.push( array1[0], array1[1], array1[2] );


            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2] );

            // colors.push(faceColor, faceColor, faceColor);
            // colors.push(faceColor, faceColor, faceColor);
            // colors.push(faceColor, faceColor, faceColor);

            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);

            if (drawResults) { // if results exist generating vertex coordinates according to results.
                // uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult),
                //     0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult));

                faceCommonGeometryData.uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult));
            }

            if (drawTexture) {
                // uvs.push(uv[offset * 2], uv[offset * 2 + 1], uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
                faceCommonGeometryData.uvs.push(uv[offset * 2], uv[offset * 2 + 1], uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
            }

            // mirror faces
            cb = new THREE.Vector3();
            ab = new THREE.Vector3();
            vA = vertices[faces[offset]];
            array1 = vA.toArray();
            // positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            vB = vertices[faces[offset + 2]];
            array1 = vertices[faces[offset + 2]].toArray();
            // positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            vC = vertices[faces[offset + 1]];
            array1 = vertices[faces[offset + 1]].toArray();
            // positions.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.positions.push( array1[0], array1[1], array1[2]);

            cb.subVectors(vC, vB);
            ab.subVectors(vA, vB);
            cb.cross(ab);

            cb.normalize();
            array1 = cb.toArray();
            // normals.push( array1[0], array1[1], array1[2]);
            // normals.push( array1[0], array1[1], array1[2]);
            // normals.push( array1[0], array1[1], array1[2]);


            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);
            faceCommonGeometryData.normals.push( array1[0], array1[1], array1[2]);

            // colors.push(faceColor, faceColor, faceColor);
            // colors.push(faceColor, faceColor, faceColor);
            // colors.push(faceColor, faceColor, faceColor);


            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);
            faceCommonGeometryData.colors.push(faceColor, faceColor, faceColor);

            if (drawResults) { // if results exist generating vertex coordinates according to results.
                // uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult),
                //     0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult));

                faceCommonGeometryData.uvs.push(0.0, scope.getV(results[faces[offset]], maxResult, minResult), 0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult),
                    0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult));
            }

            if (drawTexture) {
                // uvs.push(1 - uv[offset * 2], uv[offset * 2 + 1], 1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], 1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
                faceCommonGeometryData.uvs.push(1 - uv[offset * 2], uv[offset * 2 + 1], 1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1], 1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]);
            }
            offset = offset + 3;

        }
        // faceGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ));
        // faceGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
        // faceGeometry.addAttribute( 'normal', new THREE.Float32BufferAttribute( normals, 3 ));
        // faceGeometry.addAttribute( 'uv', new THREE.Float32BufferAttribute( uvs, 2 ));
    };


    // this.parseModelFaces = function (faceGeometry, faces, vertices, uv, faceColor, results, maxResult, minResult) {
    //     var offset = 0;
    //     var drawResults = (DRAW_RESULTS && results && (results.length != 0));
    //     var drawTexture = (!drawResults) && (uv.length != 0);
    //     while (offset < faces.length) {
    //         var face = new THREE.Face3();
    //         var ind = faceGeometry.vertices.length;
    //         faceGeometry.vertices.push(vertices[faces[offset]]);
    //         faceGeometry.vertices.push(vertices[faces[offset + 1]]);
    //         faceGeometry.vertices.push(vertices[faces[offset + 2]]);
    //         face.a = ind;
    //         face.b = ind + 1;
    //         face.c = ind + 2;
    //
    //         face.color = faceColor;
    //
    //         var resultsUV = [];
    //         if (drawResults) { // if results exist generating vertex coordinates according to results.
    //             resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset]], maxResult, minResult)));
    //             resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult)));
    //             resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult)));
    //             faceGeometry.faceVertexUvs[0].push([resultsUV[0], resultsUV[1], resultsUV[2]]);
    //         }
    //
    //
    //         if (drawTexture) {
    //             var uvs = [];
    //             uvs.push(new THREE.Vector2(uv[offset * 2], uv[offset * 2 + 1]));
    //             uvs.push(new THREE.Vector2(uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1]));
    //             uvs.push(new THREE.Vector2(uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]));
    //             faceGeometry.faceVertexUvs[0].push([uvs[0], uvs[1], uvs[2]]);
    //         }
    //
    //
    //         faceGeometry.faces.push(face);
    //         var face1 = face.clone();
    //         face1.a = face.a;
    //         face1.b = face.c;
    //         face1.c = face.b;
    //
    //         if (drawResults) { // if results exist generating vertex coordinates according to results.
    //             faceGeometry.faceVertexUvs[0].push([resultsUV[0], resultsUV[2], resultsUV[1]]);
    //         }
    //
    //         if (drawTexture) {
    //             var uvs = [];
    //             uvs.push(new THREE.Vector2(1 - uv[offset * 2], uv[offset * 2 + 1]));
    //             uvs.push(new THREE.Vector2(1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1]));
    //             uvs.push(new THREE.Vector2(1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]));
    //             faceGeometry.faceVertexUvs[0].push([uvs[0], uvs[2], uvs[1]]);
    //         }
    //
    //         faceGeometry.faces.push(face1);
    //
    //         offset = offset + 3;
    //
    //     }
    // };

    this.parseModelObjectEdgesFaces = function (geometryObject, colorMapTexture, vertices, maxResult, minResult
                                                , objectPartsArray, lineCommonPositionsArray, faceCommonGeometryData) {

        var groups = geometryObject.groups; // group names
        var results = geometryObject.results; // group names

        var complexObjectName = geometryObject.name;

        var edgeGroups = geometryObject.edges;
        var faceGroups = geometryObject.faces;
        var uvGroups = geometryObject.uvCoords;
        var groupSettings = geometryObject.groupSettings;
        var objectSettings = geometryObject.objectSettings;

        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        //
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
            // var faceGeometry = new THREE.Geometry();
            var lineGeometry = new THREE.BufferGeometry();
            var edges = edgeGroups[j];
            // var edges = edgeGroups[j];
            var offset = 0;
            // var positions = [];
            while (offset < edges.length) {
                vertices[edges[offset]].toArray();
                var array1 = vertices[edges[offset]].toArray();
                // positions.push(array1[0]);
                // positions.push(array1[1]);
                // positions.push(array1[2]);

                lineCommonPositionsArray.push(array1[0], array1[1], array1[2]);
                var array2 = vertices[edges[offset + 1]].toArray();

                // positions.push(array2[0]);
                // positions.push(array2[1]);
                // positions.push(array2[2]);

                lineCommonPositionsArray.push(array2[0], array2[1], array2[2]);

                // var vertice1 = vertices[edges[offset]];
                // var vertice2 = vertices[edges[offset + 1]];
                // lineGeometry.vertices.push(vertice1);
                // lineGeometry.vertices.push(vertice2);

                offset += 2;
            }
            // lineGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );

            // console.log("CONCAT", lineCommonPositionsArray);


            var faces = faceGroups[j];
            var uv = uvGroups[j];
            var fi = faces.length;

            var drawTexture = (!drawResults) && (uv.length != 0)

            scope.parseModelFaces(/*faceGeometry,*/ faces, vertices, uv, settings.faceColor, results,
                maxResult, minResult, faceCommonGeometryData);


            // faceGeometry.computeBoundingBox();
            // lineGeometry.computeBoundingBox();

            // faceGeometry.computeVertexNormals();
            // faceGeometry.computeFlatVertexNormals();
            // lineGeometry.computeFlatVertexNormals();

            //
            // var bObjGeometry = new THREE.BufferGeometry();
            // bObjGeometry.fromGeometry(faceGeometry);
            // faceGeometry = null;


            // if(bObjGeometry.attributes.position.count > 0){
            //     console.log(bObjGeometry);
            //     pictureGeometryElement.objectGeometry = bObjGeometry;
            // }


            // if(faceGeometry.attributes.position.count > 0){
            //     pictureGeometryElement.objectGeometry = faceGeometry;
            // }



            // var bLineGeometry = new THREE.BufferGeometry();
            // bLineGeometry.fromGeometry(lineGeometry);
            // lineGeometry = null;

            // pictureGeometryElement.objectGeometry = bObjGeometry;
            // pictureGeometryElement.edgesGeometry = lineGeometry;
            // pictureGeometryElement.edgesGeometry = lineGeometry;
            pictureGeometryElement.objectGeometryName = name + '.' + groups[j];
            pictureGeometryElement.name = groups[j];
            pictureGeometryElement.parentName = complexObjectName;
            if (drawResults) { // Draw face with spectral texture according to results
                pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                    map: colorMapTexture,
                    flatShading: true,
                    side: THREE.FrontSide

                });

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


            // pictureGeometryElement.pickingEdgesMaterial = new THREE.LineBasicMaterial({
            //     color: settings.lineColor,
            //     opacity: 1,
            //     linewidth: settings.lineWidth
            // });


            // pictureGeometryElement.edgesMaterial  = new THREE.LineMaterial( {
            //
            //     color: settings.lineColor,
            //     // linewidth: settings.lineWidth, // in pixels
            //     linewidth: settings.lineWidth/1000, // in pixels
            //     vertexColors: THREE.VertexColors,
            //     //resolution:  // to be set by renderer, eventually
            //
            // } );

            // pictureGeometryElement.edgesMaterial = new THREE.LineBasicMaterial({
            //     color: settings.lineColor,
            //     opacity: 1,
            //     linewidth: settings.lineWidth
            // });


            pictureGeometryElement.edgesMaterial = simpleLinesMaterial;

            // pictureGeometryElement.simpleShapes = [];  //Simple shapes

            // if (geometryObject.simpleShapes && geometryObject.simpleShapes[j]) {
            //     scope.parseSimpleShapes(geometryObject.simpleShapes, j, pictureGeometryElement, vertices);
            //
            // }
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
        var vertices = [];

        var drawResults = (DRAW_RESULTS && results && (results.length != 0));

        //this.coordFactor = _.max(coords);
        //this.coordFactor = 1;
        //console.debug('this.coordFactor' + this.coordFactor);
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
            textPositionsData[ind].size = objectSettings.textSize;
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
        totalGeometryObj.totalObjVertices = vertices;
        totalGeometryObj.totalObjResults = results;
        totalGeometryObj.lineCommonPositionsArray = lineCommonPositionsArray;
        totalGeometryObj.faceCommonGeometryData = faceCommonGeometryData;

        pictureInfo.geometryObjectData[index] = totalGeometryObj;

        pictureInfo.textData[index] = textPositionsData;


    }

    this.getV = function (result, maxResult, minResult) {
        return (result - minResult) / (maxResult - minResult);
    }

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

            editor.addTexture(colorMapTexture);
            colorMapTexture.magFilter = THREE.NearestFilter;
            colorMapTexture.minFilter = THREE.LinearFilter;
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
