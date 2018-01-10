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

var CRYPTO_ENGINE = {
    passCrypto: null,
    privateKeyLoaded: false,
    aesKey: null,
    generatedIV: null,
    config: {
        setPrivateKey: function setPrivateKey() {
            var file = document.querySelector('.decrypt-files__private-key').files[0];
            if (file) {
                var reader = new FileReader();
                reader.readAsText(file, 'UTF-8');
                reader.onload = function (evt) {
                    CRYPTO_ENGINE.passCrypto.setPrivateKey(evt.target.result);
                    CRYPTO_ENGINE.privateKeyLoaded = true;
                    APP.loadedFiles++;
                    APP.checkLoadedFilesCount();
                    APP.showAlert('success', 'Sukces:', 'Wczytano klucz prywatny!');
                };
                reader.onerror = function (evt) {
                    APP.showAlert('error', 'Błąd: ', 'Nie można wczytać klucza prywatnego!');
                };
            }
        },
        importAESKey: function importAESKey(data, encryptedFileInBase64, fileName, fileType) {
            window.crypto.subtle.importKey("jwk", {
                kty: data.kty,
                k: data.k,
                alg: data.alg,
                ext: true
            }, {
                name: "AES-GCM"
            }, false, ["encrypt", "decrypt"]).then(function (key) {
                console.log('Klucz zaimportowany');
                CRYPTO_ENGINE.aesKey = key;
                var encryptedBytes = base64js.toByteArray(encryptedFileInBase64);
                var fileData = new Uint8Array(encryptedBytes);
                APP.loadIVFile(fileData, fileName, fileType);
            }).catch(function (err) {
                APP.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
            });
        }
    },
    init: function init() {
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.setPrivateKey();
    },
    decryptRSA: function decryptRSA(data) {
        return CRYPTO_ENGINE.passCrypto.decrypt(data);
    },
    decryptAES: function decryptAES(data, fileName, fileType) {
        window.crypto.subtle.decrypt({
            name: "AES-GCM",
            iv: CRYPTO_ENGINE.generatedIV
        }, CRYPTO_ENGINE.aesKey, data).then(function (decrypted) {
            APP.saveFile(new Uint8Array(decrypted), fileName, fileType);
            APP.showAlert('success', 'Sukces:', 'Odszyfrowano plik!');
        }).catch(function (err) {
            APP.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
        });
    }
};

var APP = {
    loadedFiles: 0,
    config: {
        setupAjaxHeader: function setupAjaxHeader() {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });
        },
        bindDecryptFileEvent: function bindDecryptFileEvent() {
            var $field = $('.decrypt-btn');
            $field.click(function () {
                if ($field.hasClass('blocked')) {
                    return;
                }
                var file = APP.getDownloadedFile();
                APP.decryptAndDownload(file);
            });
        },
        bindLoadFilesEvents: function bindLoadFilesEvents() {
            $('.decrypt-files__private-key').change(function () {
                CRYPTO_ENGINE.config.setPrivateKey();
            });
            $('.decrypt-files__main-file').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });
            $('.additional-files-wrapper__file-key').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });
            $('.additional-files-wrapper__file-iv').change(function () {
                APP.loadedFiles++;
                APP.checkLoadedFilesCount();
            });
        },
        bindDecryptFileNameEvent: function bindDecryptFileNameEvent() {
            $('.decrypt-files__main-file').change(function () {
                if ($(this).val() !== '') {
                    var uploadedFile = document.querySelector('.decrypt-files__main-file').files[0];
                    var fileName = uploadedFile.name;
                    var tmpFileName = fileName.substr(0, fileName.length - 8);
                    var finalFileName = tmpFileName.substr(0, tmpFileName.length);
                    $.ajax({
                        url: 'decryptFileName',
                        type: 'POST',
                        dataType: 'json',
                        data: {
                            encryptedFileName: finalFileName,
                            '_token': $('meta[name="csrf-token"]').attr('content')
                        }
                    }).done(function (response) {
                        $('.decrypt-files__label').addClass('label--blue');
                        if (response.originalFileName) {
                            $('.decrypt-files__main-file-original-name').html(response.originalFileName);
                            $('.decrypt-files__hint').addClass('active');
                        } else {
                            $('.decrypt-files__main-file-original-name').html('Nie zmieniona');
                        }
                    }).fail(function (response) {
                        console.log('error');
                    }).always(function () {
                        console.log("complete");
                    });
                } else {
                    $('.decrypt-files__label').removeClass('label--blue');
                    $('.decrypt-files__hint').removeClass('active');
                    $('.decrypt-files__main-file-original-name').html('nie dostępna');
                }
            });
        }
    },
    checkLoadedFilesCount: function checkLoadedFilesCount() {
        if (APP.loadedFiles >= 4) {
            $('.decrypt-btn').removeClass('blocked');
        }
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
    getDownloadedFile: function getDownloadedFile() {
        return document.querySelector('.decrypt-files__main-file').files[0];
    },
    loadIVFile: function loadIVFile(fileData, fileName, fileType) {
        var encryptedFile = document.querySelector('.additional-files-wrapper__file-iv').files[0];
        var reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function () {
            var encryptedFile = reader.result;
            var base64String = CRYPTO_ENGINE.decryptRSA(encryptedFile);
            var ivKey = base64js.toByteArray(base64String);
            CRYPTO_ENGINE.generatedIV = ivKey;
            CRYPTO_ENGINE.decryptAES(fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            APP.showAlert('error', 'Błąd:', 'Zły plik "file_iv" !');
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                console.log(progress);
            }
        };
    },
    loadKeyFile: function loadKeyFile(fileData, fileName, fileType) {
        var encryptedFile = document.querySelector('.additional-files-wrapper__file-key').files[0];
        var reader = new FileReader();
        reader.readAsText(encryptedFile, 'utf-8');
        reader.onload = function () {
            var jsonEncrypted = reader.result;
            var decryptedFile = CRYPTO_ENGINE.decryptRSA(jsonEncrypted);
            var fileKey = JSON.parse(decryptedFile);
            CRYPTO_ENGINE.config.importAESKey(fileKey, fileData, fileName, fileType);
        };
        reader.onerror = function (error) {
            APP.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                console.log(progress);
            }
        };
    },
    getBlob: function getBlob() {
        return Blob;
    },
    saveFile: function saveFile(byteData, fileName, fileType) {
        var BB = APP.getBlob();
        saveAs(new BB([byteData], { type: fileType }), fileName.substr(0, fileName.length - 8));
    },
    decryptAndDownload: function decryptAndDownload(base64File) {
        var reader = new FileReader();
        reader.onload = function () {
            var fileType = $('.decrypt-files__main-file-type').val();
            var base64String = reader.result;
            APP.loadKeyFile(base64String, base64File.name, fileType);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                var progress = parseInt(data.loaded / data.total * 100, 10);
                console.log(progress);
            }
        };
        reader.readAsText(base64File, 'utf-8');
    },
    init: function init() {
        CRYPTO_ENGINE.init();
        APP.config.setupAjaxHeader();
        APP.config.bindLoadFilesEvents();
        APP.config.bindDecryptFileEvent();
        APP.config.bindDecryptFileNameEvent();
    }
};

module.exports = {
    bindUIActions: APP.init
};

},{}],4:[function(require,module,exports){
'use strict';

var _alertBox = require('./alert-box');

var _alertBox2 = _interopRequireDefault(_alertBox);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var APP = {
    setupAjaxHeader: function setupAjaxHeader() {
        $.ajaxSetup({
            headers: {
                'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
            }
        });
    },
    deleteFile: function deleteFile(_fileId, parentNode) {
        $.ajax({
            type: 'POST',
            url: 'delete',
            data: {
                'fileId': _fileId,
                '_token': $('meta[name="csrf-token"]').attr('content')
            },
            dataType: 'json',
            success: function success(response) {
                _alertBox2.default.showAlert(response.type, response.title, response.text);
                if (response.type === 'success') {
                    parentNode.remove();
                }
            },
            error: function error(response) {
                _alertBox2.default.showAlert('error', 'Błąd:', response.responseText);
                console.log('Błąd:', response.responseText);
            }
        });
    },
    showDeleteFilePrompt: function showDeleteFilePrompt(fileName, fileId, parentNode) {
        var answer = confirm('Usuwanie: ' + fileName + '\n\nCzy na pewno chcesz usunąć plik?');
        if (answer) {
            APP.deleteFile(fileId, parentNode);
        }
    },
    config: {
        bindDeleteFileEvent: function bindDeleteFileEvent() {
            var $field = $('.fa-trash');
            $field.click(function (event) {
                event.preventDefault();
                var fileName = $(this).parents('.top-section').find('.top-section__name').text();
                var fileId = $(this).parents('.file-wrapper').find('.file-id').text();
                APP.showDeleteFilePrompt(fileName, fileId, $(this).parents('.file-wrapper'));
            });
        }
    },
    init: function init() {
        APP.setupAjaxHeader();
        APP.config.bindDeleteFileEvent();
    }
};

module.exports = {
    bindUIActions: APP.init
};

},{"./alert-box":1}],5:[function(require,module,exports){
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

},{"./alert-box":1}],6:[function(require,module,exports){
'use strict';

var _browserDetect = require('./lib/browser-detect');

var _browserDetect2 = _interopRequireDefault(_browserDetect);

var _uploadPage = require('./lib/upload-page');

var _uploadPage2 = _interopRequireDefault(_uploadPage);

var _panelPage = require('./lib/panel-page');

var _panelPage2 = _interopRequireDefault(_panelPage);

var _decryptPage = require('./lib/decrypt-page');

var _decryptPage2 = _interopRequireDefault(_decryptPage);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

document.addEventListener("DOMContentLoaded", function () {
    _browserDetect2.default.detect();

    if ($('.encrypt-form').length) {
        _uploadPage2.default.initEngine();
    }

    if ($('.file-list-wrapper').length) {
        _panelPage2.default.bindUIActions();
    }

    if ($('.decrypt-files').length) {
        _decryptPage2.default.bindUIActions();
    }
});

},{"./lib/browser-detect":2,"./lib/decrypt-page":3,"./lib/panel-page":4,"./lib/upload-page":5}]},{},[6])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtB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QUksWUFBakM7QUFDSDtBQXpDRSxTQUFQO0FBMkNILEtBekdPO0FBMEdSLFVBQU8sZ0JBQVc7QUFDZCxzQkFBYyxJQUFkO0FBQ0EsWUFBSSxNQUFKLENBQVcsVUFBWDtBQUNBLFlBQUksTUFBSixDQUFXLGFBQVg7QUFDSDtBQTlHTyxDQUFaOztBQWlIQSxPQUFPLE9BQVAsR0FBaUI7QUFDYixnQkFBYSxJQUFJO0FBREosQ0FBakI7Ozs7O0FDdk5BOzs7O0FBQ0E7Ozs7QUFDQTs7OztBQUNBOzs7Ozs7QUFFQSxTQUFTLGdCQUFULENBQTBCLGtCQUExQixFQUE4QyxZQUFXO0FBQ3JELDRCQUFnQixNQUFoQjs7QUFFQSxRQUFJLEVBQUUsZUFBRixFQUFtQixNQUF2QixFQUErQjtBQUMzQiw2QkFBYSxVQUFiO0FBQ0g7O0FBRUQsUUFBRyxFQUFFLG9CQUFGLEVBQXdCLE1BQTNCLEVBQW1DO0FBQy9CLDRCQUFVLGFBQVY7QUFDSDs7QUFFRCxRQUFHLEVBQUUsZ0JBQUYsRUFBb0IsTUFBdkIsRUFBK0I7QUFDM0IsOEJBQVksYUFBWjtBQUNIO0FBQ0osQ0FkRCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJ2YXIgUE9QVVAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIG1zZ1RpbWUgOiB7XG4gICAgICAgICAgICBlcnJvciA6IDQwMDAsXG4gICAgICAgICAgICB3YXJuaW5nIDogMzIwMCxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiAyNTAwXG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNob3dBbGVydDogZnVuY3Rpb24gKG1zZ0NsYXNzLCB0aXRsZSwgdGV4dCkge1xuICAgICAgICB2YXIgJHRpdGxlID0gJCgnLmFsZXJ0LWJveF9fdGl0bGUnKSxcbiAgICAgICAgICAgICRtZXNzYWdlID0gJCgnLmFsZXJ0LWJveF9fbWVzc2FnZScpLFxuICAgICAgICAgICAgZGVsYXlUaW1lID0gMDtcbiAgICAgICAgaWYgKG1zZ0NsYXNzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5lcnJvcjtcbiAgICAgICAgfSBlbHNlIGlmIChtc2dDbGFzcyA9PT0gJ3dhcm5pbmcnKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS53YXJuaW5nO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuc3VjY2VzcztcbiAgICAgICAgfVxuICAgICAgICAkdGl0bGUuaHRtbCh0aXRsZSk7XG4gICAgICAgICRtZXNzYWdlLmh0bWwodGV4dCk7XG4gICAgICAgICQoJy5hbGVydC1ib3gnKS5hZGRDbGFzcyhtc2dDbGFzcykuYWRkQ2xhc3MoJ3Nob3cnKS5kZWxheShkZWxheVRpbWUpLnF1ZXVlKGZ1bmN0aW9uIChuZXh0KSB7XG4gICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdzaG93JykucmVtb3ZlQ2xhc3MobXNnQ2xhc3MpO1xuICAgICAgICAgICAgJHRpdGxlLmh0bWwoJycpO1xuICAgICAgICAgICAgJG1lc3NhZ2UuaHRtbCgnJyk7XG4gICAgICAgICAgICBuZXh0KCk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIHNob3dBbGVydCA6IFBPUFVQLnNob3dBbGVydFxufSIsInZhciBkZXRlY3RvciA9IHtcbiAgICBjb25maWcgOiB7XG4gICAgICAgIHdyYXBwZXJTZWxlY3RvciA6ICcubWFpbi13cmFwcGVyJyxcbiAgICAgICAgaHRtbEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgfSxcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoZGV0ZWN0b3IuY29uZmlnLndyYXBwZXJTZWxlY3RvcikuaHRtbChkZXRlY3Rvci5jb25maWcuaHRtbEVycm9yTXNnKTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgZGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgZGV0ZWN0IDogZGV0ZWN0b3IuaW5pdFxufSIsIlxudmFyIENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBwcml2YXRlS2V5TG9hZGVkOiBmYWxzZSxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldFByaXZhdGVLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRlY3J5cHQtZmlsZXNfX3ByaXZhdGUta2V5JykuZmlsZXNbMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUsICdVVEYtOCcpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQcml2YXRlS2V5KGV2dC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wcml2YXRlS2V5TG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnc3VjY2VzcycsICdTdWtjZXM6JywgJ1djenl0YW5vIGtsdWN6IHByeXdhdG55IScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOiAnLCAnTmllIG1vxbxuYSB3Y3p5dGHEh8Kga2x1Y3phIHByeXdhdG5lZ28hJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbXBvcnRBRVNLZXk6IGZ1bmN0aW9uKGRhdGEsIGVuY3J5cHRlZEZpbGVJbkJhc2U2NCwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGt0eTogZGF0YS5rdHksXG4gICAgICAgICAgICAgICAgICAgIGs6IGRhdGEuayxcbiAgICAgICAgICAgICAgICAgICAgYWxnOiBkYXRhLmFsZyxcbiAgICAgICAgICAgICAgICAgICAgZXh0OiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oa2V5KXtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnS2x1Y3ogemFpbXBvcnRvd2FueScpO1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHZhciBlbmNyeXB0ZWRCeXRlcyA9IGJhc2U2NGpzLnRvQnl0ZUFycmF5KGVuY3J5cHRlZEZpbGVJbkJhc2U2NCk7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGVEYXRhID0gbmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkQnl0ZXMpO1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkSVZGaWxlKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBBUFAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvID0gbmV3IEpTRW5jcnlwdCgpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXRQcml2YXRlS2V5KCk7XG4gICAgfSxcbiAgICBkZWNyeXB0UlNBOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZGVjcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGRlY3J5cHRBRVM6IGZ1bmN0aW9uKGRhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5kZWNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24oZGVjcnlwdGVkKXtcbiAgICAgICAgICAgIEFQUC5zYXZlRmlsZShuZXcgVWludDhBcnJheShkZWNyeXB0ZWQpLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnc3VjY2VzcycsICdTdWtjZXM6JywgJ09kc3p5ZnJvd2FubyBwbGlrIScpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdaxYJ5IHBsaWsgXCJmaWxlX2tleVwiICEnKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxudmFyIEFQUCA9IHtcbiAgICBsb2FkZWRGaWxlczogMCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgdmFyICRmaWVsZCA9ICQoJy5kZWNyeXB0LWJ0bicpO1xuICAgICAgICAgICAgJGZpZWxkLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmKCRmaWVsZC5oYXNDbGFzcygnYmxvY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0RG93bmxvYWRlZEZpbGUoKTtcbiAgICAgICAgICAgICAgICBBUFAuZGVjcnlwdEFuZERvd25sb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRMb2FkRmlsZXNFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuc2V0UHJpdmF0ZUtleSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUta2V5JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUtaXYnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmREZWNyeXB0RmlsZU5hbWVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHVwbG9hZGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbGVOYW1lID0gdXBsb2FkZWRGaWxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIHZhciB0bXBGaWxlTmFtZSA9IGZpbGVOYW1lLnN1YnN0cigwLGZpbGVOYW1lLmxlbmd0aC04KTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGZpbmFsRmlsZU5hbWUgPSB0bXBGaWxlTmFtZS5zdWJzdHIoMCwgdG1wRmlsZU5hbWUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJ2RlY3J5cHRGaWxlTmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNyeXB0ZWRGaWxlTmFtZTogZmluYWxGaWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnX3Rva2VuJyA6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbGFiZWwnKS5hZGRDbGFzcygnbGFiZWwtLWJsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vcmlnaW5hbEZpbGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbChyZXNwb25zZS5vcmlnaW5hbEZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19faGludCcpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbCgnTmllIHptaWVuaW9uYScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19sYWJlbCcpLnJlbW92ZUNsYXNzKCdsYWJlbC0tYmx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19faGludCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbCgnbmllIGRvc3TEmXBuYScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjaGVja0xvYWRlZEZpbGVzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoQVBQLmxvYWRlZEZpbGVzID49IDQpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWJ0bicpLnJlbW92ZUNsYXNzKCdibG9ja2VkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIHNob3dBbGVydDogZnVuY3Rpb24obXNnQ2xhc3MsdGl0bGUsdGV4dCkge1xuICAgICAgICB2YXIgJHRpdGxlID0gJCgnLmFsZXJ0LWJveF9fdGl0bGUnKSxcbiAgICAgICAgICAgICRtZXNzYWdlID0gJCgnLmFsZXJ0LWJveF9fbWVzc2FnZScpLFxuICAgICAgICAgICAgZGVsYXlUaW1lID0gMDtcbiAgICAgICAgaWYgKG1zZ0NsYXNzID09PSAnZXJyb3InKSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSA0MDAwO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZ0NsYXNzID09PSAnd2FybmluZycpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDMyMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSAyNTAwO1xuICAgICAgICB9XG4gICAgICAgICR0aXRsZS5odG1sKHRpdGxlKTtcbiAgICAgICAgJG1lc3NhZ2UuaHRtbCh0ZXh0KTtcbiAgICAgICAgJCgnLmFsZXJ0LWJveCcpLmFkZENsYXNzKG1zZ0NsYXNzKS5hZGRDbGFzcygnc2hvdycpLmRlbGF5KGRlbGF5VGltZSkucXVldWUoZnVuY3Rpb24obmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGdldERvd25sb2FkZWRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICB9LFxuICAgIGxvYWRJVkZpbGU6IGZ1bmN0aW9uIChmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIHZhciBlbmNyeXB0ZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1pdicpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbmNyeXB0ZWRGaWxlID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIHZhciBiYXNlNjRTdHJpbmcgPSBDUllQVE9fRU5HSU5FLmRlY3J5cHRSU0EoZW5jcnlwdGVkRmlsZSk7XG4gICAgICAgICAgICB2YXIgaXZLZXkgPSBiYXNlNjRqcy50b0J5dGVBcnJheShiYXNlNjRTdHJpbmcpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IGl2S2V5O1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5kZWNyeXB0QUVTKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdaxYJ5IHBsaWsgXCJmaWxlX2l2XCIgIScpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBsb2FkS2V5RmlsZTogZnVuY3Rpb24gKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgdmFyIGVuY3J5cHRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBqc29uRW5jcnlwdGVkID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIHZhciBkZWNyeXB0ZWRGaWxlID0gQ1JZUFRPX0VOR0lORS5kZWNyeXB0UlNBKGpzb25FbmNyeXB0ZWQpO1xuICAgICAgICAgICAgdmFyIGZpbGVLZXkgPSBKU09OLnBhcnNlKGRlY3J5cHRlZEZpbGUpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuaW1wb3J0QUVTS2V5KGZpbGVLZXksIGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgQVBQLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdaxYJ5IHBsaWsgXCJmaWxlX2tleVwiICEnKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gcGFyc2VJbnQoICgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QmxvYjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCbG9iO1xuICAgIH0sXG4gICAgc2F2ZUZpbGU6IGZ1bmN0aW9uKGJ5dGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgdmFyIEJCID0gQVBQLmdldEJsb2IoKTtcbiAgICAgICAgc2F2ZUFzKFxuICAgICAgICAgICAgbmV3IEJCKFtieXRlRGF0YV0sIHsgdHlwZSA6IGZpbGVUeXBlIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWUuc3Vic3RyKDAsIGZpbGVOYW1lLmxlbmd0aC04KVxuICAgICAgICApO1xuICAgIH0sXG4gICAgZGVjcnlwdEFuZERvd25sb2FkOiBmdW5jdGlvbihiYXNlNjRGaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLXR5cGUnKS52YWwoKTtcbiAgICAgICAgICAgIHZhciBiYXNlNjRTdHJpbmcgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgQVBQLmxvYWRLZXlGaWxlKGJhc2U2NFN0cmluZywgYmFzZTY0RmlsZS5uYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgdmFyIHByb2dyZXNzID0gcGFyc2VJbnQoICgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChiYXNlNjRGaWxlLCAndXRmLTgnKTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5pbml0KCk7XG4gICAgICAgIEFQUC5jb25maWcuc2V0dXBBamF4SGVhZGVyKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZExvYWRGaWxlc0V2ZW50cygpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWNyeXB0RmlsZUV2ZW50KCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZERlY3J5cHRGaWxlTmFtZUV2ZW50KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmluZFVJQWN0aW9ucyA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuY29uc3QgQVBQID0ge1xuICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGVGaWxlOiBmdW5jdGlvbihfZmlsZUlkLCBwYXJlbnROb2RlKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6ICdkZWxldGUnLFxuICAgICAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICAgICAgICAnZmlsZUlkJyA6IF9maWxlSWQsXG4gICAgICAgICAgICAgICAgJ190b2tlbicgOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCByZXNwb25zZS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6JywgcmVzcG9uc2UucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzaG93RGVsZXRlRmlsZVByb21wdDogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlSWQsIHBhcmVudE5vZGUpIHtcbiAgICAgICAgbGV0IGFuc3dlciA9IGNvbmZpcm0oJ1VzdXdhbmllOiAnKyBmaWxlTmFtZSArJ1xcblxcbkN6eSBuYSBwZXdubyBjaGNlc3ogdXN1bsSFxIcgcGxpaz8nKTtcbiAgICAgICAgaWYoYW5zd2VyKSB7XG4gICAgICAgICAgICBBUFAuZGVsZXRlRmlsZShmaWxlSWQsIHBhcmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjb25maWc6IHtcbiAgICAgICAgYmluZERlbGV0ZUZpbGVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCAkZmllbGQgPSAkKCcuZmEtdHJhc2gnKTtcbiAgICAgICAgICAgICRmaWVsZC5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlTmFtZSA9ICQodGhpcykucGFyZW50cygnLnRvcC1zZWN0aW9uJykuZmluZCgnLnRvcC1zZWN0aW9uX19uYW1lJykudGV4dCgpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlSWQgPSAkKHRoaXMpLnBhcmVudHMoJy5maWxlLXdyYXBwZXInKS5maW5kKCcuZmlsZS1pZCcpLnRleHQoKTtcbiAgICAgICAgICAgICAgICBBUFAuc2hvd0RlbGV0ZUZpbGVQcm9tcHQoZmlsZU5hbWUsZmlsZUlkLCAkKHRoaXMpLnBhcmVudHMoJy5maWxlLXdyYXBwZXInKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEFQUC5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVsZXRlRmlsZUV2ZW50KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmluZFVJQWN0aW9ucyA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHVwbG9hZEJ1dHRvblRleHQgOiAnWmFzenlmcnVqIGkgd3nFm2xpaiBwbGlrJ1xufVxuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXR1cEFqYXhIZWFkZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdYLUNTUkYtVE9LRU4nOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxvYWRQdWJsaWNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogJ2dldFB1YktleScsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGUgOiAnanNvbicsXG4gICAgICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQdWJsaWNLZXkocmVzcG9uc2UpOyBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRlQUVTS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5nZW5lcmF0ZUtleShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDEyOCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJycsICdCZXpwaWVjem55IGtsdWN6IHd5Z2VuZXJvd2FueSEnKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXhwb3J0QUVTS2V5OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXlcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5ZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoa2V5ZGF0YSk7XG4gICAgICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEtleSA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBBUFAudXBsb2FkRmlsZShmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGV0ZWN0QnJvd3NlckNvbmZpZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiAhd2luZG93LmNyeXB0by5zdWJ0bGUgJiYgd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlID0gd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aW5kb3cuY3J5cHRvIHx8ICF3aW5kb3cuY3J5cHRvLnN1YnRsZSkge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsJ0LFgsSFZDogJyxcIlR3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuXCIpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGVuY3J5cHRSU0E6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZW5jcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGVuY3J5cHRBRVM6IGZ1bmN0aW9uIChmaWxlQnl0ZXNBcnJheSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBhcnJheXNDb3VudCA9IDEyO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWID0gd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoYXJyYXlzQ291bnQpKTtcbiAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZW5jcnlwdChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICBpdjogQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSxcbiAgICAgICAgICAgIGZpbGVCeXRlc0FycmF5XG4gICAgICAgICkudGhlbihmdW5jdGlvbiAoZW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBsZXQgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZyA9IGJhc2U2NGpzLmZyb21CeXRlQXJyYXkobmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkKSk7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkSVYgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoYmFzZTY0anMuZnJvbUJ5dGVBcnJheShDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWKSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5leHBvcnRBRVNLZXkoZmlsZU5hbWUsIGZpbGVUeXBlLCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRJVik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZGV0ZWN0QnJvd3NlckNvbmZpZygpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvID0gbmV3IEpTRW5jcnlwdCgpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5sb2FkUHVibGljS2V5KCk7XG4gICAgfVxufTtcblxuY29uc3QgQVBQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBjcmVhdGVGb3JtT2JqZWN0cyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgaW5wdXQgPSAnPGlucHV0IHR5cGU9XCJmaWxlXCIgY2xhc3M9XCJlbmNyeXB0LWZvcm1fX2ZpbGVcIj4nO1xuICAgICAgICAgICAgY29uc3QgdXBsb2FkQnV0dG9uID0gXG4gICAgICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJidG4td3JhcHBlciBidG4td3JhcHBlci0tdXBsb2FkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi0tdXBsb2FkLWZpbGVcIj4ke1NFVFRJTkdTLnVwbG9hZEJ1dHRvblRleHR9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gW2lucHV0LCB1cGxvYWRCdXR0b25dO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmRGb3JtIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IEFQUC5jb25maWcuY3JlYXRlRm9ybU9iamVjdHMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSAkKCcuZW5jcnlwdC1mb3JtJyk7XG4gICAgICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRVSUFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gQVBQLmdldEZvcm1GaWxlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdQbGlrIG5pZSB6b3N0YcWCIHdjenl0YW55IScpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEFQUC5lbmNyeXB0QW5kVXBsb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQoJy5lbmNyeXB0LWZvcm1fX2ZpbGUnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5nZW5lcmF0ZUFFU0tleSgpO1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXInKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRGb3JtRmlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgZmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5lbmNyeXB0LWZvcm1fX2ZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfSxcbiAgICBlbmNyeXB0QW5kVXBsb2FkOiBmdW5jdGlvbiAoZmlsZSkge1xuXG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgZmlsZUJ5dGVzQXJyYXkgPSBuZXcgVWludDhBcnJheShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZW5jcnlwdEFFUyhmaWxlQnl0ZXNBcnJheSwgZmlsZS5uYW1lLCBmaWxlLnR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0LFgsSFZDogJywgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gcGFyc2VJbnQoKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSxcbiAgICB1cGxvYWRGaWxlOiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBmaWxlSW5CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIC8vIHhockZpZWxkczoge1xuICAgICAgICAgICAgLy8gICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiBcInNhdmVGaWxlXCIsXG4gICAgICAgICAgICB4aHI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gY29uc29sZS5sb2coTWF0aC5mbG9vcihlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIFwiZmlsZU5hbWVcIjogZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgXCJmaWxlVHlwZVwiOiBmaWxlVHlwZSxcbiAgICAgICAgICAgICAgICBcImZpbGVEYXRhXCI6IGZpbGVJbkJhc2U2NFN0cmluZyxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZEtleVwiOiBlbmNyeXB0ZWRLZXksXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRJVlwiOiBlbmNyeXB0ZWRJVlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAvL1RPRE86IGRvZGHEhyBsb2FkZXIgKGdpZilcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgICAgIGxldCByZWZyZXNoQnRuID0gJCgnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtYW5vdGhlci1maWxlXCI+T2TFm3dpZcW8IHN0cm9uxJk8L2J1dHRvbj4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpOyAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyLS11cGxvYWQnKS5hcHBlbmQocmVmcmVzaEJ0bik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgYWpheE9wdGlvbnMsIHRocm93bkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLmFwcGVuZEZvcm0oKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdEVuZ2luZSA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IGJyb3dzZXJEZXRlY3RvciBmcm9tICcuL2xpYi9icm93c2VyLWRldGVjdCc7XG5pbXBvcnQgY3J5cHRvRW5naW5lIGZyb20gJy4vbGliL3VwbG9hZC1wYWdlJztcbmltcG9ydCBwYW5lbFBhZ2UgZnJvbSAnLi9saWIvcGFuZWwtcGFnZSc7XG5pbXBvcnQgZGVjcnlwdFBhZ2UgZnJvbSAnLi9saWIvZGVjcnlwdC1wYWdlJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3NlckRldGVjdG9yLmRldGVjdCgpO1xuICAgIFxuICAgIGlmICgkKCcuZW5jcnlwdC1mb3JtJykubGVuZ3RoKSB7XG4gICAgICAgIGNyeXB0b0VuZ2luZS5pbml0RW5naW5lKCk7XG4gICAgfVxuXG4gICAgaWYoJCgnLmZpbGUtbGlzdC13cmFwcGVyJykubGVuZ3RoKSB7XG4gICAgICAgIHBhbmVsUGFnZS5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxuXG4gICAgaWYoJCgnLmRlY3J5cHQtZmlsZXMnKS5sZW5ndGgpIHtcbiAgICAgICAgZGVjcnlwdFBhZ2UuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn0pOyJdfQ==
