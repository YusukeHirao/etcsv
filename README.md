# etcsv

**etcsv(.js)** is node.js library to edit table for CSV database.

## Install

```sh
$ npm install etcsv
```

## How to use

```javascript
var etcsv = require('etcsv');

var table = etcsv.import('foo.csv');

// To edit every records
table.setByColumns('column-name', function (value, thisRecord, thisColumn) {
	return value.replace(/\n/, '<br>');
});

table.save(); // overwrite save
table.saveAs('newFile.csv'); // save as new file
```
