"use strict";


THREE.SmallScaleObject3d = function (camera, domElement, resultDigits) {
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
        var radius = 20;

        var canvas = document.createElement('canvas');
        canvas.width = radius * 4;
        canvas.height= radius * 2;
        var context = canvas.getContext('2d');
        context.font = '14px Arial';

        var metrics = context.measureText(text);
        var textWidth = metrics.width;
        context.fillStyle = "black";
        context.fillText(text, 0, Math.ceil(14 * 0.8));

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

    this.createScaleDelimiters = function (maxSizeDelimiters) {
        var number = -1;
        var maxZ = 120;
        var minZ = -132;
        var minResult = this.resultInfo.minResult;
        var maxResult = this.resultInfo.maxResult;
        for (var i = 0; i <= maxSizeDelimiters; i += 1) {
            var result = minResult + i*(maxResult - minResult)/maxSizeDelimiters;
            var textObject = reBuildText(result.round(resultDigits));
            var textResultMesh = new THREE.Sprite(textObject.material);
            me.add(textResultMesh);
            textResultMesh.position.copy(new THREE.Vector3(44, 0, minZ + i * (maxZ - minZ)/maxSizeDelimiters));
            textResultMesh.scale.set(textObject.canvas.width - 12, textObject.canvas.height -12, 1);
            me.textResults[i] = textResultMesh;

        }

    };

    this.removeAllDelimiters = function () {
        //TODO: if they realy removed from scene and dont collected
        for (var key in  this.textResults) {
            this.textResults[key].parent.remove(this.textResults[key]);
        }
        this.textResults = {};
    };


    this.setIsolineMaterial = function (material) {
        this.rectangleMesh.material = material;
    };

    this.addMinMaxResults = function(){
       this.removeAllDelimiters();
       var nColors = 0;
       if(this.rectangleMesh.material.nColors){
           nColors = this.rectangleMesh.material.nColors;
       }
       this.createScaleDelimiters(nColors);
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
        this.textResults = {};
        this.resultInfo.maxResult = 1;
        this.resultInfo.minResult = 0;

        this.rectangleMesh = new THREE.Sprite( new THREE.SpriteMaterial( { color: '#69f' } ) );
        this.rectangleMesh.scale.set( 13, 260, 0 );


        me.add(me.rectangleMesh);
    };

    this.update = function () {
        me.rectangleMesh.quaternion.copy(camera.quaternion);
    };

    this.init();

};

THREE.SmallScaleObject3d.prototype = Object.create(THREE.Object3D.prototype);