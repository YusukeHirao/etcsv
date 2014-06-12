module.exports = (grunt) ->

	grunt.loadNpmTasks 'grunt-typescript'
	grunt.loadNpmTasks 'grunt-typedoc'
	grunt.loadNpmTasks 'grunt-contrib-watch'

	# Package Data
	pkg = grunt.file.readJSON 'package.json'

	# Project configuration.
	grunt.initConfig

		typescript:
			options:
				comments: on
				declaration: on
			etcsv:
				src: [
					'src/etcsv.ts'
				]
				dest: 'lib/etcsv.js'

		watch:
			scripts:
				files: [
					"<%= typescript.etcsv.src %>"
				]
				tasks: [
					'typescript'
					'update'
				]
				options:
					interrupt: on

		typedoc:
			scripts:
				src: 'src/etcsv.ts'
				options:
					out: 'docs/'
					# name: '<%= pkg.name %>'

	grunt.registerTask 'default', [
		'typescript'
		'typedoc'
	]

	grunt.registerTask 'update', 'Update Revision', ->
		pkg.revision += 1
		grunt.file.write 'package.json', JSON.stringify(pkg, null, 2)
