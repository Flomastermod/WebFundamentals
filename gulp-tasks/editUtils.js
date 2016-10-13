'use strict';

var fs = require('fs');
var gutil = require('gulp-util');
var test = require('./test');
var wfHelper = require('./wfHelper');

var UC_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789`';
var LC_LETTERS = 'abcdefghijklmnopqrstuvwxyz0123456789`';
var TITLE_LC_WORDS = ['a', 'against', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from',
                'in', 'into', 'near', 'nor', 'of', 'on', 'onto', 'or', 'out', 'the', 'to', 'with'];

// var UC_WORDS = ['API', 'CSSOM', 'DR', 'FAQ', 'FCM', 'GIF', 'GIFs', 'HTML', 'HTTP', 'HTTPS', 'I', 'ID', 'NPN', 'SPDY', 'TL', 'TLS', 'UI', 'VAPID'];
// ToDo: Replace with external json file.

var TOKEN = '%%';
// var DICTIONARY = [TOKEN, 'absolute-positioned', 'Account Chooser', 'API', 'APIs', 'Application panel', 'Arduino', 'Bluetooth', 'Canary', 'Chrome', 
//                   'Clear Data', 'Command Menu', 'Credential Management API', 'CSS', 'CSSOM', 'Device Mode', 
//                   'DeviceMotionEvent', 'DevTools', 'DOM', 'Encrypted Media Extensions', 'FAQ', 'FCM', 'font-display',
//                   'Foreign Fetch', 'FormData', 'Geolocation', 'GIF', 'HPKP', 'HTML', 'HTTP', 'HTTPS', 'I', 'ID', 'iframe', 'initTouchEvent',
//                   'IndexedDB', 'Inspect Devices', 'Intel', 'Intel Edison', 'IntersectionObserver', 'IoT',
//                   'JavaScript', 'Layout Mode', 'MessageChannel','MediaStream', 'NPM', 'Origin Trial', 
//                   'PaymentRequest', 'Payment Request API', 'Progressive Web App', 'Progressive Web Apps',
//                   'Remote Debugging', 'requireInteraction', 'Resources panel', 
//                   'RTCCertificate', 'RTCPeerConnection', 'Sass', 'scroll-behavior', 'SharedWorkers', 'SPDY', 
//                   'Style Panel', 'Styles pane', 'SVGElement.offset', 'Timeline panel',
//                   'TL;DR', 'TLS', 'UI', 'URL', 'URLs', 'USB', 'VAPID', 'Web Animations', 'Web Push Protocol', 
//                   'Web Starter Kit', 'Windows', 'X-Frame-Options', 'XMLHttpRequestProgressEvent'];

var DICTIONARY = JSON.parse(fs.readFileSync('gulp-tasks/dictionary.json', 'utf8'));
var RE_WORDBREAK = /[: ]{1}/;

function isCodeSample(chunk) {
	if (chunk == "    # Writing an Article {: .page-title }") {
	}
 	var reIndent = /( {4}).+/g;
	var lines = (chunk.match(/\n/g)||['']).length;

	// var indents = chunk.match(reIndent).length;
	var matches = chunk.match(reIndent);
	var indents;
	if (matches) {
		indents = matches.length;
	} else {
		indents = 0;
	}
	return (lines == indents);
}

function _stripOrdinal(title) {
	title = title.replace(/\d\d?\./, '');
	return title.trim();
}

function _regularizePunctuation(title) {
	title = title.trim();
	// Remove end punctuation
	var titleLen = title.length -1;
	if ('.?!'.indexOf(title.charAt(titleLen)) >= 0 ) {
		title = title.substring(0, titleLen);
	}

	// Replace specific internal punctuation
	title = title.replace(/[,\/]{1}/g, '');

	// Deal with Parens and quotes
	var reParens = /[\(\[\{"“][^:]+:?[^:\}\]\)]+[\}\]\)"”]/;
	var parens = title.match(reParens);
	// gutil.log(parens);
	if (parens) {
		if (parens.indexOf(':') >= 0) {
			title = title.replace(parens[0], TOKEN);
		} else {
			var newTerm = (1, (parens[0].length - 1));
			title = title.replace(parens[0], newTerm);
		}
	}

	return title.trim();
}


function _regularizeCodeIdentifiers(title) {
	var reCodeIDs = [ /([a-zA-Z]+)\.[a-zA-Z]+(?:\(\))?/, //object.member
	                  /\.?[^\. ]+\(\)/, // method name
	                  /\<\w+(?: \w+=[\w'"]+)*\>/, //HTML tag with attribute
	                  /[_*]{1,2}[\w-]+[_*]{1,2}/, // emphasized word
	                  /@\w+\b/ //CSS @ queries
	]

	reCodeIDs.forEach(function(re, index, reCodeIDs) {
		var matches = title.match(re);
		if (matches) {
			if (title.indexOf(matches[0]) == 0) {
				title = title.replace(matches[0], 'Holder');
			} else {
				title = title.replace(matches[0], TOKEN);
			}
		}
	});
	return title;
}

function _regularizeTitle(title) {
	title = _stripOrdinal(title);
	title = _regularizeCodeIdentifiers(title);
	title = _regularizePunctuation(title);
	return title;
}

function _startsWithDictWord(title) {
	title = title.trim();
	var firstBreak = title.search(RE_WORDBREAK);
	var firstWord = title.substring(0, firstBreak).trim();
	var firstChar = title.charAt(0);
	// gutil.log("[FIRSTWORD]", firstWord);
	var candidates = DICTIONARY.filter(function(term, index, dictionary) {
		if ((term.indexOf(firstChar) == 0) && (firstWord.length <= term.length)){
			return true;
		} else {
			return false;
		}
	});
	// gutil.log("[CANDIDATES]", candidates);
	var retVal = null;
	candidates.forEach(function(candidate, index, candidates) {
		// gutil.log("Checking candidates");
		if (title.indexOf(candidate) == 0) {
			retVal = candidate;
		}
	});
	// gutil.log("returning", retVal);
	return retVal;
}

function _sliceFirstWord(sentence, word) {
	var firstBreak = sentence.search(RE_WORDBREAK);
	if (firstBreak < 0) { return ''; }
	word = word || sentence.slice(0, firstBreak);
	sentence = sentence.replace(word, '');
	return sentence.trim();
}

function verifyTitle(title, inFile) {
	if (title.indexOf('`') >= 0) {
		var msg = '\n\t' + title +
		          '\n\tTitles should not contain code formatting. You may need ' +
		          'to add the term to the dictionary to pass additional tests.';
		test.logError(inFile, msg);
	} else {
		if (title[0].indexOf(".page-title") >= 0) {
			if (!isTitleCase(title[1])) {
				var msg = '\n\t' + title + '\n\tPage title must be title case.';
				test.logError(inFile, msg);
			}
		} else {
			if (!isSentenceCase(title[1])) {
				var msg = '\n\t' + title + '\n\tSection title must be sentence case.';
				test.logError(inFile, msg);
		}
	  }
	}
}

function isTitleCase(title) {
	var retVal = true;
	title = _regularizeTitle(title);


	// Check if title is multi-part
	var matches = title.match(/\b\s?([:\.!\?\-]\s{1,2})\b/);
	if (matches) {
		// If it is, treat each part separately
		var pieces = title.split(matches[0]);
		for (let piece of pieces) {
			retVal = isTitleCase(piece.trim());
			if (!retVal) { return retVal; }
		}
	} else {
		var shrinkingTitle = title;
		while (shrinkingTitle != '') {

			//Check dictionary words
			var startsWith = _startsWithDictWord(shrinkingTitle);
			if (startsWith) {
				shrinkingTitle = _sliceFirstWord(shrinkingTitle, startsWith);
				continue;
			}

			//Check for words that must always be lc
			if (shrinkingTitle != title) { //Because the first word must be UC.
				var nextBreak = shrinkingTitle.search(RE_WORDBREAK);
				var nextWord = shrinkingTitle.slice(0, nextBreak).trim();
				if (TITLE_LC_WORDS.indexOf(nextWord) >= 0) {
					shrinkingTitle = _sliceFirstWord(shrinkingTitle);
					continue;
				}
			}

			//Check case of first character
			var firstChar = shrinkingTitle.charAt(0);
			if (UC_LETTERS.indexOf(firstChar) >= 0) {
				shrinkingTitle = _sliceFirstWord(shrinkingTitle);
				continue;
			} else {
				retVal = false;
				break;
			}
		}
	}
	return retVal;
}

function isSentenceCase(title) {
	var retVal = true;
	title = _regularizeTitle(title);


	// Check if title is multi-part
	var matches = title.match(/\b\s?([;\.!\?\-]\s{1,2})\b/);
	if (matches) {
		// If it is, treat each part separately
		var pieces = title.split(matches[0]);
		for (let piece of pieces) {
			retVal = isSentenceCase(piece.trim());
			if (!retVal) { return retVal; }
		}
	} else {
		title = title.replace(':', '');
		var shrinkingTitle = title;

		// In sentence case check the first word separately

		// Check dictionary words
		var startsWith = _startsWithDictWord(shrinkingTitle);
		if (startsWith) {
			shrinkingTitle = _sliceFirstWord(shrinkingTitle, startsWith);
		} else {

			// Check case of first character
			var firstChar = shrinkingTitle.charAt(0);
			if (UC_LETTERS.indexOf(firstChar) >= 0) {
				shrinkingTitle = _sliceFirstWord(shrinkingTitle);
			} else {
				return false;
			}
		}


		while (shrinkingTitle != '') {

			// Check dictionary words
			var startsWith = _startsWithDictWord(shrinkingTitle);
			if (startsWith) {
				shrinkingTitle = _sliceFirstWord(shrinkingTitle, startsWith);
				continue;
			}

			// Check case of first character
			var firstChar = shrinkingTitle.charAt(0);
			if (LC_LETTERS.indexOf(firstChar) >= 0) {
				shrinkingTitle = _sliceFirstWord(shrinkingTitle);
				continue;
			} else {
				retVal = false;
				break;
			}
		}
	}
	return retVal;
}


exports.isTitleCase = isTitleCase;
exports.isSentenceCase = isSentenceCase;
exports.isCodeSample = isCodeSample;
exports.verifyTitle = verifyTitle