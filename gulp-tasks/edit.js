/**
 * @fileoverview Gulp Task for copy edit automation for the /web Git repo.
 *
 * @author Joe Medley <jmedley@google.com>
 */

'use strict';

const path = require('path');
const gulp = require('gulp');
const test = require('./test');
const chalk = require('chalk');
const editUtils = require('./editUtils');


/******************************************************************************
 * Constants
 *****************************************************************************/


const EXTENSIONS_TO_SKIP = ['.css', '.vtt', '.xml', '.yaml'];

const DICTIONARY = 'src/data/dictionary.json';
const APPROVED_USAGE = 'src/data/approvedUsage.json';

/******************************************************************************
 * Helper Functions
 *****************************************************************************/

/**
 * Returns a simplified clone of a file's contents to make content
 * verification easier.
 *
 * @param {string} filename The file to regularize
 */
function getRegularizedFile(fileName) {
  if (GLOBAL.WF.options.verbose) { 
    gutil.log(' ', ('Regularizing file named ' + fileName + '.'));
  }
  const contents = test.readFile(fileName);
  const fragments = contents.split(/(?!  )\s\s/g);
  let regularContent = '';
  fragments.forEach(function(fragment, index, array) {

    //Skip metadata
    if (fragment.indexOf("project_path") >= 0) { return; }
    if (fragment.indexOf("book_path") >= 0 ) { return; }
    if (fragment.indexOf("description:") == 0 ) { return; }
    if (fragment.indexOf("wf_update_on:") >= 0) { return; }
    if (fragment.indexOf("wf_published_on:") >= 0) { return; }
    if (fragment.indexOf("{% include ") >= 0) { return; }

    //Skip code samples
    if (editUtils.isCodeSample(fragment)) { return; }

    //Merge paragraph lines
    fragment = fragment.replace(/(.)($)/gm, function(p1, p2) {
      if (".".indexOf(p1) >= 0) {
        return (p1 + "  ");
      } else if (p1.match(/[\w\d]/i)) {
        return (p1 + " ");
      } else {
        return p1;
      }
    })

    regularContent += fragment;
  })
  return regularContent;
}

/**
 * Verifies the correct formatting of certain terms.
 *
 * @param {string} filename The file to regularize
 */

function verifyUsage(fileContent, fileName, options) {
  return new Promise(function(resolve, reject) {
    let msg;
    options.usage.forEach(function(rule) {
    	if (wfHelper.getRegEx(rule.regEx, fileContent, null) !== null) {
    		msg = `\n\tEditing Required: ` + item.message;
    		test.logWarning(filename, msg);
    	}
    });
    resolve();
  })
}

/******************************************************************************
 * Primary File Edits
 *****************************************************************************/

function editFile(filename, options) {
	let filenameObj = path.parse(filename.toLowerCase());
  // START HERE: Files meeting this condition do not need to be tested.
  // (filenameObj.dir === 'src/content/en')
  // How do I do it?
	if (EXTENSIONS_TO_SKIP.indexOf(filenameObj.ext) === -1) {
    let regFile = getRegularizedFile(filename);
    return Promise.all([
      verifyUsage(regFile, filename, options)
    ]);
  }
}

/******************************************************************************
 * Gulp Edit Task
 *****************************************************************************/

 gulp.task('edit', function(callback) {
  if (GLOBAL.WF.options.testPath) {
    gutil.log('Edit assistance for:', chalk.cyan(GLOBAL.WF.options.testPath));
    gutil.log('');
  }
  GLOBAL.WF.options.testAll = true;
  GLOBAL.WF.options.testPath = './src/content/en';
  let opts = {
  	dictionary: test.parseJSON(DICTIONARY, test.readFile(DICTIONARY)),
  	usage: test.parseJSON(APPROVED_USAGE, test.readFile(APPROVED_USAGE))
  }
  return test.getFiles()
  .then(function(files){
    return Promise.all(files.map(function(filename) {
      return editFile(filename, opts);
    }));
  })
  .catch(function(ex) {
    let msg = `A critical gulp task exception occured: ${ex.message}`;
    test.logError('gulp-tasks/test.js', null, msg, ex);
  })
  .then(test.printSummary)
  .then(test.throwIfFailed);
});