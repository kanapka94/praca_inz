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

            $.get('extra/rsa_2048_pub.key', function (data) {
                console.log('pobrano plik rsa', data);
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
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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Y2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQT1BVUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbXNnVGltZSA6IHtcbiAgICAgICAgICAgIGVycm9yIDogNDAwMCxcbiAgICAgICAgICAgIHdhcm5pbmcgOiAzMjAwLFxuICAgICAgICAgICAgc3VjY2VzcyA6IDI1MDBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0FsZXJ0OiBmdW5jdGlvbiAobXNnQ2xhc3MsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgIHZhciAkdGl0bGUgPSAkKCcuYWxlcnQtYm94X190aXRsZScpLFxuICAgICAgICAgICAgJG1lc3NhZ2UgPSAkKCcuYWxlcnQtYm94X19tZXNzYWdlJyksXG4gICAgICAgICAgICBkZWxheVRpbWUgPSAwO1xuICAgICAgICBpZiAobXNnQ2xhc3MgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLmVycm9yO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZ0NsYXNzID09PSAnd2FybmluZycpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLndhcm5pbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5zdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgICR0aXRsZS5odG1sKHRpdGxlKTtcbiAgICAgICAgJG1lc3NhZ2UuaHRtbCh0ZXh0KTtcbiAgICAgICAgJCgnLmFsZXJ0LWJveCcpLmFkZENsYXNzKG1zZ0NsYXNzKS5hZGRDbGFzcygnc2hvdycpLmRlbGF5KGRlbGF5VGltZSkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Nob3cnKS5yZW1vdmVDbGFzcyhtc2dDbGFzcyk7XG4gICAgICAgICAgICAkdGl0bGUuaHRtbCgnJyk7XG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2hvd0FsZXJ0IDogUE9QVVAuc2hvd0FsZXJ0XG59IiwidmFyIGRldGVjdG9yID0ge1xuICAgIGNvbmZpZyA6IHtcbiAgICAgICAgd3JhcHBlclNlbGVjdG9yIDogJy5tYWluLXdyYXBwZXInLFxuICAgICAgICBodG1sRXJyb3JNc2cgOiAnPGRpdj48aDIgY2xhc3M9XCJkZXRlY3QtYnJvd3Nlci10ZXh0XCI+U3lzdGVtIHN6eWZydWrEhWN5IG9iZWNuaWUgZHppYcWCYSA8c3BhbiBjbGFzcz1cImltcG9ydGFudFwiPnR5bGtvPC9zcGFuPiBuYSBwcnplZ2zEhWRhcmthY2g6PGJyPkdvb2dsZSBDaHJvbWUgb3JheiBNb3ppbGxhIEZpcmVmb3g8L2gyPjwvZGl2PidcbiAgICB9LFxuICAgIGRldGVjdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNDaHJvbWl1bSA9IHdpbmRvdy5jaHJvbWUsXG4gICAgICAgICAgICB3aW5OYXYgPSB3aW5kb3cubmF2aWdhdG9yLFxuICAgICAgICAgICAgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3IsXG4gICAgICAgICAgICBpc09wZXJhID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdPUFInKSA+IC0xLFxuICAgICAgICAgICAgaXNJRWVkZ2UgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ0VkZ2UnKSA+IC0xLFxuICAgICAgICAgICAgaXNJT1NDaHJvbWUgPSB3aW5OYXYudXNlckFnZW50Lm1hdGNoKCdDcmlPUycpLFxuICAgICAgICAgICAgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxuICAgICAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiB3aW5kb3cub3JpZW50YXRpb24gIT09ICd1bmRlZmluZWQnKSB8fCAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdJRU1vYmlsZScpICE9PSAtMSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpc0Nocm9taXVtICE9PSBudWxsICYmIGlzQ2hyb21pdW0gIT09IHVuZGVmaW5lZCAmJiB2ZW5kb3JOYW1lID09PSAnR29vZ2xlIEluYy4nICYmIGlzT3BlcmEgPT0gZmFsc2UgJiYgaXNJRWVkZ2UgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPD0gLTEpIHtcbiAgICAgICAgICAgICAgICBkZXRlY3Rvci5kaXNwbGF5RXJyb3JNc2coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgfSxcbiAgICBkaXNwbGF5RXJyb3JNc2cgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgJChkZXRlY3Rvci5jb25maWcud3JhcHBlclNlbGVjdG9yKS5odG1sKGRldGVjdG9yLmNvbmZpZy5odG1sRXJyb3JNc2cpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXRlY3Rvci5kZXRlY3QoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZXRlY3QgOiBkZXRlY3Rvci5pbml0XG59IiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHVwbG9hZEJ1dHRvblRleHQgOiAnWmFzenlmcnVqIGkgd3nFm2xpaiBwbGlrJ1xufVxuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBsb2FkUHVibGljS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgICAgICQuZ2V0KCdleHRyYS9yc2FfMjA0OF9wdWIua2V5JywgZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygncG9icmFubyBwbGlrIHJzYScsIGRhdGEpO1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQdWJsaWNLZXkoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVBRVNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTI4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnJywgJ0JlenBpZWN6bnkga2x1Y3ogd3lnZW5lcm93YW55IScpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBleHBvcnRBRVNLZXk6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5leHBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXlkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShrZXlkYXRhKTtcbiAgICAgICAgICAgICAgICBsZXQgZW5jcnlwdGVkS2V5ID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgIEFQUC51cGxvYWRGaWxlKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkZXRlY3RCcm93c2VyQ29uZmlnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh3aW5kb3cuY3J5cHRvICYmICF3aW5kb3cuY3J5cHRvLnN1YnRsZSAmJiB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZSkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUgPSB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpbmRvdy5jcnlwdG8gfHwgIXdpbmRvdy5jcnlwdG8uc3VidGxlKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywnQsWCxIVkOiAnLFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGZpbGVCeXRlc0FycmF5LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGFycmF5c0NvdW50ID0gMTI7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShhcnJheXNDb3VudCkpO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZmlsZUJ5dGVzQXJyYXlcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGxldCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0byA9IG5ldyBKU0VuY3J5cHQoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcubG9hZFB1YmxpY0tleSgpO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgY3JlYXRlRm9ybU9iamVjdHMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGNsYXNzPVwiZW5jcnlwdC1mb3JtX19maWxlXCI+JztcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZEJ1dHRvbiA9IFxuICAgICAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiYnRuLXdyYXBwZXIgYnRuLXdyYXBwZXItLXVwbG9hZFwiPlxuICAgICAgICAgICAgICAgICAgICA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tLXVwbG9hZC1maWxlXCI+JHtTRVRUSU5HUy51cGxvYWRCdXR0b25UZXh0fTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IFtpbnB1dCwgdXBsb2FkQnV0dG9uXTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50cztcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZW5kRm9ybSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBBUFAuY29uZmlnLmNyZWF0ZUZvcm1PYmplY3RzKCk7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gJCgnLmVuY3J5cHQtZm9ybScpO1xuICAgICAgICAgICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZChlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kVUlBY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IEFQUC5nZXRGb3JtRmlsZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCAnUGxpayBuaWUgem9zdGHFgiB3Y3p5dGFueSEnKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBUFAuZW5jcnlwdEFuZFVwbG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkKCcuZW5jcnlwdC1mb3JtX19maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZ2VuZXJhdGVBRVNLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXInKS5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0Rm9ybUZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5jcnlwdC1mb3JtX19maWxlJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiBmaWxlO1xuICAgIH0sXG4gICAgZW5jcnlwdEFuZFVwbG9hZDogZnVuY3Rpb24gKGZpbGUpIHtcblxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGZpbGVCeXRlc0FycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmVuY3J5cHRBRVMoZmlsZUJ5dGVzQXJyYXksIGZpbGUubmFtZSwgZmlsZS50eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgdXBsb2FkRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZmlsZUluQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIC8vIHhockZpZWxkczoge1xuICAgICAgICAgICAgLy8gICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiBcInNhdmVGaWxlXCIsXG4gICAgICAgICAgICB4aHI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIFwiZmlsZU5hbWVcIjogZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgXCJmaWxlVHlwZVwiOiBmaWxlVHlwZSxcbiAgICAgICAgICAgICAgICBcImZpbGVEYXRhXCI6IGZpbGVJbkJhc2U2NFN0cmluZyxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZEtleVwiOiBlbmNyeXB0ZWRLZXksXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRJVlwiOiBlbmNyeXB0ZWRJVlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQocmVzcG9uc2UudHlwZSwgcmVzcG9uc2UudGl0bGUsIHJlc3BvbnNlLnRleHQpO1xuICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgcmVmcmVzaEJ0biA9ICQoJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi0tdXBsb2FkLWFub3RoZXItZmlsZVwiPk9kxZt3aWXFvCBzdHJvbsSZPC9idXR0b24+JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlci0tdXBsb2FkJykuYXBwZW5kKHJlZnJlc2hCdG4pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIGFqYXhPcHRpb25zLCB0aHJvd25FcnJvcikge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnJywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5hcHBlbmRGb3JtKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXRFbmdpbmUgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBicm93c2VyRGV0ZWN0b3IgZnJvbSAnLi9saWIvYnJvd3Nlci1kZXRlY3QnO1xuaW1wb3J0IGNyeXB0b0VuZ2luZSBmcm9tICcuL2xpYi91cGxvYWQtcGFnZSc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGJyb3dzZXJEZXRlY3Rvci5kZXRlY3QoKTtcbiAgICBcbiAgICBpZiAoJCgnLmVuY3J5cHQtZm9ybScpLmxlbmd0aCkge1xuICAgICAgICBjcnlwdG9FbmdpbmUuaW5pdEVuZ2luZSgpO1xuICAgIH1cbn0pOyJdfQ==
