var THREEext	= THREEext 		|| {};

THREEext.GridHelper = function ( size, step ) {

	var geometry = new THREE.Geometry();
	var material = new THREE.LineBasicMaterial( { vertexColors: THREE.VertexColors } );

	this.color1 = new THREE.Color( 0x444444 );
	this.color2 = new THREE.Color( 0x888888 );

	for ( var i = - size; i <= size; i += step ) {

		geometry.vertices.push(
			new THREE.Vector3( - size, i, 0 ), new THREE.Vector3( size, i, 0 ),
			new THREE.Vector3(i, -size, 0), new THREE.Vector3(i, size, 0)
		);


		var color = i === 0 ? this.color1 : this.color2;

		geometry.colors.push( color, color, color, color );

	}

	THREE.LineSegments.call( this, geometry, material);

};



THREEext.GridHelper.prototype = Object.create( THREE.LineSegments.prototype );
THREEext.GridHelper.prototype.constructor = THREEext.GridHelper;
