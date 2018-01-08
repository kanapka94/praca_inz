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
            CRYPTO_ENGINE.config.exportAESKey(fileName, fileType, bytesConvertedToBase64String, encryptedIV);
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
            //TODO: dodać loader (gif)
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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OEMsWUFBVztBQUNyRCw0QkFBZ0IsTUFBaEI7O0FBRUEsUUFBSSxFQUFFLGVBQUYsRUFBbUIsTUFBdkIsRUFBK0I7QUFDM0IsNkJBQWEsVUFBYjtBQUNIO0FBQ0osQ0FORCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUE9QVVAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIG1zZ1RpbWUgOiB7XG4gICAgICAgICAgICBlcnJvciA6IDQwMDAsXG4gICAgICAgICAgICB3YXJuaW5nIDogMzIwMCxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiAyNTAwXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNob3dBbGVydDogZnVuY3Rpb24gKG1zZ0NsYXNzLCB0aXRsZSwgdGV4dCkge1xuICAgICAgICB2YXIgJHRpdGxlID0gJCgnLmFsZXJ0LWJveF9fdGl0bGUnKSxcbiAgICAgICAgICAgICRtZXNzYWdlID0gJCgnLmFsZXJ0LWJveF9fbWVzc2FnZScpLFxuICAgICAgICAgICAgZGVsYXlUaW1lID0gMDtcbiAgICAgICAgaWYgKG1zZ0NsYXNzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5lcnJvcjtcbiAgICAgICAgfSBlbHNlIGlmIChtc2dDbGFzcyA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS53YXJuaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICAkdGl0bGUuaHRtbCh0aXRsZSk7XG4gICAgICAgICRtZXNzYWdlLmh0bWwodGV4dCk7XG4gICAgICAgICQoJy5hbGVydC1ib3gnKS5hZGRDbGFzcyhtc2dDbGFzcykuYWRkQ2xhc3MoJ3Nob3cnKS5kZWxheShkZWxheVRpbWUpLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaG93JykucmVtb3ZlQ2xhc3MobXNnQ2xhc3MpO1xuICAgICAgICAgICAgJHRpdGxlLmh0bWwoJycpO1xuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJyk7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3dBbGVydCA6IFBPUFVQLnNob3dBbGVydFxufSIsInZhciBkZXRlY3RvciA9IHtcbiAgICBjb25maWcgOiB7XG4gICAgICAgIHdyYXBwZXJTZWxlY3RvciA6ICcubWFpbi13cmFwcGVyJyxcbiAgICAgICAgaHRtbEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgfSxcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoZGV0ZWN0b3IuY29uZmlnLndyYXBwZXJTZWxlY3RvcikuaHRtbChkZXRlY3Rvci5jb25maWcuaHRtbEVycm9yTXNnKTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGV0ZWN0IDogZGV0ZWN0b3IuaW5pdFxufSIsImltcG9ydCBwb3B1cCBmcm9tICcuL2FsZXJ0LWJveCc7XG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB1cGxvYWRCdXR0b25UZXh0IDogJ1phc3p5ZnJ1aiBpIHd5xZtsaWogcGxpaydcbn1cblxuY29uc3QgQ1JZUFRPX0VOR0lORSA9IHtcbiAgICBwYXNzQ3J5cHRvOiBudWxsLFxuICAgIGFlc0tleTogbnVsbCxcbiAgICBnZW5lcmF0ZWRJVjogbnVsbCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkUHVibGljS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdnZXRQdWJLZXknLFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlIDogJ2pzb24nLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHVibGljS2V5KHJlc3BvbnNlKTsgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZW5lcmF0ZUFFU0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZ2VuZXJhdGVLZXkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiAxMjgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICcnLCAnQmV6cGllY3pueSBrbHVjeiB3eWdlbmVyb3dhbnkhJyk7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydEFFU0tleTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmV4cG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5XG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGtleWRhdGEpO1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRLZXkgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoanNvblN0cmluZyk7XG4gICAgICAgICAgICAgICAgQVBQLnVwbG9hZEZpbGUoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRldGVjdEJyb3dzZXJDb25maWcgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jcnlwdG8gJiYgIXdpbmRvdy5jcnlwdG8uc3VidGxlICYmIHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZSA9IHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2luZG93LmNyeXB0byB8fCAhd2luZG93LmNyeXB0by5zdWJ0bGUpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCdCxYLEhWQ6ICcsXCJUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLlwiKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIlR3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBlbmNyeXB0UlNBOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLmVuY3J5cHQoZGF0YSk7XG4gICAgfSxcbiAgICBlbmNyeXB0QUVTOiBmdW5jdGlvbiAoZmlsZUJ5dGVzQXJyYXksIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgYXJyYXlzQ291bnQgPSAxMjtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KGFycmF5c0NvdW50KSk7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBmaWxlQnl0ZXNBcnJheVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGVuY3J5cHRlZCkge1xuICAgICAgICAgICAgbGV0IGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcgPSBiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZCkpO1xuICAgICAgICAgICAgbGV0IGVuY3J5cHRlZElWID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGJhc2U2NGpzLmZyb21CeXRlQXJyYXkoQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVikpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZXhwb3J0QUVTS2V5KGZpbGVOYW1lLCBmaWxlVHlwZSwgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZywgZW5jcnlwdGVkSVYpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmRldGVjdEJyb3dzZXJDb25maWcoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuc2V0dXBBamF4SGVhZGVyKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0byA9IG5ldyBKU0VuY3J5cHQoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcubG9hZFB1YmxpY0tleSgpO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgY3JlYXRlRm9ybU9iamVjdHMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGNsYXNzPVwiZW5jcnlwdC1mb3JtX19maWxlXCI+JztcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZEJ1dHRvbiA9IFxuICAgICAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiYnRuLXdyYXBwZXIgYnRuLXdyYXBwZXItLXVwbG9hZFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tLXVwbG9hZC1maWxlXCI+JHtTRVRUSU5HUy51cGxvYWRCdXR0b25UZXh0fTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IFtpbnB1dCwgdXBsb2FkQnV0dG9uXTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50cztcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZW5kRm9ybSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBBUFAuY29uZmlnLmNyZWF0ZUZvcm1PYmplY3RzKCk7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gJCgnLmVuY3J5cHQtZm9ybScpO1xuICAgICAgICAgICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZChlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kVUlBY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IEFQUC5nZXRGb3JtRmlsZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCAnUGxpayBuaWUgem9zdGHFgiB3Y3p5dGFueSEnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBUFAuZW5jcnlwdEFuZFVwbG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkKCcuZW5jcnlwdC1mb3JtX19maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZ2VuZXJhdGVBRVNLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXInKS5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0Rm9ybUZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5jcnlwdC1mb3JtX19maWxlJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiBmaWxlO1xuICAgIH0sXG4gICAgZW5jcnlwdEFuZFVwbG9hZDogZnVuY3Rpb24gKGZpbGUpIHtcblxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGZpbGVCeXRlc0FycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmVuY3J5cHRBRVMoZmlsZUJ5dGVzQXJyYXksIGZpbGUubmFtZSwgZmlsZS50eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgdXBsb2FkRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZmlsZUluQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAvLyB4aHJGaWVsZHM6IHtcbiAgICAgICAgICAgIC8vICAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLmxvYWRlZCAvIGUudG90YWwgKiAxMDAgKyAnJScpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogXCJzYXZlRmlsZVwiLFxuICAgICAgICAgICAgeGhyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4geGhyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBcImZpbGVOYW1lXCI6IGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgIFwiZmlsZVR5cGVcIjogZmlsZVR5cGUsXG4gICAgICAgICAgICAgICAgXCJmaWxlRGF0YVwiOiBmaWxlSW5CYXNlNjRTdHJpbmcsXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRLZXlcIjogZW5jcnlwdGVkS2V5LFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkSVZcIjogZW5jcnlwdGVkSVZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgLy9UT0RPOiBkb2RhxIcgbG9hZGVyIChnaWYpXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQocmVzcG9uc2UudHlwZSwgcmVzcG9uc2UudGl0bGUsIHJlc3BvbnNlLnRleHQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVmcmVzaEJ0biA9ICQoJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi0tdXBsb2FkLWFub3RoZXItZmlsZVwiPk9kxZt3aWXFvCBzdHJvbsSZPC9idXR0b24+JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlci0tdXBsb2FkJykuYXBwZW5kKHJlZnJlc2hCdG4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIGFqYXhPcHRpb25zLCB0aHJvd25FcnJvcikge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnJywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5hcHBlbmRGb3JtKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXRFbmdpbmUgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBicm93c2VyRGV0ZWN0b3IgZnJvbSAnLi9saWIvYnJvd3Nlci1kZXRlY3QnO1xuaW1wb3J0IGNyeXB0b0VuZ2luZSBmcm9tICcuL2xpYi91cGxvYWQtcGFnZSc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGJyb3dzZXJEZXRlY3Rvci5kZXRlY3QoKTtcbiAgICBcbiAgICBpZiAoJCgnLmVuY3J5cHQtZm9ybScpLmxlbmd0aCkge1xuICAgICAgICBjcnlwdG9FbmdpbmUuaW5pdEVuZ2luZSgpO1xuICAgIH1cbn0pOyJdfQ==
