"use strict";

THREE.CustomSelectionMaterial = function (parameters) {



    THREE.ShaderMaterial.call(this);


    this.defines = {};
    this.defines["USE_MAP"] = "";
    this.uniforms = {};
    this.fog = false;
    this.lights = true;
    this.extensions.derivatives = true;
    this.color = new THREE.Color( 0.6, 0.6, 0.6 ); // diffuse

    this.vertexShader = 'void main() {\n\tgl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );\n}';
    this.fragmentShader = 'void main() {\n\tgl_FragColor = vec4( 1.0, 0.0, 0.0, 1.0 );\n}';

    this.setValues(parameters);



    this.init = function(){
        this.uniforms = THREE.UniformsUtils.merge([
            THREE.UniformsLib.common,
            THREE.UniformsLib.specularmap,
            THREE.UniformsLib.envmap,
            THREE.UniformsLib.aomap,
            THREE.UniformsLib.lightmap,
            THREE.UniformsLib.emissivemap,
            THREE.UniformsLib.fog,
            THREE.UniformsLib.lights,
            {
                emissive: {value: new THREE.Color(0x000000)}
            }
        ]);

        //this is cover texture
        this.uniforms["mapCover"] = {};
        this.uniforms["limitUvs"] =  { value: new THREE.Vector2( 0.0, 1.0 ) };
        // this.uniforms["limitUvs"] =  { value: new THREE.Vector2( 0.20842420264631237,  0.797314323612207 ) };
        this.uniforms["color"] = { type: "c", value: new THREE.Color( 0x808080 ) }; //gray

        this.vertexShader = [
            "#define LAMBERT",
            "varying vec3 vLightFront;",
            "#ifdef DOUBLE_SIDED",
            "	varying vec3 vLightBack;",
            "#endif",
            THREE.ShaderChunk["common"],
            THREE.ShaderChunk["uv_pars_vertex"],
            THREE.ShaderChunk["uv2_pars_vertex"],
            THREE.ShaderChunk["envmap_pars_vertex"],
            THREE.ShaderChunk["bsdfs"],
            THREE.ShaderChunk["lights_pars"],
            THREE.ShaderChunk["color_pars_vertex"],
            THREE.ShaderChunk["fog_pars_vertex"],
            THREE.ShaderChunk["morphtarget_pars_vertex"],
            THREE.ShaderChunk["skinning_pars_vertex"],
            THREE.ShaderChunk["shadowmap_pars_vertex"],
            THREE.ShaderChunk["logdepthbuf_pars_vertex"],
            THREE.ShaderChunk["clipping_planes_pars_vertex"],
            "void main() {",
            THREE.ShaderChunk["uv_vertex"],
            THREE.ShaderChunk["uv2_vertex"],
            THREE.ShaderChunk["color_vertex"],
            THREE.ShaderChunk["beginnormal_vertex"],
            THREE.ShaderChunk["morphnormal_vertex"],
            THREE.ShaderChunk["skinbase_vertex"],
            THREE.ShaderChunk["skinnormal_vertex"],
            THREE.ShaderChunk["defaultnormal_vertex"],
            THREE.ShaderChunk["begin_vertex"],
            THREE.ShaderChunk["morphtarget_vertex"],
            THREE.ShaderChunk["skinning_vertex"],
            THREE.ShaderChunk["project_vertex"],
            THREE.ShaderChunk["logdepthbuf_vertex"],
            THREE.ShaderChunk["clipping_planes_vertex"],
            THREE.ShaderChunk["worldpos_vertex"],
            THREE.ShaderChunk["envmap_vertex"],
            THREE.ShaderChunk["lights_lambert_vertex"],
            THREE.ShaderChunk["shadowmap_vertex"],
            THREE.ShaderChunk["fog_vertex"],
            "}"
        ].join("\n");

        this.fragmentShader = [
            "uniform vec3 diffuse;",
            "uniform vec3 emissive;",
            "uniform vec3 color;",
            "uniform vec2 limitUvs;",
            "uniform float opacity;",
            "uniform sampler2D mapCover;",
            "varying vec3 vLightFront;",
            "#ifdef DOUBLE_SIDED",
            "	varying vec3 vLightBack;",
            "#endif",
            THREE.ShaderChunk["common"],
            THREE.ShaderChunk["packing"],
            THREE.ShaderChunk["dithering_pars_fragment"],
            THREE.ShaderChunk["color_pars_fragment"],
            THREE.ShaderChunk["uv_pars_fragment"],
            THREE.ShaderChunk["uv2_pars_fragment"],
            THREE.ShaderChunk["map_pars_fragment"],
            THREE.ShaderChunk["alphamap_pars_fragment"],
            THREE.ShaderChunk["aomap_pars_fragment"],
            THREE.ShaderChunk["lightmap_pars_fragment"],
            THREE.ShaderChunk["emissivemap_pars_fragment"],
            THREE.ShaderChunk["envmap_pars_fragment"],
            THREE.ShaderChunk["bsdfs"],
            THREE.ShaderChunk["lights_pars"],
            THREE.ShaderChunk["fog_pars_fragment"],
            THREE.ShaderChunk["shadowmap_pars_fragment"],
            THREE.ShaderChunk["shadowmask_pars_fragment"],
            THREE.ShaderChunk["specularmap_pars_fragment"],
            THREE.ShaderChunk["logdepthbuf_pars_fragment"],
            THREE.ShaderChunk["clipping_planes_pars_fragment"],
            "void main() {",
            THREE.ShaderChunk["clipping_planes_fragment"],
            "	vec4 diffuseColor = vec4( diffuse, opacity );",
            "	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );",
            "	vec3 totalEmissiveRadiance = emissive;",
            THREE.ShaderChunk["logdepthbuf_fragment"],
            // THREE.ShaderChunk["map_fragment"],

            "vec4 texelColor = texture2D( map, vUv );",
            "if( vUv.y > limitUvs.x && vUv.y < limitUvs.y )",
            "texelColor = mapTexelToLinear( texelColor );",
            "else",
            "texelColor = vec4( color, 1.0 );",
            "diffuseColor *= texelColor;",

            THREE.ShaderChunk["color_fragment"],
            THREE.ShaderChunk["alphamap_fragment"],
            THREE.ShaderChunk["alphatest_fragment"],
            THREE.ShaderChunk["specularmap_fragment"],
            THREE.ShaderChunk["emissivemap_fragment"],

            "	reflectedLight.indirectDiffuse = getAmbientLightIrradiance( ambientLightColor );",

            THREE.ShaderChunk["lightmap_fragment"],

            "	reflectedLight.indirectDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb );",

            "	#ifdef DOUBLE_SIDED",
            "	    reflectedLight.directDiffuse = ( gl_FrontFacing ) ? vLightFront : vLightBack;",
            "   #else",
            "       reflectedLight.directDiffuse = vLightFront;",
            "	#endif",

            "	reflectedLight.directDiffuse *= BRDF_Diffuse_Lambert( diffuseColor.rgb ) * getShadowMask();",

            THREE.ShaderChunk["aomap_fragment"],


            "	vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + totalEmissiveRadiance;",

            THREE.ShaderChunk["envmap_fragment"],

            "	gl_FragColor = vec4( outgoingLight, diffuseColor.a );",


            THREE.ShaderChunk["tonemapping_fragment"],
            THREE.ShaderChunk["encodings_fragment"],
            THREE.ShaderChunk["fog_fragment"],
            THREE.ShaderChunk["premultiplied_alpha_fragment"],
            THREE.ShaderChunk["dithering_fragment"],
            "}"
        ].join("\n");
    };


    this.setSourceTexture = function(texture){
        this.uniforms["map"].value = texture;
    };

    this.setUvsLimits = function(limitVector){
        this.uniforms["limitUvs"] =  { value: limitVector };

        console.log(limitVector)
    };

    this.init();
};


THREE.CustomSelectionMaterial.prototype = Object.create(THREE.ShaderMaterial.prototype);
THREE.CustomSelectionMaterial.prototype.isMeshLambertMaterial = true;