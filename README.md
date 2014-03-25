# etcsv

**etcsv(.js)** is node.js library to edit a table for CSV database.

"Editing Table for **CSV**"

[![Code Climate](https://codeclimate.com/github/YusukeHirao/etcsv.png)](https://codeclimate.com/github/YusukeHirao/etcsv)

## Install

```sh
$ npm install etcsv
```

## Usage

```javascript
var etcsv = require('etcsv');

var table = etcsv.imports('foo.csv');

table.setByFieldName('field-name', function (value, thisRecord, thisColumn) {
	return value.replace(/\n/, '<br>');
});

table.save(); // overwrite save
table.saveAs('newFile.csv'); // save as new file
```

## etcsv Methods

### `etcsv.imports(filePath:String):etcsv.Table`

**Warning:** Sync (**not async**) process. This is returned an instance of the `etcsv.Table` Class.

```javascript
var table = etcsv.imports('foo.csv');
```

## Table Class Methods

```javascript
var table = etcsv.imports('foo.csv');
```

### `table.setByFieldName(fieldName:String, callback:Function):void`

This is fired records for set field name every time callback process. By returning value to the callback function, edit a value of that field.
If return `undefined`, or _does not return_ a value, a field value is **not changed**.  But, if return `null` or `0`, a field value will be **overwritten** by it.

```javascript
table.setByFieldName('field-name', function (value, thisRecord) {
	return value.replace(/\n/, '<br>');
});
```
