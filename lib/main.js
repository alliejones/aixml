#!/usr/bin/env node

var csv = require('csv');
var fs = require('fs');
var _ = require('underscore');

var argv = require('optimist')
           .usage('aixml [csv filename] [output xml filename (optional)]')
           .demand(1)
           .argv;

var variables = [];
var rowList = [];

// name of a CSV field, its value will be used for the variable set names
var setNameKey;

function init() {
  getTpl();
}

function getTpl() {
  fs.readFile(__dirname+'/tpl/variableLibrary.xml', 'utf8', function (err, data) {
    if (err) { console.log(err) };
    parseCSV(data);
  });
}

function parseCSV(tpl) {
  csv().from.stream(fs.createReadStream(argv._[0]))

  .on('record', function(data, index) {
    var rowObj = {};

    // Use first row as headers/variable names
    if (index === 0) {
      variables = _.map(data, function(name) {
        return name.replace(/[^0-9a-zA-Z]/g, '');
      });
      setNameKey = setNameKey ? setNameKey : variables[0];
      return null;
    }

    _.each(variables, function(xvar, index) {
      rowObj[xvar] = _.escape(data[index]);
    });

    rowList.push(rowObj);
  })

  .on('end', function(count) {
    generateXML(tpl, { variables: variables, rows: rowList, setNameKey: setNameKey });
    console.log("Rows read: " + count + ".");
  })

  .on('error', function(error) {
    console.log(error.message);
  });
}

function generateXML(tpl, data) {
  var compiledTpl = _.template(tpl);
  writeFile(compiledTpl(data));
}

function writeFile(data) {
  var filename = 'output.xml';
  fs.writeFile(filename, data, function (err) {
    if (err) throw err;
    console.log("XML file '" + filename + "' created.");
  });
}

init();