'use strict';

var gulp = require('gulp');
var gutil = require('gulp-util');
var editUtils = require('./editUtils');

var CODE_SAMPLE_TESTS = [
	{ expected: true, test: "    .containter {\n      width: 100%;\n    }\n"},
	{ expected: false, test: "   .containter {\n     width: 100%;\n   }\n"},
	{ expected: false, test: "   .containter {\n      width: 100%;\n    }\n"},
	{ expected: true, test: "    # Writing an Article {: .page-title }\n"},
	{ expected: true, test: "    # Writing an Article {: .page-title }"}
]

// Cache query options coming to Chrome… soon - title and section

var PAGE_TITLE_TESTS = [
	{ expected: true, test: "This Is a Correct Title One"},
	{ expected: false, test: "this Is an Incorrect Title One"},
	{ expected: false, test: "This is Another incorrect Title One"},
	{ expected: true, test: "Re-rastering Composited Layers on Scale Change"},
	{ expected: true, test: " Builder "},
	{ expected: true, test: "DevTools Digest, September 2016: Perf Roundup"},
	{ expected: true, test: "Use of initTouchEvent Is Removed"},
	{ expected: false, test: "Are there any restrictions to using the API?"},
	{ expected: true, test: "Muted Autoplay on Mobile: Say Goodbye to Canvas Hacks and Animated GIFs!"},
	{ expected: true, test: "Flexbox Gets New Behavior for absolute-positioned Children"},
	{ expected: true, test: "Goodbye Short Sessions: A Proposal for Improving Cookie Management"},
	{ expected: true, test: "ResizeObserver"},
	{ expected: true, test: "It’s Like document.onresize for Elements"},
	{ expected: false, test: "ResizeObserver: It’s like document.onresize for elements"},
	{ expected: true, test: "ResizeObserver . It’s Like document.onresize for Elements"},
	{ expected: true, test: "ResizeObserver- It's Like document.onresize for Elements"},
	{ expected: true, test: "Getting Started with Progressive Web Apps"}
	// { expected: true, test: "ResizeObserver? It’s Like document.onresize for Elements"},
	// { expected: true, test: "What’s New with KeyboardEvents? Keys and Codes!"}
]
//Goodbye Short Sessions: A Proposal for Using Service Workers to Improve Cookie Management on the Web
// APPROACH split into two titles.
var TITLE_TESTS = [,
	{ expected: true, test: "This is a correct title two"},
	{ expected: false, test: "This Is an Incorrect Title Two"},
	{ expected: false, test: "this is another incorrect title two"},
	{ expected: false, test: "this Is also incorrect"},
	{ expected: true, test: " Builder "},
	{ expected: true, test: "Origin Trial token"},
	{ expected: true, test: "Deprecate SVGSVGElement.viewPort"},
	{ expected: true, test: "How do I fix this?"},
	{ expected: true, test: "Use of `initTouchEvent` is removed"},
	{ expected: true, test: "Remove MediaStream ended event and attribute and onended attribute"},
	{ expected: true, test: "Are there any restrictions to using the API?"},
	{ expected: true, test: "2. Show the native UI with .show()"},
	{ expected: false, test: "Real-world Uses"},
	{ expected: true, test: 'What about “Clear Data”?'},
	{ expected: true, test: 'iframe magic'},
	{ expected: true, test: 'KeyboardEvent.keyIdentifier attribute removed'},
	{ expected: true, test: 'Putting it all together: where clients look for a response'},
	{ expected: true, test: 'FileError deprecation warning'},
	{ expected: false, test: 'Streams? or app shells?'},
	{ expected: true, test: 'Remove support for X-Frame-Options in <meta> tags'},
	{ expected: true, test: 'Cmd/Ctrl+Shift+P to bring up the Command Menu'},
]

function reportTest(testName, result, test) {
	// gutil.log(result);
	if (result == test.expected) {
		gutil.log("[PASSED] ", test.test);
	} else {
		gutil.log("[FAILED]", testName, "returned", result, "for:", test.test);
	}
}

gulp.task('test-edits', function(callback) {

	CODE_SAMPLE_TESTS.forEach(function(test, index, array) {
		var result = editUtils.isCodeSample(test.test);
		reportTest("isCodeSample()", result, test)
	});

	PAGE_TITLE_TESTS.forEach(function(test, index, array) {
		var result = editUtils.isTitleCase(test.test);
		reportTest("isTitleCase()", result, test);
	});

	TITLE_TESTS.forEach(function(test, index, array) {
		var result = editUtils.isSentenceCase(test.test);
		reportTest("isSentenceCase()", result, test)
	});

});