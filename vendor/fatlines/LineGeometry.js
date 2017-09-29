/**
 * @author WestLangley / http://github.com/WestLangley
 *
 */

THREE.LineGeometry = function (positions, index) {

    THREE.LineSegmentsGeometry.call( this, positions, index );

    this.type = 'LineGeometry';

};

THREE.LineGeometry.prototype = Object.assign( Object.create( THREE.LineSegmentsGeometry.prototype ), {

    constructor: THREE.LineGeometry,

    isLineGeometry: true,

    setPositions: function ( array ) {
        THREE.LineSegmentsGeometry.prototype.setPositions.call( this, array );
        return this;

    },

    setIndex: function ( array ) {
        THREE.LineSegmentsGeometry.prototype.setIndex.call( this, array );
        return this;

    },

    setColors: function ( array ) {

        THREE.LineSegmentsGeometry.prototype.setColors.call( this, array );

        return this;

    },

    fromLine: function ( line ) {

        var geometry = line.geometry;

        if ( geometry.isGeometry ) {

            this.setPositions( geometry.vertices );

        } else if ( geometry.isBufferGeometry ) {

            this.setPositions( geometry.position.array ); // assumes non-indexed

        }

        // set colors, maybe

        return this;

    },

    copy: function ( source ) {

        // todo

        return this;

    }

} );