"use strict";

THREE.ToolsGizmoMaterial = function (parameters) {

    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;

    this.setValues(parameters);

};

THREE.ToolsGizmoMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);


THREE.ToolsGizmoDivisionMaterial = function (parameters) {

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

};

THREE.ToolsGizmoDivisionMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);

THREE.ToolsGizmo = function (camera, domElement, plane, nearestPoint, highlighter, scene) {
    var worldPosition = new THREE.Vector3();
    var camPosition = new THREE.Vector3();
    var worldRotation = new THREE.Euler(0, 0, 1);
    var camRotation = new THREE.Euler();
    var distance;
    var radius;
    var me = this;
    me.INTERSECTED = {};
    var SELECTED;
    var onMouseDownPosition = new THREE.Vector2();
    var onMouseUpPosition = new THREE.Vector2();
    var INTERSECTED;
    var INTERSECTED_DELIMITER;
    var raycaster = new THREE.Raycaster();
    var mouse = new THREE.Vector2();
    var searchNearest = { type: "searchNearest" };
    var select3dPoint = { type: "select3dPoint" };
    var disableMainControl = { type: "disableMainControl" };
    var enableMainControl = { type: "enableMainControl" };
    var disableMainMove = { type: "disableMainMove" };
    var enableMainMove = { type: "enableMainMove" };
    var changeEvent = { type: "change" };
    var offset = new THREE.Vector3();
    me.RULER_SIZE = 15;
    me.RULER_INNER_LIMIT = 2.1;
    me.RULER_HALF_LIMIT = 9;

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

    };



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
        if (camera){
            mesh.quaternion = camera.quaternion;
        }
        return mesh;

    }

    var createAndAddRulerDelimiter = function(numberText, yPos, container, sign, additional){
        var material = new THREE.LineBasicMaterial({
            color: 0x000000, /*depthTest:false, */linewidth: 50
        });

        var geometry = new THREE.Geometry();

        var vertices = [new THREE.Vector3(0, 0, 0 ), new THREE.Vector3(0, 0, -0.4 )];
        for (var i = 0; i < vertices.length; i++) {
             geometry.vertices.push(vertices[i] );
        }


        var delimiter = new THREE.Line( geometry, material );


        var pos = new THREE.Vector3(yPos, 0, 0);
        delimiter.position.copy(pos);


        me.userData.totalObjVertices.push(new THREE.Vector3(yPos, 0, 0 ));

        delimiter.userData = {};
        delimiter.userData.index = numberText;
        delimiter.userData.defaultTopVertices = new THREE.Vector3(yPos, 0, 0 );
        delimiter.userData.additional = additional;
        delimiter.userData.half = additional ? (numberText*10)%5 === 0: false;
        delimiter.userData.bigger = !additional ? numberText%5 === 0: false;
        delimiter.userData.biggest = !additional ? numberText%10 === 0: false;
        me.delimiters[sign*numberText] = delimiter;
        delimiter.chief = container;
        container.add( delimiter );


       var textResultMesh = createText2D(numberText, "black", null, 0.4);
       var xAxis = new THREE.Vector3(1, 0, 0);
       if(sign > 0){
          rotateAroundObjectAxis(textResultMesh, xAxis, sign*Math.PI / 2);
       }else{
          rotateAroundObjectAxis(textResultMesh, xAxis,  sign*Math.PI/2);
          var zAxis = new THREE.Vector3(0, 0, 1);
          rotateAroundObjectAxis(textResultMesh, zAxis,  sign*Math.PI);
       }

       var textResultPosition = new THREE.Vector3(0, 0, 0);
       textResultPosition.x =   yPos;
       textResultPosition.z = - 0.6;
       textResultMesh.position.copy(textResultPosition);
       textResultMesh.userData = {};
       textResultMesh.userData.defaultTopVertices = textResultPosition;
       textResultMesh.userData.additional = additional;
       textResultMesh.userData.half = additional ? (numberText*10)%5 === 0: false;
       textResultMesh.userData.bigger = !additional ? numberText%5 === 0: false;
       textResultMesh.userData.biggest = !additional ? numberText%10 === 0: false;
       textResultMesh.chief = container;
       me.textResults[sign*numberText] = textResultMesh;
       container.add(textResultMesh);
    };

    this.createRulerSide = function(container, maxSizeDelimiters, step, digits, scaleFactorW, revertOrder){

         var number = -1;
         for (var i=0; i<= maxSizeDelimiters; i+=step) {
             number++;
             createAndAddRulerDelimiter(i.round(digits), (i/scaleFactorW), container,  revertOrder ? -1 : 1);
             if(!revertOrder){
                 this.userData.pointsTable.table.push([number]);
                 this.userData.valueTable.push((step*number).round(digits));
             }

         }

         if(!revertOrder){
             this.userData.pointsTable.tableSize = this.userData.pointsTable.table.length;
         }
    };

    var rotObjectMatrix;
    var rotateAroundObjectAxis = function(object, axis, radians) {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    };

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

        this.frontSide = new THREE.Object3D();
        this.userData.totalObjVertices = [];
        this.userData.delimitersToRemove = [];
        var geometry = new THREE.PlaneBufferGeometry (me.RULER_SIZE, 2, 10);
        var material = new THREE.ToolsGizmoMaterial( {color: 0xffff00,  transparent: true,  opacity: 0.5} );
        geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-geometry.attributes.position.array[0], -geometry.attributes.position.array[1], geometry.attributes.position.array[2]));
        this.rulerMeshFront = new THREE.Mesh( geometry, material );

        var xAxis = new THREE.Vector3(1, 0, 0);
        rotateAroundObjectAxis(this.rulerMeshFront, xAxis, Math.PI/2 );



        this.frontSide.add( this.rulerMeshFront );

        this.userData.pointsTable =  {"maxR" : 0.0,"minR" : 0.0,"tableSize" : 0,"table" : []};
        this.userData.valueTable=[];
        this.userData.removedDelimiters =[];

        this.backSide = new THREE.Object3D();

        geometry = new THREE.PlaneBufferGeometry (me.RULER_SIZE, 2, 10);
        material = new THREE.ToolsGizmoMaterial( {color: 0xffff00,  transparent: true,  opacity: 0.5} );
         geometry.applyMatrix(new THREE.Matrix4().makeTranslation(-geometry.attributes.position.array[0], geometry.attributes.position.array[1], geometry.attributes.position.array[2]));
        var rulerMesh = new THREE.Mesh( geometry, material );
        var xAxis = new THREE.Vector3(1, 0, 0);
        rotateAroundObjectAxis(rulerMesh, xAxis, -Math.PI/2 );
        this.backSide.add( rulerMesh );



        this.add(this.frontSide);
        this.add(this.backSide);
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
        radius = 7.76;

        this.userData.rotateVSign = -1;
        this.userData.rotateSinSign = 1;

        this.userData.rotateHAngle = 0;
        this.userData.rotateVAngle = 0;
    }

    this.getLeftCornerVerticalPosition = function () {
         var geometry = this.rulerMeshFront.geometry;
         var leftCornerPosition = new THREE.Vector3(-geometry.attributes.position.array[0],-geometry.attributes.position.array[1],geometry.attributes.position.array[2] );
         leftCornerPosition.applyMatrix4(this.matrixWorld);
         return leftCornerPosition;

    }

    this.setRotateVSign = function (value) {
          this.userData.rotateVSign = value;
    }

    this.setRotateSinSign = function (value) {
          this.userData.rotateSinSign = value;
    }

    this.setRotateHAngle = function (value) {
        this.userData.rotateHAngle = value;
    }

    this.setRotateVAngle = function (value) {
        this.userData.rotateVAngle = value;
    }

    this.hide = function () {
      me.dispatchEvent(enableMainMove);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      me.visible = false;
    }

    this.show = function () {
       me.dispatchEvent(disableMainMove);
       me.visible = true;
       domElement.addEventListener( "mousemove", onMouseMove, false );
       domElement.addEventListener( "mousedown", onMouseDown, false );
       domElement.addEventListener( "mouseup", onMouseUp, false );
       this.update();
    }


    var onMouseMove = function( event ) {
       if(!me.visible){
           return;
       }
       event.preventDefault();
       event.stopPropagation();

       var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;



        if ( SELECTED ) {
           me.dispatchEvent(searchNearest);
           var intersects = getIntersects(pointer, plane);
           SELECTED.position.copy( intersects[ 0 ].point.sub( offset ) );
           changeEvent.moved = true;
           me.dispatchEvent(changeEvent);
           return;

       }

       var intersects = getIntersects(pointer, me);

       if ( intersects.length > 0 ) {
            if(!intersects[0].object.visible){
                      return;
            }

            INTERSECTED = me;
            plane.position.copy( INTERSECTED.position );
            domElement.style.cursor = 'pointer';
            changeEvent.intersects = intersects;
            me.dispatchEvent(changeEvent);

       } else {

           INTERSECTED = null;

           domElement.style.cursor = 'auto';
           me.dispatchEvent(changeEvent);

       }
    }

     this.getPointDirectionVector = function(  ) {
          var pointA = new THREE.Vector3(nearestPoint.position.x, nearestPoint.position.y, nearestPoint.position.z);
          var result = new THREE.Vector3();
          var quaternion = new THREE.Quaternion();

          me.getWorldQuaternion( quaternion );

          result.set( 1, 0, 0).applyQuaternion( quaternion );
          var directionNorm = result.normalize().multiplyScalar(1)
          var pointB = new THREE.Vector3(directionNorm.x, directionNorm.y , directionNorm.z);

           var result = pointA.clone().add(pointB);
           return   result;
     }

     this.getDirectionNorm = function(  ) {
        var result = new THREE.Vector3();
        var quaternion = new THREE.Quaternion();

        me.getWorldQuaternion( quaternion );

        result.set( 1, 0, 0).applyQuaternion( quaternion );
        var directionNorm = result.normalize().multiplyScalar(1)
       return   directionNorm;
     }

     var onMouseDown = function( event ) {
       if(!me.visible){
           return;
       }
       event.preventDefault();
       event.stopPropagation();

       var array = getMousePosition(domElement, event.clientX, event.clientY );
       onMouseDownPosition.fromArray(array);

       var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;

       var intersects = getIntersects(pointer, me);

       if ( intersects.length > 0 ) {

           me.dispatchEvent(disableMainControl);
           SELECTED = me;

           var intersects = raycaster.intersectObject( plane );
           offset.copy( intersects[ 0 ].point ).sub( plane.position );

           domElement.style.cursor = 'move';

       }

     }


     var onMouseUp = function( event ) {
       if(!me.visible){
           return;
       }
       event.preventDefault();
//       event.stopPropagation();

       var pointer = event.changedTouches ? event.changedTouches[ 0 ] : event;
        if(SELECTED){
           if(changeEvent.moved){
              SELECTED.position.copy(nearestPoint.position);
           }
           nearestPoint.hide();
           changeEvent.moved = false;
           me.dispatchEvent(changeEvent);
           var rect = domElement.getBoundingClientRect();
           var array =  getMousePosition(domElement, event.clientX, event.clientY );
           onMouseUpPosition.fromArray(array);
           if (onMouseDownPosition.distanceTo(onMouseUpPosition) === 0) {
               var pointA = new THREE.Vector3(me.position.x, me.position.y, me.position.z);
                var result = new THREE.Vector3();
                var quaternion = new THREE.Quaternion();

                me.getWorldQuaternion( quaternion );

                result.set( 1, 0, 0).applyQuaternion( quaternion );
                var directionNorm = result.normalize().multiplyScalar(highlighter.userData.value)
                var pointB = new THREE.Vector3(directionNorm.x, directionNorm.y , directionNorm.z);

                var result = pointA.clone().add(pointB);
                select3dPoint.point = result;
                me.dispatchEvent(select3dPoint);
           }
        }
        if ( INTERSECTED ) {

           plane.position.copy( me.position );

           SELECTED = null;

        }

       SELECTED = null;
       domElement.style.cursor = 'auto';
       me.dispatchEvent(enableMainControl);

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


     this.removeAllDelimiters = function () {
         for (var key in  this.delimiters) {
               this.delimiters[key].chief.remove(this.delimiters[key]);
         }

         for (var key in  this.textResults) {
               this.textResults[key].chief.remove(this.textResults[key]);
         }
         this.delimiters = null;
         this.textResults = null;
     }

     this.updateDelimiters = function (scaleFactorW) {
        var width =  scaleFactorW*this.RULER_SIZE;
        var maxSizeDelimiters = Math.floor(width);


        this.userData.totalObjVertices =[];
        this.userData.pointsTable.table = [];
        this.userData.valueTable = [];


        this.removeAllDelimiters();

        this.delimiters = {};
        this.textResults = {};
        var step = 1;
        var digits = 1;
        if(maxSizeDelimiters > 25){
           step = 5;
        }

        if(maxSizeDelimiters > 100){
           step = 10;
        }

        if(maxSizeDelimiters > 200){
           step = 20;
        }

        if(maxSizeDelimiters < 8){
            step = 0.5;
            maxSizeDelimiters = width;
        }

        if(maxSizeDelimiters < 4){
             step = 0.25;
             digits = 2;
             maxSizeDelimiters = width;
        }

        if(maxSizeDelimiters < 2){
            step = 0.1;
            digits = 1;
            maxSizeDelimiters = width;
        }

        if(width < 0.3){
            step = 0.01;
            digits = 2;
            maxSizeDelimiters = width;
        }

        if(width < 0.013){
            step = 0.001;
            digits = 3;
            maxSizeDelimiters = width;
        }

         if(width < 0.001){
            step = 0.0001;
            digits = 4;
            maxSizeDelimiters = width;
        }

        this.createRulerSide(this.frontSide, maxSizeDelimiters, step, digits, scaleFactorW, false);
        this.createRulerSide(this.backSide, maxSizeDelimiters, step, digits, scaleFactorW,  true);
     }


     this.update = function () {
        var pixW = 5;
        var pixH = 10;
        var vFOV = camera.fov * Math.PI / 180;
        var height = 2 * Math.tan( vFOV / 2 ) * distance;
        var fraction = radius / height;
        var heightInPixels = pixH * fraction;
        var scaleFactorH = pixH/heightInPixels;
        var aspect = pixW / pixH;
        var width = height * aspect;
        var fraction = radius / width;
        var widthInPixels = pixW * fraction;
        var scaleFactorW = pixW/widthInPixels;
        this.scale.x = scaleFactorW;
        this.scale.z = scaleFactorW;
        this.updateDelimiters(scaleFactorW);


    }

    this.init();

}

THREE.ToolsGizmo.prototype = Object.create(THREE.Object3D.prototype);