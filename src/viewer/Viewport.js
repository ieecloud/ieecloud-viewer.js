var Viewport = function (editor) {

    var signals = editor.signals;

    var scope = this;


    var container = new UI.Panel().setId("main" + editor.id);
    container.setPosition('absolute');
    container.setBackgroundColor('#aaa');

    var info = new UI.Text();
    info.setPosition('absolute');
    info.setRight('5px');
    info.setBottom('5px');
    info.setFontSize('12px');
    info.setColor('#ffffff');
    container.add(info);

    var scene = editor.scene;
    var sceneAxis = editor.sceneAxis;
    var sceneHelpers = editor.sceneHelpers;
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
    var DEFAULT_STEP_ZOOM = 0.03;
    var FIRST_LIMIT_FOV = 0.01;
    var SECOND_LIMIT_FOV = 0.000000001;
    var ROTATE = false;


    var mainMouseMove = true;

    // helpers

    var grid = new THREEext.GridHelper(500, 25);
    sceneHelpers.add(grid);

    if(!editor.options.gridVisible){
        grid.hide();
    }

    // inset canvas
    // -----------------------------------------------

    // dom
    var container2 = new UI.Panel().setId("slave" + editor.id);
    container2.setPosition('absolute');


    // renderer
    var renderer2 = new THREE.CanvasRenderer({ alpha: true } );
    renderer2.setSize(CANVAS_WIDTH, CANVAS_HEIGHT);
    container2.dom.appendChild(renderer2.domElement);

    var camera = new THREE.PerspectiveCamera(10, container.dom.offsetWidth / container.dom.offsetHeight, 1, 5000);
    camera.position.z = 63;
    camera.position.y = -149;
    camera.position.x = 36;


    camera.up = new THREE.Vector3(0, 0, 1);
    camera.lookAt(scene.position);

    // camera2
    var camera2 = new THREE.PerspectiveCamera(50, CANVAS_WIDTH / CANVAS_HEIGHT, 1, 1000);
    camera2.up = camera.up; // important!

    var selectedResultPoints = {};
    var textResults = {};
    var nearestPoint = new THREE.NearestPointObject3d(camera, container.dom, {material : {color: editor.options.nearestPointColor}});
    nearestPoint.hide();


    sceneHelpers.add(nearestPoint);

    var highlighter = new THREE.NearestPointObject3d(camera, container.dom, {material : {color: editor.options.nearestPointColor}});
    highlighter.hide();
    sceneHelpers.add(highlighter);



    var highlighterProtractor = new THREE.NearestPointObject3d(camera, container.dom, {material : {color: editor.options.nearestPointColor}});
    highlighterProtractor.hide();
    sceneHelpers.add(highlighterProtractor);


     var projectionPoint = new THREE.NearestPointObject3d(camera, container.dom, {material : {color: "white"}});
        projectionPoint.hide();
        sceneHelpers.add(projectionPoint);

    var plane = new THREE.Mesh(
        new THREE.PlaneBufferGeometry( 1000, 1000, 8, 8 ),
        new THREE.MeshBasicMaterial( { color: 0x000000, opacity: 0.25, transparent: true } )
    );

    plane.material.side = THREE.DoubleSide;

    plane.userData.name="PLANE"

     var xAxis = new THREE.Vector3(1, 0, 0);
    rotateAroundObjectAxis(plane, xAxis, Math.PI/2 );

    plane.visible = false;



    sceneHelpers.add( plane );


     var ruler = new THREE.ToolsGizmo(camera, container.dom, plane, nearestPoint, highlighter,sceneHelpers);
     ruler.addEventListener("disableMainControl", function(event){
         controls.enabled = false;
         highlighter.hide();
     });


     ruler.addEventListener("enableMainControl", function(event){
         controls.enabled = true;
     });

     ruler.addEventListener("change", function(event){
        var intersects = event.intersects;
         if(!intersects){
               highlighter.hide();
              render();
            return;
         }

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
                 highlighter.userData = {value : valueTable[resultIndex]};
                 event.intersects = null;
                 render();
             }
         }
        render();
        event.intersects = null;
     });

     ruler.addEventListener("searchNearest", function(event){
        searchNearestPointRuler();
     });

     ruler.addEventListener("disableMainMove", function(event){
         mainMouseMove = false;
     });

     ruler.addEventListener("enableMainMove", function(event){
         mainMouseMove = true;
     });
     ruler.hide();
     sceneHelpers.add( ruler );

     var protractorV = new THREE.Protractor(camera, container.dom, THREE.ProtractorModes.VERTICAL, highlighterProtractor);
     protractorV.addEventListener('reRenderProtractor', function (event) {
        render();
     });

     crossVector = new THREE.Vector3(0, 0 , 0);

     calculateCrossVector();

     protractorV.addEventListener('disableMainMove', function (event) {

        mainMouseMove = false;
     });

     protractorV.addEventListener('enableMainMove', function (event) {
        mainMouseMove = true;
     });

     protractorV.addEventListener('highlightEvent', function (event) {

        var intersects = event.intersects;
         if(!intersects){
            highlighterProtractor.hide();
            render();
            return;
         }

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
                 highlighterProtractor.userData = {angle : list[0].index * Math.round(THREE.Math.radToDeg(protractorV.DIVISION_STEP))};
                 event.intersects = null;
                 render();
             }
         }


     });

     protractorV.hide();
     sceneHelpers.add( protractorV );


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
          if(!intersects){
             highlighterProtractor.hide();
             render();
             return;
          }

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
                  highlighterProtractor.userData = {angle : list[0].index * Math.round(THREE.Math.radToDeg(protractorV.DIVISION_STEP))};
                  event.intersects = null;
                  render();
              }
          }


      });



     protractorH.hide();
     sceneHelpers.add( protractorH );



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
	raycaster.linePrecision = 0.1;
	var mouse = new THREE.Vector2();

    // object picking

    var projector = new THREE.Projector();



     function rotateAroundObjectAxis(object, axis, radians) {
         var rotObjectMatrix = new THREE.Matrix4();
         rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
         object.matrix.multiply(rotObjectMatrix);
         object.rotation.setFromRotationMatrix(object.matrix);
     };

     function calculateCrossVector() {
         var normal = new THREE.Vector3(0,0,1);

         var directionNorm = ruler.getDirectionNorm();

         var vectorToCross = directionNorm.projectOnPlane(normal);
         crossVector.crossVectors(normal, vectorToCross);
      };


      function findVerticalAngle() {
         var normal = new THREE.Vector3(0,0,1);
         var rulerRay = ruler.getDirectionNorm();
         var rulerRayProjection = new THREE.Vector3(rulerRay.x, rulerRay.y, rulerRay.z).projectOnPlane(normal);
           var cross =  new THREE.Vector3();
           cross.crossVectors(rulerRay, rulerRayProjection);
           var sinAngleBTWZAndOXY = cross.length()/(rulerRay.length()*rulerRayProjection.length());
            var result =THREE.Math.radToDeg(Math.asin(sinAngleBTWZAndOXY) );

           return result


      };


     function rotateAroundWorldAxis(object, axis, radians) {
            var rotWorldMatrix = new THREE.Matrix4();
            rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
            rotWorldMatrix.multiply(object.matrix);
            object.matrix = rotWorldMatrix;
            object.rotation.setFromRotationMatrix(object.matrix.extractRotation(rotWorldMatrix));

        };

    // events

    var getIntersects = function ( event, object ) {
            var point  = new THREE.Vector2();
            var array = getMousePosition( container.dom, event.clientX, event.clientY);

            point.fromArray( array );

    		mouse.set( ( point.x * 2 ) - 1, - ( point.y * 2 ) + 1 );

    		raycaster.setFromCamera( mouse, camera );

    		if ( object instanceof Array ) {

    			return raycaster.intersectObjects( object , true);

    		}

    		return raycaster.intersectObject( object , true);

    };

    var getMousePosition = function ( dom, x, y ) {

        var rect = dom.getBoundingClientRect();
        return [ ( x - rect.left ) / rect.width, ( y - rect.top ) / rect.height ];

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
        if(pointsTable.table[index]){
          for (var i = 0; i < pointsTable.table[index].length; i++) {
               var n = objVertices[pointsTable.table[index][i]];
               n.index = pointsTable.table[index][i];
               if (!n) {
                 continue;
               }
               if (calculateR(n) < r - distance){
                   continue;
               }
               if (calculateR(n) > r + distance){
                   break;
               }
               if (calcDistance(n, c) < distance){
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
                if (calculateR(n) < r - distance){
                    break;
                }
                if (calcDistance(n, c) < distance){
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
                if (calculateR(n) > r + distance){
                   break;
                }
                if (calcDistance(n, c) < distance){
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

     function getFactorPos( val, factor, step ){
         return step / factor * val;
     }


    function addNewParticle(pos, scale) {

        if( !scale )
        {
            scale = 16;
        }

        var particle = new THREE.Sprite( particleMaterialBlack );
        particle.position.copy(pos);
        particle.scale.x = particle.scale.y = scale;
        scene.add( particle );
    };


     var drawParticleLine = function(pointA, pointB){

        var scale  =1;
        var color = new THREE.Color( "red" );
         var geometry = new THREE.Geometry();
         geometry.vertices.push(new THREE.Vector3( pointA.x,pointA.y,pointA.z ));
         geometry.vertices.push(new THREE.Vector3( pointB.x,pointB.y,pointB.z ));
         geometry.colors.push( color, color);
         var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );
         var line = new THREEext.Line(geometry, material, THREE.LinePieces);
         line.scale.x = line.scale.y = scale;
         scene.add( line );
    };



    var onMouseDownPosition = new THREE.Vector2();
    var onMouseUpPosition = new THREE.Vector2();

    var onMouseDown = function (event) {
        event.preventDefault();
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

     var  getNearestIntersect = function (intersectLine, intersectMesh) {
            if(!intersectMesh && intersectLine){
                return intersectLine;
            }

            if(intersectMesh && !intersectLine){
                return intersectMesh;
            }

            if(intersectMesh && intersectLine){
                 var intersect = intersectMesh;
                 if(intersectLine.distance < intersectMesh.distance){
                     intersect = intersectLine;
                 }
                 return intersectMesh;
            }

            return null;
        };

    scope.getSceneObjectByName = function (name, recursive) {

        for (var i = 0, l = sceneHelpers.children.length; i < l; i++) {

            var child = sceneHelpers.children[ i ];

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


        var textResultMesh = new THREE.ResultTextObject3d(camera, container.dom, {value:resultVal, color: editor.options.resultTextColor});

        textResultMesh.name = "result-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        var textResultPosition = new THREE.Vector3(0, 0, 0);
        textResultPosition.x = nearestPoint.position.x;
        textResultPosition.y = nearestPoint.position.y;
        textResultPosition.z = nearestPoint.position.z;
        textResultMesh.position.copy(textResultPosition);
        var key  = resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        textResults[key] = textResultMesh;
        textResultMesh.update(nearestPoint);
        sceneHelpers.add(textResultMesh);


        var selectedResultPoint = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: editor.options.resultPointColor}, size:editor.options.resultPointSize});
        selectedResultPoint.name = "sphereResult-" + resultVal + nearestPoint.position.x + nearestPoint.position.y + nearestPoint.position.z;
        selectedResultPoint.position.copy(nearestPoint.position);
        selectedResultPoints[key] = selectedResultPoint;

        sceneHelpers.add(selectedResultPoint);
        selectedResultPoint.update();

        render();
    };

    scope.onMouseUpEditorHandler = function (event) {
        var rect = container.dom.getBoundingClientRect();

        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        onMouseUpPosition.set(x, y);

        if (onMouseDownPosition.distanceTo(onMouseUpPosition) === 0) {

            var intersects = getIntersects(event, objects);
            if (intersects.length > 0) {

                if (event && (event.altKey || event.metaKey)) {
                    var obj = searchNearestObject(intersects, THREEext.Line);
                    if (obj.selected) {
                        editor.unSelectObject(obj);
                    } else {
                        editor.selectObject(obj);
                    }
                } else if (event && (event.ctrlKey || event.metaKey)) {
                     obj = searchNearestObject(intersects, THREE.Mesh);
                    if (obj.selected) {
                        editor.unSelectObject(obj);
                    } else {
                        editor.selectObject(obj);
                    }

                } else {
                    var firstObj = intersects[0].object;
                    var parentName = firstObj.parentName;

                    for (var i = 0; i < objects.length; i++) {
                        if (objects[i].parentName && parentName === objects[i].parentName) {
                            obj = objects[i];
                            if (obj.selected) {
                                editor.unSelectObject(obj);
                            } else {
                                editor.selectObject(obj);
                            }
                        }
                    }
                }
            } else {

                editor.select(camera);

            }

            render();

        }

        document.removeEventListener('mouseup', onMouseUp);
    };

    var onMouseUp = function (event) {

        if (editor.mode === editor.MODE_EDITOR) {
            scope.onMouseUpEditorHandler(event);
        } else {
//            not implemented yet
        }

    };


    var searchNearestPointRuler = function(){
           var vector = ruler.getLeftCornerVerticalPosition();
           raycaster.set( camera.position, vector.sub( camera.position ).normalize() );
           var intersects = raycaster.intersectObjects( objects );


           if(intersects.length > 0){
               runNearestAlgorithm(intersects);
           }
    };

     var runNearestAlgorithm = function(intersects){
         var intersectMesh = searchNearestIntersect(intersects, THREE.Mesh);
         var intersectLine = searchNearestIntersect(intersects, THREEext.Line);
         var intersect =  getNearestIntersect(intersectLine, intersectMesh);
         if (intersect) {
             var vertices = intersect.object.userData.totalObjVertices;
             var results = intersect.object.userData.totalObjResults;
             var pointsTable = intersect.object.userData.pointsTable;

             var distance = intersect.distance;
             var c = intersect.point;
             if (!pointsTable || !vertices) {
                 return;
             }
             nearestPoint.show();
             var list = nearest(c, distance, pointsTable, vertices);
             if (list.length > 0) {
                 var resultVal = 10;
                 var resultIndex = list[0].index;
                 if (resultIndex!==undefined) {
                     resultVal = results[resultIndex] ? results[resultIndex] : 0;
                     resultVal = !isNaN(resultVal) ? resultVal : 0;

                 }
                 resultVal = resultVal.round(editor.resultDigits);
                 info.setValue('x = ' + list[0].x + ' , y = ' + list[0].y + ' , z =  ' + list[0].z + ', result =  ' + resultVal);
                 var position = new THREE.Vector3(list[0].x, list[0].y, list[0].z);
                 nearestPoint.position.copy( position );
                 nearestPoint.userData.result = resultVal;
                 nearestPoint.update();
                 render();
             }
         }
     };

    scope.onMouseMoveViewerHandler = function (event) {
        if(!mainMouseMove){
           return;
        }
        var intersects = getIntersects(event, objects);
        if (intersects.length > 0) {
             // runNearestAlgorithm(intersects);
        }
    };

    scope.onMouseMoveEditorHandler = function (event) {

    };


    var onMouseMove = function (event) {
        if (editor.mode === editor.MODE_EDITOR) {
            scope.onMouseMoveEditorHandler(event);
        } else {
            scope.onMouseMoveViewerHandler(event);
        }
    };

    var onDoubleClick = function (event) {
        if (editor.mode === editor.MODE_EDITOR) {
//          not implemented yet
        } else {
            scope.onMouseDblClickViewerHandler(event);
        }

    };

    container.dom.addEventListener('mousedown', onMouseDown, false);
    container.dom.addEventListener('dblclick', onDoubleClick, false);
    container.dom.addEventListener('mousemove', onMouseMove, false);
    container2.dom.addEventListener('mousemove', onMouseMove, false);

    // controls need to be added *after* main logic,
    // otherwise controls.enabled doesn't work.


    protractorV.addEventListener('mouseDown', function (event) {
          var degree = event.angle;
          var currentAngle =  findVerticalAngle();
          if(ruler.userData.rotateSinSign < 0){ // sin <0
             currentAngle = 360 - currentAngle;
          }


         var resultAngle =  ruler.userData.rotateVSign  *  THREE.Math.degToRad(degree - currentAngle) ;
         rotateAroundWorldAxis(ruler,  crossVector , resultAngle);
         highlighterProtractor.hide();
         var directionNorm = ruler.getDirectionNorm();
         var direction = protractorV.getDirectionNorm();
         var dotProduct = directionNorm.dot(direction);
         var cosAngle  =  dotProduct/ directionNorm.length() * direction.length();


         ruler.setRotateSinSign(Math.sign(Math.sin(THREE.Math.degToRad(degree))));

         if(Math.sign(cosAngle) < 0){
            rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, -1), Math.PI);
            ruler.setRotateVSign(- ruler.userData.rotateVSign);
         }
          protractorV.hide();
          ruler.show();
          render();
    });

    protractorH.addEventListener('mouseDown', function (event) {
         var degree = event.angle;
         var normal = new THREE.Vector3(0,0,1);
         var directionNorm = ruler.getDirectionNorm();

         var projection = directionNorm.projectOnPlane(normal);
         var projectionLength  = Math.round(projection.length());



         var angleBTWOXY = THREE.Math.radToDeg(Math.atan2(projection.y, projection.x));

         var result = degree - (360 + angleBTWOXY);


         //calculate angle btn ruler ray and OXY
         var rulerRay = ruler.getPointDirectionVector();
         var rulerRayProjection = new THREE.Vector3(rulerRay.x, rulerRay.y, rulerRay.z).projectOnPlane(normal);
         var cross =  new THREE.Vector3();
         cross.crossVectors(rulerRay, rulerRayProjection);
         var sinAngleBTWZAndOXY = cross.length()/(rulerRay.length()*rulerRayProjection.length());
         var rulerRayAngleWithOXY = Math.round(THREE.Math.radToDeg(Math.asin(sinAngleBTWZAndOXY)));
         if(rulerRayAngleWithOXY !== 90){
              rotateAroundWorldAxis(ruler, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
              rotateAroundWorldAxis(protractorV, new THREE.Vector3(0, 0, 1), THREE.Math.degToRad(result));
              ruler.setRotateVSign(-1); // default direction
              calculateCrossVector();
         }

          highlighterProtractor.userData = {angle:0};
          highlighterProtractor.hide();
          protractorH.hide();
          ruler.show();
          render();
    });


    var controls = new THREE.EditorControls(editor.id, camera, container.dom);
    controls.addEventListener('change', function (event) {
          axis.update();

          for(var i=0; i<unRotatedObjects.length; i++){
             unRotatedObjects[i].quaternion.copy(camera.quaternion);
          }

         signals.objectChanged.dispatch(camera);

    });

    controls.addEventListener('zoom', function (event) {
        // temp solution
        // TODO: add logic with auto calculate step zoom
        if (event.distance > 0) {
            DEFAULT_STEP_ZOOM = 0.01;
            FIRST_LIMIT_FOV = 0.01;
        }
        var oldCameraFov = camera.fov;
        var newCameraFov = oldCameraFov + event.distance*DEFAULT_STEP_ZOOM;
        if(newCameraFov < FIRST_LIMIT_FOV){
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

        for(var key in selectedResultPoints){
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

        container.dom.appendChild(renderer.domElement);

        render();

    });

    signals.sceneGraphChanged.add(function () {

        render();
        updateInfo();


    });

    signals.objectColorSelected.add(function (object) {
        if (object !== null) {

            if (object.material) {
                object.material.color.setHex(0xff0000);
                object.material.transparent = true;
                object.material.depthTest = false;
                object.material.opacity = SELECT_OPACITY;
                object.selectedFlag = true;
            }

        }

        render();

    });

    signals.objectColorUnSelected.add(function (object) {
        if (object !== null) {

            if (object.material) {
                object.material.color.set(object.defaultColor);
                object.material.transparent = false;
                object.material.depthTest = true;
                object.material.opacity = 1;
                object.selectedFlag = false;
            }

        }

        render();

    });


    var getFar = function(box) {
        var matrix = new THREE.Matrix4();
        matrix.copy( camera.matrixWorldInverse.getInverse( camera.matrixWorld ) );
        var maxz = -Infinity;

        for (var i = 0; i < 8; i++) {
            var x = i & 1 ? box.min.x : box.max.x;
            var y = i & 2 ? box.min.z : box.max.z;
            var z = i & 4 ? box.min.y : box.max.y;
            var p =  new THREE.Vector3(x, z, y);
            p.applyMatrix4(matrix);
            z = -p.z;
            if (z > maxz){
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
        var dist = Math.abs(camera.position.y - editor.lastModel.position.y - radius/2);


        camera.fov =  2 * Math.atan( height / ( 2 * dist ) ) * ( 180 / Math.PI );
        var newCameraFar =  getFar(boundingBox);
        if(camera.far < newCameraFar){
            camera.far = newCameraFar;
        }
        var addVector = new THREE.Vector3(0, 0, 0);
        addVector.addVectors(boundingBox.min, boundingBox.max);
        var center = addVector.multiplyScalar(0.5);
        controls.setCenter(center);
        if(modelRotation){
           camera.position.z = modelRotation.position.z;
           camera.position.y =  modelRotation.position.y;
           camera.position.x = modelRotation.position.x;
           camera.fov = modelRotation.fov;
           if(modelRotation.results){
               for(var i=0; i< modelRotation.results.length; i++){
                      var result =  modelRotation.results[i];
                      var textResultMesh = new THREE.ResultTextObject3d(camera, container.dom, {value:result.resultValue, color: editor.options.resultTextColor});
                      textResultMesh.name = "result-" + result.resultValue + result.position.x + result.position.y + result.position.z;
                      textResultMesh.quaternion = camera.quaternion;
                      var textResultPosition = new THREE.Vector3(0, 0, 0);
                      textResultPosition.x = result.position.x;
                      textResultPosition.y = result.position.y;
                      textResultPosition.z = result.position.z;
                      textResultMesh.position.copy( textResultPosition );
                      var key  = result.resultValue + result.position.x + result.position.y + result.position.z;
                      textResults[key] = textResultMesh;
                      textResultMesh.update();
                      sceneHelpers.add(textResultMesh);

                      var selectedResultPoint = new THREE.NearestPointObject3d(camera, container.dom, {material: {color: editor.options.resultPointColor}, size:editor.options.resultPointSize});
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



        var boundLength = subVector.length();
        scope.scaleTools = boundLength * 0.1;

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

    signals.printScreen.add(function (url) {

        var urlRenderer = THREEx.Screenshot.toDataURL(renderer);
    });

    signals.objectAdded.add(function (object) {

        var materialsNeedUpdate = false;

        object.traverse(function (child) {

            if (child instanceof THREE.Light){
                materialsNeedUpdate = true;
            }
            if(child.userData){
                if (child.userData.quaternion==="camera"){
                    child.quaternion.copy(camera.quaternion);
                    unRotatedObjects.push(child);
                }
            }


            objects.push(child);

        });

        if (materialsNeedUpdate === true){
            updateMaterials();
        }

    });

    signals.objectChanged.add(function (object) {
        if (object !== camera) {


            if (editor.helpers[ object.id ] !== undefined) {

                editor.helpers[ object.id ].update();

            }

            updateInfo();

        }

        render();

    });

    signals.objectRemoved.add(function (object) {

        var materialsNeedUpdate = false;

        object.traverse(function (child) {

            if (child instanceof THREE.Light){
                materialsNeedUpdate = true;
            }

            objects.splice(objects.indexOf(child), 1);

        });

        if (materialsNeedUpdate === true){
             updateMaterials();
        }

    });


    signals.objectsRemoved.add(function (objsToRemove) {

        var materialsNeedUpdate = false;
         for ( i = objsToRemove.length - 1; i >= 0 ; i -- ) {
              obj = objsToRemove[ i ];
              objects.splice(objects.indexOf(obj), 1);
         }


        if (materialsNeedUpdate === true){
            updateMaterials();
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


    signals.clearColorChanged.add(function (color) {

        renderer.setClearColor(color);
        render();

        clearColor = color;

    });

    signals.windowResize.add(function () {

        camera.aspect = container.dom.offsetWidth / container.dom.offsetHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(container.dom.offsetWidth, container.dom.offsetHeight);

        render();

    });

    var renderer;

    if (System.support.webgl === true) {

        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer : true  });

    } else {

        renderer = new THREE.CanvasRenderer();

    }

    renderer.setClearColor(clearColor);
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

                        node.material.materials[ i ].needsUpdate = true;

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
        if(editor.lastModel && ROTATE){
            editor.lastModel.rotation.z -= 0.005;
            render();
        }
    }

    function render() {

        sceneHelpers.updateMatrixWorld();
        scene.updateMatrixWorld();
        sceneAxis.updateMatrixWorld();

        renderer.clear();
        renderer.render(scene, camera);
        renderer.render(sceneHelpers, camera);
        renderer2.render(sceneAxis, camera2);


    }

    return {mainContainer: container, slaveContainer: container2};

};
