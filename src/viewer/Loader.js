var Loader = function (editor, textureUrl) {

    var scope = this;
    var signals = editor.signals;
    var DRAW_RESULTS = true;
    this.textureUrl = textureUrl;
    this.objectsTree = null;
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
            scope.traverseTree(node.children[ i ], callback);

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

    }

    this.computeBoundingBox = function (modelRotation) {
       var commonBoundingBox =  new THREE.Box3().setFromObject( editor.lastModel );
       editor.calculateSpaceScale(commonBoundingBox, modelRotation);
    }


    this.loadMeshes = function (pictureInfo) {

        var result = pictureInfo.geometryObjectData;
        var scaleFactor = pictureInfo.scaleFactor;
        var meshesData = {};
        var modelGroup = new THREE.Object3D();

        for (var key in result) {
            meshesData[key] = new Array();
            var totalObjectDataElement = result[key];
            var objectElement = totalObjectDataElement.objectPartsArray;
            var pointsTable = totalObjectDataElement.pointsTable;
            var vertices = totalObjectDataElement.totalObjVertices;
            var results = totalObjectDataElement.totalObjResults;
            var commonEdgesGeometry = new THREE.Geometry();
            var edgesMaterial = objectElement[0].edgesMaterial;
            for (var j = 0; j < objectElement.length; j++) {
                var objectGeometry = objectElement[j].objectGeometry;
                var facesMaterial = objectElement[j].facesMaterial;
                var edgesGeometry = objectElement[j].edgesGeometry;
                var edgesMaterial = objectElement[j].edgesMaterial;

                var mesh = new THREE.Mesh(objectGeometry, facesMaterial);
                mesh.userData.pointsTable = pointsTable;
                mesh.userData.name =  objectElement[j].name;
                mesh.userData.totalObjVertices = vertices;
                mesh.userData.totalObjResults = results;
//            http://stackoverflow.com/questions/17146650/combining-multiple-line-geometries-into-a-single-geometry
                var lines = new THREEext.Line(edgesGeometry, edgesMaterial, THREE.LinePieces);
                lines.userData.pointsTable = pointsTable;
                 lines.userData.name =  objectElement[j].name;
                lines.userData.totalObjVertices = vertices;
                lines.userData.totalObjResults = results;
                modelGroup.add(lines);
                modelGroup.add(mesh);


                var objName = objectElement[j].name;
                if (objName.indexOf("EDGE") != -1) {
                    lines.name = objectElement[j].name;
                    lines.parentName = objectElement[j].parentName;
                    lines.defaultColor = edgesMaterial.color.clone();
                    meshesData[key].push(lines);

                } else if (objName.indexOf("FACE") != -1) {
                    mesh.name = objectElement[j].name;
                    mesh.parentName = objectElement[j].parentName;
                    mesh.defaultColor = facesMaterial.color.clone();
                    meshesData[key].push(mesh);
                }


                var simpleShapes = objectElement[j].simpleShapes;
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

                var shapes = new THREE.Mesh(simpleShapesGeometry, facesMaterial);
                 modelGroup.add(shapes);

            }
        }

        var textData = pictureInfo.textData;
        for (var key in textData) {
           var textElement = textData[key];
           for (var i in textElement) {
               var textMesh = scope.createText2D(textElement[i].label, textElement[i].color, null, textElement[i].size);
               textMesh.userData = {}
               textMesh.userData.quaternion = "camera";
               textMesh.position.copy(textElement[i].position);
               modelGroup.add(textMesh);
           }
        }

        editor.addModelGroup(modelGroup);
//        data = null;
        return meshesData;
    };

    this.createText2D = function (text, color, font, size, camera) {

        var canvas = scope.createTextCanvas(text, color, font, 256);

        var plane = new THREE.PlaneBufferGeometry (canvas.width / canvas.height * size, size);
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

    }

    this.removeModel = function () {
        editor.removeAllObjects();
    }

    this.reloadModel = function (data) {
        editor.removeAllObjects();
        scope.handleJSONData(data);
    }


    this.handleJSONData = function (data) {
        editor.onRenderStart();
        var pictureInfo = this.parseModel(data);

        var result = scope.loadMeshes(pictureInfo);


        var traverse = function (obj) {
            if (obj instanceof Array) {
                for (var i = 0; i < obj.length; i++) {
                    if (typeof obj[i] == "object" && obj[i] && !(obj[i] instanceof THREE.Mesh) && !(obj[i] instanceof THREEext.Line)) {
                        var node = obj[i];
                        if (node.index != -1) {
                            node.children = result[node.index] ? result[node.index] : [];
                        }
                        traverse(obj[i]);
                    } else {
                    }
                }
            } else {
                for (var prop in obj) {
                    if (typeof obj[prop] == "object" && obj[prop] && !(obj[prop] instanceof THREE.Mesh) && !(obj[prop] instanceof THREEext.Line)) {
                        var node = obj[prop];
                        if (node.index != -1) {
                            node.children = result[node.index] ? result[node.index] : [];
                        }
                        traverse(obj[prop]);
                    } else {
                    }
                }
            }
        }

        traverse(data.tree);
        scope.objectsTree = data.tree;

        scope.computeBoundingBox(pictureInfo.modelRotation);
        editor.onRenderDone();
    }

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

    }

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

            // uniforms
            var uniforms = {
                texture: { type: "t", value: texture },
                texture2: { type: "t", value: texture2 },
                offsetRepeat: { type: "v4", value: new THREE.Vector4(settings.texture.offsetX, settings.texture.offsetY,
                    settings.texture.repeatX, settings.texture.repeatY),
                    transparency: {type: "f", value: (settings.transparancy > 0 ? (1 - settings.transparancy) : 1.0)}
                }
            };

            // attributes
            var attributes = {
            };
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
            pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                map: texture,
                side: THREE.FrontSide,
                shading: THREE.FlatShading,
                transparent: settings.transparancy > 0 ? true : false,
                opacity: settings.transparancy > 0 ? (1 - settings.transparancy) : 1
            });
        }

    }

    this.parseModelFaces = function (faceGeometry, faces, vertices, uv, faceColor, results, maxResult, minResult) {
        var offset = 0;
        var drawResults = (DRAW_RESULTS && results && (results.length != 0));
        var drawTexture = (!drawResults) && (uv.length != 0);
        while (offset < faces.length) {
            var face = new THREE.Face3();
            var ind = faceGeometry.vertices.length;
            faceGeometry.vertices.push(vertices[faces[ offset ]]);
            faceGeometry.vertices.push(vertices[faces[ offset + 1]]);
            faceGeometry.vertices.push(vertices[faces[ offset + 2]]);
            face.a = ind;
            face.b = ind + 1;
            face.c = ind + 2;

            face.color = faceColor;

            var resultsUV = [];
            if (drawResults) { // if results exist generating vertex coordinates according to results.
                resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset]], maxResult, minResult)));
                resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset + 1]], maxResult, minResult)));
                resultsUV.push(new THREE.Vector2(0.0, scope.getV(results[faces[offset + 2]], maxResult, minResult)));
                faceGeometry.faceVertexUvs[ 0 ].push([ resultsUV[0], resultsUV[1], resultsUV[2] ]);
            }


            if (drawTexture) {
                var uvs = [];
                uvs.push(new THREE.Vector2(uv[offset * 2], uv[offset * 2 + 1]));
                uvs.push(new THREE.Vector2(uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1]));
                uvs.push(new THREE.Vector2(uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]));
                faceGeometry.faceVertexUvs[ 0 ].push([ uvs[0], uvs[1], uvs[2] ]);
            }


            faceGeometry.faces.push(face);
            var face1 = face.clone();
            face1.a = face.a;
            face1.b = face.c;
            face1.c = face.b;

            if (drawResults) { // if results exist generating vertex coordinates according to results.
                faceGeometry.faceVertexUvs[ 0 ].push([ resultsUV[0], resultsUV[2], resultsUV[1] ]);
            }

            if (drawTexture) {
                var uvs = [];
                uvs.push(new THREE.Vector2(1 - uv[offset * 2], uv[offset * 2 + 1]));
                uvs.push(new THREE.Vector2(1 - uv[(offset + 1) * 2], uv[(offset + 1) * 2 + 1]));
                uvs.push(new THREE.Vector2(1 - uv[(offset + 2) * 2], uv[(offset + 2) * 2 + 1]));
                faceGeometry.faceVertexUvs[ 0 ].push([ uvs[0], uvs[2], uvs[1] ]);
            }

            faceGeometry.faces.push(face1);

            offset = offset + 3;

        }
    }

    this.parseModelObjectEdgesFaces = function (geometryObject, colorMapTexture, vertices, maxResult, minResult, objectPartsArray) {
        var groups = geometryObject.groups; // group names
        var results = geometryObject.results; // group names

        var edgeGroups = geometryObject.edges;
        var faceGroups = geometryObject.faces;
        var uvGroups = geometryObject.uvCoords;
        var groupSettings = geometryObject.groupSettings;
        var objectSettings = geometryObject.objectSettings;

        var drawResults = (DRAW_RESULTS && results && (results.length != 0));

        for (var j = 0; j < groups.length; j++) {  //reading edges and faces by groups

            var settings = groupSettings[j];
            var text3d = settings.text3d;
            if (settings.lineColor == undefined) {
                settings = objectSettings;
            }

            var pictureGeometryElement = {};
            //Creating THREE.geometry for faces and lines in group
            var faceGeometry = new THREE.Geometry();
            var lineGeometry = new THREE.Geometry();
            var edges = edgeGroups[j];
            var offset = 0;
            while (offset < edges.length) {
                lineGeometry.vertices.push(vertices[edges[offset]])
                lineGeometry.vertices.push(vertices[edges[offset + 1]])
                offset += 2;
            }

            var faces = faceGroups[j];
            var uv = uvGroups[j];
            var fi = faces.length;

            var drawTexture = (!drawResults) && (uv.length != 0)

            scope.parseModelFaces(faceGeometry, faces, vertices, uv, settings.faceColor, results, maxResult, minResult);


            faceGeometry.computeBoundingBox();
            lineGeometry.computeBoundingBox();

            faceGeometry.computeFaceNormals();
            faceGeometry.computeVertexNormals();
            pictureGeometryElement.objectGeometry = faceGeometry;
            pictureGeometryElement.edgesGeometry = lineGeometry;
            pictureGeometryElement.objectGeometryName = name + '.' + groups[j];
            pictureGeometryElement.name = groups[j];
            pictureGeometryElement.parentName = name;
            if (drawResults) { // Draw face with spectral texture according to results
                pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                    map: colorMapTexture,
                    shading: THREE.FlatShading,
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
                            shading: THREE.FlatShading,
                            side: THREE.FrontSide,
                            transparent: settings.transparancy > 0 ? true : false,
                            opacity: settings.transparancy > 0 ? (1 - settings.transparancy) : 1
                        });
                    }
                    else { // face without texture & 3dText
                        pictureGeometryElement.facesMaterial = new THREE.MeshLambertMaterial({
                            color: settings.faceColor,
                            shading: THREE.FlatShading,
                            side: THREE.FrontSide,
                            transparent: settings.transparancy > 0 ? true : false,
                            opacity: settings.transparancy > 0 ? (1 - settings.transparancy) : 1

                        });

                    }

                }

            }

            pictureGeometryElement.edgesMaterial = new THREE.LineBasicMaterial({ color: settings.lineColor, opacity: 1, linewidth: settings.lineWidth});

            pictureGeometryElement.simpleShapes = [];  //Simple shapes

            if (geometryObject.simpleShapes && geometryObject.simpleShapes[j]) {
                scope.parseSimpleShapes(geometryObject.simpleShapes, j, pictureGeometryElement, vertices);

            }
            objectPartsArray.push(pictureGeometryElement)

        }

    }


    this.parseModelPart = function (geometryObject, names, pictureInfo, colorMapTexture, index,  maxResult, minResult) {
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

        var offset = 0;
        while (offset < coords.length) { //reading vertices
            var vertex = new THREE.Vector3();
            vertex.x = coords[ offset++ ] * scale;
            vertex.y = coords[ offset++ ] * scale;
            vertex.z = coords[ offset++ ] * scale;
            vertices.push(vertex);
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

        scope.parseModelObjectEdgesFaces(geometryObject, colorMapTexture, vertices, maxResult, minResult, objectPartsArray);

        var totalGeometryObj = {};
        totalGeometryObj.objectPartsArray = objectPartsArray;
        totalGeometryObj.pointsTable = pointsTable;
        totalGeometryObj.totalObjVertices = vertices;
        totalGeometryObj.totalObjResults = results;

        pictureInfo.geometryObjectData[index] = totalGeometryObj;

        pictureInfo.textData[index] = textPositionsData;


    }

    this.getV = function (result, maxResult, minResult) {
        return  (result - minResult) / (maxResult - minResult);
    }

    this.createJsonModelWithRotation = function(currentModelRotation){

       var modelRotation  = this.modelRotation;
       if(!modelRotation){
          return;
       }
       var message = "position:  x = " + currentModelRotation.position.x + " y =" + currentModelRotation.position.y + " z =" + currentModelRotation.position.z + ",  fov =" + currentModelRotation.fov + "\n";
       if(modelRotation.results){
          for(var i=0; i< modelRotation.results.length; i++){
              var result = modelRotation.results[i];
              console.log(result)
              message+= "result = " + result.resultValue + "  position: x = " + result.position.x + " y =" + result.position.y + " z =" + result.position.z +  "\n";
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
            var imageName = scope.textureUrl ? scope.textureUrl + 'color-spectrum.png' : 'css/images/color-spectrum.png';
            colorMapTexture = THREE.ImageUtils.loadTexture(imageName, null, function () {
                editor.reRender();
            }, function () {
                console.log("error")
            });

            editor.addTexture(colorMapTexture);
            colorMapTexture.magFilter = THREE.NearestFilter;
            colorMapTexture.minFilter = THREE.LinearMipMapLinearFilter;
        }


        for (var i = 0; i < pictureData.length; i++) {

            var geometryObject = pictureData[i];
            scope.parseModelPart(geometryObject, names, pictureInfo, colorMapTexture, i, maxResult, minResult);
        }
        return pictureInfo;
    }
}
