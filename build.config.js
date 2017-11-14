/**
 * This file/module contains all configuration for the build process.
 */
module.exports = {
  /**
   * The `build_dir` folder is where our projects are compiled during
   * development and the `compile_dir` folder is where our app resides once it's
   * completely built.
   */
  build_dir: 'build',
  compile_dir: 'bin',

  /**
   * This is a collection of file patterns that refer to our app code (the
   * stuff in `src/`). These file paths are used in the configuration of
   * build tasks. `js` is all project javascript, less tests. `ctpl` contains
   * our reusable components' (`src/common`) template HTML files, while
   * `atpl` contains the same, but for our app's code. `html` is just our
   * main HTML file, `less` is our main stylesheet, and `unit` contains our
   * app's unit tests.
   */
  app_files: {
    js: [ 'src/**/*.js'],
//    js: [ 'src/objects/SmallAxisObject3d.js'],
    html: [ 'src/index.html' ]
  },

  /**
   * This is a collection of files used during testing only.
   */
  test_files: {
    js: [

    ]
  },

  /**
   * This is the same as `app_files`, except it contains patterns that
   * reference vendor code (`vendor/`) that we need to place into the build
   * process somewhere. While the `app_files` property ensures all
   * standardized files are collected for compilation, it is the user's job
   * to ensure non-standardized (i.e. vendor-related) files are handled
   * appropriately in `vendor_files.js`.
   *
   * The `vendor_files.js` property holds files to be automatically
   * concatenated and minified with our project source files.
   *
   */

  vendor_files: {
      js: [
          'bower_components/jquery/dist/jquery.min.js',
          'bower_components/signals/dist/signals.min.js',
          'bower_components/lodash/dist/lodash.min.js',
          'vendor/three.min.js',
          'vendor/ui.js',
          'vendor/fatlines/LineSegmentsGeometry.js',
          'vendor/fatlines/LineGeometry.js',
          'vendor/fatlines/LineMaterial.js',
          'vendor/fatlines/LineSegments2.js',
          'vendor/fatlines/Line2.js',
          'vendor/system.min.js',
          'vendor/CanvasRenderer.js',
          'vendor/Projector.js',
          'vendor/Octree.js'
      ]
  }
};
