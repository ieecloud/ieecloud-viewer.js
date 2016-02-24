"use strict";


THREE.SmallAxisObject3d = function (camera, domElement) {
    var me = this;

    var createLabel = function (text, x, y, z, size, color, backGroundColor, backgroundMargin) {
        var canvas = document.createElement("canvas");

        var context = canvas.getContext("2d");
        context.font = size + "pt Arial";

        var textWidth = context.measureText(text).width;

        canvas.width = textWidth + 50;
        canvas.height = size + 50;
        context = canvas.getContext("2d");
        context.font = size + "pt Arial";


        context.textAlign = "center";
        context.textBaseline = "middle";
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var material = new THREE.MeshBasicMaterial({
            map: texture,
            overdraw: true,
            side: THREE.DoubleSide
        });

        var mesh = new THREE.Mesh(new THREE.PlaneBufferGeometry(canvas.width, canvas.height), material);
        mesh.position.x = x;
        mesh.position.y = y;
        mesh.position.z = z;
        mesh.rotation.x = Math.PI / 2;
        mesh.userData = "textAxis";
        mesh.quaternion.copy(camera.quaternion);

        return mesh;
    };

    this.show = function () {
        this.visible = true;
        this.update();
    };


    this.hide = function () {
        this.visible = false;
    };


    this.init = function () {

        THREE.Object3D.call(this);

        var object = new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 0), 100, 0x00ff00);
        me.add(object);
        object = new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 100, 0xff0000);
        me.add(object);
        object = new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 100, 0x0000ff);
        me.add(object);


        me.meshZ = createLabel("z", 10, 0, 100, 20, "black");
        me.add(me.meshZ);
        me.meshX = createLabel("x", 110, 0, 0, 20, "black");
        me.add(me.meshX);
        me.meshY = createLabel("y", 10, 110, 0, 20, "black");
        me.add(me.meshY);

        me.meshZ.quaternion.copy(camera.quaternion);
        me.meshX.quaternion.copy(camera.quaternion);
        me.meshY.quaternion.copy(camera.quaternion);

    };

    this.update = function () {
        me.meshZ.quaternion.copy(camera.quaternion);
        me.meshX.quaternion.copy(camera.quaternion);
        me.meshY.quaternion.copy(camera.quaternion);
    };

    this.init();

};

THREE.SmallAxisObject3d.prototype = Object.create(THREE.Object3D.prototype);