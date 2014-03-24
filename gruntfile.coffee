module.exports = (grunt) ->

	# Package Data
	pkg = grunt.file.readJSON 'package.json'

	# Project configuration.
	grunt.initConfig
		pkg: pkg
		meta:
			banner: '''
				/**
				 * <%= pkg.name %>.js - v<%= pkg.version %> r<%= parseInt(pkg.revision, 10) + 1 %>
				 * update: <%= grunt.template.today("yyyy-mm-dd") %>
				 * Author: <%= pkg.author %> [<%= pkg.website %>]
				 * Github: <%= pkg.repository.url %>
				 * License: Licensed under the <%= pkg.licenses[0].type %> License
				 * Require: jQuery v<%= pkg.dependencies.jquery %>
				 */
			'''

		typescript:
			options:
				comments: on
			dist:
				src: [
					'src/etcsv.ts'
				]
				dest: 'lib/etcsv.js'

		watch:
			scripts:
				files: [
					"<%= typescript.dist.src %>"
				]
				tasks: [
					'typescript'
					'gitcommit'
					'notifyDone'
				]
				options:
					interrupt: on

	grunt.registerTask 'default', [
		'typescript'
		'notifyDone'
	]

	# Tasks
	log = grunt.log
	proc = require 'child_process'
	exec = proc.exec

	grunt.loadNpmTasks 'grunt-typescript'
	grunt.loadNpmTasks 'grunt-contrib-watch'

	grunt.registerTask 'update', 'Update Revision', ->
		pkg.revision = parseInt(pkg.revision, 10) + 1
		grunt.file.write 'package.json', JSON.stringify pkg, null,2

	grunt.registerTask 'gitcommit', 'Git Commit', ->
		exec "/usr/local/git/bin/git commit -a -m 'dev (grunt commit r#{pkg.revision})'"

	grunt.registerTask 'notifyDone', 'done', ->
		exec "/usr/local/bin/growlnotify -t 'grunt.js - <#{pkg.name}> Project' -m '#{pkg.name} v@#{pkg.version} r#{pkg.revision}\nTasks are completed!'"
