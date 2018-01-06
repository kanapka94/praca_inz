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
        loadPublicKey: function loadPublicKey() {
            $.get('rsa_2048_pub.key', function (data) {
                CRYPTO_ENGINE.passCrypto.setPublicKey(data);
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
        },
        bindHideCredentialPasswordEvent: function bindHideCredentialPasswordEvent(password, dottedPassword) {
            var passField = $('.data-wrapper__password-wrapper__password');
            $('#data-wrapper__password-wrapper__show-password').click(function () {
                passField.text() === password ? passField.text(dottedPassword) : passField.text(password);
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
            url: "saveFile.php",
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
                if (response.type === 'success credentials') {
                    $('.file-uploader').css('display', 'none');
                    setTimeout(function () {
                        $('.mainNav__login').addClass('decorated');
                    }, 3000);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBPUFVQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBtc2dUaW1lIDoge1xuICAgICAgICAgICAgZXJyb3IgOiA0MDAwLFxuICAgICAgICAgICAgd2FybmluZyA6IDMyMDAsXG4gICAgICAgICAgICBzdWNjZXNzIDogMjUwMFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaG93QWxlcnQ6IGZ1bmN0aW9uIChtc2dDbGFzcywgdGl0bGUsIHRleHQpIHtcbiAgICAgICAgdmFyICR0aXRsZSA9ICQoJy5hbGVydC1ib3hfX3RpdGxlJyksXG4gICAgICAgICAgICAkbWVzc2FnZSA9ICQoJy5hbGVydC1ib3hfX21lc3NhZ2UnKSxcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDA7XG4gICAgICAgIGlmIChtc2dDbGFzcyA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUud2FybmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLnN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93QWxlcnQgOiBQT1BVUC5zaG93QWxlcnRcbn0iLCJ2YXIgZGV0ZWN0b3IgPSB7XG4gICAgY29uZmlnIDoge1xuICAgICAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgICAgIGh0bWxFcnJvck1zZyA6ICc8ZGl2PjxoMiBjbGFzcz1cImRldGVjdC1icm93c2VyLXRleHRcIj5TeXN0ZW0gc3p5ZnJ1asSFY3kgb2JlY25pZSBkemlhxYJhIDxzcGFuIGNsYXNzPVwiaW1wb3J0YW50XCI+dHlsa288L3NwYW4+IG5hIHByemVnbMSFZGFya2FjaDo8YnI+R29vZ2xlIENocm9tZSBvcmF6IE1vemlsbGEgRmlyZWZveDwvaDI+PC9kaXY+J1xuICAgIH0sXG4gICAgZGV0ZWN0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBpc0Nocm9taXVtID0gd2luZG93LmNocm9tZSxcbiAgICAgICAgICAgIHdpbk5hdiA9IHdpbmRvdy5uYXZpZ2F0b3IsXG4gICAgICAgICAgICB2ZW5kb3JOYW1lID0gd2luTmF2LnZlbmRvcixcbiAgICAgICAgICAgIGlzT3BlcmEgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ09QUicpID4gLTEsXG4gICAgICAgICAgICBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignRWRnZScpID4gLTEsXG4gICAgICAgICAgICBpc0lPU0Nocm9tZSA9IHdpbk5hdi51c2VyQWdlbnQubWF0Y2goJ0NyaU9TJyksXG4gICAgICAgICAgICBpc0ZpcmVmb3ggPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgICAgICBpc01vYmlsZURldmljZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHdpbmRvdy5vcmllbnRhdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHx8IChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0lFTW9iaWxlJykgIT09IC0xKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKGlzQ2hyb21pdW0gIT09IG51bGwgJiYgaXNDaHJvbWl1bSAhPT0gdW5kZWZpbmVkICYmIHZlbmRvck5hbWUgPT09ICdHb29nbGUgSW5jLicgJiYgaXNPcGVyYSA9PSBmYWxzZSAmJiBpc0lFZWRnZSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA8PSAtMSkge1xuICAgICAgICAgICAgICAgIGRldGVjdG9yLmRpc3BsYXlFcnJvck1zZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcbiAgICB9LFxuICAgIGRpc3BsYXlFcnJvck1zZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkKGRldGVjdG9yLmNvbmZpZy53cmFwcGVyU2VsZWN0b3IpLmh0bWwoZGV0ZWN0b3IuY29uZmlnLmh0bWxFcnJvck1zZyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRldGVjdG9yLmRldGVjdCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmluaXRcbn0iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdXBsb2FkQnV0dG9uVGV4dCA6ICdaYXN6eWZydWogaSB3ecWbbGlqIHBsaWsnXG59XG5cbmNvbnN0IENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIGxvYWRQdWJsaWNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuZ2V0KCdyc2FfMjA0OF9wdWIua2V5JywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHVibGljS2V5KGRhdGEpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRlQUVTS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5nZW5lcmF0ZUtleShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDEyOCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJycsICdCZXpwaWVjem55IGtsdWN6IHd5Z2VuZXJvd2FueSEnKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXhwb3J0QUVTS2V5OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXlcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5ZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoa2V5ZGF0YSk7XG4gICAgICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEtleSA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBBUFAudXBsb2FkRmlsZShmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGV0ZWN0QnJvd3NlckNvbmZpZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiAhd2luZG93LmNyeXB0by5zdWJ0bGUgJiYgd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlID0gd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aW5kb3cuY3J5cHRvIHx8ICF3aW5kb3cuY3J5cHRvLnN1YnRsZSkge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsJ0LFgsSFZDogJyxcIlR3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuXCIpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGVuY3J5cHRSU0E6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZW5jcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGVuY3J5cHRBRVM6IGZ1bmN0aW9uIChmaWxlQnl0ZXNBcnJheSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBhcnJheXNDb3VudCA9IDEyO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWID0gd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoYXJyYXlzQ291bnQpKTtcbiAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZW5jcnlwdChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICBpdjogQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSxcbiAgICAgICAgICAgIGZpbGVCeXRlc0FycmF5XG4gICAgICAgICkudGhlbihmdW5jdGlvbiAoZW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBsZXQgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZyA9IGJhc2U2NGpzLmZyb21CeXRlQXJyYXkobmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkKSk7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkSVYgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoYmFzZTY0anMuZnJvbUJ5dGVBcnJheShDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWKSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5leHBvcnRBRVNLZXkoZmlsZU5hbWUsIGZpbGVUeXBlLCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRJVik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZGV0ZWN0QnJvd3NlckNvbmZpZygpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudXBsb2FkQnV0dG9uVGV4dH08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbaW5wdXQsIHVwbG9hZEJ1dHRvbl07XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZEZvcm0gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gQVBQLmNvbmZpZy5jcmVhdGVGb3JtT2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9ICQoJy5lbmNyeXB0LWZvcm0nKTtcbiAgICAgICAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFVJQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0Rm9ybUZpbGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1BsaWsgbmllIHpvc3RhxYIgd2N6eXRhbnkhJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRIaWRlQ3JlZGVudGlhbFBhc3N3b3JkRXZlbnQ6IGZ1bmN0aW9uIChwYXNzd29yZCwgZG90dGVkUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhc3NGaWVsZCA9ICQoJy5kYXRhLXdyYXBwZXJfX3Bhc3N3b3JkLXdyYXBwZXJfX3Bhc3N3b3JkJyk7XG4gICAgICAgICAgICAkKCcjZGF0YS13cmFwcGVyX19wYXNzd29yZC13cmFwcGVyX19zaG93LXBhc3N3b3JkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChwYXNzRmllbGQudGV4dCgpID09PSBwYXNzd29yZCkgPyBwYXNzRmllbGQudGV4dChkb3R0ZWRQYXNzd29yZCkgOiBwYXNzRmllbGQudGV4dChwYXNzd29yZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0Rm9ybUZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5jcnlwdC1mb3JtX19maWxlJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiBmaWxlO1xuICAgIH0sXG4gICAgZW5jcnlwdEFuZFVwbG9hZDogZnVuY3Rpb24gKGZpbGUpIHtcblxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGZpbGVCeXRlc0FycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmVuY3J5cHRBRVMoZmlsZUJ5dGVzQXJyYXksIGZpbGUubmFtZSwgZmlsZS50eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgdXBsb2FkRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZmlsZUluQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAvLyB4aHJGaWVsZHM6IHtcbiAgICAgICAgICAgIC8vICAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLmxvYWRlZCAvIGUudG90YWwgKiAxMDAgKyAnJScpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogXCJzYXZlRmlsZS5waHBcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgXCJmaWxlTmFtZVwiOiBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICBcImZpbGVUeXBlXCI6IGZpbGVUeXBlLFxuICAgICAgICAgICAgICAgIFwiZmlsZURhdGFcIjogZmlsZUluQmFzZTY0U3RyaW5nLFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkS2V5XCI6IGVuY3J5cHRlZEtleSxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZElWXCI6IGVuY3J5cHRlZElWXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzIGNyZWRlbnRpYWxzJykge1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS11cGxvYWRlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLm1haW5OYXZfX2xvZ2luJykuYWRkQ2xhc3MoJ2RlY29yYXRlZCcpO1xuICAgICAgICAgICAgICAgICAgICB9LCAzMDAwKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIGFqYXhPcHRpb25zLCB0aHJvd25FcnJvcikge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnJywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5hcHBlbmRGb3JtKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXRFbmdpbmUgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBicm93c2VyRGV0ZWN0b3IgZnJvbSAnLi9saWIvYnJvd3Nlci1kZXRlY3QnO1xuaW1wb3J0IGNyeXB0b0VuZ2luZSBmcm9tICcuL2xpYi91cGxvYWQtcGFnZSc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGJyb3dzZXJEZXRlY3Rvci5kZXRlY3QoKTtcbiAgICBcbiAgICBpZiAoJCgnLmVuY3J5cHQtZm9ybScpLmxlbmd0aCkge1xuICAgICAgICBjcnlwdG9FbmdpbmUuaW5pdEVuZ2luZSgpO1xuICAgIH1cbn0pOyJdfQ==
