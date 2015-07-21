
THREE.EditorControls = function (editorId, object, domElement) {

    domElement = ( domElement !== undefined ) ? domElement : document;

    // API

    this.enabled = true;
    this.editorId = editorId;
    this.direction = "upZ";

    // internals

    var scope = this;
    var vector = new THREE.Vector3();

    var STATE = { NONE: -1, ROTATE: 0, ZOOM: 1, PAN: 2 };
    var state = STATE.NONE;

    scope.center = new THREE.Vector3();
    var normalMatrix = new THREE.Matrix3();
    var pointer = new THREE.Vector2();
    var pointerOld = new THREE.Vector2();

    // events

    var changeEvent = { type: 'change', distance :0};
    var zoomEvent = { type: 'zoom', distance :0};


    this.updateEvent = function () {

        changeEvent.distance = 0;

    };

    this.focus = function (target) {

        scope.center.setFromMatrixPosition(target.matrixWorld);
        object.lookAt(scope.center);

        scope.dispatchEvent(changeEvent);

    };

    this.pan = function (distance) {
        this.updateEvent();
        normalMatrix.getNormalMatrix(object.matrix);
        distance.applyMatrix3(normalMatrix);
        distance.multiplyScalar(vector.copy(scope.center).sub(object.position).length() * 0.00007 * object.fov);

        object.position.add(distance);
        scope.center.add(distance);

        scope.dispatchEvent(changeEvent);

    };

    this.zoom = function (distance) {
        this.updateEvent();
        changeEvent.distance = distance;
        scope.dispatchEvent(changeEvent);

    };


    this.rotateUpZAxis = function (delta) {
        this.updateEvent();
        vector.copy(object.position).sub(scope.center);

        var theta = Math.atan2(vector.x, vector.y);
        var phi = Math.atan2(Math.sqrt(vector.x * vector.x + vector.y * vector.y), vector.z);

        theta += delta.x;
        phi += delta.z;

        var EPS = 0.000001;

        phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

        var radius = vector.length();

        vector.x = radius * Math.sin(phi) * Math.sin(theta);
        vector.z = radius * Math.cos(phi);
        vector.y = radius * Math.sin(phi) * Math.cos(theta);

        object.position.copy(scope.center).add(vector);
        object.lookAt(scope.center);
        scope.dispatchEvent(changeEvent);

    };


    this.rotateUpYAxis = function (delta) {
        this.updateEvent();
        vector.copy(object.position).sub(scope.center);

        var theta = Math.atan2(vector.x, vector.z);
        var phi = Math.atan2(Math.sqrt(vector.x * vector.x + vector.z * vector.z), vector.y);

        theta += delta.x;
        phi += delta.y;

        var EPS = 0.000001;

        phi = Math.max(EPS, Math.min(Math.PI - EPS, phi));

        var radius = vector.length();

        vector.x = radius * Math.sin(phi) * Math.sin(theta);
        vector.y = radius * Math.cos(phi);
        vector.z = radius * Math.sin(phi) * Math.cos(theta);
        object.position.copy(scope.center).add(vector);
        object.lookAt(scope.center);

        scope.dispatchEvent(changeEvent);

    };

    this.rotate = this.rotateUpZAxis;

    // mouse

    function onMouseDown(event) {

        if (scope.enabled === false){
            return;
        }

        event.preventDefault();
        if( event.which == 2 ) {
             state = STATE.NONE;
            return;
        }
        if (event.button === 0) {

            state = STATE.ROTATE;

        } else if (event.button === 1) {

            state = STATE.ZOOM;

        } else if (event.button === 2) {

            state = STATE.PAN;

        }

        pointerOld.set(event.clientX, event.clientY);

        domElement.addEventListener('mousemove', onMouseMove, false);
        domElement.addEventListener('mouseup', onMouseUp, false);
        domElement.addEventListener('mouseout', onMouseUp, false);

    }

    function onMouseMove(event) {

        if (scope.enabled === false){
            return;
        }

        event.preventDefault();

        pointer.set(event.clientX, event.clientY);

        var movementX = pointer.x - pointerOld.x;
        var movementY = pointer.y - pointerOld.y;

        if (state === STATE.ROTATE) {
            var rotationVector = new THREE.Vector3(movementX * 0.005, 0, -movementY * 0.005);
            if (scope.direction == "upY") {
                rotationVector = new THREE.Vector3(-movementX * 0.005, -movementY * 0.005, 0);
            }
            scope.rotate(rotationVector);

        } else if (state === STATE.ZOOM) {

            scope.zoom(movementY);

        } else if (state === STATE.PAN) {

            scope.pan(new THREE.Vector3(-movementX, movementY, 0));

        }

        pointerOld.set(event.clientX, event.clientY);

    }

    function onMouseUp(event) {

        if (scope.enabled === false) return;

        domElement.removeEventListener('mousemove', onMouseMove, false);
        domElement.removeEventListener('mouseup', onMouseUp, false);
        domElement.removeEventListener('mouseout', onMouseUp, false);

        state = STATE.NONE;

    }

    function onMouseWheel(event) {

        event.preventDefault();
        var delta = 0;

        if (event.wheelDelta) {

            delta = event.wheelDelta/40;

        } else if (event.detail) {

            delta = -event.detail /3;

        }

       zoomEvent.distance = delta;
       scope.dispatchEvent(zoomEvent);

    }

    domElement.addEventListener('contextmenu', function (event) {
        event.preventDefault();
    }, false);
    domElement.addEventListener('mousedown', onMouseDown, false);
    domElement.addEventListener('mousewheel', onMouseWheel, false);
    domElement.addEventListener('DOMMouseScroll', onMouseWheel, false); // firefox

    // touch

    var touch = new THREE.Vector3();

    var touches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];
    var prevTouches = [ new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3() ];

    var prevDistance = null;

    function touchStart(event) {

        if (scope.enabled === false) return;

        switch (event.touches.length) {

            case 1:
             if (scope.direction == "upZ") {
                  touches[ 0 ].set(-event.touches[ 0 ].pageX, 0 ,event.touches[ 0 ].pageY);
                  touches[ 1 ].set(-event.touches[ 0 ].pageX, 0, event.touches[ 0 ].pageY);
             }else{
                  touches[ 0 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
                  touches[ 1 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
             }

                break;

            case 2:
                touches[ 0 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
                touches[ 1 ].set(event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0);
                prevDistance = touches[ 0 ].distanceTo(touches[ 1 ]);
                break;

        }

        prevTouches[ 0 ].copy(touches[ 0 ]);
        prevTouches[ 1 ].copy(touches[ 1 ]);

    }


    function touchMove(event) {

        if (scope.enabled === false) return;

        event.preventDefault();
        event.stopPropagation();

        var getClosest = function (touch, touches) {

            var closest = touches[ 0 ];

            for (var i in touches) {
                if (closest.distanceTo(touch) > touches[ i ].distanceTo(touch)) closest = touches[ i ];
            }

            return closest;

        }

        switch (event.touches.length) {

            case 1:
                 if (scope.direction == "upZ") {
                       touches[ 0 ].set(-event.touches[ 0 ].pageX, 0, event.touches[ 0 ].pageY);
                       touches[ 1 ].set(-event.touches[ 0 ].pageX, 0, event.touches[ 0 ].pageY);
                 }else{
                       touches[ 0 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
                       touches[ 1 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
                 }
                scope.rotate(touches[ 0 ].sub(getClosest(touches[ 0 ], prevTouches)).multiplyScalar(-0.005));

                break;

            case 2:
                touches[ 0 ].set(event.touches[ 0 ].pageX, event.touches[ 0 ].pageY, 0);
                touches[ 1 ].set(event.touches[ 1 ].pageX, event.touches[ 1 ].pageY, 0);
                var distance = touches[ 0 ].distanceTo(touches[ 1 ]);
                var delta = prevDistance - distance;
                scope.zoom(delta);
                prevDistance = distance;
                var offset0 = touches[ 0 ].clone().sub(getClosest(touches[ 0 ], prevTouches));
                var offset1 = touches[ 1 ].clone().sub(getClosest(touches[ 1 ], prevTouches));
                offset0.x = -offset0.x;
                offset1.x = -offset1.x;

                scope.pan(offset0.add(offset1).multiplyScalar(0.5));

                break;

        }

        prevTouches[ 0 ].copy(touches[ 0 ]);
        prevTouches[ 1 ].copy(touches[ 1 ]);

    }

    domElement.addEventListener('touchstart', touchStart, false);
    domElement.addEventListener('touchmove', touchMove, false);

};

THREE.EditorControls.prototype = Object.create(THREE.EventDispatcher.prototype);

THREE.EditorControls.prototype.setAxisDirection = function (direction) {
    this.direction = direction;
    if (direction == "upY") {
        this.rotate = this.rotateUpYAxis;
    } else if (direction == "upZ") {
        this.rotate = this.rotateUpZAxis;
    }

};

THREE.EditorControls.prototype.setCenter = function (center) {
    this.center = center;
};
