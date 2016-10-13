'use strict';

var fs = require('fs');
var gulp = require('gulp');
var chalk = require('chalk');
var glob = require('globule');
var moment = require('moment');
var jsYaml = require('js-yaml');
var gutil = require('gulp-util');
var wfHelper = require('./wfHelper');
var editUtils = require('./editUtils');
var test = require('./test');

var APPROVED_VOCABULARY = [
  { message: '"DevTools" must be spelled and capitalized as shown.', regEx: /(?!DevTools)([dD]ev\s?[tT]ools)/ },
  { message: '"Home screen" is two words.', regEx: /homescreen/ },
  { message: '"Mobile" should not be capitalized unless it begins a sentence.', regEx: /Mobile/ },
  { message: '"Website" is one word, not two.', regEx: /[Ww]eb [Ss]ite/ },
  { message: '"Service worker" should not be capitalized.', regEx: /(?!service worker)([Ss]ervice [Ww]orker)/ },
  { message: '"HTTP and HTTPS" must be capitalized.', regEx: /(?! http-)(?![-/]https?)(?![\S\s]https?:)(?![\S\s]HTTPS?[^s][\S\s])[\S\s]([Hh][Tt][Tt][Pp][Ss]?)[\S\s]/g },
  { message: 'There must be a space between "Chrome" and the version number.', regEx: /(?!wf_tags:\s(?:[\w\d]+,?)*,?[Cc]hrome\d\d)[Cc]hrome\d\d/ },
  { message: 'Don\'t use "version" in Chrome version numbers. Use "Chrome ##" instead.', regEx: /(?!wf_tags:\s(?:[\w\d]+,?)*,?[Cc]hrome\d\d)[Cc]hrome\s[Vv]ersion\s\d\d/g },
  { message: '"Chrome" must be capitalized.', regEx: /[^-/]\b(chrome)\b[^-/:]/ },
  { message: 'Don\'t use "M##" to indicate a Chrome release. Use "Chrome ##" instead.', regEx: /[^,/][Cc]hrome\d\d/g },
];
// var APPROVED_VOCABULARY = JSON.parse(fs.readFileSync('gulp-tasks/vocab-tests.json', 'utf8'));

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
  var contents = fs.readFileSync(fileName, 'utf8');
  // var reWfDates = /{#\s+wf_\w+:\s\d{4}(?:-\d{1,2}){2}\s+#}/;
  // var reInclude = /{%\s+include\s+"web\/_shared\/contributors\/\w+\.html"\s+%}/;
  // var reTitle = /^#{1,6}\s+([^{]+)(?:{: +\.page-title +})?/;
  // var reTlDr = /#+\s+TL;DR\s+{:\s+\.hide-from-toc\s+}/;

  var fragments = contents.split(/(?!  )\s\s/g);
  var regularContent = '';
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

    // Verify case of titles
    // var title = fragment.match(reTitle);
    // if (title) {
    //   editUtils.verifyTitle(title, fileName);
    // }

    regularContent += fragment;
  })
  return regularContent;
}

function getMarkdownFiles() {
  if (GLOBAL.WF.options.verbose) { 
    gutil.log(' ', 'Getting markdown files...');
  }
  return test.getFilelist('md');
}

function verifyVocabulary(fileContent, fileName) {
  return new Promise(function(resolve, reject) {
    var msg;
    APPROVED_VOCABULARY.forEach(function(item) {
      if (wfHelper.getRegEx(item.regEx, fileContent, null) !== null) {
        msg = '\n\tEditing Required: ' + item.message ;
        test.logWarning(fileName, msg);
      }
    });
    resolve();
  })
}

gulp.task('edit-assist', function(callback) {
  if (GLOBAL.WF.options.testPath) {
    gutil.log('Edit assistance for:', chalk.cyan(GLOBAL.WF.options.testPath));
    gutil.log('');
  }
  var files = getMarkdownFiles();
  files.forEach(function(file, index, files) {
    var regFile = getRegularizedFile(file);
    return Promise.all([
      verifyVocabulary(regFile, file)
    ]);
  })
})













