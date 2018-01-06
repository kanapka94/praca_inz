(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
    }
};

module.exports = {
    detect: detector.detect
};

},{}],2:[function(require,module,exports){
"use strict";

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
                APP.showAlert('success', '', 'Sicherer Schlüssel generiert!');
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
    init: function init() {
        CRYPTO_ENGINE.detectBrowserConfig();
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.loadPublicKey();
    },
    detectBrowserConfig: function detectBrowserConfig() {
        if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        }
        if (!window.crypto || !window.crypto.subtle) {
            alert("Your browser does not support the Web Cryptography API! This page will not work.");
            throw new Error("Your browser does not support the Web Cryptography API! This page will not work.");
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
    }
};
var APP = {
    config: {
        bindClickEvents: function bindClickEvents() {

            $('.file-password-wrapper__show-password').click(function () {
                var passField = $('.file-password-wrapper__password');
                passField.attr('type') === 'password' ? passField.attr('type', 'text') : passField.attr('type', 'password');
            });

            $('.btn_upload-file').click(function () {
                var file = APP.getUploadedFile();
                if (!file) {
                    APP.showAlert('error', 'Error:', 'File not loaded!');
                }
                APP.encryptAndUpload(file);
            });
        },
        bindLoadFileEvent: function bindLoadFileEvent() {
            $('.input_file-to-upload').change(function () {
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
        },
        bindRememberCredentialsAlert: function bindRememberCredentialsAlert() {
            $('.userCredentials__upload-another-file').click(function (event) {
                event.preventDefault();
                var answer = confirm('Haben Sie Ihre Login-Daten gespeichert?');
                if (answer) {
                    window.location.reload();
                }
            });
        }
    },
    init: function init() {
        CRYPTO_ENGINE.init();
        APP.config.bindClickEvents();
        APP.config.bindLoadFileEvent();
    },
    showAlert: function showAlert(msgClass, title, text) {
        var $title = $('.alert-box__title'),
            $message = $('.alert-box__message'),
            delayTime = 0;
        if (msgClass === 'error') {
            delayTime = 4000;
        } else if (msgClass === 'warning') {
            delayTime = 3200;
        } else {
            delayTime = 2500;
        }
        $title.html(title);
        $message.html(text);
        $('.alert-box').addClass(msgClass).addClass('show').delay(delayTime).queue(function (next) {
            $(this).removeClass('show').removeClass(msgClass);
            $title.html('');
            $message.html('');
            next();
        });
    },
    getUploadedFile: function getUploadedFile() {
        var uploadedFile = document.querySelector('.input_file-to-upload').files[0];
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
    showCredentialsWrapper: function showCredentialsWrapper(login, password) {
        $('.userCredentials').css('display', 'block');
        $('.data-wrapper__login-wrapper__login').text(login);
        var dottedpassword = '';
        for (var i = 0; i < password.length; i++) {
            dottedpassword += '*';
        }
        $('.data-wrapper__password-wrapper__password').text(dottedpassword);
        APP.config.bindHideCredentialPasswordEvent(password, dottedpassword);
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
                APP.showAlert(response.type, response.title, response.text);
                if (response.type === 'success credentials') {
                    $('.file-uploader').css('display', 'none');
                    APP.showCredentialsWrapper(response.login, response.password);
                    APP.config.bindRememberCredentialsAlert();
                    setTimeout(function () {
                        $('.mainNav__login').addClass('decorated');
                    }, 3000);
                }
            },
            error: function error(xhr, ajaxOptions, thrownError) {
                APP.showAlert('error', '', xhr.responseText);
            }
        });
    }
};

module.exports = {
    initEngine: APP.init
};

},{}],3:[function(require,module,exports){
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

},{"./lib/browser-detect":1,"./lib/upload-page":2}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYnJvd3Nlci1kZXRlY3QuanMiLCJhcHAvc2NyaXB0cy9saWIvdXBsb2FkLXBhZ2UuanMiLCJhcHAvc2NyaXB0cy9tYWluLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7QUNBQSxJQUFJLFdBQVc7QUFDWCxZQUFTO0FBQ0wseUJBQWtCLGVBRGI7QUFFTCxzQkFBZTtBQUZWLEtBREU7QUFLWCxZQUFTLGtCQUFXO0FBQ2hCLFlBQUksYUFBYSxPQUFPLE1BQXhCO0FBQUEsWUFDQSxTQUFTLE9BQU8sU0FEaEI7QUFBQSxZQUVBLGFBQWEsT0FBTyxNQUZwQjtBQUFBLFlBR0EsVUFBVSxPQUFPLFNBQVAsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBekIsSUFBa0MsQ0FBQyxDQUg3QztBQUFBLFlBSUEsV0FBVyxPQUFPLFNBQVAsQ0FBaUIsT0FBakIsQ0FBeUIsTUFBekIsSUFBbUMsQ0FBQyxDQUovQztBQUFBLFlBS0EsY0FBYyxPQUFPLFNBQVAsQ0FBaUIsS0FBakIsQ0FBdUIsT0FBdkIsQ0FMZDtBQUFBLFlBTUEsWUFBWSxVQUFVLFNBQVYsQ0FBb0IsV0FBcEIsR0FBa0MsT0FBbEMsQ0FBMEMsU0FBMUMsSUFBdUQsQ0FBQyxDQU5wRTtBQUFBLFlBT0EsaUJBQWlCLFNBQWpCLGNBQWlCLEdBQVc7QUFDeEIsbUJBQVEsT0FBTyxPQUFPLFdBQWQsS0FBOEIsV0FBL0IsSUFBZ0QsVUFBVSxTQUFWLENBQW9CLE9BQXBCLENBQTRCLFVBQTVCLE1BQTRDLENBQUMsQ0FBcEc7QUFDSCxTQVREOztBQVdBLFlBQUksZUFBZSxJQUFmLElBQXVCLGVBQWUsU0FBdEMsSUFBbUQsZUFBZSxhQUFsRSxJQUFtRixXQUFXLEtBQTlGLElBQXVHLFlBQVksS0FBdkgsRUFBOEgsQ0FFN0gsQ0FGRCxNQUVPO0FBQ0gsZ0JBQUksVUFBVSxTQUFWLENBQW9CLFdBQXBCLEdBQWtDLE9BQWxDLENBQTBDLFNBQTFDLEtBQXdELENBQUMsQ0FBN0QsRUFBZ0U7QUFDNUQseUJBQVMsZUFBVDtBQUNIO0FBQ0o7QUFDSixLQXhCVTtBQXlCWCxxQkFBa0IsMkJBQVc7QUFDekIsVUFBRSxTQUFTLE1BQVQsQ0FBZ0IsZUFBbEIsRUFBbUMsSUFBbkMsQ0FBd0MsU0FBUyxNQUFULENBQWdCLFlBQXhEO0FBQ0g7QUEzQlUsQ0FBZjs7QUE4QkEsT0FBTyxPQUFQLEdBQWlCO0FBQ2IsWUFBUyxTQUFTO0FBREwsQ0FBakI7OztBQzlCQTs7QUFFQSxJQUFJLGdCQUFnQjtBQUNoQixnQkFBWSxJQURJO0FBRWhCLFlBQVEsSUFGUTtBQUdoQixpQkFBYSxJQUhHO0FBSWhCLFlBQVE7QUFDSix1QkFBZSx5QkFBWTtBQUN2QixjQUFFLEdBQUYsQ0FBTSxrQkFBTixFQUEwQixVQUFVLElBQVYsRUFBZ0I7QUFDdEMsOEJBQWMsVUFBZCxDQUF5QixZQUF6QixDQUFzQyxJQUF0QztBQUNILGFBRkQ7QUFHSCxTQUxHO0FBTUosd0JBQWdCLDBCQUFZO0FBQ3hCLG1CQUFPLE1BQVAsQ0FBYyxNQUFkLENBQXFCLFdBQXJCLENBQ0k7QUFDSSxzQkFBTSxTQURWO0FBRUksd0JBQVE7QUFGWixhQURKLEVBS0ksSUFMSixFQU1JLENBQUMsU0FBRCxFQUFZLFNBQVosQ0FOSixFQU9FLElBUEYsQ0FPTyxVQUFVLEdBQVYsRUFBZTtBQUNsQiw4QkFBYyxNQUFkLEdBQXVCLEdBQXZCO0FBQ0Esb0JBQUksU0FBSixDQUFjLFNBQWQsRUFBeUIsRUFBekIsRUFBNkIsK0JBQTdCO0FBQ0gsYUFWRCxFQVVHLEtBVkgsQ0FVUyxVQUFVLEdBQVYsRUFBZTtBQUNwQix3QkFBUSxLQUFSLENBQWMsR0FBZDtBQUNILGFBWkQ7QUFhSCxTQXBCRztBQXFCSixzQkFBYyxzQkFBVSxRQUFWLEVBQW9CLFFBQXBCLEVBQThCLElBQTlCLEVBQW9DLFdBQXBDLEVBQWlEO0FBQzNELG1CQUFPLE1BQVAsQ0FBYyxNQUFkLENBQXFCLFNBQXJCLENBQ0ksS0FESixFQUVJLGNBQWMsTUFGbEIsRUFHRSxJQUhGLENBR08sVUFBVSxPQUFWLEVBQW1CO0FBQ3RCLG9CQUFJLGFBQWEsS0FBSyxTQUFMLENBQWUsT0FBZixDQUFqQjtBQUNBLG9CQUFJLGVBQWUsY0FBYyxVQUFkLENBQXlCLFVBQXpCLENBQW5CO0FBQ0Esb0JBQUksVUFBSixDQUFlLFFBQWYsRUFBeUIsUUFBekIsRUFBbUMsSUFBbkMsRUFBeUMsWUFBekMsRUFBdUQsV0FBdkQ7QUFDSCxhQVBELEVBUUssS0FSTCxDQVFXLFVBQVUsR0FBVixFQUFlO0FBQ2xCLHdCQUFRLEtBQVIsQ0FBYyxHQUFkO0FBQ0gsYUFWTDtBQVdIO0FBakNHLEtBSlE7QUF1Q2hCLFVBQU0sZ0JBQVk7QUFDZCxzQkFBYyxtQkFBZDtBQUNBLHNCQUFjLFVBQWQsR0FBMkIsSUFBSSxTQUFKLEVBQTNCO0FBQ0Esc0JBQWMsTUFBZCxDQUFxQixhQUFyQjtBQUNILEtBM0NlO0FBNENoQix5QkFBc0IsK0JBQVc7QUFDN0IsWUFBSSxPQUFPLE1BQVAsSUFBaUIsQ0FBQyxPQUFPLE1BQVAsQ0FBYyxNQUFoQyxJQUEwQyxPQUFPLE1BQVAsQ0FBYyxZQUE1RCxFQUEwRTtBQUN0RSxtQkFBTyxNQUFQLENBQWMsTUFBZCxHQUF1QixPQUFPLE1BQVAsQ0FBYyxZQUFyQztBQUNIO0FBQ0QsWUFBSSxDQUFDLE9BQU8sTUFBUixJQUFrQixDQUFDLE9BQU8sTUFBUCxDQUFjLE1BQXJDLEVBQTZDO0FBQ3pDLGtCQUFNLGtGQUFOO0FBQ0Esa0JBQU0sSUFBSSxLQUFKLENBQVUsa0ZBQVYsQ0FBTjtBQUNBO0FBQ0g7QUFDSixLQXJEZTtBQXNEaEIsZ0JBQVksb0JBQVUsSUFBVixFQUFnQjtBQUN4QixlQUFPLGNBQWMsVUFBZCxDQUF5QixPQUF6QixDQUFpQyxJQUFqQyxDQUFQO0FBQ0gsS0F4RGU7QUF5RGhCLGdCQUFZLG9CQUFVLElBQVYsRUFBZ0IsUUFBaEIsRUFBMEIsUUFBMUIsRUFBb0M7QUFDNUMsc0JBQWMsV0FBZCxHQUE0QixPQUFPLE1BQVAsQ0FBYyxlQUFkLENBQThCLElBQUksVUFBSixDQUFlLEVBQWYsQ0FBOUIsQ0FBNUI7QUFDQSxlQUFPLE1BQVAsQ0FBYyxNQUFkLENBQXFCLE9BQXJCLENBQ0k7QUFDSSxrQkFBTSxTQURWO0FBRUksZ0JBQUksY0FBYztBQUZ0QixTQURKLEVBS0ksY0FBYyxNQUxsQixFQU1JLElBTkosRUFPRSxJQVBGLENBT08sVUFBVSxTQUFWLEVBQXFCO0FBQ3hCLGdCQUFJLCtCQUErQixTQUFTLGFBQVQsQ0FBdUIsSUFBSSxVQUFKLENBQWUsU0FBZixDQUF2QixDQUFuQztBQUNBLGdCQUFJLGNBQWMsY0FBYyxVQUFkLENBQXlCLFNBQVMsYUFBVCxDQUF1QixjQUFjLFdBQXJDLENBQXpCLENBQWxCO0FBQ0EsMEJBQWMsTUFBZCxDQUFxQixZQUFyQixDQUFrQyxRQUFsQyxFQUE0QyxRQUE1QyxFQUFzRCw0QkFBdEQsRUFBb0YsV0FBcEY7QUFDSCxTQVhELEVBV0csS0FYSCxDQVdTLFVBQVUsR0FBVixFQUFlO0FBQ3BCLG9CQUFRLEtBQVIsQ0FBYyxHQUFkO0FBQ0gsU0FiRDtBQWNIO0FBekVlLENBQXBCO0FBMkVBLElBQUksTUFBTTtBQUNOLFlBQVE7QUFDSix5QkFBaUIsMkJBQVk7O0FBRXpCLGNBQUUsdUNBQUYsRUFBMkMsS0FBM0MsQ0FBaUQsWUFBWTtBQUN6RCxvQkFBSSxZQUFZLEVBQUUsa0NBQUYsQ0FBaEI7QUFDQywwQkFBVSxJQUFWLENBQWUsTUFBZixNQUEyQixVQUE1QixHQUEwQyxVQUFVLElBQVYsQ0FBZSxNQUFmLEVBQXVCLE1BQXZCLENBQTFDLEdBQTJFLFVBQVUsSUFBVixDQUFlLE1BQWYsRUFBdUIsVUFBdkIsQ0FBM0U7QUFDSCxhQUhEOztBQUtBLGNBQUUsa0JBQUYsRUFBc0IsS0FBdEIsQ0FBNEIsWUFBWTtBQUNwQyxvQkFBSSxPQUFPLElBQUksZUFBSixFQUFYO0FBQ0Esb0JBQUksQ0FBQyxJQUFMLEVBQVc7QUFDUCx3QkFBSSxTQUFKLENBQWMsT0FBZCxFQUF1QixRQUF2QixFQUFpQyxrQkFBakM7QUFDSDtBQUNELG9CQUFJLGdCQUFKLENBQXFCLElBQXJCO0FBQ0gsYUFORDtBQU9ILFNBZkc7QUFnQkosMkJBQW1CLDZCQUFZO0FBQzNCLGNBQUUsdUJBQUYsRUFBMkIsTUFBM0IsQ0FBa0MsWUFBWTtBQUMxQyxvQkFBSSxFQUFFLElBQUYsRUFBUSxHQUFSLE9BQWtCLEVBQXRCLEVBQTBCO0FBQ3RCLGtDQUFjLE1BQWQsQ0FBcUIsY0FBckI7QUFDQSxzQkFBRSxJQUFGLEVBQVEsUUFBUixDQUFpQixZQUFqQjtBQUNBLHNCQUFFLG1CQUFGLEVBQXVCLEdBQXZCLENBQTJCLFNBQTNCLEVBQXNDLE1BQXRDO0FBQ0gsaUJBSkQsTUFJTztBQUNILHNCQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLFlBQXBCO0FBQ0Esc0JBQUUsbUJBQUYsRUFBdUIsR0FBdkIsQ0FBMkIsU0FBM0IsRUFBc0MsTUFBdEM7QUFDSDtBQUNKLGFBVEQ7QUFVSCxTQTNCRztBQTRCSix5Q0FBaUMseUNBQVUsUUFBVixFQUFvQixjQUFwQixFQUFvQztBQUNqRSxnQkFBSSxZQUFZLEVBQUUsMkNBQUYsQ0FBaEI7QUFDQSxjQUFFLGdEQUFGLEVBQW9ELEtBQXBELENBQTBELFlBQVk7QUFDakUsMEJBQVUsSUFBVixPQUFxQixRQUF0QixHQUFrQyxVQUFVLElBQVYsQ0FBZSxjQUFmLENBQWxDLEdBQW1FLFVBQVUsSUFBVixDQUFlLFFBQWYsQ0FBbkU7QUFDSCxhQUZEO0FBR0gsU0FqQ0c7QUFrQ0osc0NBQThCLHdDQUFZO0FBQ3RDLGNBQUUsdUNBQUYsRUFBMkMsS0FBM0MsQ0FBaUQsVUFBVSxLQUFWLEVBQWlCO0FBQzlELHNCQUFNLGNBQU47QUFDQSxvQkFBSSxTQUFTLFFBQVEseUNBQVIsQ0FBYjtBQUNBLG9CQUFJLE1BQUosRUFBWTtBQUNSLDJCQUFPLFFBQVAsQ0FBZ0IsTUFBaEI7QUFDSDtBQUNKLGFBTkQ7QUFPSDtBQTFDRyxLQURGO0FBNkNOLFVBQU8sZ0JBQVc7QUFDZCxzQkFBYyxJQUFkO0FBQ0EsWUFBSSxNQUFKLENBQVcsZUFBWDtBQUNBLFlBQUksTUFBSixDQUFXLGlCQUFYO0FBQ0gsS0FqREs7QUFrRE4sZUFBVyxtQkFBVSxRQUFWLEVBQW9CLEtBQXBCLEVBQTJCLElBQTNCLEVBQWlDO0FBQ3hDLFlBQUksU0FBUyxFQUFFLG1CQUFGLENBQWI7QUFBQSxZQUNJLFdBQVcsRUFBRSxxQkFBRixDQURmO0FBQUEsWUFFSSxZQUFZLENBRmhCO0FBR0EsWUFBSSxhQUFhLE9BQWpCLEVBQTBCO0FBQ3RCLHdCQUFZLElBQVo7QUFDSCxTQUZELE1BRU8sSUFBSSxhQUFhLFNBQWpCLEVBQTRCO0FBQy9CLHdCQUFZLElBQVo7QUFDSCxTQUZNLE1BRUE7QUFDSCx3QkFBWSxJQUFaO0FBQ0g7QUFDRCxlQUFPLElBQVAsQ0FBWSxLQUFaO0FBQ0EsaUJBQVMsSUFBVCxDQUFjLElBQWQ7QUFDQSxVQUFFLFlBQUYsRUFBZ0IsUUFBaEIsQ0FBeUIsUUFBekIsRUFBbUMsUUFBbkMsQ0FBNEMsTUFBNUMsRUFBb0QsS0FBcEQsQ0FBMEQsU0FBMUQsRUFBcUUsS0FBckUsQ0FBMkUsVUFBVSxJQUFWLEVBQWdCO0FBQ3ZGLGNBQUUsSUFBRixFQUFRLFdBQVIsQ0FBb0IsTUFBcEIsRUFBNEIsV0FBNUIsQ0FBd0MsUUFBeEM7QUFDQSxtQkFBTyxJQUFQLENBQVksRUFBWjtBQUNBLHFCQUFTLElBQVQsQ0FBYyxFQUFkO0FBQ0E7QUFDSCxTQUxEO0FBTUgsS0FyRUs7QUFzRU4scUJBQWlCLDJCQUFZO0FBQ3pCLFlBQUksZUFBZSxTQUFTLGFBQVQsQ0FBdUIsdUJBQXZCLEVBQWdELEtBQWhELENBQXNELENBQXRELENBQW5CO0FBQ0EsZUFBTyxZQUFQO0FBQ0gsS0F6RUs7QUEwRU4sc0JBQWtCLDBCQUFVLElBQVYsRUFBZ0I7O0FBRTlCLFlBQUksU0FBUyxJQUFJLFVBQUosRUFBYjtBQUNBLGVBQU8sTUFBUCxHQUFnQixZQUFZO0FBQ3hCLGdCQUFJLGFBQWEsSUFBSSxVQUFKLENBQWUsT0FBTyxNQUF0QixDQUFqQjtBQUNBLDBCQUFjLFVBQWQsQ0FBeUIsVUFBekIsRUFBcUMsS0FBSyxJQUExQyxFQUFnRCxLQUFLLElBQXJEO0FBQ0gsU0FIRDtBQUlBLGVBQU8sT0FBUCxHQUFpQixVQUFVLEtBQVYsRUFBaUI7QUFDOUIsb0JBQVEsR0FBUixDQUFZLFNBQVosRUFBdUIsS0FBdkI7QUFDSCxTQUZEO0FBR0EsZUFBTyxVQUFQLEdBQW9CLFVBQVUsSUFBVixFQUFnQjtBQUNoQyxnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLG9CQUFJLFdBQVcsU0FBVyxLQUFLLE1BQUwsR0FBYyxLQUFLLEtBQXBCLEdBQTZCLEdBQXZDLEVBQTZDLEVBQTdDLENBQWY7QUFDSDtBQUNKLFNBSkQ7QUFLQSxlQUFPLGlCQUFQLENBQXlCLElBQXpCO0FBQ0gsS0ExRks7QUEyRk4sNEJBQXdCLGdDQUFVLEtBQVYsRUFBaUIsUUFBakIsRUFBMkI7QUFDL0MsVUFBRSxrQkFBRixFQUFzQixHQUF0QixDQUEwQixTQUExQixFQUFxQyxPQUFyQztBQUNBLFVBQUUscUNBQUYsRUFBeUMsSUFBekMsQ0FBOEMsS0FBOUM7QUFDQSxZQUFJLGlCQUFpQixFQUFyQjtBQUNBLGFBQUssSUFBSSxJQUFJLENBQWIsRUFBZ0IsSUFBSSxTQUFTLE1BQTdCLEVBQXFDLEdBQXJDLEVBQTBDO0FBQ3RDLDhCQUFrQixHQUFsQjtBQUNIO0FBQ0QsVUFBRSwyQ0FBRixFQUErQyxJQUEvQyxDQUFvRCxjQUFwRDtBQUNBLFlBQUksTUFBSixDQUFXLCtCQUFYLENBQTJDLFFBQTNDLEVBQXFELGNBQXJEO0FBQ0gsS0FwR0s7QUFxR04sZ0JBQVksb0JBQVUsUUFBVixFQUFvQixRQUFwQixFQUE4QixrQkFBOUIsRUFBa0QsWUFBbEQsRUFBZ0UsV0FBaEUsRUFBNkU7QUFDckYsVUFBRSxJQUFGLENBQU87QUFDSDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGtCQUFNLE1BUkg7QUFTSCxpQkFBSyxjQVRGO0FBVUgsaUJBQUssZUFBWTtBQUNiLG9CQUFJLE1BQU0sRUFBRSxZQUFGLENBQWUsR0FBZixFQUFWO0FBQ0Esb0JBQUksTUFBSixDQUFXLFVBQVgsR0FBd0IsVUFBVSxDQUFWLEVBQWE7QUFDakM7QUFDSCxpQkFGRDtBQUdBLHVCQUFPLEdBQVA7QUFDSCxhQWhCRTtBQWlCSCxrQkFBTTtBQUNGLDRCQUFZLFFBRFY7QUFFRiw0QkFBWSxRQUZWO0FBR0YsNEJBQVksa0JBSFY7QUFJRixnQ0FBZ0IsWUFKZDtBQUtGLCtCQUFlO0FBTGIsYUFqQkg7QUF3QkgsbUJBQU8sS0F4Qko7QUF5Qkgsc0JBQVUsTUF6QlA7QUEwQkgscUJBQVMsaUJBQVUsUUFBVixFQUFvQjtBQUN6QixvQkFBSSxTQUFKLENBQWMsU0FBUyxJQUF2QixFQUE2QixTQUFTLEtBQXRDLEVBQTZDLFNBQVMsSUFBdEQ7QUFDQSxvQkFBSSxTQUFTLElBQVQsS0FBa0IscUJBQXRCLEVBQTZDO0FBQ3pDLHNCQUFFLGdCQUFGLEVBQW9CLEdBQXBCLENBQXdCLFNBQXhCLEVBQW1DLE1BQW5DO0FBQ0Esd0JBQUksc0JBQUosQ0FBMkIsU0FBUyxLQUFwQyxFQUEyQyxTQUFTLFFBQXBEO0FBQ0Esd0JBQUksTUFBSixDQUFXLDRCQUFYO0FBQ0EsK0JBQVcsWUFBWTtBQUNuQiwwQkFBRSxpQkFBRixFQUFxQixRQUFyQixDQUE4QixXQUE5QjtBQUNILHFCQUZELEVBRUcsSUFGSDtBQUdIO0FBQ0osYUFwQ0U7QUFxQ0gsbUJBQU8sZUFBVSxHQUFWLEVBQWUsV0FBZixFQUE0QixXQUE1QixFQUF5QztBQUM1QyxvQkFBSSxTQUFKLENBQWMsT0FBZCxFQUF1QixFQUF2QixFQUEyQixJQUFJLFlBQS9CO0FBQ0g7QUF2Q0UsU0FBUDtBQXlDSDtBQS9JSyxDQUFWOztBQWtKQSxPQUFPLE9BQVAsR0FBaUI7QUFDYixnQkFBYSxJQUFJO0FBREosQ0FBakI7Ozs7O0FDL05BOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQVc7QUFDckQsNEJBQWdCLE1BQWhCOztBQUVBLFFBQUksRUFBRSxlQUFGLEVBQW1CLE1BQXZCLEVBQStCO0FBQzNCLDZCQUFhLFVBQWI7QUFDSDtBQUNKLENBTkQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIGRldGVjdG9yID0ge1xuICAgIGNvbmZpZyA6IHtcbiAgICAgICAgd3JhcHBlclNlbGVjdG9yIDogJy5tYWluLXdyYXBwZXInLFxuICAgICAgICBodG1sRXJyb3JNc2cgOiAnPGRpdj48aDIgY2xhc3M9XCJkZXRlY3QtYnJvd3Nlci10ZXh0XCI+U3lzdGVtIHN6eWZydWrEhWN5IG9iZWNuaWUgZHppYcWCYSA8c3BhbiBjbGFzcz1cImltcG9ydGFudFwiPnR5bGtvPC9zcGFuPiBuYSBwcnplZ2zEhWRhcmthY2g6PGJyPkdvb2dsZSBDaHJvbWUgb3JheiBNb3ppbGxhIEZpcmVmb3g8L2gyPjwvZGl2PidcbiAgICB9LFxuICAgIGRldGVjdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNDaHJvbWl1bSA9IHdpbmRvdy5jaHJvbWUsXG4gICAgICAgIHdpbk5hdiA9IHdpbmRvdy5uYXZpZ2F0b3IsXG4gICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICBpc09wZXJhID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdPUFInKSA+IC0xLFxuICAgICAgICBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignRWRnZScpID4gLTEsXG4gICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxuICAgICAgICBpc01vYmlsZURldmljZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpc0Nocm9taXVtICE9PSBudWxsICYmIGlzQ2hyb21pdW0gIT09IHVuZGVmaW5lZCAmJiB2ZW5kb3JOYW1lID09PSAnR29vZ2xlIEluYy4nICYmIGlzT3BlcmEgPT0gZmFsc2UgJiYgaXNJRWVkZ2UgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPD0gLTEpIHtcbiAgICAgICAgICAgICAgICBkZXRlY3Rvci5kaXNwbGF5RXJyb3JNc2coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgfSxcbiAgICBkaXNwbGF5RXJyb3JNc2cgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgJChkZXRlY3Rvci5jb25maWcud3JhcHBlclNlbGVjdG9yKS5odG1sKGRldGVjdG9yLmNvbmZpZy5odG1sRXJyb3JNc2cpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmRldGVjdFxufSIsIlwidXNlIHN0cmljdFwiO1xuXG52YXIgQ1JZUFRPX0VOR0lORSA9IHtcbiAgICBwYXNzQ3J5cHRvOiBudWxsLFxuICAgIGFlc0tleTogbnVsbCxcbiAgICBnZW5lcmF0ZWRJVjogbnVsbCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgbG9hZFB1YmxpY0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5nZXQoJ3JzYV8yMDQ4X3B1Yi5rZXknLCBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQdWJsaWNLZXkoZGF0YSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVBRVNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTI4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBBUFAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJycsICdTaWNoZXJlciBTY2hsw7xzc2VsIGdlbmVyaWVydCEnKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXhwb3J0QUVTS2V5OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXlcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5ZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoa2V5ZGF0YSk7XG4gICAgICAgICAgICAgICAgdmFyIGVuY3J5cHRlZEtleSA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBBUFAudXBsb2FkRmlsZShmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZGV0ZWN0QnJvd3NlckNvbmZpZygpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9LFxuICAgIGRldGVjdEJyb3dzZXJDb25maWcgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jcnlwdG8gJiYgIXdpbmRvdy5jcnlwdG8uc3VidGxlICYmIHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZSA9IHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2luZG93LmNyeXB0byB8fCAhd2luZG93LmNyeXB0by5zdWJ0bGUpIHtcbiAgICAgICAgICAgIGFsZXJ0KFwiWW91ciBicm93c2VyIGRvZXMgbm90IHN1cHBvcnQgdGhlIFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUaGlzIHBhZ2Ugd2lsbCBub3Qgd29yay5cIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJZb3VyIGJyb3dzZXIgZG9lcyBub3Qgc3VwcG9ydCB0aGUgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRoaXMgcGFnZSB3aWxsIG5vdCB3b3JrLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGRhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWID0gd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoMTIpKTtcbiAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZW5jcnlwdChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICBpdjogQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSxcbiAgICAgICAgICAgIGRhdGFcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIHZhciBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIHZhciBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xudmFyIEFQUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgYmluZENsaWNrRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG5cbiAgICAgICAgICAgICQoJy5maWxlLXBhc3N3b3JkLXdyYXBwZXJfX3Nob3ctcGFzc3dvcmQnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHBhc3NGaWVsZCA9ICQoJy5maWxlLXBhc3N3b3JkLXdyYXBwZXJfX3Bhc3N3b3JkJyk7XG4gICAgICAgICAgICAgICAgKHBhc3NGaWVsZC5hdHRyKCd0eXBlJykgPT09ICdwYXNzd29yZCcpID8gcGFzc0ZpZWxkLmF0dHIoJ3R5cGUnLCAndGV4dCcpIDogcGFzc0ZpZWxkLmF0dHIoJ3R5cGUnLCAncGFzc3dvcmQnKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkKCcuYnRuX3VwbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gQVBQLmdldFVwbG9hZGVkRmlsZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICBBUFAuc2hvd0FsZXJ0KCdlcnJvcicsICdFcnJvcjonLCAnRmlsZSBub3QgbG9hZGVkIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBUFAuZW5jcnlwdEFuZFVwbG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kTG9hZEZpbGVFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmlucHV0X2ZpbGUtdG8tdXBsb2FkJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZ2VuZXJhdGVBRVNLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS1idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS1idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRIaWRlQ3JlZGVudGlhbFBhc3N3b3JkRXZlbnQ6IGZ1bmN0aW9uIChwYXNzd29yZCwgZG90dGVkUGFzc3dvcmQpIHtcbiAgICAgICAgICAgIHZhciBwYXNzRmllbGQgPSAkKCcuZGF0YS13cmFwcGVyX19wYXNzd29yZC13cmFwcGVyX19wYXNzd29yZCcpO1xuICAgICAgICAgICAgJCgnI2RhdGEtd3JhcHBlcl9fcGFzc3dvcmQtd3JhcHBlcl9fc2hvdy1wYXNzd29yZCcpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAocGFzc0ZpZWxkLnRleHQoKSA9PT0gcGFzc3dvcmQpID8gcGFzc0ZpZWxkLnRleHQoZG90dGVkUGFzc3dvcmQpIDogcGFzc0ZpZWxkLnRleHQocGFzc3dvcmQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRSZW1lbWJlckNyZWRlbnRpYWxzQWxlcnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy51c2VyQ3JlZGVudGlhbHNfX3VwbG9hZC1hbm90aGVyLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHZhciBhbnN3ZXIgPSBjb25maXJtKCdIYWJlbiBTaWUgSWhyZSBMb2dpbi1EYXRlbiBnZXNwZWljaGVydD8nKTtcbiAgICAgICAgICAgICAgICBpZiAoYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5sb2NhdGlvbi5yZWxvYWQoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kQ2xpY2tFdmVudHMoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kTG9hZEZpbGVFdmVudCgpO1xuICAgIH0sXG4gICAgc2hvd0FsZXJ0OiBmdW5jdGlvbiAobXNnQ2xhc3MsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgIHZhciAkdGl0bGUgPSAkKCcuYWxlcnQtYm94X190aXRsZScpLFxuICAgICAgICAgICAgJG1lc3NhZ2UgPSAkKCcuYWxlcnQtYm94X19tZXNzYWdlJyksXG4gICAgICAgICAgICBkZWxheVRpbWUgPSAwO1xuICAgICAgICBpZiAobXNnQ2xhc3MgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDQwMDA7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gMzIwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDI1MDA7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldFVwbG9hZGVkRmlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICB2YXIgdXBsb2FkZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmlucHV0X2ZpbGUtdG8tdXBsb2FkJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiB1cGxvYWRlZEZpbGU7XG4gICAgfSxcbiAgICBlbmNyeXB0QW5kVXBsb2FkOiBmdW5jdGlvbiAoZmlsZSkge1xuXG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyIGJ5dGVzQXJyYXkgPSBuZXcgVWludDhBcnJheShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZW5jcnlwdEFFUyhieXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIHZhciBwcm9ncmVzcyA9IHBhcnNlSW50KCgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgc2hvd0NyZWRlbnRpYWxzV3JhcHBlcjogZnVuY3Rpb24gKGxvZ2luLCBwYXNzd29yZCkge1xuICAgICAgICAkKCcudXNlckNyZWRlbnRpYWxzJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICQoJy5kYXRhLXdyYXBwZXJfX2xvZ2luLXdyYXBwZXJfX2xvZ2luJykudGV4dChsb2dpbik7XG4gICAgICAgIHZhciBkb3R0ZWRwYXNzd29yZCA9ICcnO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHBhc3N3b3JkLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBkb3R0ZWRwYXNzd29yZCArPSAnKic7XG4gICAgICAgIH1cbiAgICAgICAgJCgnLmRhdGEtd3JhcHBlcl9fcGFzc3dvcmQtd3JhcHBlcl9fcGFzc3dvcmQnKS50ZXh0KGRvdHRlZHBhc3N3b3JkKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kSGlkZUNyZWRlbnRpYWxQYXNzd29yZEV2ZW50KHBhc3N3b3JkLCBkb3R0ZWRwYXNzd29yZCk7XG4gICAgfSxcbiAgICB1cGxvYWRGaWxlOiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBmaWxlSW5CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIC8vIHhockZpZWxkczoge1xuICAgICAgICAgICAgLy8gICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiBcInNhdmVGaWxlLnBocFwiLFxuICAgICAgICAgICAgeGhyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4geGhyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBcImZpbGVOYW1lXCI6IGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgIFwiZmlsZVR5cGVcIjogZmlsZVR5cGUsXG4gICAgICAgICAgICAgICAgXCJmaWxlRGF0YVwiOiBmaWxlSW5CYXNlNjRTdHJpbmcsXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRLZXlcIjogZW5jcnlwdGVkS2V5LFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkSVZcIjogZW5jcnlwdGVkSVZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgQVBQLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzIGNyZWRlbnRpYWxzJykge1xuICAgICAgICAgICAgICAgICAgICAkKCcuZmlsZS11cGxvYWRlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5zaG93Q3JlZGVudGlhbHNXcmFwcGVyKHJlc3BvbnNlLmxvZ2luLCByZXNwb25zZS5wYXNzd29yZCk7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5jb25maWcuYmluZFJlbWVtYmVyQ3JlZGVudGlhbHNBbGVydCgpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5tYWluTmF2X19sb2dpbicpLmFkZENsYXNzKCdkZWNvcmF0ZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMzAwMCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBhamF4T3B0aW9ucywgdGhyb3duRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBBUFAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXRFbmdpbmUgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBicm93c2VyRGV0ZWN0b3IgZnJvbSAnLi9saWIvYnJvd3Nlci1kZXRlY3QnO1xuaW1wb3J0IGNyeXB0b0VuZ2luZSBmcm9tICcuL2xpYi91cGxvYWQtcGFnZSc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGJyb3dzZXJEZXRlY3Rvci5kZXRlY3QoKTtcbiAgICBcbiAgICBpZiAoJCgnLmVuY3J5cHQtZm9ybScpLmxlbmd0aCkge1xuICAgICAgICBjcnlwdG9FbmdpbmUuaW5pdEVuZ2luZSgpO1xuICAgIH1cbn0pOyJdfQ==
