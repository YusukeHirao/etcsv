/// <reference path="DefinitelyTyped/node/node.d.ts" />
/// <reference path="DefinitelyTyped/moment/moment.d.ts" />

/**
 * etcsv
 *
 * @version 0.2.0
 * @since 0.1.0
 *
 */
module etcsv {

	var fs = require('fs');
	var path = require('path');
	var iconv = require('iconv');
	var moment = require('moment');

	var parent = (module).parent;
	var baseDir = path.dirname(parent.filename);

	/**
	 * imports
	 *
	 * @version 0.1.0
	 * @since 0.1.0
	 *
	 */
	export function imports (filePath: string, charset?: string): Table {
		var csv:CSV = new CSV(filePath, charset);
		var table:Table = csv.toTable();
		return table;
	}

	/**
	 * CSV
	 *
	 * @version 0.2.0
	 * @since 0.1.0
	 *
	 */
	class CSV {

		/**
		 * text
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		public text: string;

		/**
		 * header
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		public header: string[];

		/**
		 * rows
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		public rows: string[][];

		/**
		 * constructor
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		constructor (filePath: string, charset: string) {
			var absPath: string = path.resolve(path.join(baseDir, filePath));
			var text: string = fs.readFileSync(absPath);
			var conv: any;
			if (charset) {
				conv = new iconv.Iconv(charset, 'UTF-8//TRANSLIT//IGNORE');
				text = conv.convert(text);
			}
			this.text = text.toString();
			this._parse();
		}

		/**
		 * toTable
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		public toTable ():Table {
			var table: Table = new Table();
			var i: number = 0;
			var l: number = this.rows.length;
			var k: number = 0;
			var kL: number = this.header.length;
			var record: Record;
			for (; i < l; i++) {
				record = new Record;
				for (; k < kL; k++) {
					record.set(this.header[k], this.rows[i][k]);
				}
				table.data.push(record);
				k = 0;
			}
			return table;
		}

		/**
		 * _parse
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		private _parse (): void {
			var text: string = this.text;
			var current: string;
			var next: string;
			var field: string = '';
			var fields: string[] = [];
			var rows: string[][] = [];
			var hasOpenQuote: boolean = false;
			var hasEscape: boolean = false;
			var counter: number = 0;
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

	/**
	 * Table
	 *
	 * @version 0.2.0
	 * @since 0.1.0
	 *
	 */
	export class Table {

		/**
		 * data
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		public data: any[] = [];

		/**
		 * _fields
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		private _fields: string[] = [];

		/**
		 * _relations
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		private _relations: Relation[] = [];

		public setByFieldName (fieldName: string, callback: Function): void {
			this.data.forEach((record) => {
				var value: any = record._[fieldName];
				var result: any = callback.call(this, value, record._);
				if (result !== undefined) {
					record._[fieldName] = result;
				}
			});
		}

		/**
		 * sql
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public sql (options: TableSqlMethodOption): SQL {
			var sql: string = '';
			var values: string[] = [];

			if (!('db' in options)) {
				throw new TypeError();
			}
			if (!('table' in options)) {
				throw new TypeError();
			}

			this._fields = options.fields || [];

			if (options.relations && options.relations.length && options.relations.forEach) {
				options.relations.forEach((relation: RelationOption): void => {
					this._relations.push(new Relation(relation.table, relation.relationalIdMax, relation.relationalIdFieldName, relation.selfIdFieldName));
				});
			}

			this.data.forEach((data: any, i:number): void => {

				var line: string[] = [];

				line.push(<string> '' + (i + 1));

				this._fields.forEach(function(fieldName: string) {
					line.push(<string> '' + data._[fieldName]);
				});

				values.push("('" + line.join("','") + "')");

				this._relations.forEach(function(relation: Relation) {
					var ri: number = 0;
					var l: number = relation.relationalIdMax;
					var rValue: string;
					for (; ri < l; ri++) {
						// フィールドが存在するかどうか
						if (rValue = <string> data._[relation.table + ':' + ri]) {
							// データが空文字じゃない（ここの条件はデータに拠る）
							if (rValue) {
								relation.queries.push("(" + (relation.queries.length + 1) + "," + ri + "," + (i + 1) + ")");
							}
						}
					}
				});
			});

			sql += '# ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- #\n';
			sql += '#\n';
			sql += '# OVERWRITE TABEL SQL\n';
			sql += '# generated by etcsv.js for Node\n';
			sql += '# at ' + moment().format('YYYY-MM-DD HH:mm') +'\n';
			sql += '#\n';
			sql += '# ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- #\n\n';

			sql += 'TRUNCATE TABLE `' + options.db + '`.`' + options.table + '`;\n';
			sql += 'ALTER TABLE `' + options.db + '`.`' + options.table + '` AUTO_INCREMENT = 1;\n\n';
			sql += 'INSERT INTO `' + options.db + '`.`' + options.table + '` (`id`, `' + this._fields.join('`,`') + '`) VALUES\n';
			sql += values.join(',\n') + ';';

			this._relations.forEach((relation: Relation): void => {
				if (relation.queries.length) {
					sql += '\n\n\n';
					sql += 'TRUNCATE TABLE `' + options.db + '`.`' + relation.table + '`;\n';
					sql += 'ALTER TABLE `' + options.db + '`.`' + relation.table + '` AUTO_INCREMENT = 1;\n\n';
					sql += 'INSERT INTO `' + options.db + '`.`' + relation.table +'` (`id`, `' + relation.relationalIdFieldName + '_id`, `' + relation.selfIdFieldName + '_id`) VALUES\n';
					sql += relation.queries.join(',\n') + ';';
				}
			});

			return new SQL(sql);
		}

	}

	/**
	 * SQL
	 *
	 * @version 0.2.0
	 * @since 0.2.0
	 *
	 */
	export class SQL {

		/**
		 * query
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public query: string;

		/**
		 * constructor
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		constructor (query: string) {
			this.query = query;
		}

		/**
		 * output
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public output (filePath: string): void {
			fs.writeFile(filePath, this.query);
		}

	}

	/**
	 * Record
	 *
	 * @version 0.2.0
	 * @since 0.1.0
	 *
	 */
	class Record {

		/**
		 * _
		 *
		 * @version 0.2.0
		 * @since 0.1.0
		 *
		 */
		private _: { [index: string]: string } = {};

		/**
		 * set
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public set (fieldName: string, value: string): void {
			this._[fieldName] = value;
		}

		/**
		 * get
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public get (fieldName: string): string {
			if (fieldName in this._) {
				return this._[fieldName];
			} else {
				return null;
			}
		}

	}

	/**
	 * Relation
	 *
	 * @version 0.2.0
	 * @since 0.2.0
	 *
	 */
	class Relation {

		/**
		 * table
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public table: string;

		/**
		 * relationalIdMax
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public relationalIdMax: number;

		/**
		 * relationalIdFieldName
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public relationalIdFieldName: string;

		/**
		 * selfIdFieldName
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public selfIdFieldName: string;

		/**
		 * queries
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		public queries: string[] = [];

		/**
		 * constructor
		 *
		 * @version 0.2.0
		 * @since 0.2.0
		 *
		 */
		constructor (relationshipTableName: string, relationalIdMax: number, relationalIdFieldName: string, selfIdFieldName:string) {
			this.table = relationshipTableName;
			this.relationalIdMax = +relationalIdMax || 1000;
			this.relationalIdFieldName = relationalIdFieldName;
			this.selfIdFieldName = selfIdFieldName;
		}
	}

	/**
	 * RelationOption
	 *
	 * @version 0.2.0
	 * @since 0.2.0
	 *
	 */
	export interface RelationOption {
		table: string;
		relationalIdMax: number;
		relationalIdFieldName: string;
		selfIdFieldName: string;
	}

	/**
	 * TableSqlMethodOption
	 *
	 * @version 0.2.0
	 * @since 0.2.0
	 *
	 */
	export interface TableSqlMethodOption {
		db: string;
		table: string;
		fields: string[];
		relations: RelationOption[];
	}
}

(module).exports = etcsv;
