/// <reference path="DefinitelyTyped/node/node.d.ts" />

module etcsv {

	var fs = require('fs');
	var path = require('path');
	var iconv = require('iconv');

	var parent = (module).parent;
	var baseDir = path.dirname(parent.filename);

	export function imports (filePath:string, charset?:string):Table {
		var csv:CSV = new CSV(filePath, charset);
		var table:Table = csv.toTable();
		return table;
	}

	class CSV {

		public text:string;
		public header:string[];
		public rows:string[][];

		constructor (filePath:string, charset:string) {
			var absPath:string = path.resolve(path.join(baseDir, filePath));
			var text:string = fs.readFileSync(absPath);
			var conv;
			if (charset) {
				conv = new iconv.Iconv(charset, 'UTF-8//TRANSLIT//IGNORE');
				text = conv.convert(text).toString();
			}
			this.text = text.toString();
			this._parse();
		}

		public toTable ():Table {
			var table:Table = new Table();
			var i:number = 0;
			var l:number = this.rows.length;
			var k:number = 0;
			var kL:number = this.header.length;
			var record:Record;
			var v:any;
			for (; i < l; i++) {
				record = new Record;
				for (; k < kL; k++) {
					record._[this.header[k]] = this.rows[i][k];
				}
				table.data.push(record);
				k = 0;
			}
			return table;
		}

		private _parse () {
			var text:string = this.text;
			var current:string;
			var next:string;
			var field:string = '';
			var fields:string[] = [];
			var rows:string[][] = [];
			var hasOpenQuote:boolean = false;
			var hasEscape:boolean = false;
			var counter:number = 0;
			while (text) {
				current = text.substr(0, 1);
				next = text.substr(1, 1);
				text = text.substr(1);
				if (counter++ === 0 && current === '"') {
					hasOpenQuote = true;
					continue;
				}
				if (current === ',') {
					if (!hasOpenQuote) {
						fields.push(field.trim());
						field = '';
						hasOpenQuote = false;
						continue;
					}
				}
				if (current === '"') {
					if (hasEscape) {
						hasEscape = false;
						continue;
					} else if (next === '"') {
						field += '"';
						hasEscape = true;
						continue;
					} else if (hasOpenQuote && (next === ',' || /[\r\n]/.test(next))) {
						hasOpenQuote = false;
						continue;
					}
					hasOpenQuote = true;
					continue;
				}
				if (/[\n\r]/.test(current)) {
					if (hasOpenQuote) {
						field += "\n";
						continue;
					}
					fields.push(field.trim());
					field = '';
					rows.push(fields);
					fields = [];
					continue;
				}
				field += current;
			}
			this.header = rows.shift();
			this.rows = rows;
		}
	}

	export class Table {

		public data:any[] = [];

		public setByFieldName (fieldName, callback) {
			this.data.forEach((record) => {
				var value:any = record._[fieldName];
				var result:any = callback.call(this, value, record._);
				if (result !== undefined) {
					record._[fieldName] = result;
				}
			});
		}

	}

	class Column {
	}

	class Record {
		public _:any = {};
	}
}

(module).exports = etcsv;
