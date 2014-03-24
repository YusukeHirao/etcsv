/// <reference path="DefinitelyTyped/node/node.d.ts" />
var etcsv;
(function (etcsv) {
    var path = require('path');
    var CSVConverter = require("csvtojson").core.Converter;
    var deferred = require('deferred');

    var parent = (module).parent;
    var baseDir = path.dirname(parent.filename);

    function imports(filePath) {
        var table = new Table();
        var absPath = path.resolve(path.join(baseDir, filePath));
        var csvConverter = new CSVConverter();
        csvConverter.on('end_parsed', function (json) {
            table.isLoaded = true;
            table.data = json.csvRows;
            var fieldName;
            console.log(table.data[0]);
        });
        csvConverter.from(absPath);
        return table;
    }
    etcsv.imports = imports;

    var Table = (function () {
        function Table() {
            this.isLoaded = false;
            this.data = {};
        }
        return Table;
    })();
    etcsv.Table = Table;

    var Column = (function () {
        function Column() {
        }
        return Column;
    })();
    etcsv.Column = Column;

    var Record = (function () {
        function Record() {
        }
        return Record;
    })();
    etcsv.Record = Record;
})(etcsv || (etcsv = {}));

(module).exports = etcsv;
