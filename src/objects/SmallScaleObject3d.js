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
        var size = 15;
        var canvas = createTextCanvas(text,  "black", null, 256);


        var plane = new THREE.PlaneBufferGeometry(canvas.width / canvas.height * size, size);
        var tex = new THREE.Texture(canvas);

        tex.needsUpdate = true;
        return {tex: tex, plane : plane};
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
        var xAxis = new THREE.Vector3(1, 0, 0);
        var textObject = reBuildText(this.resultInfo.maxResult);
        var planeMat = new THREE.ResultTextObject3dMaterial({
            map: textObject.tex,
            color: 0xffffff
        });
        this.maxResultMesh = new THREE.Mesh(textObject.plane, planeMat);
        rotateAroundObjectAxis(this.maxResultMesh, xAxis, Math.PI / 2);
        me.add(this.maxResultMesh);
        this.maxResultMesh.position.copy(new THREE.Vector3(25, 0, 130));

        var textObject = reBuildText(this.resultInfo.minResult.round(2));
        var planeMat = new THREE.ResultTextObject3dMaterial({
            map: textObject.tex,
            color: 0xffffff
        });

        this.minResultMesh = new THREE.Mesh(textObject.plane, planeMat);
        rotateAroundObjectAxis(this.minResultMesh, xAxis, Math.PI / 2);
        me.add(this.minResultMesh);
        this.minResultMesh.position.copy(new THREE.Vector3(25, 0, -130));

    };


    this.setResultInfo = function (resultInfo) {
        this.resultInfo = resultInfo;


        this.maxResultMesh.parent.remove(this.maxResultMesh);
        this.maxResultMesh.geometry.dispose();


        this.minResultMesh.parent.remove(this.minResultMesh);
        this.minResultMesh.geometry.dispose();

        this.addMinMaxResults();

        // var textObject = reBuildText(this.resultInfo.maxResult.round(2));
        // var planeMat = new THREE.ResultTextObject3dMaterial({
        //     map: textObject.tex,
        //     color: 0xffffff
        // });
        // this.maxResultMesh.material = planeMat;
        //
        //
        //
        //
        // var textObject = reBuildText(this.resultInfo.minResult.round(2));
        // var planeMat = new THREE.ResultTextObject3dMaterial({
        //     map: textObject.tex,
        //     color: 0xffffff
        // });
        // this.minResultMesh.material = planeMat;

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

        // this.addMinMaxResults();

        var textObject = reBuildText(this.resultInfo.maxResult);
        var planeMat = new THREE.ResultTextObject3dMaterial({
            map: textObject.tex,
            color: 0xffffff
        });
        this.maxResultMesh = new THREE.Mesh(textObject.plane, planeMat);
        rotateAroundObjectAxis(this.maxResultMesh, xAxis, Math.PI / 2);
        me.add(this.maxResultMesh);
        this.maxResultMesh.position.copy(new THREE.Vector3(25, 0, 130));

        var textObject = reBuildText(this.resultInfo.minResult);
        var planeMat = new THREE.ResultTextObject3dMaterial({
            map: textObject.tex,
            color: 0xffffff
        });

        this.minResultMesh = new THREE.Mesh(textObject.plane, planeMat);
        rotateAroundObjectAxis(this.minResultMesh, xAxis, Math.PI / 2);
        me.add(this.minResultMesh);
        this.minResultMesh.position.copy(new THREE.Vector3(25, 0, -130));

    };

    this.update = function () {
    };

    this.init();

};

THREE.SmallScaleObject3d.prototype = Object.create(THREE.Object3D.prototype);