var THREEext	= THREEext 		|| {};
THREEext.Line = function ( geometry, material, mode ) {


    THREE.Line.call( this );

	this.type = 'Line';

	this.geometry = geometry !== undefined ? geometry : new THREE.Geometry();
	this.material = material !== undefined ? material : new THREE.LineBasicMaterial( { color: 'black' } );

	this.mode = ( mode !== undefined ) ? mode : THREE.LineStrip;



};



THREEext.Line.prototype = Object.create( THREE.Line.prototype );
THREEext.Line.prototype.constructor = THREEext.Line;

THREEext.Line.prototype.raycast = ( function () {

	var inverseMatrix = new THREE.Matrix4();
	var ray = new THREE.Ray();
	var sphere = new THREE.Sphere();

	return function ( raycaster, intersects ) {

		var precision = raycaster.linePrecision;
		var precisionSq = precision * precision;

		var geometry = this.geometry;

		if ( geometry.boundingSphere === null ) geometry.computeBoundingSphere();

		// Checking boundingSphere distance to ray

		sphere.copy( geometry.boundingSphere );
		sphere.applyMatrix4( this.matrixWorld );

		if ( raycaster.ray.isIntersectionSphere( sphere ) === false ) {

			return;

		}

		inverseMatrix.getInverse( this.matrixWorld );
		ray.copy( raycaster.ray ).applyMatrix4( inverseMatrix );

		var vStart = new THREE.Vector3();
		var vEnd = new THREE.Vector3();
		var interSegment = new THREE.Vector3();
		var interRay = new THREE.Vector3();
		var step = this.mode === THREE.LineStrip ? 1 : 2;

		if ( geometry instanceof THREE.BufferGeometry ) {

			var attributes = geometry.attributes;

			if ( attributes.index !== undefined ) {

				var indices = attributes.index.array;
				var positions = attributes.position.array;
				var offsets = geometry.offsets;

				if ( offsets.length === 0 ) {

					offsets = [ { start: 0, count: indices.length, index: 0 } ];

				}

				for ( var oi = 0; oi < offsets.length; oi++){

					var start = offsets[ oi ].start;
					var count = offsets[ oi ].count;
					var index = offsets[ oi ].index;

					for ( var i = start; i < start + count - 1; i += step ) {

						var a = index + indices[ i ];
						var b = index + indices[ i + 1 ];

						vStart.fromArray( positions, a * 3 );
						vEnd.fromArray( positions, b * 3 );

						var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

						if ( distSq > precisionSq ) continue;

						var distance = ray.origin.distanceTo( interRay );

						if ( distance < raycaster.near || distance > raycaster.far ) continue;

						intersects.push( {

							distance: distance,
							point: raycaster.ray.at( distance ),
							face: null,
							faceIndex: null,
							object: this

						} );

					}

				}

			} else {

				var positions = attributes.position.array;

				for ( var i = 0; i < positions.length / 3 - 1; i += step ) {

					vStart.fromArray( positions, 3 * i );
					vEnd.fromArray( positions, 3 * i + 3 );

					var distSq = ray.distanceSqToSegment( vStart, vEnd, interRay, interSegment );

					if ( distSq > precisionSq ) continue;

					var distance = ray.origin.distanceTo( interRay );

					if ( distance < raycaster.near || distance > raycaster.far ) continue;

					intersects.push( {

						distance: distance,
						// What do we want? intersection point on the ray or on the segment??
						point: raycaster.ray.at( distance ),
						face: null,
						faceIndex: null,
						object: this

					} );

				}

			}

		} else if ( geometry instanceof THREE.Geometry ) {

			var vertices = geometry.vertices;
			var nbVertices = vertices.length;

			for ( var i = 0; i < nbVertices - 1; i += step ) {

				var distSq = ray.distanceSqToSegment( vertices[ i ], vertices[ i + 1 ], interRay, interSegment );

				if ( distSq > precisionSq ) continue;

				var distance = ray.origin.distanceTo( interRay );

				if ( distance < raycaster.near || distance > raycaster.far ) continue;

				intersects.push( {

					distance: distance,
					point: raycaster.ray.at( distance ),
					face: null,
					faceIndex: null,
					object: this

				} );

			}

		}

	};

}() );

THREEext.Line.prototype.clone = function ( object ) {

	if ( object === undefined ) object = new THREEext.Line( this.geometry, this.material, this.mode );

	THREE.Line.prototype.clone.call( this, object );

	return object;

};