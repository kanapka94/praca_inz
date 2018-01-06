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
            }).catch(function (err) {
                console.error(err);
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
    encryptAES: function encryptAES(data, fileName, fileType) {
        CRYPTO_ENGINE.generatedIV = window.crypto.getRandomValues(new Uint8Array(12));
        window.crypto.subtle.encrypt({
            name: "AES-GCM",
            iv: CRYPTO_ENGINE.generatedIV
        }, CRYPTO_ENGINE.aesKey, data).then(function (encrypted) {
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
                console.log('klik!');
                var file = APP.getUploadedFile();
                if (!file) {
                    _alertBox2.default.showAlert('error', 'Błąd:', 'Plik nie został wczytany!');
                    return;
                }
                APP.encryptAndUpload(file);
            });
        },
        bindLoadFileEvent: function bindLoadFileEvent() {
            $('.encrypt-form__file').change(function () {
                if ($(this).val() !== '') {
                    CRYPTO_ENGINE.config.generateAESKey();
                    $(this).addClass('file-added');
                    $('.file-btn-wrapper').css('display', 'flex');
                } else {
                    $(this).removeClass('file-added');
                    $('.file-btn-wrapper').css('display', 'none');
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
    getUploadedFile: function getUploadedFile() {
        var uploadedFile = document.querySelector('.encrypt-form__file').files[0];
        return uploadedFile;
    },
    encryptAndUpload: function encryptAndUpload(file) {

        var reader = new FileReader();
        reader.onload = function () {
            var bytesArray = new Uint8Array(reader.result);
            CRYPTO_ENGINE.encryptAES(bytesArray, file.name, file.type);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
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
        APP.config.bindLoadFileEvent();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0Es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dXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQT1BVUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbXNnVGltZSA6IHtcbiAgICAgICAgICAgIGVycm9yIDogNDAwMCxcbiAgICAgICAgICAgIHdhcm5pbmcgOiAzMjAwLFxuICAgICAgICAgICAgc3VjY2VzcyA6IDI1MDBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0FsZXJ0OiBmdW5jdGlvbiAobXNnQ2xhc3MsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgIHZhciAkdGl0bGUgPSAkKCcuYWxlcnQtYm94X190aXRsZScpLFxuICAgICAgICAgICAgJG1lc3NhZ2UgPSAkKCcuYWxlcnQtYm94X19tZXNzYWdlJyksXG4gICAgICAgICAgICBkZWxheVRpbWUgPSAwO1xuICAgICAgICBpZiAobXNnQ2xhc3MgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLmVycm9yO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZ0NsYXNzID09PSAnd2FybmluZycpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLndhcm5pbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5zdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgICR0aXRsZS5odG1sKHRpdGxlKTtcbiAgICAgICAgJG1lc3NhZ2UuaHRtbCh0ZXh0KTtcbiAgICAgICAgJCgnLmFsZXJ0LWJveCcpLmFkZENsYXNzKG1zZ0NsYXNzKS5hZGRDbGFzcygnc2hvdycpLmRlbGF5KGRlbGF5VGltZSkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Nob3cnKS5yZW1vdmVDbGFzcyhtc2dDbGFzcyk7XG4gICAgICAgICAgICAkdGl0bGUuaHRtbCgnJyk7XG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2hvd0FsZXJ0IDogUE9QVVAuc2hvd0FsZXJ0XG59IiwidmFyIGRldGVjdG9yID0ge1xuICAgIGNvbmZpZyA6IHtcbiAgICAgICAgd3JhcHBlclNlbGVjdG9yIDogJy5tYWluLXdyYXBwZXInLFxuICAgICAgICBodG1sRXJyb3JNc2cgOiAnPGRpdj48aDIgY2xhc3M9XCJkZXRlY3QtYnJvd3Nlci10ZXh0XCI+U3lzdGVtIHN6eWZydWrEhWN5IG9iZWNuaWUgZHppYcWCYSA8c3BhbiBjbGFzcz1cImltcG9ydGFudFwiPnR5bGtvPC9zcGFuPiBuYSBwcnplZ2zEhWRhcmthY2g6PGJyPkdvb2dsZSBDaHJvbWUgb3JheiBNb3ppbGxhIEZpcmVmb3g8L2gyPjwvZGl2PidcbiAgICB9LFxuICAgIGRldGVjdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNDaHJvbWl1bSA9IHdpbmRvdy5jaHJvbWUsXG4gICAgICAgICAgICB3aW5OYXYgPSB3aW5kb3cubmF2aWdhdG9yLFxuICAgICAgICAgICAgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3IsXG4gICAgICAgICAgICBpc09wZXJhID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdPUFInKSA+IC0xLFxuICAgICAgICAgICAgaXNJRWVkZ2UgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ0VkZ2UnKSA+IC0xLFxuICAgICAgICAgICAgaXNJT1NDaHJvbWUgPSB3aW5OYXYudXNlckFnZW50Lm1hdGNoKCdDcmlPUycpLFxuICAgICAgICAgICAgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxuICAgICAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiB3aW5kb3cub3JpZW50YXRpb24gIT09ICd1bmRlZmluZWQnKSB8fCAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdJRU1vYmlsZScpICE9PSAtMSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpc0Nocm9taXVtICE9PSBudWxsICYmIGlzQ2hyb21pdW0gIT09IHVuZGVmaW5lZCAmJiB2ZW5kb3JOYW1lID09PSAnR29vZ2xlIEluYy4nICYmIGlzT3BlcmEgPT0gZmFsc2UgJiYgaXNJRWVkZ2UgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPD0gLTEpIHtcbiAgICAgICAgICAgICAgICBkZXRlY3Rvci5kaXNwbGF5RXJyb3JNc2coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgfSxcbiAgICBkaXNwbGF5RXJyb3JNc2cgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgJChkZXRlY3Rvci5jb25maWcud3JhcHBlclNlbGVjdG9yKS5odG1sKGRldGVjdG9yLmNvbmZpZy5odG1sRXJyb3JNc2cpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXRlY3Rvci5kZXRlY3QoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZXRlY3QgOiBkZXRlY3Rvci5pbml0XG59IiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHVwbG9hZEJ1dHRvblRleHQgOiAnWmFzenlmcnVqIGkgd3nFm2xpaiBwbGlrJ1xufVxuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBsb2FkUHVibGljS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmdldCgncnNhXzIwNDhfcHViLmtleScsIGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLnNldFB1YmxpY0tleShkYXRhKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZW5lcmF0ZUFFU0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZ2VuZXJhdGVLZXkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiAxMjgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICcnLCAnQmV6cGllY3pueSBrbHVjeiB3eWdlbmVyb3dhbnkhJyk7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydEFFU0tleTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmV4cG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5XG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGtleWRhdGEpO1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRLZXkgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoanNvblN0cmluZyk7XG4gICAgICAgICAgICAgICAgQVBQLnVwbG9hZEZpbGUoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGV0ZWN0QnJvd3NlckNvbmZpZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiAhd2luZG93LmNyeXB0by5zdWJ0bGUgJiYgd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlID0gd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aW5kb3cuY3J5cHRvIHx8ICF3aW5kb3cuY3J5cHRvLnN1YnRsZSkge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsJ0LFgsSFZDogJyxcIlR3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuXCIpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGVuY3J5cHRSU0E6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZW5jcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGVuY3J5cHRBRVM6IGZ1bmN0aW9uIChkYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KDEyKSk7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICkudGhlbihmdW5jdGlvbiAoZW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBsZXQgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZyA9IGJhc2U2NGpzLmZyb21CeXRlQXJyYXkobmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkKSk7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkSVYgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoYmFzZTY0anMuZnJvbUJ5dGVBcnJheShDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWKSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5leHBvcnRBRVNLZXkoZmlsZU5hbWUsIGZpbGVUeXBlLCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRJVik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZGV0ZWN0QnJvd3NlckNvbmZpZygpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudXBsb2FkQnV0dG9uVGV4dH08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbaW5wdXQsIHVwbG9hZEJ1dHRvbl07XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZEZvcm0gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gQVBQLmNvbmZpZy5jcmVhdGVGb3JtT2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9ICQoJy5lbmNyeXB0LWZvcm0nKTtcbiAgICAgICAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFVJQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2tsaWshJyk7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0VXBsb2FkZWRGaWxlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdQbGlrIG5pZSB6b3N0YcWCIHdjenl0YW55IScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEFQUC5lbmNyeXB0QW5kVXBsb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRMb2FkRmlsZUV2ZW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuZW5jcnlwdC1mb3JtX19maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZ2VuZXJhdGVBRVNLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS1idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS1idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRIaWRlQ3JlZGVudGlhbFBhc3N3b3JkRXZlbnQ6IGZ1bmN0aW9uIChwYXNzd29yZCwgZG90dGVkUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIGNvbnN0IHBhc3NGaWVsZCA9ICQoJy5kYXRhLXdyYXBwZXJfX3Bhc3N3b3JkLXdyYXBwZXJfX3Bhc3N3b3JkJyk7XG4gICAgICAgICAgICAkKCcjZGF0YS13cmFwcGVyX19wYXNzd29yZC13cmFwcGVyX19zaG93LXBhc3N3b3JkJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIChwYXNzRmllbGQudGV4dCgpID09PSBwYXNzd29yZCkgPyBwYXNzRmllbGQudGV4dChkb3R0ZWRQYXNzd29yZCkgOiBwYXNzRmllbGQudGV4dChwYXNzd29yZCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0VXBsb2FkZWRGaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIHZhciB1cGxvYWRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5jcnlwdC1mb3JtX19maWxlJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiB1cGxvYWRlZEZpbGU7XG4gICAgfSxcbiAgICBlbmNyeXB0QW5kVXBsb2FkOiBmdW5jdGlvbiAoZmlsZSkge1xuXG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB2YXIgYnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGJ5dGVzQXJyYXksIGZpbGUubmFtZSwgZmlsZS50eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJywgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gcGFyc2VJbnQoKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSxcbiAgICB1cGxvYWRGaWxlOiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBmaWxlSW5CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIC8vIHhockZpZWxkczoge1xuICAgICAgICAgICAgLy8gICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiBcInNhdmVGaWxlLnBocFwiLFxuICAgICAgICAgICAgeGhyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4geGhyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBcImZpbGVOYW1lXCI6IGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgIFwiZmlsZVR5cGVcIjogZmlsZVR5cGUsXG4gICAgICAgICAgICAgICAgXCJmaWxlRGF0YVwiOiBmaWxlSW5CYXNlNjRTdHJpbmcsXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRLZXlcIjogZW5jcnlwdGVkS2V5LFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkSVZcIjogZW5jcnlwdGVkSVZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudHlwZSA9PT0gJ3N1Y2Nlc3MgY3JlZGVudGlhbHMnKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5maWxlLXVwbG9hZGVyJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcubWFpbk5hdl9fbG9naW4nKS5hZGRDbGFzcygnZGVjb3JhdGVkJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDMwMDApO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgYWpheE9wdGlvbnMsIHRocm93bkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLmFwcGVuZEZvcm0oKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kVUlBY3Rpb25zKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZExvYWRGaWxlRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0RW5naW5lIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgYnJvd3NlckRldGVjdG9yIGZyb20gJy4vbGliL2Jyb3dzZXItZGV0ZWN0JztcbmltcG9ydCBjcnlwdG9FbmdpbmUgZnJvbSAnLi9saWIvdXBsb2FkLXBhZ2UnO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICBicm93c2VyRGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgXG4gICAgaWYgKCQoJy5lbmNyeXB0LWZvcm0nKS5sZW5ndGgpIHtcbiAgICAgICAgY3J5cHRvRW5naW5lLmluaXRFbmdpbmUoKTtcbiAgICB9XG59KTsiXX0=
