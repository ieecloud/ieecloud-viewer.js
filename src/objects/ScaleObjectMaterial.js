"use strict";

THREE.ScaleObjectMaterial = function (parameters) {


    THREE.ShaderMaterial.call(this);

    this.defines = {};
    this.defines["USE_MAP"] = "";
    this.uniforms = {};
    this.color = new Color( 0xffffff );
    this.map = null;

    this.rotation = 0;

    this.fog = false;
    this.lights = false;

    this.vertexShader = 'void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}';
    this.fragmentShader = 'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}';

    this.setValues(parameters);


    this.init = function () {
        this.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.fog
        ]);

        this.uniforms["limitUvs"] =  { value: new THREE.Vector2( 0.0, 1.0 ) };
        this.uniforms["color"] = {type: "c", value: new THREE.Color(0x808080)}; //gray

        this.vertexShader = [
            "uniform float rotation;",
            "uniform vec2 center;",
            THREE.ShaderChunk["common"],
            THREE.ShaderChunk["uv_pars_vertex"],
            THREE.ShaderChunk["fog_pars_vertex"],
            THREE.ShaderChunk["logdepthbuf_pars_vertex"],
            THREE.ShaderChunk["clipping_planes_pars_vertex"],
            "void main() {",
            THREE.ShaderChunk["uv_vertex"],
            "vec4 mvPosition = modelViewMatrix * vec4( 0.0, 0.0, 0.0, 1.0 );",
            "vec2 scale;",
            "scale.x = length( vec3( modelMatrix[ 0 ].x, modelMatrix[ 0 ].y, modelMatrix[ 0 ].z ) );",
            "scale.y = length( vec3( modelMatrix[ 1 ].x, modelMatrix[ 1 ].y, modelMatrix[ 1 ].z ) );",
            "#ifndef USE_SIZEATTENUATION",

            "bool isPerspective = isPerspectiveMatrix( projectionMatrix );",

            "if ( isPerspective ) scale *= - mvPosition.z;",

            "#endif",

            "vec2 alignedPosition = ( position.xy - ( center - vec2( 0.5 ) ) ) * scale;",

            "vec2 rotatedPosition;",
            "rotatedPosition.x = cos( rotation ) * alignedPosition.x - sin( rotation ) * alignedPosition.y;",
            "rotatedPosition.y = sin( rotation ) * alignedPosition.x + cos( rotation ) * alignedPosition.y;",

            "mvPosition.xy += rotatedPosition;",

            "gl_Position = projectionMatrix * mvPosition;",
            THREE.ShaderChunk["logdepthbuf_vertex"],
            THREE.ShaderChunk["clipping_planes_vertex"],
            THREE.ShaderChunk["fog_vertex"]

        ].join("\n");

        this.fragmentShader = [
            "uniform vec3 diffuse;",
            "uniform float opacity;",
            THREE.ShaderChunk["common"],
            THREE.ShaderChunk["uv_pars_fragment"],
            THREE.ShaderChunk["map_pars_fragment"],
            THREE.ShaderChunk["alphamap_pars_fragment"],
            THREE.ShaderChunk["fog_pars_fragment"],
            THREE.ShaderChunk["logdepthbuf_pars_fragment"],
            THREE.ShaderChunk["clipping_planes_pars_fragment"],
            "void main() {",
            THREE.ShaderChunk["clipping_planes_fragment"],
            "vec3 outgoingLight = vec3( 0.0 );",
            "vec4 diffuseColor = vec4( diffuse, opacity );",
            THREE.ShaderChunk["logdepthbuf_fragment"],
            THREE.ShaderChunk["map_fragment"],
            THREE.ShaderChunk["alphamap_fragment"],
            THREE.ShaderChunk["alphatest_fragment"],
            "outgoingLight = diffuseColor.rgb;",
            "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
            THREE.ShaderChunk["tonemapping_fragment"],
            THREE.ShaderChunk["encodings_fragment"],
            THREE.ShaderChunk["fog_fragment"]
        ].join("\n");
    };


    this.setSourceTexture = function (texture) {
        this.uniforms["map"].value = texture;
    };


    this.init();
};


THREE.ScaleObjectMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
THREE.ScaleObjectMaterial.prototype.isSpriteMaterial = true;
