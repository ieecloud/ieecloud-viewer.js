"use strict";

THREE.ProtractorMaterial = function (parameters) {

    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;

    this.setValues(parameters);

}

THREE.ProtractorMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);

THREE.ProtractorDivisionMaterial = function (parameters) {

    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;

    this.oldColor = this.color.clone();
    this.oldOpacity = this.opacity;

    this.highlight = function( highlighted ) {

        if ( highlighted ) {

            this.color.setRGB( 139,0,0 );
            this.opacity = 1;

        } else {
            this.color.setRGB( this.oldColor );
            this.opacity = this.oldOpacity;

        }

    };

    this.setValues(parameters);

}

THREE.ProtractorDivisionMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);

THREE.ProtractorModes = {VERTICAL:"protractorV", HORIZONTAL:"protractorH"};

THREE.Protractor = function (camera, domElement, mode, highlighterProtractor) {
    var worldPosition = new THREE.Vector3();
    var camPosition = new THREE.Vector3();
    var worldRotation = new THREE.Euler(0, 0, 1);
    var camRotation = new THREE.Euler();
    var distance;
    var radius;
    var me = this;
    me.DIVISION_STEP = Math.PI/12;
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var delimiters = [];
    var INTERSECTED = {};
    var reRenderProtractor = { type: "reRenderProtractor" };
    var mouseDownEvent = { type: "mouseDown" };
    var disableMainMove = { type: "disableMainMove" };
    var enableMainMove = { type: "enableMainMove" };
    var highlightEvent = { type: "highlightEvent" };




    this.mode = mode;


    var createTextCanvas = function (text, color, font, size, backColor) {

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



    var createText2D = function (text, color, font, size, camera) {

        var canvas = createTextCanvas(text, color, font, 256);

        var plane = new THREE.PlaneBufferGeometry (canvas.width / canvas.height * size, size);
        var tex = new THREE.Texture(canvas);

        tex.needsUpdate = true;

        var planeMat = new THREE.MeshBasicMaterial({
            map: tex,
            color: 0xffffff,
            transparent: true
        });

        var mesh = new THREE.Mesh(plane, planeMat);
        mesh.material.depthTest = false;
        if (camera)
            mesh.quaternion = camera.quaternion;

        return mesh;

    }


    this.buildProtractorDivisions = function(container, sign){
        for (var angle = 0; angle < 2*Math.PI - me.DIVISION_STEP; angle= angle + me.DIVISION_STEP) {
              this.buildProtractorDivision(container, angle, sign);
        }
    }

    this.buildProtractorDivision = function(container, angle, sign){
        var radius = 2.9;
        var position = new THREE.Vector3(radius*Math.cos(angle) , radius*Math.sin(angle), 0);

        var degree = Math.round(THREE.Math.radToDeg(angle));

        var material = new THREE.LineBasicMaterial({
           color: 0x000000, depthTest:false, linewidth: 50
        });

        var geometry = new THREE.Geometry();
        geometry.vertices.push(
           new THREE.Vector3(3*Math.cos(angle) , 3*Math.sin(angle), 0 ),
           new THREE.Vector3(2.7*Math.cos(angle) , 2.7*Math.sin(angle), 0 )
        );

        var delimiter = new THREE.Line( geometry, material );

        me.userData.totalObjVertices.push(new THREE.Vector3(3*Math.cos(angle), 0, 3*Math.sin(angle) ));

       container.add(delimiter)

         var textResultMesh = createText2D(degree, "black", null, 0.3);
         var zAxis = new THREE.Vector3(0, 0, 1);
         if(sign > 0){
              rotateAroundObjectAxis(textResultMesh, zAxis,  angle - Math.PI / 2);
         }else{
              rotateAroundObjectAxis(textResultMesh, zAxis, -angle + Math.PI / 2+ Math.PI / 2+ Math.PI / 2);
         }


        var radius = 2.5;
        var position = new THREE.Vector3(radius*Math.cos(sign*angle) , radius*Math.sin(sign*angle), 0);
        textResultMesh.position.copy(position);
        container.add(textResultMesh);
    }

    var boundingBox = function(obj) {
        var me = this;
        if (obj instanceof THREE.Mesh) {

            var geometry = obj.geometry;
            geometry.computeBoundingBox();
            return  geometry.boundingBox;

        }

        if (obj instanceof THREE.Object3D) {

            var bb = new THREE.Box3();
            for (var i=0;i < obj.children.length;i++) {
                bb.union(me.boundingBox(obj.children[i]));
            }
            return bb;
        }
    }

    var rotObjectMatrix;
    var rotateAroundObjectAxis = function(object, axis, radians) {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    }

    var boundingBox = function(obj) {
        var me = this;
        if (obj instanceof THREE.Mesh) {

            var geometry = obj.geometry;
            geometry.computeBoundingBox();
            return  geometry.boundingBox;

        }

        if (obj instanceof THREE.Object3D) {

            var bb = new THREE.Box3();
            for (var i=0;i < obj.children.length;i++) {
                bb.union(me.boundingBox(obj.children[i]));
            }
            return bb;
        }
    }



    this.init = function () {

        THREE.Object3D.call(this);

        this.userData.totalObjVertices = [];
        this.frontSide = new THREE.Object3D();

        var geometry = new THREE.RingGeometry( 1.8, 3, 100, 100, 0, Math.PI * 2 );
        var material = new THREE.ProtractorMaterial( {color: 0xffff00,  transparent: true,  opacity: 0.5} );
        this.protractorMeshFront = new THREE.Mesh( geometry, material );




        this.frontSide.add( this.protractorMeshFront );
        this.buildProtractorDivisions(this.frontSide, 1)





        var xAxis = new THREE.Vector3(1, 0, 0);
        rotateAroundObjectAxis(this.frontSide, xAxis, Math.PI/2 );


        this.backSide = new THREE.Object3D();

        var geometry = new THREE.RingGeometry( 1.8, 3, 100, 100, 0, Math.PI * 2 );
        var material = new THREE.ProtractorMaterial( {color: 0xffff00,  transparent: true,  opacity: 0.5} );
        this.protractorMeshBack = new THREE.Mesh( geometry, material );
        this.backSide.add( this.protractorMeshBack );
        this.buildProtractorDivisions(this.backSide, -1)

        var xAxis = new THREE.Vector3(1, 0, 0);
        rotateAroundObjectAxis(this.backSide, xAxis, -Math.PI/2 );

        this.add(this.frontSide);
        this.add(this.backSide);
        if(me.mode === THREE.ProtractorModes.HORIZONTAL){
            rotateAroundObjectAxis(me, xAxis, -Math.PI/2 );
        }

        this.userData.pointsTable =  {"maxR" : 0.0,"minR" : 0.0,"tableSize" : 25,"table" : [[0],[1],[2],[3],[4],[5],[6],[7],[8],[9],[10],[11],[12],[13],[14],[15], [16],  [17], [18], [19],
        [20], [21], [22], [23], [0]]};

        var tempMatrix = new THREE.Matrix4();
        worldPosition.setFromMatrixPosition(this.matrixWorld);
        worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(this.matrixWorld));

        camera.updateMatrixWorld();
        camPosition.setFromMatrixPosition(camera.matrixWorld);
        camRotation.setFromRotationMatrix(tempMatrix.extractRotation(camera.matrixWorld));

        distance = worldPosition.distanceTo(camPosition);

        var boundingBox = new THREE.Box3().setFromObject( this );
        var subVector = new THREE.Vector3(0, 0, 0);
        subVector.subVectors(boundingBox.min, boundingBox.max);

        var height = subVector.length();
        radius = height / 2;

        this.hide = function () {
          document.removeEventListener('mousemove', onMouseMove);
          document.removeEventListener('mousedown', onMouseDown);
          me.dispatchEvent(enableMainMove);
          me.visible = false;
        }

        this.show = function () {
           domElement.addEventListener( "mousemove", onMouseMove, false );
           domElement.addEventListener( "mousedown", onMouseDown, false );
           me.dispatchEvent(disableMainMove);
           me.visible = true;
           this.update();
        }



        var onMouseDown = function( event ) {
          if(!me.visible){
              return;
          }
          event.preventDefault();

          var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;
          if(!highlighterProtractor.visible){
             return;
          }

          var intersects = getIntersects(pointer, me);

          if ( intersects.length > 0 ) {
             if(highlighterProtractor.visible){
                 var mouseDownEvent = { type: "mouseDown" , angle: highlighterProtractor.userData.angle};
                 me.dispatchEvent(mouseDownEvent);
             }
          }
        }

        var onMouseMove = function( event ) {
          if(!me.visible){
              return;
          }
          event.preventDefault();

          var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

          var intersects = getIntersects( pointer, me);
          if(intersects.length > 0){
              highlightEvent.intersects = intersects;
              me.dispatchEvent(highlightEvent);
          }else {
              highlightEvent.intersects = null;
              me.dispatchEvent(highlightEvent);
          }
        }

         var getIntersects = function ( event, object ) {
            var point  = new THREE.Vector2();
            var array = getMousePosition(domElement, event.clientX, event.clientY);

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

    }


     this.setMode = function (mode) {
        this.mode = mode;
     }


     this.getDirectionNorm = function(  ) {
         var result = new THREE.Vector3();
         var quaternion = new THREE.Quaternion();

         me.getWorldQuaternion( quaternion );

         result.set( 1, 0, 0).applyQuaternion( quaternion );
         var directionNorm = result.normalize().multiplyScalar(1)
        return   directionNorm;
      }



     this.update = function () {

        var vFOV = camera.fov * Math.PI / 180;
        var height = 2 * Math.tan( vFOV / 2 ) * distance;
        var fraction = radius / height;
        var heightInPixels = 1000 * fraction;
        var scaleFactorH = 1000/heightInPixels;
        this.scale.x = scaleFactorH * 0.4
        this.scale.z = scaleFactorH * 0.4
    }

    this.init();

}

THREE.Protractor.prototype = Object.create(THREE.Object3D.prototype);