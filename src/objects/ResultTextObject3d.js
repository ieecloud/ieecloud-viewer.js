"use strict";

THREE.ResultTextObject3dMaterial = function (parameters) {

    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;
    this.side = THREE.DoubleSide;

    this.setValues(parameters);

};

THREE.ResultTextObject3dMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);

THREE.ResultTextObject3d = function (camera, params) {
    var worldPosition = new THREE.Vector3();
    var camPosition = new THREE.Vector3();
    var worldRotation = new THREE.Euler(0, 0, 1);
    var camRotation = new THREE.Euler();
    var distance;
    var radius;
    var me = this;

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


    this.show = function () {
        this.visible = true;
        this.update();
    };


    this.hide = function () {
        this.visible = false;
    };


    this.init = function () {


        var size = 0.5;
        var canvas = createTextCanvas(params.value, params.color, null, 256);


        var plane = new THREE.PlaneBufferGeometry(canvas.width / canvas.height * size, size);
        var tex = new THREE.Texture(canvas);

        tex.needsUpdate = true;

        var planeMat = new THREE.ResultTextObject3dMaterial({
            map: tex,
            color: 0xffffff
        });

        plane.applyMatrix(new THREE.Matrix4().makeTranslation(-plane.attributes.position.array[0] + 0.1, 0, 0));

        THREE.Mesh.call(this, plane, planeMat);
        this.quaternion.copy(camera.quaternion);


        var tempMatrix = new THREE.Matrix4();
        worldPosition.setFromMatrixPosition(this.matrixWorld);
        worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(this.matrixWorld));

        camera.updateMatrixWorld();
        camPosition.setFromMatrixPosition(camera.matrixWorld);
        camRotation.setFromRotationMatrix(tempMatrix.extractRotation(camera.matrixWorld));

        distance = worldPosition.distanceTo(camPosition);

        var boundingBox = new THREE.Box3().setFromObject(this);
        var subVector = new THREE.Vector3(0, 0, 0);
        subVector.subVectors(boundingBox.min, boundingBox.max);

        var height = subVector.length();
        radius = height / 2;
    };

    this.leftCorner = function () {
        return this.children[0].geometry.vertices[0].x * this.scale.y;
    };

    this.update = function (domElement){
        var vFOV = camera.fov * Math.PI / 180;
        var height = 2 * Math.tan(vFOV / 2) * distance;
        var fraction = 0.5 / height;
        var heightInPixels = domElement.offsetHeight * fraction;
        var scaleFactorH = 598 / heightInPixels;
        this.scale.x = scaleFactorH * 0.05;
        this.scale.y = scaleFactorH * 0.05;
        this.quaternion.copy(camera.quaternion);
    };

    this.init();

};

THREE.ResultTextObject3d.prototype = Object.create(THREE.Mesh.prototype);