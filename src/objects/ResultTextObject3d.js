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
    let worldPosition = new THREE.Vector3();
    let camPosition = new THREE.Vector3();
    let worldRotation = new THREE.Euler(0, 0, 1);
    let camRotation = new THREE.Euler();
    let distance;
    let radius;
    let me = this;

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

        ctx.miterLimit = 1;
        ctx.fillStyle = color || 'black';
        ctx.strokeStyle = 'black';

        ctx.fillText(text, 0, Math.ceil(size * 0.8));


        ctx.lineWidth = 3;
        ctx.strokeText(text, 0, Math.ceil(size * 0.8));


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

        this.value = params.value;
        this.resultDigits = params.resultDigits;
        this.color = params.color;
        let size = 0.5;
        let valueToRender = this.getValueToRender();
        let canvas = createTextCanvas(valueToRender, this.color, null, 256);

        let plane = new THREE.PlaneBufferGeometry(canvas.width / canvas.height * size, size);
        let tex = new THREE.Texture(canvas);

        tex.needsUpdate = true;

        let planeMat = new THREE.ResultTextObject3dMaterial({
            map: tex,
            color: 0xffffff
        });

        plane.applyMatrix(new THREE.Matrix4().makeTranslation(-plane.attributes.position.array[0] + 0.1, 0, 0));

        THREE.Mesh.call(this, plane, planeMat);
        this.quaternion.copy(camera.quaternion);


        let tempMatrix = new THREE.Matrix4();
        worldPosition.setFromMatrixPosition(this.matrixWorld);
        worldRotation.setFromRotationMatrix(tempMatrix.extractRotation(this.matrixWorld));

        camera.updateMatrixWorld();
        camPosition.setFromMatrixPosition(camera.matrixWorld);
        camRotation.setFromRotationMatrix(tempMatrix.extractRotation(camera.matrixWorld));

        distance = worldPosition.distanceTo(camPosition);

        let boundingBox = new THREE.Box3().setFromObject(this);
        let subVector = new THREE.Vector3(0, 0, 0);
        subVector.subVectors(boundingBox.min, boundingBox.max);

        let height = subVector.length();
        radius = height / 2;
    };

    this.leftCorner = function () {
        return this.children[0].geometry.vertices[0].x * this.scale.y;
    };

    this.getValueToRender = function () {

        if (_.isString(this.value)) {
            return this.value;
        }

        if (this.resultDigits === 0) {
            return Math.floor(this.value);
        }

        return this.value && !isNaN(this.value) ? this.value.round(this.resultDigits) : 0;
    };

    this.setResultDigits = function (resultDigits) {
        this.resultDigits = resultDigits;
        let valueToRender = this.getValueToRender();
        let canvas = createTextCanvas(valueToRender, this.color, null, 256);
        let plane = new THREE.PlaneBufferGeometry(canvas.width / canvas.height * 0.5, 0.5);
        let newTexture = new THREE.Texture(canvas);
        newTexture.needsUpdate = true;
        this.material = new THREE.ResultTextObject3dMaterial({
            map: newTexture,
            color: 0xffffff
        });
        plane.applyMatrix(new THREE.Matrix4().makeTranslation(-plane.attributes.position.array[0] + 0.1, 0, 0));
        this.geometry = plane;
    };

    this.update = function (domElement) {
        let vFOV = camera.fov * Math.PI / 180;
        let height = 2 * Math.tan(vFOV / 2) * distance;
        let fraction = 0.5 / height;
        let heightInPixels = domElement.offsetHeight * fraction;
        let scaleFactorH = 598 / heightInPixels;
        this.scale.x = scaleFactorH * 0.05;
        this.scale.y = scaleFactorH * 0.05;
        this.quaternion.copy(camera.quaternion);
    };

    this.init();

};

THREE.ResultTextObject3d.prototype = Object.create(THREE.Mesh.prototype);
