# etcsv

**etcsv(.js)** is node.js library to edit table for CSV database.

"**e**diting **t**able for **csv**"

[![Code Climate](https://codeclimate.com/github/YusukeHirao/etcsv.png)](https://codeclimate.com/github/YusukeHirao/etcsv)

## Install

```sh
$ npm install etcsv
```

## Usage

```javascript
var etcsv = require('etcsv');

var table = etcsv.imports('foo.csv');

// To edit every records
table.setByColumns('column-name', function (value, thisRecord, thisColumn) {
	return value.replace(/\n/, '<br>');
});

table.save(); // overwrite save
table.saveAs('newFile.csv'); // save as new file
```
