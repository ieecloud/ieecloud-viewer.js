"use strict";


THREE.SmallScaleObject3d = function (camera, domElement, isolineMaterial) {
    var me = this;



    var createTextCanvas = function (text, color, font, size, backColor) {

        size = 50;
        var canvas = document.createElement('canvas');

        var ctx = canvas.getContext('2d');


        var fontStr = (size + 'px ') +   'Tahoma, Geneva, sans-serif';
        ctx.font = fontStr;
        ctx.textAlign = 'left';
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

    var reBuildText = function (text) {
        var radius = 30;

        var canvas = document.createElement('canvas');
        canvas.width = radius * 4;
        canvas.height= radius * 2;
        var context = canvas.getContext('2d');
        context.font = '15px Arial';

        var metrics = context.measureText(text);
        var textWidth = metrics.width;
        context.fillStyle = "black";
        context.fillText(text, (canvas.width - textWidth) / 2, radius);
        var texture = new THREE.Texture(canvas);
        texture.needsUpdate = true;

        var spriteMaterial = new THREE.SpriteMaterial({map: texture});

        return {material: spriteMaterial, canvas : canvas};
    };

    this.show = function () {
        this.visible = true;
        this.update();
    };


    this.hide = function () {
        this.visible = false;
    };

    this.setIsolineMaterial = function (material) {
        this.rectangleMesh.material = material;
        this.rectangleMesh.material.side = THREE.DoubleSide;
    };

    this.addMinMaxResults = function(){
        var textObject = reBuildText(this.resultInfo.minResult ? this.resultInfo.minResult.round(2) : "0");
        if (this.minResultMesh) {
            this.minResultMesh.material = textObject.material;
        } else {
            this.minResultMesh = new THREE.Sprite(textObject.material);
            me.add(this.minResultMesh);
            this.minResultMesh.position.copy(new THREE.Vector3(25, 0, -135));
        }

        this.minResultMesh.scale.set(textObject.canvas.width, textObject.canvas.height, 1);


        textObject = reBuildText(this.resultInfo.maxResult ? this.resultInfo.maxResult.round(2) : "0");

        if (this.maxResultMesh) {
            this.maxResultMesh.material = textObject.material;
        } else {
            this.maxResultMesh = new THREE.Sprite(textObject.material);
            me.add(this.maxResultMesh);
            this.maxResultMesh.position.copy(new THREE.Vector3(25, 0, 128));
        }

        this.maxResultMesh.scale.set(textObject.canvas.width, textObject.canvas.height, 1);
    };


    this.setResultInfo = function (resultInfo) {
        this.resultInfo = resultInfo;
        this.addMinMaxResults();
    };

    var rotObjectMatrix;


    var rotateAroundObjectAxis = function (object, axis, radians) {
        rotObjectMatrix = new THREE.Matrix4();
        rotObjectMatrix.makeRotationAxis(axis.normalize(), radians);
        object.matrix.multiply(rotObjectMatrix);
        object.rotation.setFromRotationMatrix(object.matrix);
    };

    this.init = function () {

        THREE.Object3D.call(this);

        this.resultInfo  = {};
        this.resultInfo.maxResult = 1;
        this.resultInfo.minResult = 0;


        var geometry = new THREE.PlaneBufferGeometry(15, 300, 20, 20);

        var material= new THREE.MeshBasicMaterial({color: 0xff0000, opacity: 1, transparent: false});


        me.rectangleMesh = new THREE.Mesh(geometry, material);

        var xAxis = new THREE.Vector3(1, 0, 0);
        var yAxis = new THREE.Vector3(0, 1, 0);
        rotateAroundObjectAxis(me.rectangleMesh, xAxis, -Math.PI / 2);
        me.add(me.rectangleMesh);
    };

    this.update = function () {
    };

    this.init();

};

THREE.SmallScaleObject3d.prototype = Object.create(THREE.Object3D.prototype);