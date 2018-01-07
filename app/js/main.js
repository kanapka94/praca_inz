(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var POPUP = {
    config: {
        msgTime: {
            error: 4000,
            warning: 3200,
            success: 2500
        }
    },
    showAlert: function showAlert(msgClass, title, text) {
        var $title = $('.alert-box__title'),
            $message = $('.alert-box__message'),
            delayTime = 0;
        if (msgClass === 'error') {
            delayTime = POPUP.config.msgTime.error;
        } else if (msgClass === 'warning') {
            delayTime = POPUP.config.msgTime.warning;
        } else {
            delayTime = POPUP.config.msgTime.success;
        }
        $title.html(title);
        $message.html(text);
        $('.alert-box').addClass(msgClass).addClass('show').delay(delayTime).queue(function (next) {
            $(this).removeClass('show').removeClass(msgClass);
            $title.html('');
            $message.html('');
            next();
        });
    }
};

module.exports = {
    showAlert: POPUP.showAlert
};

},{}],2:[function(require,module,exports){
'use strict';

var detector = {
    config: {
        wrapperSelector: '.main-wrapper',
        htmlErrorMsg: '<div><h2 class="detect-browser-text">System szyfrujący obecnie działa <span class="important">tylko</span> na przeglądarkach:<br>Google Chrome oraz Mozilla Firefox</h2></div>'
    },
    detect: function detect() {
        var isChromium = window.chrome,
            winNav = window.navigator,
            vendorName = winNav.vendor,
            isOpera = winNav.userAgent.indexOf('OPR') > -1,
            isIEedge = winNav.userAgent.indexOf('Edge') > -1,
            isIOSChrome = winNav.userAgent.match('CriOS'),
            isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
            isMobileDevice = function isMobileDevice() {
            return typeof window.orientation !== 'undefined' || navigator.userAgent.indexOf('IEMobile') !== -1;
        };

        if (isChromium !== null && isChromium !== undefined && vendorName === 'Google Inc.' && isOpera == false && isIEedge == false) {} else {
            if (navigator.userAgent.toLowerCase().indexOf('firefox') <= -1) {
                detector.displayErrorMsg();
            }
        }
    },
    displayErrorMsg: function displayErrorMsg() {
        $(detector.config.wrapperSelector).html(detector.config.htmlErrorMsg);
    },
    init: function init() {
        detector.detect();
    }
};

module.exports = {
    detect: detector.init
};

},{}],3:[function(require,module,exports){
'use strict';

var _alertBox = require('./alert-box');

var _alertBox2 = _interopRequireDefault(_alertBox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

"use strict";

var SETTINGS = {
    uploadButtonText: 'Zaszyfruj i wyślij plik'
};

var CRYPTO_ENGINE = {
    passCrypto: null,
    aesKey: null,
    generatedIV: null,
    config: {
        setupAjaxHeader: function setupAjaxHeader() {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });
        },
        loadPublicKey: function loadPublicKey() {
            $.ajax({
                type: 'POST',
                url: 'getPubKey',
                dataType: 'json',
                success: function success(response) {
                    CRYPTO_ENGINE.passCrypto.setPublicKey(response);
                },
                error: function error(response) {
                    console.error(response);
                }
            });
        },
        generateAESKey: function generateAESKey() {
            window.crypto.subtle.generateKey({
                name: "AES-GCM",
                length: 128
            }, true, ["encrypt", "decrypt"]).then(function (key) {
                CRYPTO_ENGINE.aesKey = key;
                _alertBox2.default.showAlert('success', '', 'Bezpieczny klucz wygenerowany!');
            }).catch(function (err) {
                console.error(err);
            });
        },
        exportAESKey: function exportAESKey(fileName, fileType, data, encryptedIV) {
            window.crypto.subtle.exportKey("jwk", CRYPTO_ENGINE.aesKey).then(function (keydata) {
                var jsonString = JSON.stringify(keydata);
                var encryptedKey = CRYPTO_ENGINE.encryptRSA(jsonString);
                APP.uploadFile(fileName, fileType, data, encryptedKey, encryptedIV);
            }).catch(function (error) {
                _alertBox2.default.showAlert('error', 'Błąd: ', error);
                console.error(error);
            });
        }
    },
    detectBrowserConfig: function detectBrowserConfig() {
        if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        }
        if (!window.crypto || !window.crypto.subtle) {
            _alertBox2.default.showAlert('error', 'Błąd: ', "Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.");
            throw new Error("Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.");
            return;
        }
    },
    encryptRSA: function encryptRSA(data) {
        return CRYPTO_ENGINE.passCrypto.encrypt(data);
    },
    encryptAES: function encryptAES(fileBytesArray, fileName, fileType) {
        var arraysCount = 12;
        CRYPTO_ENGINE.generatedIV = window.crypto.getRandomValues(new Uint8Array(arraysCount));
        window.crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: CRYPTO_ENGINE.generatedIV
        }, CRYPTO_ENGINE.aesKey, fileBytesArray).then(function (encrypted) {
            var bytesConvertedToBase64String = base64js.fromByteArray(new Uint8Array(encrypted));
            var encryptedIV = CRYPTO_ENGINE.encryptRSA(base64js.fromByteArray(CRYPTO_ENGINE.generatedIV));
            var encryptedFileName = CRYPTO_ENGINE.encryptRSA(fileName);
            CRYPTO_ENGINE.config.exportAESKey(encryptedFileName, fileType, bytesConvertedToBase64String, encryptedIV);
        }).catch(function (err) {
            console.error(err);
        });
    },
    init: function init() {
        CRYPTO_ENGINE.detectBrowserConfig();
        CRYPTO_ENGINE.config.setupAjaxHeader();
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.loadPublicKey();
    }
};

var APP = {
    config: {
        createFormObjects: function createFormObjects() {
            var input = '<input type="file" class="encrypt-form__file">';
            var uploadButton = '<div class="btn-wrapper btn-wrapper--upload">\n                    <button type="button" class="btn btn--upload-file">' + SETTINGS.uploadButtonText + '</button>\n                </div>';
            var elements = [input, uploadButton];
            return elements;
        },
        appendForm: function appendForm() {
            var elements = APP.config.createFormObjects();
            var form = $('.encrypt-form');
            elements.forEach(function (element) {
                form.append(element);
            });
        },
        bindUIActions: function bindUIActions() {
            $('.btn--upload-file').click(function () {
                var file = APP.getFormFile();
                if (!file) {
                    _alertBox2.default.showAlert('error', 'Błąd:', 'Plik nie został wczytany!');
                    return;
                }
                APP.encryptAndUpload(file);
            });

            $('.encrypt-form__file').change(function () {
                if ($(this).val() !== '') {
                    CRYPTO_ENGINE.config.generateAESKey();
                    $(this).addClass('file-added');
                    $('.btn-wrapper').css('display', 'flex');
                } else {
                    $(this).removeClass('file-added');
                    $('.btn-wrapper').css('display', 'none');
                }
            });
        }
    },
    getFormFile: function getFormFile() {
        var file = document.querySelector('.encrypt-form__file').files[0];
        return file;
    },
    encryptAndUpload: function encryptAndUpload(file) {

        var reader = new FileReader();
        reader.onload = function () {
            var fileBytesArray = new Uint8Array(reader.result);
            CRYPTO_ENGINE.encryptAES(fileBytesArray, file.name, file.type);
        };
        reader.onerror = function (error) {
            console.log('Błąd: ', error);
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    uploadFile: function uploadFile(fileName, fileType, fileInBase64String, encryptedKey, encryptedIV) {
        $.ajax({
            // xhrFields: {
            //     onprogress: function (e) {
            //         if (e.lengthComputable) {
            //             console.log(e.loaded / e.total * 100 + '%');
            //         }
            //     }
            // },
            type: 'POST',
            url: "saveFile",
            xhr: function xhr() {
                var xhr = $.ajaxSettings.xhr();
                xhr.upload.onprogress = function (e) {
                    // console.log(Math.floor(e.loaded / e.total * 100) + '%');
                };
                return xhr;
            },
            data: {
                "fileName": fileName,
                "fileType": fileType,
                "fileData": fileInBase64String,
                "encryptedKey": encryptedKey,
                "encryptedIV": encryptedIV
            },
            cache: false,
            dataType: 'json',
            success: function success(response) {
                _alertBox2.default.showAlert(response.type, response.title, response.text);
                if (response.type === 'success') {
                    $('.btn--upload-file').css('display', 'none');
                    var refreshBtn = $('<button type="button" class="btn btn--upload-another-file">Odśwież stronę</button>').click(function () {
                        location.reload();
                    });
                    $('.btn-wrapper--upload').append(refreshBtn);
                } else {
                    console.log(response);
                }
            },
            error: function error(xhr, ajaxOptions, thrownError) {
                _alertBox2.default.showAlert('error', '', xhr.responseText);
            }
        });
    },
    init: function init() {
        CRYPTO_ENGINE.init();
        APP.config.appendForm();
        APP.config.bindUIActions();
    }
};

module.exports = {
    initEngine: APP.init
};

},{"./alert-box":1}],4:[function(require,module,exports){
'use strict';

var _browserDetect = require('./lib/browser-detect');

var _browserDetect2 = _interopRequireDefault(_browserDetect);

var _uploadPage = require('./lib/upload-page');

var _uploadPage2 = _interopRequireDefault(_uploadPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

document.addEventListener("DOMContentLoaded", function () {
    _browserDetect2.default.detect();

    if ($('.encrypt-form').length) {
        _uploadPage2.default.initEngine();
    }
});

},{"./lib/browser-detect":2,"./lib/upload-page":3}]},{},[4])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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QUFDQTs7Ozs7O0FBRUEsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsWUFBVztBQUNyRCw0QkFBZ0IsTUFBaEI7O0FBRUEsUUFBSSxFQUFFLGVBQUYsRUFBbUIsTUFBdkIsRUFBK0I7QUFDM0IsNkJBQWEsVUFBYjtBQUNIO0FBQ0osQ0FORCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUE9QVVAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIG1zZ1RpbWUgOiB7XG4gICAgICAgICAgICBlcnJvciA6IDQwMDAsXG4gICAgICAgICAgICB3YXJuaW5nIDogMzIwMCxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiAyNTAwXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNob3dBbGVydDogZnVuY3Rpb24gKG1zZ0NsYXNzLCB0aXRsZSwgdGV4dCkge1xuICAgICAgICB2YXIgJHRpdGxlID0gJCgnLmFsZXJ0LWJveF9fdGl0bGUnKSxcbiAgICAgICAgICAgICRtZXNzYWdlID0gJCgnLmFsZXJ0LWJveF9fbWVzc2FnZScpLFxuICAgICAgICAgICAgZGVsYXlUaW1lID0gMDtcbiAgICAgICAgaWYgKG1zZ0NsYXNzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5lcnJvcjtcbiAgICAgICAgfSBlbHNlIGlmIChtc2dDbGFzcyA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS53YXJuaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICAkdGl0bGUuaHRtbCh0aXRsZSk7XG4gICAgICAgICRtZXNzYWdlLmh0bWwodGV4dCk7XG4gICAgICAgICQoJy5hbGVydC1ib3gnKS5hZGRDbGFzcyhtc2dDbGFzcykuYWRkQ2xhc3MoJ3Nob3cnKS5kZWxheShkZWxheVRpbWUpLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaG93JykucmVtb3ZlQ2xhc3MobXNnQ2xhc3MpO1xuICAgICAgICAgICAgJHRpdGxlLmh0bWwoJycpO1xuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJyk7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3dBbGVydCA6IFBPUFVQLnNob3dBbGVydFxufSIsInZhciBkZXRlY3RvciA9IHtcbiAgICBjb25maWcgOiB7XG4gICAgICAgIHdyYXBwZXJTZWxlY3RvciA6ICcubWFpbi13cmFwcGVyJyxcbiAgICAgICAgaHRtbEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgfSxcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoZGV0ZWN0b3IuY29uZmlnLndyYXBwZXJTZWxlY3RvcikuaHRtbChkZXRlY3Rvci5jb25maWcuaHRtbEVycm9yTXNnKTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGV0ZWN0IDogZGV0ZWN0b3IuaW5pdFxufSIsImltcG9ydCBwb3B1cCBmcm9tICcuL2FsZXJ0LWJveCc7XG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB1cGxvYWRCdXR0b25UZXh0IDogJ1phc3p5ZnJ1aiBpIHd5xZtsaWogcGxpaydcbn1cblxuY29uc3QgQ1JZUFRPX0VOR0lORSA9IHtcbiAgICBwYXNzQ3J5cHRvOiBudWxsLFxuICAgIGFlc0tleTogbnVsbCxcbiAgICBnZW5lcmF0ZWRJVjogbnVsbCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkUHVibGljS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdnZXRQdWJLZXknLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlIDogJ2pzb24nLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHVibGljS2V5KHJlc3BvbnNlKTsgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZW5lcmF0ZUFFU0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZ2VuZXJhdGVLZXkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiAxMjgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICcnLCAnQmV6cGllY3pueSBrbHVjeiB3eWdlbmVyb3dhbnkhJyk7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydEFFU0tleTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmV4cG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5XG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGtleWRhdGEpO1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRLZXkgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoanNvblN0cmluZyk7XG4gICAgICAgICAgICAgICAgQVBQLnVwbG9hZEZpbGUoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRldGVjdEJyb3dzZXJDb25maWcgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jcnlwdG8gJiYgIXdpbmRvdy5jcnlwdG8uc3VidGxlICYmIHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZSA9IHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2luZG93LmNyeXB0byB8fCAhd2luZG93LmNyeXB0by5zdWJ0bGUpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCdCxYLEhWQ6ICcsXCJUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLlwiKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlR3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBlbmNyeXB0UlNBOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLmVuY3J5cHQoZGF0YSk7XG4gICAgfSxcbiAgICBlbmNyeXB0QUVTOiBmdW5jdGlvbiAoZmlsZUJ5dGVzQXJyYXksIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgYXJyYXlzQ291bnQgPSAxMjtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KGFycmF5c0NvdW50KSk7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBmaWxlQnl0ZXNBcnJheVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGVuY3J5cHRlZCkge1xuICAgICAgICAgICAgbGV0IGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcgPSBiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZCkpO1xuICAgICAgICAgICAgbGV0IGVuY3J5cHRlZElWID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGJhc2U2NGpzLmZyb21CeXRlQXJyYXkoQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVikpO1xuICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEZpbGVOYW1lID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGZpbGVOYW1lKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShlbmNyeXB0ZWRGaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudXBsb2FkQnV0dG9uVGV4dH08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbaW5wdXQsIHVwbG9hZEJ1dHRvbl07XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZEZvcm0gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gQVBQLmNvbmZpZy5jcmVhdGVGb3JtT2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9ICQoJy5lbmNyeXB0LWZvcm0nKTtcbiAgICAgICAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFVJQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0Rm9ybUZpbGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1BsaWsgbmllIHpvc3RhxYIgd2N6eXRhbnkhJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldEZvcm1GaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVuY3J5cHQtZm9ybV9fZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICByZXR1cm4gZmlsZTtcbiAgICB9LFxuICAgIGVuY3J5cHRBbmRVcGxvYWQ6IGZ1bmN0aW9uIChmaWxlKSB7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBmaWxlQnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGZpbGVCeXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCgoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbiAgICB9LFxuICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGZpbGVJbkJhc2U2NFN0cmluZywgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgLy8geGhyRmllbGRzOiB7XG4gICAgICAgICAgICAvLyAgICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwICsgJyUnKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6IFwic2F2ZUZpbGVcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgXCJmaWxlTmFtZVwiOiBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICBcImZpbGVUeXBlXCI6IGZpbGVUeXBlLFxuICAgICAgICAgICAgICAgIFwiZmlsZURhdGFcIjogZmlsZUluQmFzZTY0U3RyaW5nLFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkS2V5XCI6IGVuY3J5cHRlZEtleSxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZElWXCI6IGVuY3J5cHRlZElWXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWZyZXNoQnRuID0gJCgnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtYW5vdGhlci1maWxlXCI+T2TFm3dpZcW8IHN0cm9uxJk8L2J1dHRvbj4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpOyAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyLS11cGxvYWQnKS5hcHBlbmQocmVmcmVzaEJ0bik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgYWpheE9wdGlvbnMsIHRocm93bkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLmFwcGVuZEZvcm0oKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdEVuZ2luZSA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IGJyb3dzZXJEZXRlY3RvciBmcm9tICcuL2xpYi9icm93c2VyLWRldGVjdCc7XG5pbXBvcnQgY3J5cHRvRW5naW5lIGZyb20gJy4vbGliL3VwbG9hZC1wYWdlJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3NlckRldGVjdG9yLmRldGVjdCgpO1xuICAgIFxuICAgIGlmICgkKCcuZW5jcnlwdC1mb3JtJykubGVuZ3RoKSB7XG4gICAgICAgIGNyeXB0b0VuZ2luZS5pbml0RW5naW5lKCk7XG4gICAgfVxufSk7Il19
