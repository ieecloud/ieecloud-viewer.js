/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

THREE.Line2 = function ( geometry, material ) {

    THREE.LineSegments2.call( this );

    this.type = 'Line2';

    this.geometry = geometry !== undefined ? geometry : new THREE.LineGeometry();
    this.material = material !== undefined ? material : new THREE.LineMaterial( { color: Math.random() * 0xffffff } );

};

THREE.Line2.prototype = Object.assign( Object.create( THREE.LineSegments2.prototype ), {

    constructor: THREE.Line2,

    isLine2: true,

    // raycast: ( function () {
    //
    //     var inverseMatrix = new THREE.Matrix4();
    //     var ray = new THREE.Ray();
    //     var sphere = new THREE.Sphere();
    //
    //     return function raycast( raycaster, intersects ) {
    //         var precision = raycaster.linePrecision;
    //         var precisionSq = precision * precision;
    //
    //         var geometry = this.geometry;
    //         var matrixWorld = this.matrixWorld;
    //
    //         // Checking boundingSphere distance to ray
    //
    //         if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();
    //         var threshold = 0.1
    //         sphere.copy( geometry.boundingSphere );
    //         sphere.applyMatrix4( matrixWorld );
    //         sphere.radius += threshold;
    //
    //         if ( raycaster.ray.intersectsSphere( sphere ) === false ) return;
    //
    //         //
    //         var localThresholdSq = threshold * threshold;
    //         inverseMatrix.getInverse( matrixWorld );
    //         ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );
    //
    //         var vStart = new THREE.Vector3();
    //         var vEnd = new THREE.Vector3();
    //         var interSegment = new THREE.Vector3();
    //         var interRay = new THREE.Vector3();
    //         var step = (this && this.isLine2) ? 2 : 1;
    //
    //         if ( geometry.isBufferGeometry ) {
    //
    //             var index = geometry.index;
    //             var attributes = geometry.attributes;
    //             var positions = attributes.position.array;
    //
    //             if ( index !== null ) {
    //
    //                 var indices = index.array;
    //
    //                 for ( var i = 0, l = indices.length - 1; i < l; i += step ) {
    //
    //                     var a = indices[ i ];
    //                     var b = indices[ i + 1 ];
    //
    //                     vStart.fromArray( positions, a * 3 );
    //                     vEnd.fromArray( positions, b * 3 );
    //
    //                     var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );
    //
    //                     if ( distSq < localThresholdSq ) continue;
    //
    //                     interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation
    //
    //                     var distance = raycaster.ray.origin.distanceTo( interRay );
    //
    //                     if ( distance < raycaster.near || distance > raycaster.far ) continue;
    //                     console.log("PASSS");
    //                     intersects.push( {
    //
    //                         distance: distance,
    //                         // What do we want? intersection point on the ray or on the segment??
    //                         // point: raycaster.ray.at( distance ),
    //                         point: interSegment.clone().applyMatrix4( this.matrixWorld ),
    //                         index: i,
    //                         face: null,
    //                         faceIndex: null,
    //                         object: this
    //
    //                     } );
    //
    //                 }
    //
    //             } else {
    //
    //                 for ( var i = 0, l = positions.length / 3 - 1; i < l; i += step ) {
    //
    //                     vStart.fromArray( positions, 3 * i );
    //                     vEnd.fromArray( positions, 3 * i + 3 );
    //
    //                     var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );
    //
    //                     if ( distSq > precisionSq ) continue;
    //
    //                     interRay.applyMatrix4( this.matrixWorld ); //Move back to world space for distance calculation
    //
    //                     var distance = raycaster.ray.origin.distanceTo( interRay );
    //
    //                     if ( distance < raycaster.near || distance > raycaster.far ) continue;
    //
    //                     intersects.push( {
    //
    //                         distance: distance,
    //                         // What do we want? intersection point on the ray or on the segment??
    //                         // point: raycaster.ray.at( distance ),
    //                         point: interSegment.clone().applyMatrix4( this.matrixWorld ),
    //                         index: i,
    //                         face: null,
    //                         faceIndex: null,
    //                         object: this
    //
    //                     } );
    //
    //                 }
    //
    //             }
    //
    //         }
    //
    //     };
    //
    // }() ),

    copy: function ( source ) {

        // todo

        return this;

    }

} );


