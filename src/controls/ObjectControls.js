THREE.ObjectControls = function (editorId, domElement) {
    // http://projects.defmech.com/ThreeJSObjectRotationWithQuaternion/
    // https://stackoverflow.com/questions/23223431/how-to-rotate-object-in-three-jsr66-not-use-trackball-which-is-control-the-cam?rq=1
    domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;
    this.editorId = editorId;
    this.direction = "upZ";

    // internals

    var scope = this;
    var vector = new THREE.Vector3();
    var mouseDown = false;
    var moveReleaseTimeDelta = 50;

    var deltaX = 0,
        deltaY = 0;

    var STATE = {NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2};


    scope.center = new THREE.Vector3();
    var normalMatrix = new THREE.Matrix3();
    var pointer = new THREE.Vector2();
    var pointerOld = new THREE.Vector2();
    var onMouseUpPosition = new THREE.Vector2();
    var onMouseDownPosition = new THREE.Vector2();

    scope.rotateStartPoint = new THREE.Vector3(1.5, 0, 1);
    var rotateEndPoint = new THREE.Vector3(1.5, 0, 1);

    // events

    var changeEvent = {type: 'change', distance: 0};
    var zoomEvent = {type: 'zoom', distance: 0};

    var rotationSpeed = 10;
    var curQuaternion;

    var startPoint = {
        x: 0,
        y: 0
    };

    var lastMoveTimestamp = 50;

    scope.state = STATE.NONE;

    this.updateEvent = function () {

        changeEvent.distance = 0;

    };

    this.setDisabled = function () {

        scope.enabled = false;
        scope.state = STATE.NONE;
        domElement.removeEventListener('mousemove', onMouseMove, false);
        domElement.removeEventListener('mouseup', onMouseUp, false);
        domElement.removeEventListener('mouseout', onMouseUp, false);

    };

    this.setEnabled = function () {

        scope.enabled = true;

    };

    this.focus = function (target) {

        // scope.center.setFromMatrixPosition(target.matrixWorld);
        // object.lookAt(scope.center);
        //
        // scope.dispatchEvent(changeEvent);

    };

    this.pan = function (distance) {
        // this.updateEvent();
        // normalMatrix.getNormalMatrix(object.matrix);
        // distance.applyMatrix3(normalMatrix);
        // distance.multiplyScalar(vector.copy(scope.center).sub(object.position).length() * 0.00007 * object.fov);
        //
        // object.position.add(distance);
        // scope.center.add(distance);
        //
        // scope.dispatchEvent(changeEvent);

    };

    this.zoom = function (distance) {
        // this.updateEvent();
        // changeEvent.distance = distance;
        // scope.dispatchEvent(changeEvent);

    };


    this.rotateUpZAxis = function (delta) {
        handleRotation();
        scope.dispatchEvent(changeEvent);

    };


    this.rotate = this.rotateUpZAxis;

    // mouse

    function onMouseDown(event) {

        if (scope.enabled === false){
            return;
        }

        event.preventDefault();
        if (event.which == 2) {
            scope.state = STATE.NONE;
            return;
        }
        if (event.button === 0) {

            scope.state = STATE.ROTATE;

        } else if (event.button === 1) {

            scope.state = STATE.ZOOM;

        } else if (event.button === 2) {

            scope.state = STATE.PAN;

        }

        pointerOld.set(event.clientX, event.clientY);
        mouseDown = true;

        startPoint = {
            x: event.clientX,
            y: event.clientY
        };

        scope.rotateStartPoint = rotateEndPoint = projectOnTrackball(0, 0);



        var rect = domElement.getBoundingClientRect();
        //
        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        onMouseDownPosition.set(x, y);


        domElement.addEventListener('mousemove', onMouseMove, false);
        domElement.addEventListener('mouseup', onMouseUp, false);
        domElement.addEventListener('mouseout', onMouseUp, false);

    }

    function onMouseMove(event) {
        if (scope.enabled === false || scope.state.NONE) {
            return false;
        }

        event.preventDefault();

        var rect = domElement.getBoundingClientRect();

        var x = (event.clientX - rect.left) / rect.width;
        var y = (event.clientY - rect.top) / rect.height;
        var vector = new THREE.Vector2(x, y);

        if (onMouseDownPosition.distanceTo(vector) < 0.007) {
            return false;
        }



        deltaX = event.x - startPoint.x;
        deltaY = event.y - startPoint.y;



        startPoint.x = event.x;
        startPoint.y = event.y;

        lastMoveTimestamp = new Date();


        // pointer.set(event.clientX, event.clientY);

        var movementX = pointer.x - pointerOld.x;
        var movementY = pointer.y - pointerOld.y;

        if (scope.state === STATE.ROTATE) {
            var rotationVector = new THREE.Vector3(movementX * 0.005, 0, -movementY * 0.005);
            if (scope.direction == "upY") {
                rotationVector = new THREE.Vector3(-movementX * 0.005, -movementY * 0.005, 0);
            }
            scope.rotate(rotationVector);



        } else if (scope.state === STATE.ZOOM) {

            scope.zoom(movementY);

        } else if (scope.state === STATE.PAN) {

            scope.pan(new THREE.Vector3(-movementX, movementY, 0));

        }

        pointerOld.set(event.clientX, event.clientY);


    }

    function onMouseUp(event) {

        if (scope.enabled === false) return;



        if (new Date().getTime() - lastMoveTimestamp.getTime() > moveReleaseTimeDelta)
        {
            deltaX = event.x - startPoint.x;
            deltaY = event.y - startPoint.y;
        }

        mouseDown = false;

        domElement.removeEventListener('mousemove', onMouseMove, false);
        domElement.removeEventListener('mouseup', onMouseUp, false);

        // domElement.removeEventListener('mousemove', onMouseMove, false);
        // domElement.removeEventListener('mouseup', onMouseUp, false);
        domElement.removeEventListener('mouseout', onMouseUp, false);




        scope.state = STATE.NONE;
    }

    function onMouseWheel(event) {


        // if (event && (event.ctrlKey || event.metaKey)) {


        event.preventDefault();
        var delta = 0;

        if (event.wheelDelta) {

            delta = event.wheelDelta / 4;

        } else if (event.detail) {

            delta = -event.detail / 30;

        }

        zoomEvent.distance = delta;
        scope.dispatchEvent(zoomEvent);
        // }
    }

    domElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);
    domElement.addEventListener('mousedown', onMouseDown, false);
    domElement.addEventListener('mousewheel', onMouseWheel, false);
    domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

    // touch

    var touch = new THREE.Vector3();

    var touches = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
    var prevTouches = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];

    var prevDistance = null;

    function touchStart(event) {

        if (scope.enabled === false) return;

        switch (event.touches.length) {

            case 1:
                if (scope.direction == "upZ") {
                    touches[0].set(-event.touches[0].pageX, 0, event.touches[0].pageY);
                    touches[1].set(-event.touches[0].pageX, 0, event.touches[0].pageY);
                } else {
                    touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);
                    touches[1].set(event.touches[0].pageX, event.touches[0].pageY, 0);
                }

                break;

            case 2:
                touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);
                touches[1].set(event.touches[1].pageX, event.touches[1].pageY, 0);
                prevDistance = touches[0].distanceTo(touches[1]);
                break;

        }

        prevTouches[0].copy(touches[0]);
        prevTouches[1].copy(touches[1]);

    }


    this.handleUpdate = function handleUpdate()
    {
        if (!mouseDown)
        {
            var drag = 0.95;
            var minDelta = 0.05;

            if (deltaX < -minDelta || deltaX > minDelta)
            {
                deltaX *= drag;
            }
            else
            {
                deltaX = 0;
            }

            if (deltaY < -minDelta || deltaY > minDelta)
            {
                deltaY *= drag;
            }
            else
            {
                deltaY = 0;
            }

            handleRotation();
        }
    };

    function handleRotation()
    {
        console.log("SDSDSDhandleRotation");
        rotateEndPoint = projectOnTrackball(deltaX, deltaY);

        console.log("rotateStartPoint" , scope.rotateStartPoint)
        console.log("rotateEndPoint", rotateEndPoint)

        var rotateQuaternion = rotateMatrix(scope.rotateStartPoint, rotateEndPoint);
        curQuaternion = scope.object.quaternion;
        curQuaternion.multiplyQuaternions(rotateQuaternion, curQuaternion);
        curQuaternion.normalize();
        scope.object.setRotationFromQuaternion(curQuaternion);

        rotateEndPoint = scope.rotateStartPoint;
    }

    function projectOnTrackball(touchX, touchY)
    {
        var mouseOnBall = new THREE.Vector3();

        var rect = domElement.getBoundingClientRect();

        // mouseOnBall.set(
        //     clamp(touchX / rect.width, -1, 1), clamp(-touchY / rect.height, -1, 1),
        //     0.0
        // );

        mouseOnBall.set(
            clamp(-touchX / rect.width, -1, 1),  0.0,
            clamp(touchY / rect.height, -1, 1)
        );
        console.log("projectOnTrackball", mouseOnBall);

        var length = mouseOnBall.length();

        if (length > 1.0)
        {
            mouseOnBall.normalize();
        }
        else
        {
            mouseOnBall.y = Math.sqrt(1.0 - length * length);

        }

        mouseOnBall.x = mouseOnBall.x + 1.5;
        // mouseOnBall.y = mouseOnBall.y + scope.center.y;
        // mouseOnBall.z = mouseOnBall.z + scope.center.z;

        return mouseOnBall;
    }

    function rotateMatrix(rotateStart, rotateEnd)
    {
        var axis = new THREE.Vector3(),
            quaternion = new THREE.Quaternion();

        console.log("rotateStart", rotateStart);
        console.log("rotateEnd", rotateEnd);

        var angle = Math.acos(rotateStart.dot(rotateEnd) / rotateStart.length() / rotateEnd.length());

        if (angle)
        {
            axis.crossVectors(rotateStart, rotateEnd).normalize();
            console.log("AXIS ROTATION", axis);
            console.log("CENTER", scope.center);

            // axis.x =  axis.x+ 1.5;
            // axis.y = 0;
            // axis.z = 0;

            angle *= rotationSpeed;
            quaternion.setFromAxisAngle(axis, angle);
        }
        return quaternion;
    }

    function clamp(value, min, max)
    {
        return Math.min(Math.max(value, min), max);
    }



    function touchMove(event) {

    //     if (scope.enabled === false) return;
    //
    //     event.preventDefault();
    //     event.stopPropagation();
    //
    //     var getClosest = function (touch, touches) {
    //
    //         var closest = touches[0];
    //
    //         for (var i in touches) {
    //             if (closest.distanceTo(touch) > touches[i].distanceTo(touch)) closest = touches[i];
    //         }
    //
    //         return closest;
    //
    //     }
    //
    //     switch (event.touches.length) {
    //
    //         case 1:
    //             if (scope.direction == "upZ") {
    //                 touches[0].set(-event.touches[0].pageX, 0, event.touches[0].pageY);
    //                 touches[1].set(-event.touches[0].pageX, 0, event.touches[0].pageY);
    //             } else {
    //                 touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);
    //                 touches[1].set(event.touches[0].pageX, event.touches[0].pageY, 0);
    //             }
    //             scope.rotate(touches[0].sub(getClosest(touches[0], prevTouches)).multiplyScalar(-0.005));
    //
    //             break;
    //
    //         case 2:
    //             touches[0].set(event.touches[0].pageX, event.touches[0].pageY, 0);
    //             touches[1].set(event.touches[1].pageX, event.touches[1].pageY, 0);
    //             var distance = touches[0].distanceTo(touches[1]);
    //             var delta = prevDistance - distance;
    //             scope.zoom(delta);
    //             prevDistance = distance;
    //             var offset0 = touches[0].clone().sub(getClosest(touches[0], prevTouches));
    //             var offset1 = touches[1].clone().sub(getClosest(touches[1], prevTouches));
    //             offset0.x = -offset0.x;
    //             offset1.x = -offset1.x;
    //
    //             scope.pan(offset0.add(offset1).multiplyScalar(0.5));
    //
    //             break;
    //
    //     }
    //
    //     prevTouches[0].copy(touches[0]);
    //     prevTouches[1].copy(touches[1]);
    //
    }
    //
    // domElement.addEventListener('touchstart', touchStart, false);
    // domElement.addEventListener('touchmove', touchMove, false);

};

THREE.ObjectControls.prototype = Object.create(THREE.EventDispatcher.prototype);

THREE.ObjectControls.prototype.setAxisDirection = function (direction) {
    this.direction = direction;
    if (direction == "upY") {
        this.rotate = this.rotateUpYAxis;
    } else if (direction == "upZ") {
        this.rotate = this.rotateUpZAxis;
    }

};

THREE.ObjectControls.prototype.setCenter = function (center) {
    // rotateStartPoint = this.center;
    this.center = center;
    this.rotateStartPoint = center;
    console.log("THREE.ObjectControls.prototype.rotateStartPoint", this.rotateStartPoint);
};


THREE.ObjectControls.prototype.update = function () {
    if(this.object){
        // this.handleUpdate();
    }
};

THREE.ObjectControls.prototype.setObject = function (object) {
    this.object = object;
};
