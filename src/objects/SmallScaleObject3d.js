"use strict";


THREE.SmallScaleObject3d = function (camera, domElement, resultDigits) {
    let me = this;


    let createTextCanvas = function (text, color, font, size) {

        size = size || 24;
        let radius = 20;
        let canvas = document.createElement('canvas');

        let ctx = canvas.getContext('2d');


        let fontStr = (size + 'px ') + (font || 'Arial');
        ctx.font = fontStr;

        canvas.width = radius * 4;
        canvas.height = radius * 2;

        ctx.font = fontStr;
        ctx.miterLimit = 1;
        ctx.fillStyle = color || 'black';
        ctx.strokeStyle = 'black';
        ctx.fillText(text, 0, Math.ceil(size * 0.8));
        return canvas;

    };


    let decimalAdjust = function (type, value, exp) {
        if (typeof exp === 'undefined' || +exp === 0) {
            return Math[type](value);
        }
        value = +value;
        exp = +exp;
        if (isNaN(value) || !(typeof exp === 'number' && exp % 1 === 0)) {
            return NaN;
        }
        value = value.toString().split('e');
        value = Math[type](+(value[0] + 'e' + (value[1] ? (+value[1] - exp) : -exp)));
        value = value.toString().split('e');
        return +(value[0] + 'e' + (value[1] ? (+value[1] + exp) : exp));
    }

    this.show = function () {
        this.visible = true;
        this.update();
    };


    this.hide = function () {
        this.visible = false;
    };

    Number.prototype.round = function (places) {
        return +(Math.round(this + "e+" + places) + "e-" + places);
    };

    this.createScaleDelimiters = function (maxSizeDelimiters, from, to) {
        let maxZ = 115;
        let minZ = -137;
        let minResult = from;
        let maxResult = to;
        for (let i = 0; i <= maxSizeDelimiters; i += 1) {
            let result = minResult + i * (maxResult - minResult) / maxSizeDelimiters;
            let valueWithoutE = result.toString().split('e');
            let expPartStr = valueWithoutE[1];
            let expPartNum = Number(expPartStr);
            let valueToRender = 'unknown'
            if (_.isNaN(expPartNum)) {
                valueToRender = result.round(this.resultDigits)
            } else {
                valueToRender = decimalAdjust('round', result, expPartNum)
            }
            let canvas = createTextCanvas(valueToRender, this.color, null, 12);
            let newTexture = new THREE.Texture(canvas);
            newTexture.needsUpdate = true;
            let spriteMaterial = new THREE.SpriteMaterial({map: newTexture});

            let textResultMesh = new THREE.Sprite(spriteMaterial);
            me.add(textResultMesh);
            textResultMesh.position.copy(new THREE.Vector3(50, 0, minZ + i * (maxZ - minZ) / maxSizeDelimiters));
            textResultMesh.scale.set((canvas.width)/** 0.005*/, (canvas.height) /** 0.005*/, 1);
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

    this.addMinMaxResults = function (from, to) {
        this.currentFrom = from;
        this.currentTo = to;
        this.removeAllDelimiters();
        let nColors = 0;
        if (this.rectangleMesh.material.nColors) {
            nColors = this.rectangleMesh.material.nColors;
        }

        this.createScaleDelimiters(nColors, from, to);
    };

    this.init = function () {

        THREE.Object3D.call(this);

        this.resultInfo = {};
        this.textResults = {};
        this.resultInfo.maxResult = {};
        this.resultInfo.maxResult.value = 1;
        this.resultInfo.minResult = {};
        this.resultInfo.minResult.value = 0;

        this.rectangleMesh = new THREE.Sprite(new THREE.SpriteMaterial({color: '#69f'}));
        this.rectangleMesh.scale.set(13, 260, 0);
        this.resultDigits = resultDigits;

        me.add(me.rectangleMesh);
    };

    this.update = function () {
        me.rectangleMesh.quaternion.copy(camera.quaternion);
    };

    this.setResultDigits = function (resultDigits) {
        this.resultDigits = resultDigits;
        this.addMinMaxResults(this.currentFrom, this.currentTo);
    };

    this.init();

};

THREE.SmallScaleObject3d.prototype = Object.create(THREE.Object3D.prototype);
