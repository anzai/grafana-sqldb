module.exports = function(grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.loadNpmTasks('grunt-tsconfig');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-typescript');

  grunt.initConfig({
    clean: ["ts", "dist"],

    typescript: {
      build: {
        src: ['src/**/*.ts'],
        out: "ts",
        options: {
          module: 'system', //or commonjs
          target: 'es5', //or es3
          declaration: true,
          emitDecoratorMetadata: true,
          experimentalDecorators: true,
          sourceMap: true,
          noImplicitAny: false,
        }
      }
    },

    copy: {
      typescript: {
        expand: true,
        cwd: 'src',
        src: ['**/*.ts', '**/*.js'],
        dest: 'ts/'
      },
      html: {
        expand: true,
        flatten: true,
        src: ['src/public/partials/**'],
        dest: 'dist/partials/'
      },
      javascript: {
        expand: true,
        flatten: true,
        src: ['ts/**/*.js'],
        dest: 'dist/'
      },
      statics: {
        expand: true,
        src: ['plugin.json', 'LICENSE'],
        dest: 'dist/'
      }
    }
  });

  grunt.registerTask('default', [
    'clean',
    'copy:typescript',
    'typescript:build',
    'copy:javascript',
    'copy:html',
    'copy:statics',
  ]);
}
