"use strict";

THREE.NearestPointObject3dMaterial = function (parameters) {

    THREE.MeshBasicMaterial.call(this);

    this.depthTest = false;
    this.depthWrite = false;
    this.transparent = true;

    this.setValues(parameters);

}

THREE.NearestPointObject3dMaterial.prototype = Object.create(THREE.MeshBasicMaterial.prototype);

THREE.NearestPointObject3d = function (camera, domElement, params) {
    var worldPosition = new THREE.Vector3();
    var camPosition = new THREE.Vector3();
    var worldRotation = new THREE.Euler(0, 0, 1);
    var camRotation = new THREE.Euler();
    var distance;
    var radius;
    var me = this;


    this.show = function () {
        this.visible = true;
        this.update();
    }


    this.hide = function () {
        this.visible = false;
    }


    this.init = function () {

        THREE.Object3D.call(this);


        var sphereMat = new THREE.NearestPointObject3dMaterial(params.material);
        var size = params.size ? params.size : 0.007;
        var nearestPointMesh = new THREE.Mesh(new THREE.SphereGeometry(size), sphereMat);


        this.add(nearestPointMesh);


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
    }


    this.update = function () {
        var vFOV = camera.fov * Math.PI / 180;
        var height = 2 * Math.tan(vFOV / 2) * distance;
        var fraction = radius / height;
        var heightInPixels = domElement.offsetHeight * fraction;
        var scaleFactorH = 598 / heightInPixels;
        this.scale.x = scaleFactorH * radius
        this.scale.y = scaleFactorH * radius
        this.scale.z = scaleFactorH * radius
    }

    this.init();

}

THREE.NearestPointObject3d.prototype = Object.create(THREE.Object3D.prototype);
