module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    concat: {
      options: {
        banner: '/*! <%= pkg.name %> - v<%= pkg.version %> - ' +
          '<%= grunt.template.today("yyyy-mm-dd") %>\n' +
          '* <%= pkg.homepage %>\n' +
          '* Copyright (c) <%= grunt.template.today("yyyy") %> <%= pkg.author.name %>;' +
          ' Licensed <%= _.pluck(pkg.licenses, "type").join(", ") %> */\n'
      },
      dist: {
        src: ['src/simpleRequire.js', 'src/parts/**/*.js', 'src/main.js'],
        dest: 'dist/<%= pkg.name %>'
      }
    },
    watch: {
      files: '<config:lint.files>',
      tasks: 'concat'
    },
    jshint: {
      files: ['src/**/*.js', 'test/**/*Spec.js'],
      options: {
        strict: false,
        curly: true,
        eqeqeq: true,
        immed: true,
        latedef: false,
        newcap: true,
        noarg: true,
        sub: true,
        undef: true,
        boss: true,
        eqnull: true,
        trailing: true,
        globals: {
          module: false,
          describe: true,
          ddescribe: true,
          beforeEach: true,
          afterEach: true,
          it: true,
          iit: true,
          runs: true,
          waitsFor: true,
          waits: true,
          spyOn: true,
          expect: true,
          jasmine: true,
          uitest: true,
          testutils: true,
          window: true,
          document: true
        }
      }

    },
    connect: {
      server: {
        options: {
          port: 9000,
          base: './'
        }
      }
    },
    testacular: {
      dev: {
        configFile: 'testacular.conf.js',
        singleRun: false,
        browsers: []
      },
      ci: {
        configFile: 'testacular.conf.js',
        singleRun: true,
        browsers: ['PhantomJS']
      }
    }
  });

  grunt.registerTask('dev', ['connect','testacular:dev']);

  grunt.registerTask('default', ['jshint','connect','testacular:ci','concat']);

  grunt.registerTask('travis', ['jshint','connect','testacular:ci']);

  grunt.loadNpmTasks('gruntacular');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-jshint');
};