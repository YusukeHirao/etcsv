/// <reference path="DefinitelyTyped/node/node.d.ts" />
var etcsv;
(function (etcsv) {
    var fs = require('fs');
    var path = require('path');
    var iconv = require('iconv');

    var parent = (module).parent;
    var baseDir = path.dirname(parent.filename);

    function imports(filePath, charset) {
        var csv = new CSV(filePath, charset);
        var table = csv.toTable();
        return table;
    }
    etcsv.imports = imports;

    var CSV = (function () {
        function CSV(filePath, charset) {
            var absPath = path.resolve(path.join(baseDir, filePath));
            var text = fs.readFileSync(absPath);
            var conv;
            if (charset) {
                conv = new iconv.Iconv(charset, 'UTF-8//TRANSLIT//IGNORE');
                text = conv.convert(text).toString();
            }
            this.text = text.toString();
            this._parse();
        }
        CSV.prototype.toTable = function () {
            var table = new Table();
            var i = 0;
            var l = this.rows.length;
            var k = 0;
            var kL = this.header.length;
            var record;
            var v;
            for (; i < l; i++) {
                record = new Record;
                for (; k < kL; k++) {
                    record._[this.header[k]] = this.rows[i][k];
                }
                table.data.push(record);
                k = 0;
            }
            return table;
        };

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

    var Table = (function () {
        function Table() {
            this.data = [];
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
        return Table;
    })();
    etcsv.Table = Table;

    var Column = (function () {
        function Column() {
        }
        return Column;
    })();

    var Record = (function () {
        function Record() {
            this._ = {};
        }
        return Record;
    })();
})(etcsv || (etcsv = {}));

(module).exports = etcsv;
