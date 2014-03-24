/// <reference path="DefinitelyTyped/node/node.d.ts" />

module etcsv {

	var path = require('path');
	var CSVConverter = require("csvtojson").core.Converter;
	var deferred = require('deferred');

	var parent = (module).parent;
	var baseDir = path.dirname(parent.filename);

	export function imports (filePath : string) : Table {
		var table:Table = new Table();
		var absPath = path.resolve(path.join(baseDir, filePath));
		var csvConverter = new CSVConverter();
		csvConverter.on('end_parsed', (json) => {
			table.isLoaded = true;
			table.data = json.csvRows;
			var fieldName:string;
			console.log(table.data[0]);
		});
		csvConverter.from(absPath);
		return table;
	}

	export class Table {

		public isLoaded:boolean = false;
		public data:any = {};

		constructor () {
		}

	}

	export class Column {
	}

	export class Record {
	}
}

(module).exports = etcsv;
