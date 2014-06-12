/// <reference path="DefinitelyTyped/node/node.d.ts" />
/// <reference path="DefinitelyTyped/moment/moment.d.ts" />
/**
* etcsv
*
* @version 0.2.0
* @since 0.1.0
*
*/
var etcsv;
(function (etcsv) {
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
    function imports(filePath, charset) {
        var csv = new CSV(filePath, charset);
        var table = csv.toTable();
        return table;
    }
    etcsv.imports = imports;

    /**
    * CSV
    *
    * @version 0.2.0
    * @since 0.1.0
    *
    */
    var CSV = (function () {
        /**
        * constructor
        *
        * @version 0.2.0
        * @since 0.1.0
        *
        */
        function CSV(filePath, charset) {
            var absPath = path.resolve(path.join(baseDir, filePath));
            var text = fs.readFileSync(absPath);
            var conv;
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
        CSV.prototype.toTable = function () {
            var table = new Table();
            var i = 0;
            var l = this.rows.length;
            var k = 0;
            var kL = this.header.length;
            var record;
            for (; i < l; i++) {
                record = new Record;
                for (; k < kL; k++) {
                    record.set(this.header[k], this.rows[i][k]);
                }
                table.data.push(record);
                k = 0;
            }
            return table;
        };

        /**
        * _parse
        *
        * @version 0.2.0
        * @since 0.1.0
        *
        */
        CSV.prototype._parse = function () {
            var text = this.text;
            var current;
            var next;
            var field = '';
            var fields = [];
            var rows = [];
            var hasOpenQuote = false;
            var hasEscape = false;
            var counter = 0;
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
        };
        return CSV;
    })();

    /**
    * Table
    *
    * @version 0.2.0
    * @since 0.1.0
    *
    */
    var Table = (function () {
        function Table() {
            /**
            * data
            *
            * @version 0.2.0
            * @since 0.1.0
            *
            */
            this.data = [];
            /**
            * _fields
            *
            * @version 0.2.0
            * @since 0.2.0
            *
            */
            this._fields = [];
            /**
            * _relations
            *
            * @version 0.2.0
            * @since 0.2.0
            *
            */
            this._relations = [];
        }
        Table.prototype.setByFieldName = function (fieldName, callback) {
            var _this = this;
            this.data.forEach(function (record) {
                var value = record._[fieldName];
                var result = callback.call(_this, value, record._);
                if (result !== undefined) {
                    record._[fieldName] = result;
                }
            });
        };

        /**
        * sql
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        Table.prototype.sql = function (options) {
            var _this = this;
            var sql = '';
            var values = [];

            if (!('db' in options)) {
                throw new TypeError();
            }
            if (!('table' in options)) {
                throw new TypeError();
            }

            this._fields = options.fields || [];

            if (options.relations && options.relations.length && options.relations.forEach) {
                options.relations.forEach(function (relation) {
                    _this._relations.push(new Relation(relation.table, relation.relationalIdMax, relation.relationalIdFieldName, relation.selfIdFieldName));
                });
            }

            this.data.forEach(function (data, i) {
                var line = [];

                line.push('' + (i + 1));

                _this._fields.forEach(function (fieldName) {
                    line.push('' + data._[fieldName]);
                });

                values.push("('" + line.join("','") + "')");

                _this._relations.forEach(function (relation) {
                    var ri = 0;
                    var l = relation.relationalIdMax;
                    var rValue;
                    for (; ri < l; ri++) {
                        // フィールドが存在するかどうか
                        if (rValue = data._[relation.table + ':' + ri]) {
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
            sql += '# at ' + moment().format('YYYY-MM-DD HH:mm') + '\n';
            sql += '#\n';
            sql += '# ----- ----- ----- ----- ----- ----- ----- ----- ----- ----- #\n\n';

            sql += 'TRUNCATE TABLE `' + options.db + '`.`' + options.table + '`;\n';
            sql += 'ALTER TABLE `' + options.db + '`.`' + options.table + '` AUTO_INCREMENT = 1;\n\n';
            sql += 'INSERT INTO `' + options.db + '`.`' + options.table + '` (`id`, `' + this._fields.join('`,`') + '`) VALUES\n';
            sql += values.join(',\n') + ';';

            this._relations.forEach(function (relation) {
                if (relation.queries.length) {
                    sql += '\n\n\n';
                    sql += 'TRUNCATE TABLE `' + options.db + '`.`' + relation.table + '`;\n';
                    sql += 'ALTER TABLE `' + options.db + '`.`' + relation.table + '` AUTO_INCREMENT = 1;\n\n';
                    sql += 'INSERT INTO `' + options.db + '`.`' + relation.table + '` (`id`, `' + relation.relationalIdFieldName + '_id`, `' + relation.selfIdFieldName + '_id`) VALUES\n';
                    sql += relation.queries.join(',\n') + ';';
                }
            });

            return new SQL(sql);
        };
        return Table;
    })();
    etcsv.Table = Table;

    /**
    * SQL
    *
    * @version 0.2.0
    * @since 0.2.0
    *
    */
    var SQL = (function () {
        /**
        * constructor
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        function SQL(query) {
            this.query = query;
        }
        /**
        * output
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        SQL.prototype.output = function (filePath) {
            fs.writeFile(filePath, this.query);
        };
        return SQL;
    })();
    etcsv.SQL = SQL;

    /**
    * Record
    *
    * @version 0.2.0
    * @since 0.1.0
    *
    */
    var Record = (function () {
        function Record() {
            /**
            * _
            *
            * @version 0.2.0
            * @since 0.1.0
            *
            */
            this._ = {};
        }
        /**
        * set
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        Record.prototype.set = function (fieldName, value) {
            this._[fieldName] = value;
        };

        /**
        * get
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        Record.prototype.get = function (fieldName) {
            if (fieldName in this._) {
                return this._[fieldName];
            } else {
                return null;
            }
        };
        return Record;
    })();

    /**
    * Relation
    *
    * @version 0.2.0
    * @since 0.2.0
    *
    */
    var Relation = (function () {
        /**
        * constructor
        *
        * @version 0.2.0
        * @since 0.2.0
        *
        */
        function Relation(relationshipTableName, relationalIdMax, relationalIdFieldName, selfIdFieldName) {
            /**
            * queries
            *
            * @version 0.2.0
            * @since 0.2.0
            *
            */
            this.queries = [];
            this.table = relationshipTableName;
            this.relationalIdMax = +relationalIdMax || 1000;
            this.relationalIdFieldName = relationalIdFieldName;
            this.selfIdFieldName = selfIdFieldName;
        }
        return Relation;
    })();

    

    
})(etcsv || (etcsv = {}));

(module).exports = etcsv;
