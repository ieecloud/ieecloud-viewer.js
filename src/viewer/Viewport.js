var Viewport = function (editor) {

    var signals = editor.signals;

    var scope = this;


    var container = new UI.Panel().setId("main" + editor.id);
    container.setPosition('absolute');
    container.setBackgroundColor('#aaa');

    var infoMode = new UI.Text();
    infoMode.setPosition('absolute');
    infoMode.setRight('5px');
    infoMode.setTop('5px');
    infoMode.setFontSize('12px');
    infoMode.setColor('#ffffff');
    infoMode.setValue('mode=' + editor.mode)
    container.add(infoMode);


    var info = new UI.Text();
    info.setPosition('absolute');
    info.setRight('5px');
    info.setBottom('5px');
    info.setFontSize('12px');
    info.setColor('#ffffff');
    container.add(info);

    var rulerInfo = new UI.Text();
    rulerInfo.setPosition('absolute');
    rulerInfo.setLeft('5px');
    rulerInfo.setBottom('5px');
    rulerInfo.setFontSize('12px');
    rulerInfo.setColor('#ffffff');
    container.add(rulerInfo);

    var scene = editor.scene;
    var octree =  editor.octree;
    var sceneAxis = editor.sceneAxis;
    var sceneHelpers = editor.sceneHelpers;
    var scenePicker = editor.pickingScene;
    var CANVAS_WIDTH = 200;
    var CANVAS_HEIGHT = 200;
    var CAM_DISTANCE = 300;
    var INTERSECTED = {};

    var clearColor = editor.options.backgroundColor;
    var objects = [];
    var unRotatedObjects = [];
    var center = new THREE.Vector3();

    var SELECT_COLOR = 300;
    var SELECT_OPACITY = 0.4;
    var DEFAULT_STEP_ZOOM = 0.0006;
    var FIRST_LIMIT_FOV = 0.0006;
    var SECOND_LIMIT_FOV = 0.000000001;
    var ROTATE = false;
    var USE_OCTREE = true;


    var mainMouseMove = true;

    // helpers

    var grid = new THREEext.GridHelper(500, 25);
    sceneHelpers.add(grid);

    if (!editor.options.gridVisible) {
        grid.hide();
    }

    // inset canvas
    // -----------------------------------------------

    // dom
    var container2 = new UI.Panel().setId("slave" + editor.id);
    container2.setPosition('absolute');


    var modal = new UI.Modal();
    container.add(modal);

    // var rendererStats  = new THREEx.RendererStats();
    //
    // rendererStats.domElement.style.position   = 'absolute';
    // rendererStats.domElement.style.left  = '0px';
    // rendererStats.domElement.style.bottom    = '0px';
    // container.dom.appendChild( rendererStats.domElement );


    // renderer
    var renderer2 = new THREE.CanvasRenderer({alpha: true});
    renderer2.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    container2.dom.appendChild(renderer2.domElement);

    var camera = new THREE.PerspectiveCamera(10, container.dom.offsetWidth / container.dom.offsetHeight, 1, 15000);
    camera.position.z = 63;
    camera.position.y = -149;
    camera.position.x = 36;


    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(scene.position);

    // camera2
    var camera2 = new THREE.PerspectiveCamera(50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 2000);
    camera2.up = camera.up; // important!

    var selectedResultPoints = {};
    var textResults = {};
    var nearestPoint = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: editor.options.nearestPointColor}});
    nearestPoint.hide();


    sceneHelpers.add(nearestPoint);

    var highlighter = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: editor.options.nearestPointColor}});
    highlighter.hide();
    sceneHelpers.add(highlighter);


    var highlighterProtractor = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: editor.options.nearestPointColor}});
    highlighterProtractor.hide();
    sceneHelpers.add(highlighterProtractor);


    var projectionPoint = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: "white"}});
    projectionPoint.hide();
    sceneHelpers.add(projectionPoint);

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(1000, 1000, 8, 8),
        new THREE.MeshBasicMaterial({color: 0x000000, opacity: 0.25, transparent: true})
    );

    plane.material.side = THREE.DoubleSide;

    plane.userData.name = "PLANE";

    var xAxis = new THREE.Vector3(1, 0, 0);
    rotateAroundObjectAxis(plane, xAxis, Math.PI / 2);

    plane.visible = false;


    sceneHelpers.add(plane);


    var ruler = new THREE.ToolsGizmo(camera, container.dom, plane, nearestPoint, highlighter);
    rulerInfo.setValue('angleH = ' + ruler.userData.rotateHAngle + ' , angleV = ' + ruler.userData.rotateVAngle);

    ruler.addEventListener("disableMainControl", function (event) {
        if (controls) {
            controls.setDisabled();
        }
        highlighter.hide();
    });


    ruler.addEventListener("select3dPoint", function (event) {
        editor.select3dPoint(event.point.clone().multiplyScalar(editor.loader.coordFactor));
        ruler.hide();
        render();
    });

    ruler.addEventListener("enableMainControl", function (event) {
        if (controls) {
            controls.setEnabled();
        }

    });

    ruler.addEventListener("change", function (event) {
        var intersects = event.intersects;
        var isRulerMoved = event.moved;
        if (!intersects) {
            highlighter.hide();
            if (!isRulerMoved) {
                mainMouseMove = true;
            }
            render();
            return;
        }

        mainMouseMove = false;
        nearestPoint.hide();

        var intersect = intersects[0];
        if (intersect) {

            var vertices = intersect.object.parent.parent.userData.totalObjVertices;
            var pointsTable = intersect.object.parent.parent.userData.pointsTable;
            var valueTable = intersect.object.parent.parent.userData.valueTable;
            var distance = intersect.distance;
            var c = intersect.point;
            if (!pointsTable || !vertices) {
                return;
            }

            var wordVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                wordVertices.push(ruler.localToWorld(vertices[i].clone()));
            }

            highlighter.show();
            var list = nearest(c, distance, pointsTable, wordVertices);
            if (list.length > 0) {
                var resultIndex = list[0].index;
                var rulerValue = valueTable[resultIndex];
                var position = new THREE.Vector3(list[0].x, list[0].y, list[0].z);
                highlighter.position.copy(position);
                highlighter.userData = {value: valueTable[resultIndex]};
                event.intersects = null;
                render();
            }
        }
        render();
        event.intersects = null;
    });

    ruler.addEventListener("searchNearest", function (event) {
        searchNearestPointRuler();
    });

    ruler.addEventListener("disableMainMove", function (event) {
        mainMouseMove = false;
    });

    ruler.addEventListener("enableMainMove", function (event) {
        mainMouseMove = true;
    });
    ruler.hide();
    sceneHelpers.add(ruler);

    var protractorV = new THREE.Protractor(camera, container.dom, THREE.ProtractorModes.VERTICAL, highlighterProtractor);
    protractorV.addEventListener('reRenderProtractor', function (event) {
        render();
    });

    crossVector = new THREE.Vector3(0, 0, 0);

    calculateCrossVector();

    protractorV.addEventListener('disableMainMove', function (event) {

        mainMouseMove = false;
    });

    protractorV.addEventListener('enableMainMove', function (event) {
        mainMouseMove = true;
    });

    protractorV.addEventListener('highlightEvent', function (event) {

        var intersects = event.intersects;
        if (!intersects) {
            highlighterProtractor.hide();
            mainMouseMove = true;
            render();
            return;
        }

        mainMouseMove = false;
        nearestPoint.hide();

        var intersect = intersects[0];
        if (intersect) {

            var vertices = intersect.object.parent.parent.userData.totalObjVertices;
            var pointsTable = intersect.object.parent.parent.userData.pointsTable;
            var distance = intersect.distance;
            var c = intersect.point;
            if (!pointsTable || !vertices) {
                return;
            }

            var wordVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                wordVertices.push(protractorV.localToWorld(vertices[i].clone()));
            }

            highlighterProtractor.show();
            var list = nearest(c, distance, pointsTable, wordVertices);
            if (list.length > 0) {
                var position = new THREE.Vector3(list[0].x, list[0].y, list[0].z);
                highlighterProtractor.position.copy(position);
                highlighterProtractor.userData = {angle: list[0].index * Math.round(THREE.Math.radToDeg(protractorV.DIVISION_STEP))};
                event.intersects = null;
                render();
            }
        }


    });

    protractorV.hide();
    sceneHelpers.add(protractorV);


    var protractorH = new THREE.Protractor(camera, container.dom, THREE.ProtractorModes.HORIZONTAL, highlighterProtractor);
    protractorH.addEventListener('reRenderProtractor', function (event) {
        render();
    });

    protractorH.addEventListener('disableMainMove', function (event) {

        mainMouseMove = false;
    });

    protractorH.addEventListener('enableMainMove', function (event) {
        mainMouseMove = true;
    });


    protractorH.addEventListener('highlightEvent', function (event) {

        var intersects = event.intersects;
        if (!intersects) {
            highlighterProtractor.hide();
            mainMouseMove = true;
            render();
            return;
        }
        mainMouseMove = false;
        nearestPoint.hide();

        var intersect = intersects[0];
        if (intersect) {

            var vertices = intersect.object.parent.parent.userData.totalObjVertices;
            var pointsTable = intersect.object.parent.parent.userData.pointsTable;
            var distance = intersect.distance;
            var c = intersect.point;
            if (!pointsTable || !vertices) {
                return;
            }

            var wordVertices = [];
            for (var i = 0; i < vertices.length; i++) {
                wordVertices.push(protractorH.localToWorld(vertices[i].clone()));
            }

            highlighterProtractor.show();
            var list = nearest(c, distance, pointsTable, wordVertices);
            if (list.length > 0) {
                var position = new THREE.Vector3(list[0].x, list[0].y, list[0].z);
                highlighterProtractor.position.copy(position);
                highlighterProtractor.userData = {angle: list[0].index * Math.round(THREE.Math.radToDeg(protractorV.DIVISION_STEP))};
                event.intersects = null;
                render();
            }
        }


    });


    protractorH.hide();
    sceneHelpers.add(protractorH);


    var object = new THREE.AxisHelper(100);
    sceneHelpers.add(object);

    var axis = new THREE.SmallAxisObject3d(camera, container2.dom);
    sceneAxis.add(axis);

    var color = 0xffffff;
    var intensity = 1;

    var light = new THREE.DirectionalLight(color, intensity);

    scene.add(camera);
    camera.add(light);
    light.position.copy(new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion));

    // fog

    var oldFogType = "None";
    var oldFogColor = 0xaaaaaa;
    var oldFogNear = 1;
    var oldFogFar = 5000;
    var oldFogDensity = 0.00025;


    var raycaster = new THREE.Raycaster();
    raycaster.linePrecision = 0.01;
    var mouse = new THREE.Vector2();
    var mouse2 = new THREE.Vector2();

    // object picking

    var projector = new THREE.Projector();


    function rotateAroundObjectAxis(object, axis, radians) {
        var rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    function calculateCrossVector() {
        var normal = new THREE.Vector3(0, 0, 1);

        var directionNorm = ruler.getDirectionNorm();

        var vectorToCross = directionNorm.projectOnPlane(normal);
        crossVector.crossVectors(normal, vectorToCross);
    }


    function findVerticalAngle() {
        var normal = new THREE.Vector3(0, 0, 1);
        var rulerRay = ruler.getDirectionNorm();
        var rulerRayProjection = new THREE.Vector3(rulerRay.x, rulerRay.y, rulerRay.z).projectOnPlane(normal);
        var cross = new THREE.Vector3();
        cross.crossVectors(rulerRay, rulerRayProjection);
        var sinAngleBTWZAndOXY = cross.length() / (rulerRay.length() * rulerRayProjection.length());
        var result = THREE.Math.radToDeg(Math.asin(sinAngleBTWZAndOXY));

        if (isNaN(result)) {
            result = 90;
        }

        return result


    }


    function rotateAroundWorldAxis(object, axis, radians) {
        var rotWorldMatrix = new THREE.Matrix4();
        rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
        rotWorldMatrix.multiply(object.matrix);
        object.matrix = rotWorldMatrix;
        object.rotation.setFromRotationMatrix(object.matrix.extractRotation(rotWorldMatrix));

    }


    var getIntersects = function (event, object) {
        var point = new THREE.Vector2();
        var array = getMousePosition(container.dom, event.clientX, event.clientY);

        point.fromArray(array);

        mouse.set(( point.x * 2 ) - 1, -( point.y * 2 ) + 1);

        raycaster.setFromCamera(mouse, camera);
        if (USE_OCTREE) {
            var octreeObjects = octree.search(raycaster.ray.origin, raycaster.ray.far, true, raycaster.ray.direction);
            return raycaster.intersectOctreeObjects(octreeObjects);
        } else {
            var direction = new THREE.Vector3(mouse.x, mouse.y, 0.5).unproject(camera).sub(camera.position).normalize();

            raycaster.set(camera.position, direction);

            //this.ray.origin.copy( camera.position );
            //this.ray.direction.set( coords.x, coords.y, 0.5 ).unproject( camera ).sub( camera.position ).normalize();
            if (object instanceof Array) {
                return raycaster.intersectObjects(object, true);

            }
            return raycaster.intersectObject(object, true);
        }
    };

    var getMousePosition = function (dom, x, y) {

        var rect = dom.getBoundingClientRect();
        return [( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height];

    };


    var calculateR = function (coordinate) {
        var x = coordinate.x;
        var y = coordinate.y;
        var z = coordinate.z;
        return Math.sqrt(x * x + y * y + z * z);
    };

    var calcDistance = function (a, b) {
        return Math.sqrt((a.x - b.x) * (a.x - b.x) + (a.y - b.y) * (a.y - b.y) + (a.z - b.z) * (a.z - b.z));
    };

    var nearest = function (c, distance, pointsTable, objVertices) {
        var list = new Array();
        var r = calculateR(c);
        var dr = (pointsTable.maxR - pointsTable.minR) / pointsTable.tableSize;
        var index = Math.round((pointsTable.tableSize * (r - pointsTable.minR) / (pointsTable.maxR - pointsTable.minR)));
        if (index < 0) {
            index = 0;
        }
        if (index >= pointsTable.tableSize) {
            index = pointsTable.tableSize - 1;
        }
        if (pointsTable.table[index]) {
            for (var i = 0; i < pointsTable.table[index].length; i++) {
                var n = objVertices[pointsTable.table[index][i]];
                n.index = pointsTable.table[index][i];
                if (!n) {
                    continue;
                }
                if (calculateR(n) < r - distance) {
                    continue;
                }
                if (calculateR(n) > r + distance) {
                    break;
                }
                if (calcDistance(n, c) < distance) {
                    list.push(n);
                }
            }
        }
        for (var i = index - 1; i >= 0 && dr * (index - i) < distance; i--) {
            for (var j = pointsTable.table[i].length - 1; j >= 0; j--) {
                var n = objVertices[pointsTable.table[i][j]];
                n.index = pointsTable.table[i][j];
                if (!n) {
                    continue;
                }
                if (calculateR(n) < r - distance) {
                    break;
                }
                if (calcDistance(n, c) < distance) {
                    list.push(n);
                }

            }
        }

        for (var i = index + 1; i < pointsTable.tableSize && dr * (i - index) < distance; i++) {
            for (var k = 0; k < pointsTable.table[i].length; k++) {
                var n = objVertices[pointsTable.table[i][k]];
                n.index = pointsTable.table[i][k];
                if (!n) {
                    continue;
                }
                if (calculateR(n) > r + distance) {
                    break;
                }
                if (calcDistance(n, c) < distance) {
                    list.push(n);
                }
            }
        }
        list.sort(function (n1, n2) {
            var d1 = calcDistance(c, n1);
            var d2 = calcDistance(c, n2);
            return (d1 - d2);

        });

        return list;
    };

    var onMouseDownPosition = new THREE.Vector2();
    var onMouseUpPosition = new THREE.Vector2();

    var onMouseDown = function (event) {
        event.preventDefault();

        var array = getMousePosition(container.dom, event.clientX, event.clientY);
        onMouseDownPosition.fromArray(array);


        document.addEventListener('mouseup', onMouseUp, false);

    };

    var searchNearestObject = function (intersects, objectType) {
        var dist = intersects[0].distance;
        var obj = intersects[0].object;


        for (var i = 0; i < intersects.length; i++) {
            if (!(intersects[i].object instanceof objectType)) {
                continue;
            }
            obj = intersects[i].object;
            dist = intersects[i].distance;
            break;
        }
        for (i = 0; i < intersects.length; i++) {
            if (!(intersects[i].object instanceof objectType)) {
                continue;
            }
            if (intersects[i].distance < dist) {
                obj = intersects[i].object;

            }
        }

        return obj;
    };

    var searchNearestIntersect = function (intersects, objectType) {
        var dist = 0;
        var intersect;
        for (var i = 0; i < intersects.length; i++) {
            if (!(intersects[i].object instanceof objectType)) {
                continue;
            }
            intersect = intersects[i];
            dist = intersects[i].distance;
            break;
        }

        for (i = 0; i < intersects.length; i++) {
            if (!(intersects[i].object instanceof objectType)) {
                continue;
            }
            if (intersects[i].distance < dist) {
                intersect = intersects[i];

            }
        }

        return intersect;
    };

    var getNearestIntersect = function (intersectLine, intersectMesh) {
        if (!intersectMesh && intersectLine) {
            return intersectLine;
        }

        if (intersectMesh && !intersectLine) {
            return intersectMesh;
        }

        if (intersectMesh && intersectLine) {
            var intersect = intersectMesh;
            if (intersectLine.distance < intersectMesh.distance) {
                intersect = intersectLine;
            }
            return intersectMesh;
        }

        return null;
    };

    scope.getSceneObjectByName = function (name, recursive) {

        for (var i = 0, l = sceneHelpers.children.length; i < l; i++) {

            var child = sceneHelpers.children[i];

            if (child.name === name) {

                return child;

            }


        }
    };

    Number.prototype.round = function (places) {
        return +(Math.round(this + "e+" + places) + "e-" + places);
    };


    scope.onMouseDblClickViewerHandler = function (event) {
        var rect = container.dom.getBoundingClientRect();

        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        onMouseUpPosition.set(x, y);

        if (onMouseDownPosition.distanceTo(onMouseUpPosition) === 0) {
            var intersects = getIntersects(event, objects);
            if (intersects.length === 0) {
                return false;
            }
        }


        var resultVal = nearestPoint.userData.result;

        var textResultObjByName = scope.getSceneObjectByName("result-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z);
        if (textResultObjByName) {
            var textResultSphereObjByName = scope.getSceneObjectByName("sphereResult-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z);
            sceneHelpers.remove(textResultObjByName);
            sceneHelpers.remove(textResultSphereObjByName);
            return false;
        }


        var textResultMesh = new THREE.ResultTextObject3d(camera, container.dom, {
            value: resultVal,
            color: editor.options.resultTextColor
        });

        textResultMesh.name = "result-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        var textResultPosition = new THREE.Vector3(0, 0, 0);
        textResultPosition.x = nearestPoint.position.x;
        textResultPosition.y = nearestPoint.position.y;
        textResultPosition.z = nearestPoint.position.z;
        textResultMesh.position.copy(textResultPosition);
        unRotatedObjects.push(textResultMesh);
        var key = resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        textResults[key] = textResultMesh;
        textResultMesh.update(nearestPoint);
        sceneHelpers.add(textResultMesh);


        var selectedResultPoint = new THREE.NearestPointObject3d(camera, container.dom, {
            material: {color: editor.options.resultPointColor},
            size: editor.options.resultPointSize
        });
        selectedResultPoint.name = "sphereResult-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        selectedResultPoint.position.copy(nearestPoint.position);
        selectedResultPoints[key] = selectedResultPoint;

        sceneHelpers.add(selectedResultPoint);
        selectedResultPoint.update();

        render();
    };

    scope.onMouseUpFacesEdgesHandler = function (event) {

        if (controls.state >= 0) {
            return;
        }

        if (objects.length === 0) {
            return;
        }

        var array = getMousePosition(container.dom, event.clientX, event.clientY);
        onMouseUpPosition.fromArray(array);
        if (onMouseDownPosition.distanceTo(onMouseUpPosition) === 0) {
            var intersects = getIntersects(event, objects);
            if (intersects.length > 0) {

                if (event && (event.altKey || event.metaKey)) {
                    var obj = searchNearestObject(intersects, THREE.LineSegments);
                    // TODO: in editor mode select tree node
                    if (obj.selectedFlag) {
                        scope.unSelectObject(obj);
                        // editor.unSelectTree(obj);
                    } else {
                        scope.selectObject(obj);
                        // editor.selectTree(obj);
                    }
                } else if (event && (event.ctrlKey || event.metaKey)) {
                    obj = searchNearestObject(intersects, THREE.Mesh);
                    if (obj.selectedFlag) {
                        scope.unSelectObject(obj);
                        // editor.unSelectTree(obj);
                    } else {
                        scope.selectObject(obj);
                        // editor.selectTree(obj);
                    }
                }
            } else {
                editor.select(camera);
            }
            render();
        }
        document.removeEventListener('mouseup', onMouseUp);
    };

    scope.onMouseUp3dGeometryHandler = function (event) {
        if (event.button !== 0) {
            return;
        }

        if (controls.state >= 0) {
            return;
        }

        if (objects.length === 0) {
            return;
        }

        var array = getMousePosition(container.dom, event.clientX, event.clientY);
        onMouseUpPosition.fromArray(array);
        var toggleSelect = function(aTree, fCompair){
            var aInnerTree = [];
            var oNode;
            for(var keysTree in aTree) {
                aInnerTree.push(aTree[keysTree]);
            }
            while(aInnerTree.length > 0) {
                oNode = aInnerTree.pop();
                if( fCompair(oNode) ){
                    // TODO: in editor mode select tree node
                    if (oNode.selectedFlag) {
                        scope.unSelectObject(oNode)
                    } else {
                        scope.selectObject(oNode)
                    }
                } else { // if (node.children && node.children.length) {
                    for(var keysNode in oNode){
                        if(oNode[keysNode] instanceof Array){
                            for (var i = 0; i < oNode[keysNode].length; i++) {
                                aInnerTree.push(oNode[keysNode][i]);
                            }
                        }
                    }
                }
            }
        };

        if (onMouseDownPosition.distanceTo(onMouseUpPosition) === 0) {
            var intersects = getIntersects(event, objects);
            if (intersects.length > 0) {
                var intersectMesh = searchNearestIntersect(intersects, THREE.Mesh);
                var intersectLine = searchNearestIntersect(intersects, THREE.LineSegments);
                var intersect = getNearestIntersect(intersectLine, intersectMesh);
                toggleSelect(editor.loader.objectsTree, function(oNode){ if(oNode["parentName"] === intersect.object.parentName) return true; });
            } else {
                editor.select(camera);
            }
            render();
        }
        document.removeEventListener('mouseup', onMouseUp);
    };

    scope.onMouseUp3dPointHandler = function (event) {
        if (event.button !== 0) {
            return;
        }
        var array = getMousePosition(container.dom, event.clientX, event.clientY);
        onMouseUpPosition.fromArray(array);
        if (onMouseDownPosition.distanceTo(onMouseUpPosition) <= 0.005 && nearestPoint.visible) {
            ruler.position.copy(nearestPoint.position);
            editor.select3dPoint(nearestPoint.position.clone().multiplyScalar(editor.loader.coordFactor));
            ruler.hide();
            render();
        }
        document.removeEventListener('mouseup', onMouseUp);
    };


    scope.selectObject = function (object) {
        if (object !== null) {
            if (object.material) {
                object.material.color.setHex(0xff0000);
                object.material.transparent = true;
                object.material.depthTest = false;
                object.material.opacity = SELECT_OPACITY;
                object.selectedFlag = true;
            }
        }
    };

    scope.unSelectObject = function (object) {
        if (object !== null) {
            if (object.material) {
                object.material.color.set(object.defaultColor);
                object.material.transparent = false;
                object.material.depthTest = true;
                object.material.opacity = 1;
                object.selectedFlag = false;
            }
        }
    };





    var onMouseUp = function (event) {
        if (editor.mode === editor.MODE_FACES_EDGES) {
            scope.onMouseUpFacesEdgesHandler(event);
        } else if (editor.mode === editor.MODE_3D_POINT) {
            scope.onMouseUp3dPointHandler(event);
        } else if (editor.mode === editor.MODE_3D_GEOMETRY) {
            scope.onMouseUp3dGeometryHandler(event);
        }
    };


    var searchNearestPointRuler = function () {
        var vector = ruler.getLeftCornerVerticalPosition();
        raycaster.set(camera.position, vector.sub(camera.position).normalize());
        var intersects = raycaster.intersectObjects(objects);


        if (intersects.length > 0) {
            runNearestAlgorithm(intersects);
        }
    };

    var runNearestAlgorithm = function (intersects) {
        var intersectMesh = searchNearestIntersect(intersects, THREE.Mesh);
        var intersectLine = searchNearestIntersect(intersects, THREE.LineSegments);
        var intersect = getNearestIntersect(intersectLine, intersectMesh);
        // var intersect = intersects[0];
        if (intersect) {

            var vertices = intersect.object.userData.totalObjVertices;
            var results = intersect.object.userData.totalObjResults;
            var pointsTable = intersect.object.userData.pointsTable;

            var distance = intersect.distance * editor.loader.coordFactor;
            var c = intersect.point;
            if (!pointsTable || !vertices) {
                return;
            }
            nearestPoint.show();
            var list = nearest(c, distance, pointsTable, vertices);
            if (list.length > 0) {
                var resultVal = 10;
                var resultIndex = list[0].index;
                if (resultIndex !== undefined) {
                    resultVal = results[resultIndex] ? results[resultIndex] : 0;
                    resultVal = !isNaN(resultVal) ? resultVal : 0;

                }
                resultVal = resultVal.round(editor.resultDigits);
                var point = list[0].clone().multiplyScalar(editor.loader.coordFactor);
                info.setValue('x = ' + point.x + ' , y = ' + point.y + ' , z =  ' + point.z + ', result =  ' + resultVal);
                var position = new THREE.Vector3(list[0].x, list[0].y, list[0].z);
                nearestPoint.position.copy(position);
                nearestPoint.userData.result = resultVal;
                nearestPoint.update();
                render();
            }
        }
    };
    var lastMove = Date.now();
    scope.onMouseMoveViewerHandler = function (event) {
        if (!mainMouseMove) {
            return;
        }

        if (controls.state >= 0) {
            return;
        }

        if (objects.length === 0) {
            return;
        }

        if (Date.now() - lastMove < 31) { // 32 frames a second
            return;
        } else {
            lastMove = Date.now();
        }

        var intersects = getIntersects(event, objects);
        if (intersects.length > 0) {
            runNearestAlgorithm(intersects);
        }
    };

    scope.onMouseMoveEditorHandler = function (event) {

    };


    var onMouseMove = function (event) {
        if (editor.mode === editor.MODE_FACES_EDGES || editor.mode === editor.MODE_3D_GEOMETRY) {
            scope.onMouseMoveEditorHandler(event);
        } else if (editor.mode === editor.MODE_3D_POINT) {
            scope.onMouseMoveViewerHandler(event);
        }
    };

    var onDoubleClick = function (event) {
        if (editor.mode === editor.MODE_FACES_EDGES || editor.mode === editor.MODE_3D_GEOMETRY) {
//          not implemented yet
        } else if (editor.mode === editor.MODE_3D_POINT) {
            scope.onMouseDblClickViewerHandler(event);
        }

    };

    container.dom.addEventListener('mousedown', onMouseDown, false);
    container.dom.addEventListener('dblclick', onDoubleClick, false);
    container.dom.addEventListener('mousemove', onMouseMove, false);
    container2.dom.addEventListener('mousemove', onMouseMove, false);

    // controls need to be added *after* main logic,
    // otherwise controls.enabled doesn't work.

    ruler.addEventListener('digitsEvent', function (event) {
        var modalHeader = new UI.Text();
        modalHeader.setValue('Set Delimiter');
        var numberControl = new UI.Number(event.digit);
        modal.show(modalHeader, numberControl, function (result) {
            ruler.getDelimiterAndDispatch(result);
        });
    });

    ruler.addEventListener('rotateEvent', function (event) {

        var degree = event.angle;
        var sign = Math.sign(degree);
        if (event.direction === "vertical") {
            var currentAngle = findVerticalAngle();
            var resultAngle = THREE.Math.degToRad(degree);
            rotateAroundWorldAxis(ruler, crossVector, resultAngle);
            highlighterProtractor.hide();
            var directionNorm = ruler.getDirectionNorm();
            var direction = protractorV.getDirectionNorm();
            var dotProduct = directionNorm.dot(direction);
            var cosAngle = dotProduct / directionNorm.length() * direction.length();


            ruler.setRotateSinSign(Math.sign(Math.sin(THREE.Math.degToRad(90 + currentAngle))));
            ruler.setRotateVAngle(90 + currentAngle);

            rulerInfo.setValue('angleH = ' + ruler.userData.rotateHAngle + ' , angleV = ' + ruler.userData.rotateVAngle);

            if (Math.sign(cosAngle) < 0) {
                rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, -1), Math.PI);
                ruler.setRotateVSign(-ruler.userData.rotateVSign);
            }
        } else if (event.direction === "horizontal") {

            var normal = new THREE.Vector3(0, 0, 1);
            var directionNorm = ruler.getDirectionNorm();
            var projection = directionNorm.projectOnPlane(normal);
            var projectionLength = projection.length();
            var result = degree;

            if (parseFloat(projectionLength.toFixed(12)) != 0) {
                rotateAroundWorldAxis(ruler, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
                rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
                ruler.setRotateVSign(-1); // default direction
                calculateCrossVector();
            }
            ruler.setRotateHAngle(degree);
        }
        render();
    });

    var onChooseProtractorVAngle = function (degree) {
        var currentAngle = findVerticalAngle();
        if (ruler.userData.rotateSinSign < 0) { // sin <0
            currentAngle = 360 - currentAngle;
        }


        var resultAngle = ruler.userData.rotateVSign * THREE.Math.degToRad(degree - currentAngle);
        rotateAroundWorldAxis(ruler, crossVector, resultAngle);
        highlighterProtractor.hide();
        var directionNorm = ruler.getDirectionNorm();
        var direction = protractorV.getDirectionNorm();
        var dotProduct = directionNorm.dot(direction);
        var cosAngle = dotProduct / directionNorm.length() * direction.length();


        ruler.setRotateSinSign(Math.sign(Math.sin(THREE.Math.degToRad(degree))));
        ruler.setRotateVAngle(degree);

        rulerInfo.setValue('angleH = ' + ruler.userData.rotateHAngle + ' , angleV = ' + ruler.userData.rotateVAngle);

        if (Math.sign(cosAngle) < 0) {
            rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, -1), Math.PI);
            ruler.setRotateVSign(-ruler.userData.rotateVSign);
        }
        protractorV.hide();
        ruler.show();
        render();
    };


    protractorV.addEventListener('mouseDown', function (event) {
        var degree = event.angle;
        onChooseProtractorVAngle(degree);
    });

    protractorV.addEventListener('digitsEvent', function (event) {
        var modalHeader = new UI.Text();
        modalHeader.setValue('Set Vertical Angle');
        var numberControl = new UI.Number(event.digit);
        modal.show(modalHeader, numberControl, function (degree) {
            onChooseProtractorVAngle(degree);
        });
    });


    var onChooseProtractorHAngle = function (degree) {
        var normal = new THREE.Vector3(0, 0, 1);
        var directionNorm = ruler.getDirectionNorm();

        var projection = directionNorm.projectOnPlane(normal);
        var projectionLength = Math.round(projection.length());


        var angleBTWOXY = THREE.Math.radToDeg(Math.atan2(projection.y, projection.x));

        var result = degree - (360 + angleBTWOXY);


//         //calculate angle btn ruler ray and OXY
//         var rulerRay = ruler.getPointDirectionVector();
//         var rulerRayProjection = new THREE.Vector3(rulerRay.x, rulerRay.y, rulerRay.z).projectOnPlane(normal);
//         var cross =  new THREE.Vector3();
//         cross.crossVectors(rulerRay, rulerRayProjection);
//         var sinAngleBTWZAndOXY = cross.length()/(rulerRay.length()*rulerRayProjection.length());
//         var rulerRayAngleWithOXY = Math.round(THREE.Math.radToDeg(Math.asin(sinAngleBTWZAndOXY)));
        if (parseFloat(projectionLength.toFixed(12)) != 0) {
            rotateAroundWorldAxis(ruler, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
            rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
            ruler.setRotateVSign(-1); // default direction
            calculateCrossVector();
        }

        ruler.setRotateHAngle(degree);

        highlighterProtractor.userData = {angle: 0};
        highlighterProtractor.hide();
        protractorH.hide();
        ruler.show();
        render();
    };

    protractorH.addEventListener('mouseDown', function (event) {
        var degree = event.angle;
        onChooseProtractorHAngle(degree);
    });


    protractorH.addEventListener('digitsEvent', function (event) {
        var modalHeader = new UI.Text();
        modalHeader.setValue('Set Horizontal Angle');
        var numberControl = new UI.Number(event.digit);
        modal.show(modalHeader, numberControl, function (degree) {
            onChooseProtractorHAngle(degree);
        });
    });


    var controls = new THREE.EditorControls(editor.id, camera, container.dom);
    controls.addEventListener('change', function (event) {
        axis.update();

        for (var i = 0; i < unRotatedObjects.length; i++) {
            unRotatedObjects[i].quaternion.copy(camera.quaternion);
        }

        signals.objectChanged.dispatch(camera);

    });

    controls.addEventListener('zoom', function (event) {
        // temp solution
        // TODO: add logic with auto calculate step zoom
        if (event.distance > 0) {
            DEFAULT_STEP_ZOOM = 0.0006;
            FIRST_LIMIT_FOV = 0.0006;
        }
        var oldCameraFov = camera.fov;
        var newCameraFov = oldCameraFov + event.distance * DEFAULT_STEP_ZOOM;
        if (newCameraFov < FIRST_LIMIT_FOV) {
            newCameraFov = FIRST_LIMIT_FOV;
            DEFAULT_STEP_ZOOM = 0.0001;
            FIRST_LIMIT_FOV = SECOND_LIMIT_FOV;
        }
        camera.fov = newCameraFov;
        camera.updateProjectionMatrix();


        ruler.update();
        protractorV.update();
        protractorH.update();
        nearestPoint.update();
        highlighter.update();
        highlighterProtractor.update();
        axis.update();

        for (var key in selectedResultPoints) {
            selectedResultPoints[key].update();
            textResults[key].update(selectedResultPoints[key]);
        }

        signals.objectChanged.dispatch(camera);

    });


    // signals

    signals.rendererChanged.add(function (object) {

        container.dom.removeChild(renderer.domElement);

        renderer = object;
        renderer.setClearColor(clearColor);
        renderer.autoClear = false;
        renderer.autoUpdateScene = false;
        renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
        // pickingRenderTarget.setSize(container.dom.offsetWidth, container.dom.offsetHeight);

        container.dom.appendChild(renderer.domElement);

        render();

    });

    signals.sceneGraphChanged.add(function () {

        render();
        // updateInfo();


    });

    signals.objectColorSelected.add(function (object) {
        scope.selectObject(object);
        render();

    });

    signals.objectColorUnSelected.add(function (object) {
        scope.unSelectObject(object);

        render();

    });


    signals.setMode.add(function () {
        nearestPoint.hide();
        highlighter.hide();
        highlighterProtractor.hide();
        infoMode.setValue('mode=' + editor.mode);
        render();
    });


    var getFar = function (box) {
        var matrix = new THREE.Matrix4();
        matrix.copy(camera.matrixWorldInverse.getInverse(camera.matrixWorld));
        var maxz = -Infinity;

        for (var i = 0; i < 8; i++) {
            var x = i & 1 ? box.min.x : box.max.x;
            var y = i & 2 ? box.min.z : box.max.z;
            var z = i & 4 ? box.min.y : box.max.y;
            var p = new THREE.Vector3(x, z, y);
            p.applyMatrix4(matrix);
            z = -p.z;
            if (z > maxz) {
                maxz = z;
            }
        }

        return maxz;
    };


    signals.scaleChanged.add(function (boundingBox, modelRotation) {
        var subVector = new THREE.Vector3(0, 0, 0);
        subVector.subVectors(boundingBox.min, boundingBox.max);

        var height = subVector.length();
        var radius = height / 2;


        var heightModel = Math.abs(boundingBox.min.z - boundingBox.max.z);
        var widthModel = Math.abs(boundingBox.min.x - boundingBox.max.x);
        var paramToFit = Math.max(widthModel, heightModel);
        var dist = camera.position.distanceTo(editor.lastModel.position) - radius;
        camera.fov = 2 * Math.atan(paramToFit / ( 2 * dist )) * ( 180 / Math.PI );
        var newCameraFar = getFar(boundingBox);
        if (camera.far < newCameraFar) {
            camera.far = newCameraFar;
        }
        var addVector = new THREE.Vector3(0, 0, 0);
        addVector.addVectors(boundingBox.min, boundingBox.max);
        var center = addVector.multiplyScalar(0.5);
        controls.setCenter(center);
        if (modelRotation) {
            camera.position.z = modelRotation.position.z;
            camera.position.y = modelRotation.position.y;
            camera.position.x = modelRotation.position.x;
            camera.fov = modelRotation.fov;
            if (modelRotation.results) {
                for (var i = 0; i < modelRotation.results.length; i++) {
                    var result = modelRotation.results[i];
                    var textResultMesh = new THREE.ResultTextObject3d(camera, container.dom, {
                        value: result.resultValue,
                        color: editor.options.resultTextColor
                    });
                    textResultMesh.name = "result-" + result.resultValue + result.position.x + result.position.y + result.position.z;
                    textResultMesh.quaternion = camera.quaternion;
                    var textResultPosition = new THREE.Vector3(0, 0, 0);
                    textResultPosition.x = result.position.x;
                    textResultPosition.y = result.position.y;
                    textResultPosition.z = result.position.z;
                    textResultMesh.position.copy(textResultPosition);
                    var key = result.resultValue + result.position.x + result.position.y + result.position.z;
                    textResults[key] = textResultMesh;
                    textResultMesh.update();
                    sceneHelpers.add(textResultMesh);

                    var selectedResultPoint = new THREE.NearestPointObject3d(camera, container.dom, {
                        material: {color: editor.options.resultPointColor},
                        size: editor.options.resultPointSize
                    });
                    selectedResultPoint.name = "sphereResult-" + result.resultValue + result.position.x + result.position.y + result.position.z;
                    selectedResultPoint.position.copy(result.position);
                    selectedResultPoints[key] = selectedResultPoint;

                    sceneHelpers.add(selectedResultPoint);
                    selectedResultPoint.update();
                }

            }
        }

        camera.lookAt(center);
        camera.updateProjectionMatrix();
        ruler.setCoordFactor(editor.loader.coordFactor);
        ruler.update();
        protractorV.update();
        protractorH.update();
        nearestPoint.update();
        highlighter.update();
        highlighterProtractor.update();
        axis.update();

        render();
    });


    signals.saveModelPosition.add(function () {

        var modelRotation = {};
        modelRotation.position = {};
        modelRotation.position.x = camera.position.z;
        modelRotation.position.y = camera.position.y;
        modelRotation.position.z = camera.position.z;
        modelRotation.fov = camera.fov;
        editor.createJsonModelWithRotation(modelRotation);
    });

    signals.printScreen.add(function (toFileName) {
        var urlRenderer	= renderer.domElement.toDataURL("image/png");
        editor.onPrintScreenDone(urlRenderer);
        // var element = document.createElement('a');
        // element.setAttribute('href', urlRenderer);
        // element.setAttribute('download', toFileName);
        // element.style.display = 'none';
        // document.body.appendChild(element);
        // element.click();
        // document.body.removeChild(element);
    });


    signals.objectAdded.add(function (object) {
        // var startDate   = new Date();
        var materialsNeedUpdate = false;
        object.traverse(function (child) {

            if (child instanceof THREE.Light) {
                materialsNeedUpdate = true;
            }
            if (child.userData) {
                if (child.userData.quaternion === "camera") {
                    child.quaternion.copy(camera.quaternion);
                    unRotatedObjects.push(child);
                }
            }
            objects.push(child);
        });

        // var endDate   = new Date();
        // var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        // console.log("signals.objectAdded", seconds);
        nearestPoint.hide();
        highlighter.hide();
        highlighterProtractor.hide();
        ruler.hide();
        // editor.setMode(editor.MODE_3D_GEOMETRY);
        if (materialsNeedUpdate === true) {
            updateMaterials();
        }

    });

    signals.objectChanged.add(function (object) {
        if (object !== camera) {


            if (editor.helpers[object.id] !== undefined) {

                editor.helpers[object.id].update();

            }

            // updateInfo();

        }

        render();

    });

    signals.objectRemoved.add(function (object) {

        var materialsNeedUpdate = false;

        object.traverse(function (child) {

            if (child instanceof THREE.Light) {
                materialsNeedUpdate = true;
            }

            objects.splice(objects.indexOf(child), 1);

        });

        if (materialsNeedUpdate === true) {
            updateMaterials();
        }

    });


    signals.objectsRemoved.add(function (objsToRemove) {
        var materialsNeedUpdate = false;
        for (var i = objsToRemove.length - 1; i >= 0; i--) {
            var obj = objsToRemove[i];
            obj.traverse(function (child) {
                if (child instanceof THREE.Light) {
                    materialsNeedUpdate = true;
                }
                objects.splice(objects.indexOf(child), 1);

                if (child instanceof THREE.Mesh) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }
                    if (child.material) {
                        if (child.material instanceof THREE.MeshFaceMaterial || child.material instanceof THREE.MultiMaterial) {
                            child.material.materials.forEach(function (mtrl, idx) {
                                if (mtrl.map) mtrl.map.dispose();
                                if (mtrl.lightMap) mtrl.lightMap.dispose();
                                if (mtrl.bumpMap) mtrl.bumpMap.dispose();
                                if (mtrl.normalMap) mtrl.normalMap.dispose();
                                if (mtrl.specularMap) mtrl.specularMap.dispose();
                                if (mtrl.envMap) mtrl.envMap.dispose();
                                mtrl.dispose();    // disposes any programs associated with the material
                            });
                        } else {
                            if (child.material.map) child.material.map.dispose();
                            if (child.material.lightMap) child.material.lightMap.dispose();
                            if (child.material.bumpMap) child.material.bumpMap.dispose();
                            if (child.material.normalMap) child.material.normalMap.dispose();
                            if (child.material.specularMap) child.material.specularMap.dispose();
                            if (child.material.envMap) child.material.envMap.dispose();
                            child.material.dispose();
                            // !!! cause problem with rendering

                        }


                    }
                    scene.remove(child);
                }

                if (child instanceof THREE.LineSegments) {
                    if (child.geometry) {
                        child.geometry.dispose();
                    }

                    if (child.material) {
                        child.material.dispose();
                    }
                    scene.remove(child);
                }

            });

            scene.remove(obj);
        }
        if (materialsNeedUpdate === true) {
            updateMaterials();
        }
        if (renderer && (renderer.info.memory.geometries || renderer.info.memory.programs || renderer.info.memory.textures)) {
            // console.log("geometries=" + renderer.info.memory.geometries + " programs=" + renderer.info.memory.programs + " textures=" +renderer.info.memory.textures);
        }
    });


    signals.materialChanged.add(function (material) {

        render();

    });


    signals.axisChanged.add(function (direction) {

        if (direction === "upY") {
            camera.position.set(97, 50, 104);
            camera.up = new THREE.Vector3(0, 1, 0);
        } else if (direction === "upZ") {
            camera.position.set(36, -149, 63);
            camera.up = new THREE.Vector3(0, 0, 1);
        }
        camera2.up = camera.up;
        camera.lookAt(scene.position);
        camera2.position.copy(camera.position);
        camera2.position.setLength(CAM_DISTANCE);
        camera2.lookAt(sceneAxis.position);
        controls.setAxisDirection(direction);
        sceneAxis.traverse(function (object) {
            if (object instanceof THREE.Mesh) {
                if (object.userData === "textAxis") {
                    if (direction === "upY") {
                        object.rotation.x = 2 * Math.PI;
                    } else if (direction === "upZ") {
                        object.rotation.x = Math.PI / 2;
                    }
                }
            }
        });

        render();

    });


    signals.showVProtractor.add(function (show) {
        protractorV.position.copy(ruler.position);
        protractorH.hide();
        protractorV.show();
        ruler.hide();
        highlighter.hide();
        render();

    });

    signals.showHProtractor.add(function (show) {
        protractorH.position.copy(ruler.position);
        protractorV.hide();
        protractorH.show();
        ruler.hide();
        highlighter.hide();
        render();

    });


    signals.showRuler.add(function (show) {

        if (show) {
            ruler.show();
        } else {
            ruler.hide();
        }
        highlighterProtractor.hide();
        protractorV.hide();
        protractorH.hide();

        render();

    });

    signals.toggleRotate.add(function (flag) {

        ROTATE = flag;

        render();

    });

    signals.toggleSearchNearestMode.add(function (flag) {

        USE_OCTREE = flag;


    });


    signals.clearColorChanged.add(function (color) {

        renderer.setClearColor(color);
        render();

        clearColor = color;

    });

    signals.windowResize.add(function () {

        camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);
        // pickingRenderTarget.setSize(container.dom.offsetWidth, container.dom.offsetHeight);


        ruler.update();
        protractorV.update();
        protractorH.update();
        nearestPoint.update();
        highlighter.update();
        highlighterProtractor.update();
        axis.update();

        render();

    });

    var renderer;
    // var pickingRenderTarget;

    if (System.support.webgl === true) {

        renderer = new THREE.WebGLRenderer({antialias: true, alpha: false, preserveDrawingBuffer: true});
        // pickingRenderTarget = new THREE.WebGLRenderTarget();
        // pickingRenderTarget.texture.generateMipmaps = false;
        // pickingRenderTarget.texture.minFilter = THREE.NearestFilter;


    } else {

        renderer = new THREE.CanvasRenderer();

    }

    renderer.setClearColor(clearColor);
    renderer.sortObjects = false;
    renderer.autoClear = false;
    renderer.autoUpdateScene = false;
    container.dom.appendChild(renderer.domElement);

    animate();


    function updateInfo() {

        var objects = 0;
        var vertices = 0;
        var faces = 0;

        scene.traverse(function (object) {

            if (object instanceof THREE.Mesh) {

                objects++;
                var geometry = object.geometry;

                if (geometry instanceof THREE.Geometry) {

                    vertices += geometry.vertices.length;
                    faces += geometry.faces.length;

                } else if (geometry instanceof THREE.BufferGeometry) {

                    vertices += geometry.attributes.position.array.length / 3;

                    if (geometry.attributes.index !== undefined) {

                        faces += geometry.attributes.index.array.length / 3;

                    } else {

                        faces += vertices / 3;

                    }

                }

            }

        });


    }

    function updateMaterials() {

        editor.scene.traverse(function (node) {

            if (node.material) {

                node.material.needsUpdate = true;

                if (node.material instanceof THREE.MeshFaceMaterial) {

                    for (var i = 0; i < node.material.materials.length; i++) {

                        node.material.materials[i].needsUpdate = true;

                    }

                }

            }

        });

    }


    function animate() {
        requestAnimationFrame(animate);
        camera2.quaternion.copy(camera.quaternion);
        camera2.position.copy(camera.position);
        camera2.position.setLength(CAM_DISTANCE);
        if (editor.lastModel && ROTATE) {
            editor.lastModel.rotation.z -= 0.005;
            render();
        }
    }


    function render() {
        // var startDate   = new Date();
        sceneHelpers.updateMatrixWorld();
        scene.updateMatrixWorld();
        sceneAxis.updateMatrixWorld();
        // renderer.clearDepth();
        renderer.clear();
        renderer.render(scene, camera);
        renderer.render(sceneHelpers, camera);
        renderer2.render(sceneAxis, camera2);
        octree.update();
        // rendererStats.update(renderer);
        // var endDate   = new Date();
        // var seconds = (endDate.getTime() - startDate.getTime()) / 1000;
        // console.log("render", seconds);

        // console.log("Calls:",  renderer.info.render.calls);
        // console.log("Vertices:", renderer.info.render.vertices);
        // console.log("Faces:",   renderer.info.render.faces);
        // console.log("Points:",  renderer.info.render.points);


    }

    return {mainContainer: container, slaveContainer: container2, renderer : renderer};

};
