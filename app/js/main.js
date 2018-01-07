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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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QVc7QUFDckQsNEJBQWdCLE1BQWhCOztBQUVBLFFBQUksRUFBRSxlQUFGLEVBQW1CLE1BQXZCLEVBQStCO0FBQzNCLDZCQUFhLFVBQWI7QUFDSDtBQUNKLENBTkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBPUFVQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBtc2dUaW1lIDoge1xuICAgICAgICAgICAgZXJyb3IgOiA0MDAwLFxuICAgICAgICAgICAgd2FybmluZyA6IDMyMDAsXG4gICAgICAgICAgICBzdWNjZXNzIDogMjUwMFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaG93QWxlcnQ6IGZ1bmN0aW9uIChtc2dDbGFzcywgdGl0bGUsIHRleHQpIHtcbiAgICAgICAgdmFyICR0aXRsZSA9ICQoJy5hbGVydC1ib3hfX3RpdGxlJyksXG4gICAgICAgICAgICAkbWVzc2FnZSA9ICQoJy5hbGVydC1ib3hfX21lc3NhZ2UnKSxcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDA7XG4gICAgICAgIGlmIChtc2dDbGFzcyA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUud2FybmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLnN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93QWxlcnQgOiBQT1BVUC5zaG93QWxlcnRcbn0iLCJ2YXIgZGV0ZWN0b3IgPSB7XG4gICAgY29uZmlnIDoge1xuICAgICAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgICAgIGh0bWxFcnJvck1zZyA6ICc8ZGl2PjxoMiBjbGFzcz1cImRldGVjdC1icm93c2VyLXRleHRcIj5TeXN0ZW0gc3p5ZnJ1asSFY3kgb2JlY25pZSBkemlhxYJhIDxzcGFuIGNsYXNzPVwiaW1wb3J0YW50XCI+dHlsa288L3NwYW4+IG5hIHByemVnbMSFZGFya2FjaDo8YnI+R29vZ2xlIENocm9tZSBvcmF6IE1vemlsbGEgRmlyZWZveDwvaDI+PC9kaXY+J1xuICAgIH0sXG4gICAgZGV0ZWN0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpc0Nocm9taXVtID0gd2luZG93LmNocm9tZSxcbiAgICAgICAgICAgIHdpbk5hdiA9IHdpbmRvdy5uYXZpZ2F0b3IsXG4gICAgICAgICAgICB2ZW5kb3JOYW1lID0gd2luTmF2LnZlbmRvcixcbiAgICAgICAgICAgIGlzT3BlcmEgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ09QUicpID4gLTEsXG4gICAgICAgICAgICBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignRWRnZScpID4gLTEsXG4gICAgICAgICAgICBpc0lPU0Nocm9tZSA9IHdpbk5hdi51c2VyQWdlbnQubWF0Y2goJ0NyaU9TJyksXG4gICAgICAgICAgICBpc0ZpcmVmb3ggPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgICAgICBpc01vYmlsZURldmljZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHdpbmRvdy5vcmllbnRhdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHx8IChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0lFTW9iaWxlJykgIT09IC0xKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKGlzQ2hyb21pdW0gIT09IG51bGwgJiYgaXNDaHJvbWl1bSAhPT0gdW5kZWZpbmVkICYmIHZlbmRvck5hbWUgPT09ICdHb29nbGUgSW5jLicgJiYgaXNPcGVyYSA9PSBmYWxzZSAmJiBpc0lFZWRnZSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA8PSAtMSkge1xuICAgICAgICAgICAgICAgIGRldGVjdG9yLmRpc3BsYXlFcnJvck1zZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcbiAgICB9LFxuICAgIGRpc3BsYXlFcnJvck1zZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkKGRldGVjdG9yLmNvbmZpZy53cmFwcGVyU2VsZWN0b3IpLmh0bWwoZGV0ZWN0b3IuY29uZmlnLmh0bWxFcnJvck1zZyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRldGVjdG9yLmRldGVjdCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmluaXRcbn0iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdXBsb2FkQnV0dG9uVGV4dCA6ICdaYXN6eWZydWogaSB3ecWbbGlqIHBsaWsnXG59XG5cbmNvbnN0IENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFB1YmxpY0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnZ2V0UHViS2V5JyxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZSA6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLnNldFB1YmxpY0tleShyZXNwb25zZSk7IFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVBRVNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTI4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnJywgJ0JlenBpZWN6bnkga2x1Y3ogd3lnZW5lcm93YW55IScpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBleHBvcnRBRVNLZXk6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5leHBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXlkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShrZXlkYXRhKTtcbiAgICAgICAgICAgICAgICBsZXQgZW5jcnlwdGVkS2V5ID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgIEFQUC51cGxvYWRGaWxlKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkZXRlY3RCcm93c2VyQ29uZmlnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh3aW5kb3cuY3J5cHRvICYmICF3aW5kb3cuY3J5cHRvLnN1YnRsZSAmJiB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZSkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUgPSB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpbmRvdy5jcnlwdG8gfHwgIXdpbmRvdy5jcnlwdG8uc3VidGxlKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywnQsWCxIVkOiAnLFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGZpbGVCeXRlc0FycmF5LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGFycmF5c0NvdW50ID0gMTI7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShhcnJheXNDb3VudCkpO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZmlsZUJ5dGVzQXJyYXlcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGxldCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudXBsb2FkQnV0dG9uVGV4dH08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbaW5wdXQsIHVwbG9hZEJ1dHRvbl07XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZEZvcm0gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gQVBQLmNvbmZpZy5jcmVhdGVGb3JtT2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9ICQoJy5lbmNyeXB0LWZvcm0nKTtcbiAgICAgICAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFVJQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0Rm9ybUZpbGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1BsaWsgbmllIHpvc3RhxYIgd2N6eXRhbnkhJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldEZvcm1GaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVuY3J5cHQtZm9ybV9fZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICByZXR1cm4gZmlsZTtcbiAgICB9LFxuICAgIGVuY3J5cHRBbmRVcGxvYWQ6IGZ1bmN0aW9uIChmaWxlKSB7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBmaWxlQnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGZpbGVCeXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCgoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbiAgICB9LFxuICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGZpbGVJbkJhc2U2NFN0cmluZywgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgLy8geGhyRmllbGRzOiB7XG4gICAgICAgICAgICAvLyAgICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwICsgJyUnKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6IFwic2F2ZUZpbGVcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgXCJmaWxlTmFtZVwiOiBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICBcImZpbGVUeXBlXCI6IGZpbGVUeXBlLFxuICAgICAgICAgICAgICAgIFwiZmlsZURhdGFcIjogZmlsZUluQmFzZTY0U3RyaW5nLFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkS2V5XCI6IGVuY3J5cHRlZEtleSxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZElWXCI6IGVuY3J5cHRlZElWXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWZyZXNoQnRuID0gJCgnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtYW5vdGhlci1maWxlXCI+T2TFm3dpZcW8IHN0cm9uxJk8L2J1dHRvbj4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpOyAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyLS11cGxvYWQnKS5hcHBlbmQocmVmcmVzaEJ0bik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgYWpheE9wdGlvbnMsIHRocm93bkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLmFwcGVuZEZvcm0oKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdEVuZ2luZSA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IGJyb3dzZXJEZXRlY3RvciBmcm9tICcuL2xpYi9icm93c2VyLWRldGVjdCc7XG5pbXBvcnQgY3J5cHRvRW5naW5lIGZyb20gJy4vbGliL3VwbG9hZC1wYWdlJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3NlckRldGVjdG9yLmRldGVjdCgpO1xuICAgIFxuICAgIGlmICgkKCcuZW5jcnlwdC1mb3JtJykubGVuZ3RoKSB7XG4gICAgICAgIGNyeXB0b0VuZ2luZS5pbml0RW5naW5lKCk7XG4gICAgfVxufSk7Il19
