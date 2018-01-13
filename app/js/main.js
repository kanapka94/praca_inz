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
                    _alertBox2.default.showAlert('success', 'Sukces:', 'Wczytano klucz prywatny!');
                };
                reader.onerror = function (evt) {
                    _alertBox2.default.showAlert('error', 'Błąd: ', 'Nie można wczytać klucza prywatnego!');
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
                _alertBox2.default.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
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
            _alertBox2.default.showAlert('success', 'Sukces:', 'Odszyfrowano plik!');
        }).catch(function (err) {
            _alertBox2.default.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
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
            _alertBox2.default.showAlert('error', 'Błąd:', 'Zły plik "file_iv" !');
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
            _alertBox2.default.showAlert('error', 'Błąd:', 'Zły plik "file_key" !');
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
        saveAs(new BB([byteData], { type: fileType }), fileName);
    },
    decryptAndDownload: function decryptAndDownload(base64File) {
        var reader = new FileReader();
        reader.onload = function () {
            var fileType = $('.decrypt-files__main-file-type').val();
            var base64String = reader.result;
            var fileName = $('.decrypt-files__main-file-original-name').text();
            APP.loadKeyFile(base64String, fileName, fileType);
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

},{"./alert-box":1}],4:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtBQUN2RixjQUFFLElBQUYsRUFBUSxXQUFSLENBQW9CLE1BQXBCLEVBQTRCLFdBQTVCLENBQXdDLFFBQXhDO0FBQ0EsbUJBQU8sSUFBUCxDQUFZLEVBQVo7QUFDQSxxQkFBUyxJQUFULENBQWMsRUFBZDtBQUNBO0FBQ0gsU0FMRDtBQU1IO0FBM0JPLENBQVo7O0FBOEJBLE9BQU8sT0FBUCxHQUFpQjtBQUNiLGVBQVksTUFBTTtBQURMLENBQWpCOzs7OztBQzlCQSxJQUFJLFdBQVc7QUFDWCxZQUFTO0FBQ0wseUJBQWtCLGVBRGI7QUFFTCxzQkFBZTtBQUZWLEtBREU7QUFLWCxZQUFTLGtCQUFXO0FBQ2hCLFlBQUksYUFBYSxPQUFPLE1BQXhCO0FBQUEsWUFDSSxTQUFTLE9BQU8sU0FEcEI7QUFBQSxZQUVJLGFBQWEsT0FBTyxNQUZ4QjtBQUFBLFlBR0ksVUFBVSxPQUFPLFNBQVAsQ0FBaUIsT0FBakIsQ0FBeUIsS0FBekIsSUFBa0MsQ0FBQyxDQUhqRDtBQUFBLFlBSUksV0FBVyxPQUFPLFNBQVAsQ0FBaUIsT0FBakIsQ0FBeUIsTUFBekIsSUFBbUMsQ0FBQyxDQUpuRDtBQUFBLFlBS0ksY0FBYyxPQUFPLFNBQVAsQ0FBaUIsS0FBakIsQ0FBdUIsT0FBdkIsQ0FMbEI7QUFBQSxZQU1JLFlBQVksVUFBVSxTQUFWLENBQW9CLFdBQXBCLEdBQWtDLE9BQWxDLENBQTBDLFNBQTFDLElBQXVELENBQUMsQ0FOeEU7QUFBQSxZQU9JLGlCQUFpQixTQUFqQixjQUFpQixHQUFXO0FBQ3hCLG1CQUFRLE9BQU8sT0FBTyxXQUFkLEtBQThCLFdBQS9CLElBQWdELFVBQVUsU0FBVixDQUFvQixPQUFwQixDQUE0QixVQUE1QixNQUE0QyxDQUFDLENBQXBHO0FBQ0gsU0FUTDs7QUFXQSxZQUFJLGVBQWUsSUFBZixJQUF1QixlQUFlLFNBQXRDLElBQW1ELGVBQWUsYUFBbEUsSUFBbUYsV0FBVyxLQUE5RixJQUF1RyxZQUFZLEtBQXZILEVBQThILENBRTdILENBRkQsTUFFTztBQUNILGdCQUFJLFVBQVUsU0FBVixDQUFvQixXQUFwQixHQUFrQyxPQUFsQyxDQUEwQyxTQUExQyxLQUF3RCxDQUFDLENBQTdELEVBQWdFO0FBQzVELHlCQUFTLGVBQVQ7QUFDSDtBQUNKO0FBQ0osS0F4QlU7QUF5QlgscUJBQWtCLDJCQUFXO0FBQ3pCLFVBQUUsU0FBUyxNQUFULENBQWdCLGVBQWxCLEVBQW1DLElBQW5DLENBQXdDLFNBQVMsTUFBVCxDQUFnQixZQUF4RDtBQUNILEtBM0JVO0FBNEJYLFVBQU8sZ0JBQVc7QUFDZCxpQkFBUyxNQUFUO0FBQ0g7QUE5QlUsQ0FBZjs7QUFpQ0EsT0FBTyxPQUFQLEdBQWlCO0FBQ2IsWUFBUyxTQUFTO0FBREwsQ0FBakI7Ozs7O0FDakNBOzs7Ozs7QUFFQSxJQUFJLGdCQUFnQjtBQUNoQixnQkFBWSxJQURJO0FBRWhCLHNCQUFrQixLQUZGO0FBR2hCLFlBQVEsSUFIUTtBQUloQixpQkFBYSxJQUpHO0FBS2hCLFlBQVE7QUFDSix1QkFBZSx5QkFBWTtBQUN2QixnQkFBSSxPQUFPLFNBQVMsYUFBVCxDQUF1Qiw2QkFBdkIsRUFBc0QsS0FBdEQsQ0FBNEQsQ0FBNUQsQ0FBWDtBQUNBLGdCQUFJLElBQUosRUFBVTtBQUNOLG9CQUFJLFNBQVMsSUFBSSxVQUFKLEVBQWI7QUFDQSx1QkFBTyxVQUFQLENBQWtCLElBQWxCLEVBQXdCLE9BQXhCO0FBQ0EsdUJBQU8sTUFBUCxHQUFnQixVQUFVLEdBQVYsRUFBZTtBQUMzQixrQ0FBYyxVQUFkLENBQXlCLGFBQXpCLENBQXVDLElBQUksTUFBSixDQUFXLE1BQWxEO0FBQ0Esa0NBQWMsZ0JBQWQsR0FBaUMsSUFBakM7QUFDQSx3QkFBSSxXQUFKO0FBQ0Esd0JBQUkscUJBQUo7QUFDQSx1Q0FBTSxTQUFOLENBQWdCLFNBQWhCLEVBQTJCLFNBQTNCLEVBQXNDLDBCQUF0QztBQUNILGlCQU5EO0FBT0EsdUJBQU8sT0FBUCxHQUFpQixVQUFVLEdBQVYsRUFBZTtBQUM1Qix1Q0FBTSxTQUFOLENBQWdCLE9BQWhCLEVBQXlCLFFBQXpCLEVBQW1DLHNDQUFuQztBQUNILGlCQUZEO0FBR0g7QUFDSixTQWpCRztBQWtCSixzQkFBYyxzQkFBUyxJQUFULEVBQWUscUJBQWYsRUFBc0MsUUFBdEMsRUFBZ0QsUUFBaEQsRUFBMEQ7QUFDcEUsbUJBQU8sTUFBUCxDQUFjLE1BQWQsQ0FBcUIsU0FBckIsQ0FDSSxLQURKLEVBRUk7QUFDSSxxQkFBSyxLQUFLLEdBRGQ7QUFFSSxtQkFBRyxLQUFLLENBRlo7QUFHSSxxQkFBSyxLQUFLLEdBSGQ7QUFJSSxxQkFBSztBQUpULGFBRkosRUFRSTtBQUNJLHNCQUFNO0FBRFYsYUFSSixFQVdJLEtBWEosRUFZSSxDQUFDLFNBQUQsRUFBWSxTQUFaLENBWkosRUFhRSxJQWJGLENBYU8sVUFBUyxHQUFULEVBQWE7QUFDaEIsd0JBQVEsR0FBUixDQUFZLHFCQUFaO0FBQ0EsOEJBQWMsTUFBZCxHQUF1QixHQUF2QjtBQUNBLG9CQUFJLGlCQUFpQixTQUFTLFdBQVQsQ0FBcUIscUJBQXJCLENBQXJCO0FBQ0Esb0JBQUksV0FBVyxJQUFJLFVBQUosQ0FBZSxjQUFmLENBQWY7QUFDQSxvQkFBSSxVQUFKLENBQWUsUUFBZixFQUF5QixRQUF6QixFQUFtQyxRQUFuQztBQUNILGFBbkJELEVBbUJHLEtBbkJILENBbUJTLFVBQVMsR0FBVCxFQUFhO0FBQ2xCLG1DQUFNLFNBQU4sQ0FBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0MsdUJBQWxDO0FBQ0gsYUFyQkQ7QUFzQkg7QUF6Q0csS0FMUTtBQWdEaEIsVUFBTSxnQkFBVztBQUNiLHNCQUFjLFVBQWQsR0FBMkIsSUFBSSxTQUFKLEVBQTNCO0FBQ0Esc0JBQWMsTUFBZCxDQUFxQixhQUFyQjtBQUNILEtBbkRlO0FBb0RoQixnQkFBWSxvQkFBUyxJQUFULEVBQWU7QUFDdkIsZUFBTyxjQUFjLFVBQWQsQ0FBeUIsT0FBekIsQ0FBaUMsSUFBakMsQ0FBUDtBQUNILEtBdERlO0FBdURoQixnQkFBWSxvQkFBUyxJQUFULEVBQWUsUUFBZixFQUF5QixRQUF6QixFQUFtQztBQUMzQyxlQUFPLE1BQVAsQ0FBYyxNQUFkLENBQXFCLE9BQXJCLENBQ0k7QUFDSSxrQkFBTSxTQURWO0FBRUksZ0JBQUksY0FBYztBQUZ0QixTQURKLEVBS0ksY0FBYyxNQUxsQixFQU1JLElBTkosRUFPRSxJQVBGLENBT08sVUFBUyxTQUFULEVBQW1CO0FBQ3RCLGdCQUFJLFFBQUosQ0FBYSxJQUFJLFVBQUosQ0FBZSxTQUFmLENBQWIsRUFBd0MsUUFBeEMsRUFBa0QsUUFBbEQ7QUFDQSwrQkFBTSxTQUFOLENBQWdCLFNBQWhCLEVBQTJCLFNBQTNCLEVBQXNDLG9CQUF0QztBQUNILFNBVkQsRUFVRyxLQVZILENBVVMsVUFBUyxHQUFULEVBQWE7QUFDbEIsK0JBQU0sU0FBTixDQUFnQixPQUFoQixFQUF5QixPQUF6QixFQUFrQyx1QkFBbEM7QUFDSCxTQVpEO0FBYUg7QUFyRWUsQ0FBcEI7O0FBd0VBLElBQUksTUFBTTtBQUNOLGlCQUFhLENBRFA7QUFFTixZQUFRO0FBQ0oseUJBQWtCLDJCQUFXO0FBQ3pCLGNBQUUsU0FBRixDQUFZO0FBQ1IseUJBQVM7QUFDTCxvQ0FBZ0IsRUFBRSx5QkFBRixFQUE2QixJQUE3QixDQUFrQyxTQUFsQztBQURYO0FBREQsYUFBWjtBQUtILFNBUEc7QUFRSiw4QkFBc0IsZ0NBQVk7QUFDOUIsZ0JBQUksU0FBUyxFQUFFLGNBQUYsQ0FBYjtBQUNBLG1CQUFPLEtBQVAsQ0FBYSxZQUFXO0FBQ3BCLG9CQUFHLE9BQU8sUUFBUCxDQUFnQixTQUFoQixDQUFILEVBQStCO0FBQzNCO0FBQ0g7QUFDRCxvQkFBSSxPQUFPLElBQUksaUJBQUosRUFBWDtBQUNBLG9CQUFJLGtCQUFKLENBQXVCLElBQXZCO0FBQ0gsYUFORDtBQU9ILFNBakJHO0FBa0JKLDZCQUFxQiwrQkFBWTtBQUM3QixjQUFFLDZCQUFGLEVBQWlDLE1BQWpDLENBQXdDLFlBQVk7QUFDaEQsOEJBQWMsTUFBZCxDQUFxQixhQUFyQjtBQUNILGFBRkQ7QUFHQSxjQUFFLDJCQUFGLEVBQStCLE1BQS9CLENBQXNDLFlBQVk7QUFDOUMsb0JBQUksV0FBSjtBQUNBLG9CQUFJLHFCQUFKO0FBQ0gsYUFIRDtBQUlBLGNBQUUscUNBQUYsRUFBeUMsTUFBekMsQ0FBZ0QsWUFBWTtBQUN4RCxvQkFBSSxXQUFKO0FBQ0Esb0JBQUkscUJBQUo7QUFDSCxhQUhEO0FBSUEsY0FBRSxvQ0FBRixFQUF3QyxNQUF4QyxDQUErQyxZQUFZO0FBQ3ZELG9CQUFJLFdBQUo7QUFDQSxvQkFBSSxxQkFBSjtBQUNILGFBSEQ7QUFLSCxTQW5DRztBQW9DSixrQ0FBMEIsb0NBQVc7QUFDakMsY0FBRSwyQkFBRixFQUErQixNQUEvQixDQUFzQyxZQUFZO0FBQzlDLG9CQUFJLEVBQUUsSUFBRixFQUFRLEdBQVIsT0FBa0IsRUFBdEIsRUFBMEI7QUFDdEIsd0JBQUksZUFBZSxTQUFTLGFBQVQsQ0FBdUIsMkJBQXZCLEVBQW9ELEtBQXBELENBQTBELENBQTFELENBQW5CO0FBQ0Esd0JBQUksV0FBVyxhQUFhLElBQTVCO0FBQ0Esd0JBQUksY0FBYyxTQUFTLE1BQVQsQ0FBZ0IsQ0FBaEIsRUFBa0IsU0FBUyxNQUFULEdBQWdCLENBQWxDLENBQWxCO0FBQ0Esd0JBQUksZ0JBQWdCLFlBQVksTUFBWixDQUFtQixDQUFuQixFQUFzQixZQUFZLE1BQWxDLENBQXBCO0FBQ0Esc0JBQUUsSUFBRixDQUFPO0FBQ0gsNkJBQUssaUJBREY7QUFFSCw4QkFBTSxNQUZIO0FBR0gsa0NBQVUsTUFIUDtBQUlILDhCQUFNO0FBQ0YsK0NBQW1CLGFBRGpCO0FBRUYsc0NBQVcsRUFBRSx5QkFBRixFQUE2QixJQUE3QixDQUFrQyxTQUFsQztBQUZUO0FBSkgscUJBQVAsRUFTQyxJQVRELENBU00sVUFBUyxRQUFULEVBQW1CO0FBQ3JCLDBCQUFFLHVCQUFGLEVBQTJCLFFBQTNCLENBQW9DLGFBQXBDO0FBQ0EsNEJBQUksU0FBUyxnQkFBYixFQUErQjtBQUMzQiw4QkFBRSx5Q0FBRixFQUE2QyxJQUE3QyxDQUFrRCxTQUFTLGdCQUEzRDtBQUNBLDhCQUFFLHNCQUFGLEVBQTBCLFFBQTFCLENBQW1DLFFBQW5DO0FBQ0gseUJBSEQsTUFHTztBQUNILDhCQUFFLHlDQUFGLEVBQTZDLElBQTdDLENBQWtELGVBQWxEO0FBQ0g7QUFDSixxQkFqQkQsRUFrQkMsSUFsQkQsQ0FrQk0sVUFBUyxRQUFULEVBQW1CO0FBQ3JCLGdDQUFRLEdBQVIsQ0FBWSxPQUFaO0FBQ0gscUJBcEJELEVBcUJDLE1BckJELENBcUJRLFlBQVc7QUFDZixnQ0FBUSxHQUFSLENBQVksVUFBWjtBQUNILHFCQXZCRDtBQXlCSCxpQkE5QkQsTUE4Qk87QUFDSCxzQkFBRSx1QkFBRixFQUEyQixXQUEzQixDQUF1QyxhQUF2QztBQUNBLHNCQUFFLHNCQUFGLEVBQTBCLFdBQTFCLENBQXNDLFFBQXRDO0FBQ0Esc0JBQUUseUNBQUYsRUFBNkMsSUFBN0MsQ0FBa0QsY0FBbEQ7QUFDSDtBQUNKLGFBcENEO0FBcUNIO0FBMUVHLEtBRkY7QUE4RU4sMkJBQXVCLGlDQUFZO0FBQy9CLFlBQUcsSUFBSSxXQUFKLElBQW1CLENBQXRCLEVBQXlCO0FBQ3JCLGNBQUUsY0FBRixFQUFrQixXQUFsQixDQUE4QixTQUE5QjtBQUNIO0FBQ0osS0FsRks7QUFtRk4sdUJBQW1CLDZCQUFXO0FBQzFCLGVBQU8sU0FBUyxhQUFULENBQXVCLDJCQUF2QixFQUFvRCxLQUFwRCxDQUEwRCxDQUExRCxDQUFQO0FBQ0gsS0FyRks7QUFzRk4sZ0JBQVksb0JBQVUsUUFBVixFQUFvQixRQUFwQixFQUE4QixRQUE5QixFQUF3QztBQUNoRCxZQUFJLGdCQUFnQixTQUFTLGFBQVQsQ0FBdUIsb0NBQXZCLEVBQTZELEtBQTdELENBQW1FLENBQW5FLENBQXBCO0FBQ0EsWUFBSSxTQUFTLElBQUksVUFBSixFQUFiO0FBQ0EsZUFBTyxVQUFQLENBQWtCLGFBQWxCLEVBQWlDLE9BQWpDO0FBQ0EsZUFBTyxNQUFQLEdBQWdCLFlBQVc7QUFDdkIsZ0JBQUksZ0JBQWdCLE9BQU8sTUFBM0I7QUFDQSxnQkFBSSxlQUFlLGNBQWMsVUFBZCxDQUF5QixhQUF6QixDQUFuQjtBQUNBLGdCQUFJLFFBQVEsU0FBUyxXQUFULENBQXFCLFlBQXJCLENBQVo7QUFDQSwwQkFBYyxXQUFkLEdBQTRCLEtBQTVCO0FBQ0EsMEJBQWMsVUFBZCxDQUF5QixRQUF6QixFQUFtQyxRQUFuQyxFQUE2QyxRQUE3QztBQUNILFNBTkQ7QUFPQSxlQUFPLE9BQVAsR0FBaUIsVUFBVSxLQUFWLEVBQWlCO0FBQzlCLCtCQUFNLFNBQU4sQ0FBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0Msc0JBQWxDO0FBQ0gsU0FGRDtBQUdBLGVBQU8sVUFBUCxHQUFvQixVQUFTLElBQVQsRUFBZTtBQUMvQixnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLG9CQUFJLFdBQVcsU0FBWSxLQUFLLE1BQUwsR0FBYyxLQUFLLEtBQXBCLEdBQTZCLEdBQXhDLEVBQThDLEVBQTlDLENBQWY7QUFDQSx3QkFBUSxHQUFSLENBQVksUUFBWjtBQUNIO0FBQ0osU0FMRDtBQU1ILEtBMUdLO0FBMkdOLGlCQUFhLHFCQUFVLFFBQVYsRUFBb0IsUUFBcEIsRUFBOEIsUUFBOUIsRUFBd0M7QUFDakQsWUFBSSxnQkFBZ0IsU0FBUyxhQUFULENBQXVCLHFDQUF2QixFQUE4RCxLQUE5RCxDQUFvRSxDQUFwRSxDQUFwQjtBQUNBLFlBQUksU0FBUyxJQUFJLFVBQUosRUFBYjtBQUNBLGVBQU8sVUFBUCxDQUFrQixhQUFsQixFQUFpQyxPQUFqQztBQUNBLGVBQU8sTUFBUCxHQUFnQixZQUFXO0FBQ3ZCLGdCQUFJLGdCQUFnQixPQUFPLE1BQTNCO0FBQ0EsZ0JBQUksZ0JBQWdCLGNBQWMsVUFBZCxDQUF5QixhQUF6QixDQUFwQjtBQUNBLGdCQUFJLFVBQVUsS0FBSyxLQUFMLENBQVcsYUFBWCxDQUFkO0FBQ0EsMEJBQWMsTUFBZCxDQUFxQixZQUFyQixDQUFrQyxPQUFsQyxFQUEyQyxRQUEzQyxFQUFxRCxRQUFyRCxFQUErRCxRQUEvRDtBQUNILFNBTEQ7QUFNQSxlQUFPLE9BQVAsR0FBaUIsVUFBVSxLQUFWLEVBQWlCO0FBQzlCLCtCQUFNLFNBQU4sQ0FBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0MsdUJBQWxDO0FBQ0gsU0FGRDtBQUdBLGVBQU8sVUFBUCxHQUFvQixVQUFTLElBQVQsRUFBZTtBQUMvQixnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLG9CQUFJLFdBQVcsU0FBWSxLQUFLLE1BQUwsR0FBYyxLQUFLLEtBQXBCLEdBQTZCLEdBQXhDLEVBQThDLEVBQTlDLENBQWY7QUFDQSx3QkFBUSxHQUFSLENBQVksUUFBWjtBQUNIO0FBQ0osU0FMRDtBQU1ILEtBOUhLO0FBK0hOLGFBQVMsbUJBQVc7QUFDaEIsZUFBTyxJQUFQO0FBQ0gsS0FqSUs7QUFrSU4sY0FBVSxrQkFBUyxRQUFULEVBQW1CLFFBQW5CLEVBQTZCLFFBQTdCLEVBQXVDO0FBQzdDLFlBQUksS0FBSyxJQUFJLE9BQUosRUFBVDtBQUNBLGVBQ0ksSUFBSSxFQUFKLENBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUIsRUFBRSxNQUFPLFFBQVQsRUFBbkIsQ0FESixFQUVJLFFBRko7QUFJSCxLQXhJSztBQXlJTix3QkFBb0IsNEJBQVMsVUFBVCxFQUFxQjtBQUNyQyxZQUFJLFNBQVMsSUFBSSxVQUFKLEVBQWI7QUFDQSxlQUFPLE1BQVAsR0FBZ0IsWUFBVztBQUN2QixnQkFBSSxXQUFXLEVBQUUsZ0NBQUYsRUFBb0MsR0FBcEMsRUFBZjtBQUNBLGdCQUFJLGVBQWUsT0FBTyxNQUExQjtBQUNBLGdCQUFJLFdBQVcsRUFBRSx5Q0FBRixFQUE2QyxJQUE3QyxFQUFmO0FBQ0EsZ0JBQUksV0FBSixDQUFnQixZQUFoQixFQUE4QixRQUE5QixFQUF3QyxRQUF4QztBQUNILFNBTEQ7QUFNQSxlQUFPLE9BQVAsR0FBaUIsVUFBVSxLQUFWLEVBQWlCO0FBQzlCLG9CQUFRLEdBQVIsQ0FBWSxTQUFaLEVBQXVCLEtBQXZCO0FBQ0gsU0FGRDtBQUdBLGVBQU8sVUFBUCxHQUFvQixVQUFTLElBQVQsRUFBZTtBQUMvQixnQkFBSSxLQUFLLGdCQUFULEVBQTJCO0FBQ3ZCLG9CQUFJLFdBQVcsU0FBWSxLQUFLLE1BQUwsR0FBYyxLQUFLLEtBQXBCLEdBQTZCLEdBQXhDLEVBQThDLEVBQTlDLENBQWY7QUFDQSx3QkFBUSxHQUFSLENBQVksUUFBWjtBQUNIO0FBQ0osU0FMRDtBQU1BLGVBQU8sVUFBUCxDQUFrQixVQUFsQixFQUE4QixPQUE5QjtBQUNILEtBM0pLO0FBNEpOLFVBQU8sZ0JBQVc7QUFDZCxzQkFBYyxJQUFkO0FBQ0EsWUFBSSxNQUFKLENBQVcsZUFBWDtBQUNBLFlBQUksTUFBSixDQUFXLG1CQUFYO0FBQ0EsWUFBSSxNQUFKLENBQVcsb0JBQVg7QUFDQSxZQUFJLE1BQUosQ0FBVyx3QkFBWDtBQUNIO0FBbEtLLENBQVY7O0FBcUtBLE9BQU8sT0FBUCxHQUFpQjtBQUNiLG1CQUFnQixJQUFJO0FBRFAsQ0FBakI7Ozs7O0FDL09BOzs7Ozs7QUFFQSxJQUFNLE1BQU07QUFDUixxQkFBa0IsMkJBQVc7QUFDekIsVUFBRSxTQUFGLENBQVk7QUFDUixxQkFBUztBQUNMLGdDQUFnQixFQUFFLHlCQUFGLEVBQTZCLElBQTdCLENBQWtDLFNBQWxDO0FBRFg7QUFERCxTQUFaO0FBS0gsS0FQTztBQVFSLGdCQUFZLG9CQUFTLE9BQVQsRUFBa0IsVUFBbEIsRUFBOEI7QUFDdEMsVUFBRSxJQUFGLENBQU87QUFDSCxrQkFBTSxNQURIO0FBRUgsaUJBQUssUUFGRjtBQUdILGtCQUFNO0FBQ0YsMEJBQVcsT0FEVDtBQUVGLDBCQUFXLEVBQUUseUJBQUYsRUFBNkIsSUFBN0IsQ0FBa0MsU0FBbEM7QUFGVCxhQUhIO0FBT0gsc0JBQVUsTUFQUDtBQVFILHFCQUFTLGlCQUFVLFFBQVYsRUFBb0I7QUFDekIsbUNBQU0sU0FBTixDQUFnQixTQUFTLElBQXpCLEVBQStCLFNBQVMsS0FBeEMsRUFBK0MsU0FBUyxJQUF4RDtBQUNBLG9CQUFHLFNBQVMsSUFBVCxLQUFrQixTQUFyQixFQUFnQztBQUM1QiwrQkFBVyxNQUFYO0FBQ0g7QUFDSixhQWJFO0FBY0gsbUJBQU8sZUFBVSxRQUFWLEVBQW9CO0FBQ3ZCLG1DQUFNLFNBQU4sQ0FBZ0IsT0FBaEIsRUFBeUIsT0FBekIsRUFBa0MsU0FBUyxZQUEzQztBQUNBLHdCQUFRLEdBQVIsQ0FBWSxPQUFaLEVBQXFCLFNBQVMsWUFBOUI7QUFDSDtBQWpCRSxTQUFQO0FBbUJILEtBNUJPO0FBNkJSLDBCQUFzQiw4QkFBVSxRQUFWLEVBQW9CLE1BQXBCLEVBQTRCLFVBQTVCLEVBQXdDO0FBQzFELFlBQUksU0FBUyxRQUFRLGVBQWMsUUFBZCxHQUF3QixzQ0FBaEMsQ0FBYjtBQUNBLFlBQUcsTUFBSCxFQUFXO0FBQ1AsZ0JBQUksVUFBSixDQUFlLE1BQWYsRUFBdUIsVUFBdkI7QUFDSDtBQUNKLEtBbENPO0FBbUNSLFlBQVE7QUFDSiw2QkFBcUIsK0JBQVc7QUFDNUIsZ0JBQU0sU0FBUyxFQUFFLFdBQUYsQ0FBZjtBQUNBLG1CQUFPLEtBQVAsQ0FBYSxVQUFVLEtBQVYsRUFBaUI7QUFDMUIsc0JBQU0sY0FBTjtBQUNBLG9CQUFJLFdBQVcsRUFBRSxJQUFGLEVBQVEsT0FBUixDQUFnQixjQUFoQixFQUFnQyxJQUFoQyxDQUFxQyxvQkFBckMsRUFBMkQsSUFBM0QsRUFBZjtBQUNBLG9CQUFJLFNBQVMsRUFBRSxJQUFGLEVBQVEsT0FBUixDQUFnQixlQUFoQixFQUFpQyxJQUFqQyxDQUFzQyxVQUF0QyxFQUFrRCxJQUFsRCxFQUFiO0FBQ0Esb0JBQUksb0JBQUosQ0FBeUIsUUFBekIsRUFBa0MsTUFBbEMsRUFBMEMsRUFBRSxJQUFGLEVBQVEsT0FBUixDQUFnQixlQUFoQixDQUExQztBQUNILGFBTEQ7QUFNSDtBQVRHLEtBbkNBO0FBOENSLFVBQU8sZ0JBQVc7QUFDZCxZQUFJLGVBQUo7QUFDQSxZQUFJLE1BQUosQ0FBVyxtQkFBWDtBQUNIO0FBakRPLENBQVo7O0FBb0RBLE9BQU8sT0FBUCxHQUFpQjtBQUNiLG1CQUFnQixJQUFJO0FBRFAsQ0FBakI7Ozs7O0FDdERBOzs7Ozs7QUFFQTs7QUFFQSxJQUFNLFdBQVc7QUFDYixzQkFBbUI7QUFETixDQUFqQjs7QUFJQSxJQUFNLGdCQUFnQjtBQUNsQixnQkFBWSxJQURNO0FBRWxCLFlBQVEsSUFGVTtBQUdsQixpQkFBYSxJQUhLO0FBSWxCLFlBQVE7QUFDSix5QkFBa0IsMkJBQVc7QUFDekIsY0FBRSxTQUFGLENBQVk7QUFDUix5QkFBUztBQUNMLG9DQUFnQixFQUFFLHlCQUFGLEVBQTZCLElBQTdCLENBQWtDLFNBQWxDO0FBRFg7QUFERCxhQUFaO0FBS0gsU0FQRztBQVFKLHVCQUFlLHlCQUFZO0FBQ3ZCLGNBQUUsSUFBRixDQUFPO0FBQ0gsc0JBQU0sTUFESDtBQUVILHFCQUFLLFdBRkY7QUFHSCwwQkFBVyxNQUhSO0FBSUgseUJBQVUsaUJBQVMsUUFBVCxFQUFtQjtBQUN6QixrQ0FBYyxVQUFkLENBQXlCLFlBQXpCLENBQXNDLFFBQXRDO0FBQ0gsaUJBTkU7QUFPSCx1QkFBUSxlQUFTLFFBQVQsRUFBbUI7QUFDdkIsNEJBQVEsS0FBUixDQUFjLFFBQWQ7QUFDSDtBQVRFLGFBQVA7QUFXSCxTQXBCRztBQXFCSix3QkFBZ0IsMEJBQVk7QUFDeEIsbUJBQU8sTUFBUCxDQUFjLE1BQWQsQ0FBcUIsV0FBckIsQ0FDSTtBQUNJLHNCQUFNLFNBRFY7QUFFSSx3QkFBUTtBQUZaLGFBREosRUFLSSxJQUxKLEVBTUksQ0FBQyxTQUFELEVBQVksU0FBWixDQU5KLEVBT0UsSUFQRixDQU9PLFVBQVUsR0FBVixFQUFlO0FBQ2xCLDhCQUFjLE1BQWQsR0FBdUIsR0FBdkI7QUFDQSxtQ0FBTSxTQUFOLENBQWdCLFNBQWhCLEVBQTJCLEVBQTNCLEVBQStCLGdDQUEvQjtBQUNILGFBVkQsRUFVRyxLQVZILENBVVMsVUFBVSxHQUFWLEVBQWU7QUFDcEIsd0JBQVEsS0FBUixDQUFjLEdBQWQ7QUFDSCxhQVpEO0FBYUgsU0FuQ0c7QUFvQ0osc0JBQWMsc0JBQVUsUUFBVixFQUFvQixRQUFwQixFQUE4QixJQUE5QixFQUFvQyxXQUFwQyxFQUFpRDtBQUMzRCxtQkFBTyxNQUFQLENBQWMsTUFBZCxDQUFxQixTQUFyQixDQUNJLEtBREosRUFFSSxjQUFjLE1BRmxCLEVBR0UsSUFIRixDQUdPLFVBQVUsT0FBVixFQUFtQjtBQUN0QixvQkFBSSxhQUFhLEtBQUssU0FBTCxDQUFlLE9BQWYsQ0FBakI7QUFDQSxvQkFBSSxlQUFlLGNBQWMsVUFBZCxDQUF5QixVQUF6QixDQUFuQjtBQUNBLG9CQUFJLFVBQUosQ0FBZSxRQUFmLEVBQXlCLFFBQXpCLEVBQW1DLElBQW5DLEVBQXlDLFlBQXpDLEVBQXVELFdBQXZEO0FBQ0gsYUFQRCxFQVFLLEtBUkwsQ0FRVyxVQUFVLEtBQVYsRUFBaUI7QUFDcEIsbUNBQU0sU0FBTixDQUFnQixPQUFoQixFQUF5QixRQUF6QixFQUFtQyxLQUFuQztBQUNBLHdCQUFRLEtBQVIsQ0FBYyxLQUFkO0FBQ0gsYUFYTDtBQVlIO0FBakRHLEtBSlU7QUF1RGxCLHlCQUFzQiwrQkFBVztBQUM3QixZQUFJLE9BQU8sTUFBUCxJQUFpQixDQUFDLE9BQU8sTUFBUCxDQUFjLE1BQWhDLElBQTBDLE9BQU8sTUFBUCxDQUFjLFlBQTVELEVBQTBFO0FBQ3RFLG1CQUFPLE1BQVAsQ0FBYyxNQUFkLEdBQXVCLE9BQU8sTUFBUCxDQUFjLFlBQXJDO0FBQ0g7QUFDRCxZQUFJLENBQUMsT0FBTyxNQUFSLElBQWtCLENBQUMsT0FBTyxNQUFQLENBQWMsTUFBckMsRUFBNkM7QUFDekMsK0JBQU0sU0FBTixDQUFnQixPQUFoQixFQUF3QixRQUF4QixFQUFpQywyR0FBakM7QUFDQSxrQkFBTSxJQUFJLEtBQUosQ0FBVSwyR0FBVixDQUFOO0FBQ0E7QUFDSDtBQUNKLEtBaEVpQjtBQWlFbEIsZ0JBQVksb0JBQVUsSUFBVixFQUFnQjtBQUN4QixlQUFPLGNBQWMsVUFBZCxDQUF5QixPQUF6QixDQUFpQyxJQUFqQyxDQUFQO0FBQ0gsS0FuRWlCO0FBb0VsQixnQkFBWSxvQkFBVSxjQUFWLEVBQTBCLFFBQTFCLEVBQW9DLFFBQXBDLEVBQThDO0FBQ3RELFlBQUksY0FBYyxFQUFsQjtBQUNBLHNCQUFjLFdBQWQsR0FBNEIsT0FBTyxNQUFQLENBQWMsZUFBZCxDQUE4QixJQUFJLFVBQUosQ0FBZSxXQUFmLENBQTlCLENBQTVCO0FBQ0EsZUFBTyxNQUFQLENBQWMsTUFBZCxDQUFxQixPQUFyQixDQUNJO0FBQ0ksa0JBQU0sU0FEVjtBQUVJLGdCQUFJLGNBQWM7QUFGdEIsU0FESixFQUtJLGNBQWMsTUFMbEIsRUFNSSxjQU5KLEVBT0UsSUFQRixDQU9PLFVBQVUsU0FBVixFQUFxQjtBQUN4QixnQkFBSSwrQkFBK0IsU0FBUyxhQUFULENBQXVCLElBQUksVUFBSixDQUFlLFNBQWYsQ0FBdkIsQ0FBbkM7QUFDQSxnQkFBSSxjQUFjLGNBQWMsVUFBZCxDQUF5QixTQUFTLGFBQVQsQ0FBdUIsY0FBYyxXQUFyQyxDQUF6QixDQUFsQjtBQUNBLDBCQUFjLE1BQWQsQ0FBcUIsWUFBckIsQ0FBa0MsUUFBbEMsRUFBNEMsUUFBNUMsRUFBc0QsNEJBQXRELEVBQW9GLFdBQXBGO0FBQ0gsU0FYRCxFQVdHLEtBWEgsQ0FXUyxVQUFVLEdBQVYsRUFBZTtBQUNwQixvQkFBUSxLQUFSLENBQWMsR0FBZDtBQUNILFNBYkQ7QUFjSCxLQXJGaUI7QUFzRmxCLFVBQU0sZ0JBQVk7QUFDZCxzQkFBYyxtQkFBZDtBQUNBLHNCQUFjLE1BQWQsQ0FBcUIsZUFBckI7QUFDQSxzQkFBYyxVQUFkLEdBQTJCLElBQUksU0FBSixFQUEzQjtBQUNBLHNCQUFjLE1BQWQsQ0FBcUIsYUFBckI7QUFDSDtBQTNGaUIsQ0FBdEI7O0FBOEZBLElBQU0sTUFBTTtBQUNSLFlBQVE7QUFDSiwyQkFBb0IsNkJBQVc7QUFDM0IsZ0JBQU0sUUFBUSxnREFBZDtBQUNBLGdCQUFNLDBJQUV1RCxTQUFTLGdCQUZoRSxzQ0FBTjtBQUlBLGdCQUFNLFdBQVcsQ0FBQyxLQUFELEVBQVEsWUFBUixDQUFqQjtBQUNBLG1CQUFPLFFBQVA7QUFDSCxTQVRHO0FBVUosb0JBQWEsc0JBQVc7QUFDcEIsZ0JBQU0sV0FBVyxJQUFJLE1BQUosQ0FBVyxpQkFBWCxFQUFqQjtBQUNBLGdCQUFNLE9BQU8sRUFBRSxlQUFGLENBQWI7QUFDQSxxQkFBUyxPQUFULENBQWlCLG1CQUFXO0FBQ3hCLHFCQUFLLE1BQUwsQ0FBWSxPQUFaO0FBQ0gsYUFGRDtBQUdILFNBaEJHO0FBaUJKLHVCQUFlLHlCQUFZO0FBQ3ZCLGNBQUUsbUJBQUYsRUFBdUIsS0FBdkIsQ0FBNkIsWUFBWTtBQUNyQyxvQkFBSSxPQUFPLElBQUksV0FBSixFQUFYO0FBQ0Esb0JBQUksQ0FBQyxJQUFMLEVBQVc7QUFDUCx1Q0FBTSxTQUFOLENBQWdCLE9BQWhCLEVBQXlCLE9BQXpCLEVBQWtDLDJCQUFsQztBQUNBO0FBQ0g7QUFDRCxvQkFBSSxnQkFBSixDQUFxQixJQUFyQjtBQUNILGFBUEQ7O0FBU0EsY0FBRSxxQkFBRixFQUF5QixNQUF6QixDQUFnQyxZQUFZO0FBQ3hDLG9CQUFJLEVBQUUsSUFBRixFQUFRLEdBQVIsT0FBa0IsRUFBdEIsRUFBMEI7QUFDdEIsa0NBQWMsTUFBZCxDQUFxQixjQUFyQjtBQUNBLHNCQUFFLElBQUYsRUFBUSxRQUFSLENBQWlCLFlBQWpCO0FBQ0Esc0JBQUUsY0FBRixFQUFrQixHQUFsQixDQUFzQixTQUF0QixFQUFpQyxNQUFqQztBQUNILGlCQUpELE1BSU87QUFDSCxzQkFBRSxJQUFGLEVBQVEsV0FBUixDQUFvQixZQUFwQjtBQUNBLHNCQUFFLGNBQUYsRUFBa0IsR0FBbEIsQ0FBc0IsU0FBdEIsRUFBaUMsTUFBakM7QUFDSDtBQUNKLGFBVEQ7QUFVSDtBQXJDRyxLQURBO0FBd0NSLGlCQUFhLHVCQUFZO0FBQ3JCLFlBQUksT0FBTyxTQUFTLGFBQVQsQ0FBdUIscUJBQXZCLEVBQThDLEtBQTlDLENBQW9ELENBQXBELENBQVg7QUFDQSxlQUFPLElBQVA7QUFDSCxLQTNDTztBQTRDUixzQkFBa0IsMEJBQVUsSUFBVixFQUFnQjs7QUFFOUIsWUFBTSxTQUFTLElBQUksVUFBSixFQUFmO0FBQ0EsZUFBTyxNQUFQLEdBQWdCLFlBQVk7QUFDeEIsZ0JBQUksaUJBQWlCLElBQUksVUFBSixDQUFlLE9BQU8sTUFBdEIsQ0FBckI7QUFDQSwwQkFBYyxVQUFkLENBQXlCLGNBQXpCLEVBQXlDLEtBQUssSUFBOUMsRUFBb0QsS0FBSyxJQUF6RDtBQUNILFNBSEQ7QUFJQSxlQUFPLE9BQVAsR0FBaUIsVUFBVSxLQUFWLEVBQWlCO0FBQzlCLG9CQUFRLEdBQVIsQ0FBWSxRQUFaLEVBQXNCLEtBQXRCO0FBQ0gsU0FGRDtBQUdBLGVBQU8sVUFBUCxHQUFvQixVQUFVLElBQVYsRUFBZ0I7QUFDaEMsZ0JBQUksS0FBSyxnQkFBVCxFQUEyQjtBQUN2QixvQkFBSSxXQUFXLFNBQVcsS0FBSyxNQUFMLEdBQWMsS0FBSyxLQUFwQixHQUE2QixHQUF2QyxFQUE2QyxFQUE3QyxDQUFmO0FBQ0g7QUFDSixTQUpEO0FBS0EsZUFBTyxpQkFBUCxDQUF5QixJQUF6QjtBQUNILEtBNURPO0FBNkRSLGdCQUFZLG9CQUFVLFFBQVYsRUFBb0IsUUFBcEIsRUFBOEIsa0JBQTlCLEVBQWtELFlBQWxELEVBQWdFLFdBQWhFLEVBQTZFO0FBQ3JGLFVBQUUsSUFBRixDQUFPO0FBQ0g7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxrQkFBTSxNQVJIO0FBU0gsaUJBQUssVUFURjtBQVVILGlCQUFLLGVBQVk7QUFDYixvQkFBSSxNQUFNLEVBQUUsWUFBRixDQUFlLEdBQWYsRUFBVjtBQUNBLG9CQUFJLE1BQUosQ0FBVyxVQUFYLEdBQXdCLFVBQVUsQ0FBVixFQUFhO0FBQ2pDO0FBQ0gsaUJBRkQ7QUFHQSx1QkFBTyxHQUFQO0FBQ0gsYUFoQkU7QUFpQkgsa0JBQU07QUFDRiw0QkFBWSxRQURWO0FBRUYsNEJBQVksUUFGVjtBQUdGLDRCQUFZLGtCQUhWO0FBSUYsZ0NBQWdCLFlBSmQ7QUFLRiwrQkFBZTtBQUxiLGFBakJIO0FBd0JILG1CQUFPLEtBeEJKO0FBeUJILHNCQUFVLE1BekJQO0FBMEJIO0FBQ0EscUJBQVMsaUJBQVUsUUFBVixFQUFvQjtBQUN6QixtQ0FBTSxTQUFOLENBQWdCLFNBQVMsSUFBekIsRUFBK0IsU0FBUyxLQUF4QyxFQUErQyxTQUFTLElBQXhEO0FBQ0Esb0JBQUksU0FBUyxJQUFULEtBQWtCLFNBQXRCLEVBQWlDO0FBQzdCLHNCQUFFLG1CQUFGLEVBQXVCLEdBQXZCLENBQTJCLFNBQTNCLEVBQXNDLE1BQXRDO0FBQ0Esd0JBQUksYUFBYSxFQUFFLG9GQUFGLEVBQXdGLEtBQXhGLENBQThGLFlBQVc7QUFDdEgsaUNBQVMsTUFBVDtBQUNILHFCQUZnQixDQUFqQjtBQUdBLHNCQUFFLHNCQUFGLEVBQTBCLE1BQTFCLENBQWlDLFVBQWpDO0FBQ0gsaUJBTkQsTUFNTztBQUNILDRCQUFRLEdBQVIsQ0FBWSxRQUFaO0FBQ0g7QUFDSixhQXRDRTtBQXVDSCxtQkFBTyxlQUFVLEdBQVYsRUFBZSxXQUFmLEVBQTRCLFdBQTVCLEVBQXlDO0FBQzVDLG1DQUFNLFNBQU4sQ0FBZ0IsT0FBaEIsRUFBeUIsRUFBekIsRUFBNkIsSUFBSSxZQUFqQztBQUNIO0FBekNFLFNBQVA7QUEyQ0gsS0F6R087QUEwR1IsVUFBTyxnQkFBVztBQUNkLHNCQUFjLElBQWQ7QUFDQSxZQUFJLE1BQUosQ0FBVyxVQUFYO0FBQ0EsWUFBSSxNQUFKLENBQVcsYUFBWDtBQUNIO0FBOUdPLENBQVo7O0FBaUhBLE9BQU8sT0FBUCxHQUFpQjtBQUNiLGdCQUFhLElBQUk7QUFESixDQUFqQjs7Ozs7QUN2TkE7Ozs7QUFDQTs7OztBQUNBOzs7O0FBQ0E7Ozs7OztBQUVBLFNBQVMsZ0JBQVQsQ0FBMEIsa0JBQTFCLEVBQThDLFlBQVc7QUFDckQsNEJBQWdCLE1BQWhCOztBQUVBLFFBQUksRUFBRSxlQUFGLEVBQW1CLE1BQXZCLEVBQStCO0FBQzNCLDZCQUFhLFVBQWI7QUFDSDs7QUFFRCxRQUFHLEVBQUUsb0JBQUYsRUFBd0IsTUFBM0IsRUFBbUM7QUFDL0IsNEJBQVUsYUFBVjtBQUNIOztBQUVELFFBQUcsRUFBRSxnQkFBRixFQUFvQixNQUF2QixFQUErQjtBQUMzQiw4QkFBWSxhQUFaO0FBQ0g7QUFDSixDQWREIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQT1BVUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbXNnVGltZSA6IHtcbiAgICAgICAgICAgIGVycm9yIDogNDAwMCxcbiAgICAgICAgICAgIHdhcm5pbmcgOiAzMjAwLFxuICAgICAgICAgICAgc3VjY2VzcyA6IDI1MDBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0FsZXJ0OiBmdW5jdGlvbiAobXNnQ2xhc3MsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgIHZhciAkdGl0bGUgPSAkKCcuYWxlcnQtYm94X190aXRsZScpLFxuICAgICAgICAgICAgJG1lc3NhZ2UgPSAkKCcuYWxlcnQtYm94X19tZXNzYWdlJyksXG4gICAgICAgICAgICBkZWxheVRpbWUgPSAwO1xuICAgICAgICBpZiAobXNnQ2xhc3MgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLmVycm9yO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZ0NsYXNzID09PSAnd2FybmluZycpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLndhcm5pbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5zdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgICR0aXRsZS5odG1sKHRpdGxlKTtcbiAgICAgICAgJG1lc3NhZ2UuaHRtbCh0ZXh0KTtcbiAgICAgICAgJCgnLmFsZXJ0LWJveCcpLmFkZENsYXNzKG1zZ0NsYXNzKS5hZGRDbGFzcygnc2hvdycpLmRlbGF5KGRlbGF5VGltZSkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Nob3cnKS5yZW1vdmVDbGFzcyhtc2dDbGFzcyk7XG4gICAgICAgICAgICAkdGl0bGUuaHRtbCgnJyk7XG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2hvd0FsZXJ0IDogUE9QVVAuc2hvd0FsZXJ0XG59IiwidmFyIGRldGVjdG9yID0ge1xuICAgIGNvbmZpZyA6IHtcbiAgICAgICAgd3JhcHBlclNlbGVjdG9yIDogJy5tYWluLXdyYXBwZXInLFxuICAgICAgICBodG1sRXJyb3JNc2cgOiAnPGRpdj48aDIgY2xhc3M9XCJkZXRlY3QtYnJvd3Nlci10ZXh0XCI+U3lzdGVtIHN6eWZydWrEhWN5IG9iZWNuaWUgZHppYcWCYSA8c3BhbiBjbGFzcz1cImltcG9ydGFudFwiPnR5bGtvPC9zcGFuPiBuYSBwcnplZ2zEhWRhcmthY2g6PGJyPkdvb2dsZSBDaHJvbWUgb3JheiBNb3ppbGxhIEZpcmVmb3g8L2gyPjwvZGl2PidcbiAgICB9LFxuICAgIGRldGVjdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgaXNDaHJvbWl1bSA9IHdpbmRvdy5jaHJvbWUsXG4gICAgICAgICAgICB3aW5OYXYgPSB3aW5kb3cubmF2aWdhdG9yLFxuICAgICAgICAgICAgdmVuZG9yTmFtZSA9IHdpbk5hdi52ZW5kb3IsXG4gICAgICAgICAgICBpc09wZXJhID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdPUFInKSA+IC0xLFxuICAgICAgICAgICAgaXNJRWVkZ2UgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ0VkZ2UnKSA+IC0xLFxuICAgICAgICAgICAgaXNJT1NDaHJvbWUgPSB3aW5OYXYudXNlckFnZW50Lm1hdGNoKCdDcmlPUycpLFxuICAgICAgICAgICAgaXNGaXJlZm94ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA+IC0xLFxuICAgICAgICAgICAgaXNNb2JpbGVEZXZpY2UgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gKHR5cGVvZiB3aW5kb3cub3JpZW50YXRpb24gIT09ICd1bmRlZmluZWQnKSB8fCAobmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdJRU1vYmlsZScpICE9PSAtMSk7XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChpc0Nocm9taXVtICE9PSBudWxsICYmIGlzQ2hyb21pdW0gIT09IHVuZGVmaW5lZCAmJiB2ZW5kb3JOYW1lID09PSAnR29vZ2xlIEluYy4nICYmIGlzT3BlcmEgPT0gZmFsc2UgJiYgaXNJRWVkZ2UgPT0gZmFsc2UpIHtcbiAgICAgICAgICAgIFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgaWYgKG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPD0gLTEpIHtcbiAgICAgICAgICAgICAgICBkZXRlY3Rvci5kaXNwbGF5RXJyb3JNc2coKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSAgICAgICAgXG4gICAgfSxcbiAgICBkaXNwbGF5RXJyb3JNc2cgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgJChkZXRlY3Rvci5jb25maWcud3JhcHBlclNlbGVjdG9yKS5odG1sKGRldGVjdG9yLmNvbmZpZy5odG1sRXJyb3JNc2cpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXRlY3Rvci5kZXRlY3QoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZXRlY3QgOiBkZXRlY3Rvci5pbml0XG59IiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxudmFyIENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBwcml2YXRlS2V5TG9hZGVkOiBmYWxzZSxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldFByaXZhdGVLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRlY3J5cHQtZmlsZXNfX3ByaXZhdGUta2V5JykuZmlsZXNbMF07XG4gICAgICAgICAgICBpZiAoZmlsZSkge1xuICAgICAgICAgICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGZpbGUsICdVVEYtOCcpO1xuICAgICAgICAgICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoZXZ0KSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQcml2YXRlS2V5KGV2dC50YXJnZXQucmVzdWx0KTtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wcml2YXRlS2V5TG9hZGVkID0gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJ1N1a2NlczonLCAnV2N6eXRhbm8ga2x1Y3ogcHJ5d2F0bnkhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgJ05pZSBtb8W8bmEgd2N6eXRhxIfCoGtsdWN6YSBwcnl3YXRuZWdvIScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgaW1wb3J0QUVTS2V5OiBmdW5jdGlvbihkYXRhLCBlbmNyeXB0ZWRGaWxlSW5CYXNlNjQsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuaW1wb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBrdHk6IGRhdGEua3R5LFxuICAgICAgICAgICAgICAgICAgICBrOiBkYXRhLmssXG4gICAgICAgICAgICAgICAgICAgIGFsZzogZGF0YS5hbGcsXG4gICAgICAgICAgICAgICAgICAgIGV4dDogdHJ1ZSxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBmYWxzZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uKGtleSl7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0tsdWN6IHphaW1wb3J0b3dhbnknKTtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICB2YXIgZW5jcnlwdGVkQnl0ZXMgPSBiYXNlNjRqcy50b0J5dGVBcnJheShlbmNyeXB0ZWRGaWxlSW5CYXNlNjQpO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlRGF0YSA9IG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZEJ5dGVzKTtcbiAgICAgICAgICAgICAgICBBUFAubG9hZElWRmlsZShmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvID0gbmV3IEpTRW5jcnlwdCgpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXRQcml2YXRlS2V5KCk7XG4gICAgfSxcbiAgICBkZWNyeXB0UlNBOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZGVjcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGRlY3J5cHRBRVM6IGZ1bmN0aW9uKGRhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5kZWNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24oZGVjcnlwdGVkKXtcbiAgICAgICAgICAgIEFQUC5zYXZlRmlsZShuZXcgVWludDhBcnJheShkZWNyeXB0ZWQpLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJ1N1a2NlczonLCAnT2Rzenlmcm93YW5vIHBsaWshJyk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCAnWsWCeSBwbGlrIFwiZmlsZV9rZXlcIiAhJyk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbnZhciBBUFAgPSB7XG4gICAgbG9hZGVkRmlsZXM6IDAsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZERlY3J5cHRGaWxlRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHZhciAkZmllbGQgPSAkKCcuZGVjcnlwdC1idG4nKTtcbiAgICAgICAgICAgICRmaWVsZC5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZigkZmllbGQuaGFzQ2xhc3MoJ2Jsb2NrZWQnKSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gQVBQLmdldERvd25sb2FkZWRGaWxlKCk7XG4gICAgICAgICAgICAgICAgQVBQLmRlY3J5cHRBbmREb3dubG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kTG9hZEZpbGVzRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fcHJpdmF0ZS1rZXknKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldFByaXZhdGVLZXkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWtleScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWl2JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVOYW1lRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB1cGxvYWRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaWxlTmFtZSA9IHVwbG9hZGVkRmlsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICB2YXIgdG1wRmlsZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHIoMCxmaWxlTmFtZS5sZW5ndGgtOCk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBmaW5hbEZpbGVOYW1lID0gdG1wRmlsZU5hbWUuc3Vic3RyKDAsIHRtcEZpbGVOYW1lLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICdkZWNyeXB0RmlsZU5hbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jcnlwdGVkRmlsZU5hbWU6IGZpbmFsRmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ190b2tlbicgOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2xhYmVsJykuYWRkQ2xhc3MoJ2xhYmVsLS1ibHVlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub3JpZ2luYWxGaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwocmVzcG9uc2Uub3JpZ2luYWxGaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2hpbnQnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwoJ05pZSB6bWllbmlvbmEnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbGFiZWwnKS5yZW1vdmVDbGFzcygnbGFiZWwtLWJsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2hpbnQnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwoJ25pZSBkb3N0xJlwbmEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2hlY2tMb2FkZWRGaWxlc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKEFQUC5sb2FkZWRGaWxlcyA+PSA0KSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1idG4nKS5yZW1vdmVDbGFzcygnYmxvY2tlZCcpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXREb3dubG9hZGVkRmlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuZmlsZXNbMF07XG4gICAgfSxcbiAgICBsb2FkSVZGaWxlOiBmdW5jdGlvbiAoZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICB2YXIgZW5jcnlwdGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUtaXYnKS5maWxlc1swXTtcbiAgICAgICAgdmFyIHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGVuY3J5cHRlZEZpbGUsICd1dGYtOCcpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZW5jcnlwdGVkRmlsZSA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICB2YXIgYmFzZTY0U3RyaW5nID0gQ1JZUFRPX0VOR0lORS5kZWNyeXB0UlNBKGVuY3J5cHRlZEZpbGUpO1xuICAgICAgICAgICAgdmFyIGl2S2V5ID0gYmFzZTY0anMudG9CeXRlQXJyYXkoYmFzZTY0U3RyaW5nKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSBpdktleTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZGVjcnlwdEFFUyhmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsICdaxYJ5IHBsaWsgXCJmaWxlX2l2XCIgIScpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBsb2FkS2V5RmlsZTogZnVuY3Rpb24gKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgdmFyIGVuY3J5cHRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICB2YXIgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBqc29uRW5jcnlwdGVkID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIHZhciBkZWNyeXB0ZWRGaWxlID0gQ1JZUFRPX0VOR0lORS5kZWNyeXB0UlNBKGpzb25FbmNyeXB0ZWQpO1xuICAgICAgICAgICAgdmFyIGZpbGVLZXkgPSBKU09OLnBhcnNlKGRlY3J5cHRlZEZpbGUpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuaW1wb3J0QUVTS2V5KGZpbGVLZXksIGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBnZXRCbG9iOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEJsb2I7XG4gICAgfSxcbiAgICBzYXZlRmlsZTogZnVuY3Rpb24oYnl0ZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICB2YXIgQkIgPSBBUFAuZ2V0QmxvYigpO1xuICAgICAgICBzYXZlQXMoXG4gICAgICAgICAgICBuZXcgQkIoW2J5dGVEYXRhXSwgeyB0eXBlIDogZmlsZVR5cGUgfSksXG4gICAgICAgICAgICBmaWxlTmFtZVxuICAgICAgICApO1xuICAgIH0sXG4gICAgZGVjcnlwdEFuZERvd25sb2FkOiBmdW5jdGlvbihiYXNlNjRGaWxlKSB7XG4gICAgICAgIHZhciByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZmlsZVR5cGUgPSAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLXR5cGUnKS52YWwoKTtcbiAgICAgICAgICAgIHZhciBiYXNlNjRTdHJpbmcgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykudGV4dCgpO1xuICAgICAgICAgICAgQVBQLmxvYWRLZXlGaWxlKGJhc2U2NFN0cmluZywgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJywgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICB2YXIgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGJhc2U2NEZpbGUsICd1dGYtOCcpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kTG9hZEZpbGVzRXZlbnRzKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZERlY3J5cHRGaWxlRXZlbnQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVjcnlwdEZpbGVOYW1lRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBiaW5kVUlBY3Rpb25zIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5jb25zdCBBUFAgPSB7XG4gICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUZpbGU6IGZ1bmN0aW9uKF9maWxlSWQsIHBhcmVudE5vZGUpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogJ2RlbGV0ZScsXG4gICAgICAgICAgICBkYXRhOiB7IFxuICAgICAgICAgICAgICAgICdmaWxlSWQnIDogX2ZpbGVJZCxcbiAgICAgICAgICAgICAgICAnX3Rva2VuJyA6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIHJlc3BvbnNlLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0LFgsSFZDonLCByZXNwb25zZS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNob3dEZWxldGVGaWxlUHJvbXB0OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVJZCwgcGFyZW50Tm9kZSkge1xuICAgICAgICBsZXQgYW5zd2VyID0gY29uZmlybSgnVXN1d2FuaWU6ICcrIGZpbGVOYW1lICsnXFxuXFxuQ3p5IG5hIHBld25vIGNoY2VzeiB1c3VuxIXEhyBwbGlrPycpO1xuICAgICAgICBpZihhbnN3ZXIpIHtcbiAgICAgICAgICAgIEFQUC5kZWxldGVGaWxlKGZpbGVJZCwgcGFyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbmZpZzoge1xuICAgICAgICBiaW5kRGVsZXRlRmlsZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0ICRmaWVsZCA9ICQoJy5mYS10cmFzaCcpO1xuICAgICAgICAgICAgJGZpZWxkLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gJCh0aGlzKS5wYXJlbnRzKCcudG9wLXNlY3Rpb24nKS5maW5kKCcudG9wLXNlY3Rpb25fX25hbWUnKS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVJZCA9ICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpLmZpbmQoJy5maWxlLWlkJykudGV4dCgpO1xuICAgICAgICAgICAgICAgIEFQUC5zaG93RGVsZXRlRmlsZVByb21wdChmaWxlTmFtZSxmaWxlSWQsICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQVBQLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWxldGVGaWxlRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBiaW5kVUlBY3Rpb25zIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdXBsb2FkQnV0dG9uVGV4dCA6ICdaYXN6eWZydWogaSB3ecWbbGlqIHBsaWsnXG59XG5cbmNvbnN0IENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFB1YmxpY0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnZ2V0UHViS2V5JyxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZSA6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLnNldFB1YmxpY0tleShyZXNwb25zZSk7IFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVBRVNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTI4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnJywgJ0JlenBpZWN6bnkga2x1Y3ogd3lnZW5lcm93YW55IScpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBleHBvcnRBRVNLZXk6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5leHBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXlkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShrZXlkYXRhKTtcbiAgICAgICAgICAgICAgICBsZXQgZW5jcnlwdGVkS2V5ID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgIEFQUC51cGxvYWRGaWxlKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkZXRlY3RCcm93c2VyQ29uZmlnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh3aW5kb3cuY3J5cHRvICYmICF3aW5kb3cuY3J5cHRvLnN1YnRsZSAmJiB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZSkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUgPSB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpbmRvdy5jcnlwdG8gfHwgIXdpbmRvdy5jcnlwdG8uc3VidGxlKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywnQsWCxIVkOiAnLFwiVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS5cIik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGZpbGVCeXRlc0FycmF5LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGFycmF5c0NvdW50ID0gMTI7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShhcnJheXNDb3VudCkpO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZmlsZUJ5dGVzQXJyYXlcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGxldCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudXBsb2FkQnV0dG9uVGV4dH08L2J1dHRvbj5cbiAgICAgICAgICAgICAgICA8L2Rpdj5gO1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBbaW5wdXQsIHVwbG9hZEJ1dHRvbl07XG4gICAgICAgICAgICByZXR1cm4gZWxlbWVudHM7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVuZEZvcm0gOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gQVBQLmNvbmZpZy5jcmVhdGVGb3JtT2JqZWN0cygpO1xuICAgICAgICAgICAgY29uc3QgZm9ybSA9ICQoJy5lbmNyeXB0LWZvcm0nKTtcbiAgICAgICAgICAgIGVsZW1lbnRzLmZvckVhY2goZWxlbWVudCA9PiB7XG4gICAgICAgICAgICAgICAgZm9ybS5hcHBlbmQoZWxlbWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZFVJQWN0aW9uczogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0Rm9ybUZpbGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgJ1BsaWsgbmllIHpvc3RhxYIgd2N6eXRhbnkhJyk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldEZvcm1GaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVuY3J5cHQtZm9ybV9fZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICByZXR1cm4gZmlsZTtcbiAgICB9LFxuICAgIGVuY3J5cHRBbmRVcGxvYWQ6IGZ1bmN0aW9uIChmaWxlKSB7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBmaWxlQnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGZpbGVCeXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCgoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbiAgICB9LFxuICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGZpbGVJbkJhc2U2NFN0cmluZywgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgLy8geGhyRmllbGRzOiB7XG4gICAgICAgICAgICAvLyAgICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwICsgJyUnKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6IFwic2F2ZUZpbGVcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICAvLyBjb25zb2xlLmxvZyhNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgXCJmaWxlTmFtZVwiOiBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICBcImZpbGVUeXBlXCI6IGZpbGVUeXBlLFxuICAgICAgICAgICAgICAgIFwiZmlsZURhdGFcIjogZmlsZUluQmFzZTY0U3RyaW5nLFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkS2V5XCI6IGVuY3J5cHRlZEtleSxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZElWXCI6IGVuY3J5cHRlZElWXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIC8vVE9ETzogZG9kYcSHIGxvYWRlciAoZ2lmKVxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hCdG4gPSAkKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tLXVwbG9hZC1hbm90aGVyLWZpbGVcIj5PZMWbd2llxbwgc3Ryb27EmTwvYnV0dG9uPicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXItLXVwbG9hZCcpLmFwcGVuZChyZWZyZXNoQnRuKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBhamF4T3B0aW9ucywgdGhyb3duRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJycsIHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5pbml0KCk7XG4gICAgICAgIEFQUC5jb25maWcuYXBwZW5kRm9ybSgpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0RW5naW5lIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgYnJvd3NlckRldGVjdG9yIGZyb20gJy4vbGliL2Jyb3dzZXItZGV0ZWN0JztcbmltcG9ydCBjcnlwdG9FbmdpbmUgZnJvbSAnLi9saWIvdXBsb2FkLXBhZ2UnO1xuaW1wb3J0IHBhbmVsUGFnZSBmcm9tICcuL2xpYi9wYW5lbC1wYWdlJztcbmltcG9ydCBkZWNyeXB0UGFnZSBmcm9tICcuL2xpYi9kZWNyeXB0LXBhZ2UnO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICBicm93c2VyRGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgXG4gICAgaWYgKCQoJy5lbmNyeXB0LWZvcm0nKS5sZW5ndGgpIHtcbiAgICAgICAgY3J5cHRvRW5naW5lLmluaXRFbmdpbmUoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZmlsZS1saXN0LXdyYXBwZXInKS5sZW5ndGgpIHtcbiAgICAgICAgcGFuZWxQYWdlLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZGVjcnlwdC1maWxlcycpLmxlbmd0aCkge1xuICAgICAgICBkZWNyeXB0UGFnZS5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufSk7Il19
