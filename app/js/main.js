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

var SETTINGS = {
    wrapperSelector: '.main-wrapper',
    text: {
        html: {
            detectErrorMsg: '<div><h2 class="detect-browser-text">System szyfrujący obecnie działa <span class="important">tylko</span> na przeglądarkach:<br>Google Chrome oraz Mozilla Firefox</h2></div>'
        }
    }
};

var detector = {
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
        $(SETTINGS.wrapperSelector).html(SETTINGS.text.html.detectErrorMsg);
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

var SETTINGS = {
    text: {
        html: {
            fileNameNotChanged: 'Nie zmieniona',
            fileNameNotAvailable: 'nie dostępna'
        },
        popup: {
            loadPrivateKey: 'Wczytano klucz prywatny!',
            errorLoadPrivateKey: 'Nie można wczytać klucza prywatnego!',
            wrongFileKey: 'Zły plik "file_key" !',
            wrongIVFile: 'Zły plik "file_iv" !',
            fileEncrypted: 'Odszyfrowano plik!'
        }
    }
};

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
                    _alertBox2.default.showAlert('success', 'Sukces:', SETTINGS.text.popup.loadPrivateKey);
                };
                reader.onerror = function (evt) {
                    _alertBox2.default.showAlert('error', 'Błąd: ', SETTINGS.text.popup.errorLoadPrivateKey);
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
                CRYPTO_ENGINE.aesKey = key;
                var encryptedBytes = base64js.toByteArray(encryptedFileInBase64);
                var fileData = new Uint8Array(encryptedBytes);
                APP.loadIVFile(fileData, fileName, fileType);
            }).catch(function (err) {
                _alertBox2.default.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
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
            $('.loader').remove();
            APP.saveFile(new Uint8Array(decrypted), fileName, fileType);
            _alertBox2.default.showAlert('success', 'Sukces:', SETTINGS.text.popup.fileEncrypted);
        }).catch(function (err) {
            _alertBox2.default.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
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
                $('.loader').css('display', 'block');
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
                    var encodedPartNameLength = 8;
                    var tmpFileName = fileName.substr(0, fileName.length - encodedPartNameLength);
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
                            $('.decrypt-files__main-file-original-name').html(SETTINGS.text.html.fileNameNotChanged);
                        }
                    }).fail(function (response) {
                        console.log('error');
                    }).always(function () {
                        console.log("complete");
                    });
                } else {
                    $('.decrypt-files__label').removeClass('label--blue');
                    $('.decrypt-files__hint').removeClass('active');
                    $('.decrypt-files__main-file-original-name').html(SETTINGS.text.html.fileNameNotAvailable);
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
            _alertBox2.default.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongIVFile);
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
            _alertBox2.default.showAlert('error', 'Błąd:', SETTINGS.text.popup.wrongFileKey);
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

var SETTINGS = {
    text: {
        html: {
            deleteFile: '\n\nCzy na pewno chcesz usunąć plik?'
        }
    }
};

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
        var answer = confirm('Usuwanie: ' + fileName + SETTINGS.text.html.deleteFile);
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
    text: {
        html: {
            uploadButtonText: 'Zaszyfruj i wyślij plik'
        },
        popup: {
            secureKeyGenerated: 'Bezpieczny klucz wygenerowany!',
            fileNotLoaded: 'Plik nie został wczytany!',
            cryptoApiLoadError: 'Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.'
        }
    }
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
                data: {
                    'fileName': 'rsa_4096_pub.key'
                },
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
                _alertBox2.default.showAlert('success', '', SETTINGS.text.popup.secureKeyGenerated);
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
            _alertBox2.default.showAlert('error', 'Błąd: ', SETTINGS.text.popup.cryptoApiLoadError);
            throw new Error(SETTINGS.text.popup.cryptoApiLoadError);
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
            var uploadButton = '<p class="percent"></p><p class="loader">Prosz\u0119 czeka\u0107...</p><div class="btn-wrapper btn-wrapper--upload">\n                    <button type="button" class="btn btn--upload-file">' + SETTINGS.text.html.uploadButtonText + '</button>\n                </div>';
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
                $('.loader').css('display', 'block');
                $('.percent').css('display', 'block');
                var file = APP.getFormFile();
                if (!file) {
                    _alertBox2.default.showAlert('error', 'Błąd:', SETTINGS.text.popup.fileNotLoaded);
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
                $('.percent').text('Szyfrowanie pliku: ' + progress);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    uploadFile: function uploadFile(fileName, fileType, fileInBase64String, encryptedKey, encryptedIV) {
        $.ajax({
            type: 'POST',
            url: "saveFile",
            xhr: function xhr() {
                var xhr = $.ajaxSettings.xhr();
                var uploadResult = 0;
                xhr.upload.onprogress = function (e) {
                    uploadResult = Math.floor(e.loaded / e.total * 100);
                    if (uploadResult < 100) {
                        $('.percent').text('Wysyłanie pliku: ' + uploadResult + '%');
                    } else {
                        $('.percent').text('Trwa zapisywanie pliku na serwerze.');
                    }
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
                $('.loader').remove();
                $('.percent').remove();
                _alertBox2.default.showAlert(response.type, response.title, response.text);
                $('.btn--upload-file').css('display', 'none');
                var refreshBtn = $('<button type="button" class="btn btn--upload-another-file">Odśwież stronę</button>').click(function () {
                    location.reload();
                });
                $('.btn-wrapper--upload').append(refreshBtn);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtB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aEI7O0FBRUEsUUFBSSxFQUFFLGVBQUYsRUFBbUIsTUFBdkIsRUFBK0I7QUFDM0IsNkJBQWEsVUFBYjtBQUNIOztBQUVELFFBQUcsRUFBRSxvQkFBRixFQUF3QixNQUEzQixFQUFtQztBQUMvQiw0QkFBVSxhQUFWO0FBQ0g7O0FBRUQsUUFBRyxFQUFFLGdCQUFGLEVBQW9CLE1BQXZCLEVBQStCO0FBQzNCLDhCQUFZLGFBQVo7QUFDSDtBQUNKLENBZEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBPUFVQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBtc2dUaW1lIDoge1xuICAgICAgICAgICAgZXJyb3IgOiA0MDAwLFxuICAgICAgICAgICAgd2FybmluZyA6IDMyMDAsXG4gICAgICAgICAgICBzdWNjZXNzIDogMjUwMFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaG93QWxlcnQ6IGZ1bmN0aW9uIChtc2dDbGFzcywgdGl0bGUsIHRleHQpIHtcbiAgICAgICAgdmFyICR0aXRsZSA9ICQoJy5hbGVydC1ib3hfX3RpdGxlJyksXG4gICAgICAgICAgICAkbWVzc2FnZSA9ICQoJy5hbGVydC1ib3hfX21lc3NhZ2UnKSxcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDA7XG4gICAgICAgIGlmIChtc2dDbGFzcyA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUud2FybmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLnN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93QWxlcnQgOiBQT1BVUC5zaG93QWxlcnRcbn0iLCJjb25zdCBTRVRUSU5HUyA9IHtcbiAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIGRldGVjdEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBkZXRlY3RvciA9IHtcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoU0VUVElOR1Mud3JhcHBlclNlbGVjdG9yKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5kZXRlY3RFcnJvck1zZyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRldGVjdG9yLmRldGVjdCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmluaXRcbn0iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB0ZXh0IDoge1xuICAgICAgICBodG1sIDoge1xuICAgICAgICAgICAgZmlsZU5hbWVOb3RDaGFuZ2VkIDogJ05pZSB6bWllbmlvbmEnLFxuICAgICAgICAgICAgZmlsZU5hbWVOb3RBdmFpbGFibGUgOiAnbmllIGRvc3TEmXBuYSdcbiAgICAgICAgfSxcbiAgICAgICAgcG9wdXAgOiB7XG4gICAgICAgICAgICBsb2FkUHJpdmF0ZUtleSA6ICdXY3p5dGFubyBrbHVjeiBwcnl3YXRueSEnLFxuICAgICAgICAgICAgZXJyb3JMb2FkUHJpdmF0ZUtleSA6ICdOaWUgbW/FvG5hIHdjenl0YcSHwqBrbHVjemEgcHJ5d2F0bmVnbyEnLFxuICAgICAgICAgICAgd3JvbmdGaWxlS2V5IDogJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScsXG4gICAgICAgICAgICB3cm9uZ0lWRmlsZSA6ICdaxYJ5IHBsaWsgXCJmaWxlX2l2XCIgIScsXG4gICAgICAgICAgICBmaWxlRW5jcnlwdGVkIDogJ09kc3p5ZnJvd2FubyBwbGlrIScsXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgcHJpdmF0ZUtleUxvYWRlZDogZmFsc2UsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXRQcml2YXRlS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgZmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlLCAnVVRGLTgnKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHJpdmF0ZUtleShldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucHJpdmF0ZUtleUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICdTdWtjZXM6JywgU0VUVElOR1MudGV4dC5wb3B1cC5sb2FkUHJpdmF0ZUtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgU0VUVElOR1MudGV4dC5wb3B1cC5lcnJvckxvYWRQcml2YXRlS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGltcG9ydEFFU0tleTogZnVuY3Rpb24oZGF0YSwgZW5jcnlwdGVkRmlsZUluQmFzZTY0LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmltcG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga3R5OiBkYXRhLmt0eSxcbiAgICAgICAgICAgICAgICAgICAgazogZGF0YS5rLFxuICAgICAgICAgICAgICAgICAgICBhbGc6IGRhdGEuYWxnLFxuICAgICAgICAgICAgICAgICAgICBleHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRCeXRlcyA9IGJhc2U2NGpzLnRvQnl0ZUFycmF5KGVuY3J5cHRlZEZpbGVJbkJhc2U2NCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVEYXRhID0gbmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkQnl0ZXMpO1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkSVZGaWxlKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldFByaXZhdGVLZXkoKTtcbiAgICB9LFxuICAgIGRlY3J5cHRSU0E6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5kZWNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZGVjcnlwdEFFUzogZnVuY3Rpb24oZGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmRlY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICkudGhlbihmdW5jdGlvbihkZWNyeXB0ZWQpe1xuICAgICAgICAgICAgJCgnLmxvYWRlcicpLnJlbW92ZSgpO1xuICAgICAgICAgICAgQVBQLnNhdmVGaWxlKG5ldyBVaW50OEFycmF5KGRlY3J5cHRlZCksIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnU3VrY2VzOicsIFNFVFRJTkdTLnRleHQucG9wdXAuZmlsZUVuY3J5cHRlZCk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBsb2FkZWRGaWxlczogMCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJGZpZWxkID0gJCgnLmRlY3J5cHQtYnRuJyk7XG4gICAgICAgICAgICAkZmllbGQuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYoJGZpZWxkLmhhc0NsYXNzKCdibG9ja2VkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKCcubG9hZGVyJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBBUFAuZ2V0RG93bmxvYWRlZEZpbGUoKTtcbiAgICAgICAgICAgICAgICBBUFAuZGVjcnlwdEFuZERvd25sb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRMb2FkRmlsZXNFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuc2V0UHJpdmF0ZUtleSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUta2V5JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUtaXYnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmREZWNyeXB0RmlsZU5hbWVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVwbG9hZGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gdXBsb2FkZWRGaWxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGVuY29kZWRQYXJ0TmFtZUxlbmd0aCA9IDg7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0bXBGaWxlTmFtZSA9IGZpbGVOYW1lLnN1YnN0cigwLGZpbGVOYW1lLmxlbmd0aCAtIGVuY29kZWRQYXJ0TmFtZUxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgIGxldCBmaW5hbEZpbGVOYW1lID0gdG1wRmlsZU5hbWUuc3Vic3RyKDAsIHRtcEZpbGVOYW1lLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICB1cmw6ICdkZWNyeXB0RmlsZU5hbWUnLFxuICAgICAgICAgICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGE6IHsgXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZW5jcnlwdGVkRmlsZU5hbWU6IGZpbmFsRmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ190b2tlbicgOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZG9uZShmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2xhYmVsJykuYWRkQ2xhc3MoJ2xhYmVsLS1ibHVlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2Uub3JpZ2luYWxGaWxlTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwocmVzcG9uc2Uub3JpZ2luYWxGaWxlTmFtZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2hpbnQnKS5hZGRDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwoU0VUVElOR1MudGV4dC5odG1sLmZpbGVOYW1lTm90Q2hhbmdlZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnZXJyb3InKTtcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmFsd2F5cyhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiY29tcGxldGVcIik7XG4gICAgICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2xhYmVsJykucmVtb3ZlQ2xhc3MoJ2xhYmVsLS1ibHVlJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19oaW50JykucmVtb3ZlQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5maWxlTmFtZU5vdEF2YWlsYWJsZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNoZWNrTG9hZGVkRmlsZXNDb3VudDogZnVuY3Rpb24gKCkge1xuICAgICAgICBpZihBUFAubG9hZGVkRmlsZXMgPj0gNCkge1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtYnRuJykucmVtb3ZlQ2xhc3MoJ2Jsb2NrZWQnKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0RG93bmxvYWRlZEZpbGU6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmZpbGVzWzBdO1xuICAgIH0sXG4gICAgbG9hZElWRmlsZTogZnVuY3Rpb24gKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGVuY3J5cHRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWl2JykuZmlsZXNbMF07XG4gICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChlbmNyeXB0ZWRGaWxlLCAndXRmLTgnKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEZpbGUgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGJhc2U2NFN0cmluZyA9IENSWVBUT19FTkdJTkUuZGVjcnlwdFJTQShlbmNyeXB0ZWRGaWxlKTtcbiAgICAgICAgICAgIGxldCBpdktleSA9IGJhc2U2NGpzLnRvQnl0ZUFycmF5KGJhc2U2NFN0cmluZyk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWID0gaXZLZXk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmRlY3J5cHRBRVMoZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nSVZGaWxlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gcGFyc2VJbnQoICgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgbG9hZEtleUZpbGU6IGZ1bmN0aW9uIChmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBlbmNyeXB0ZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1rZXknKS5maWxlc1swXTtcbiAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGVuY3J5cHRlZEZpbGUsICd1dGYtOCcpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsZXQganNvbkVuY3J5cHRlZCA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBsZXQgZGVjcnlwdGVkRmlsZSA9IENSWVBUT19FTkdJTkUuZGVjcnlwdFJTQShqc29uRW5jcnlwdGVkKTtcbiAgICAgICAgICAgIGxldCBmaWxlS2V5ID0gSlNPTi5wYXJzZShkZWNyeXB0ZWRGaWxlKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmltcG9ydEFFU0tleShmaWxlS2V5LCBmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIFNFVFRJTkdTLnRleHQucG9wdXAud3JvbmdGaWxlS2V5KTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gcGFyc2VJbnQoICgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH0sXG4gICAgZ2V0QmxvYjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBCbG9iO1xuICAgIH0sXG4gICAgc2F2ZUZpbGU6IGZ1bmN0aW9uKGJ5dGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IEJCID0gQVBQLmdldEJsb2IoKTtcbiAgICAgICAgc2F2ZUFzKFxuICAgICAgICAgICAgbmV3IEJCKFtieXRlRGF0YV0sIHsgdHlwZSA6IGZpbGVUeXBlIH0pLFxuICAgICAgICAgICAgZmlsZU5hbWVcbiAgICAgICAgKTtcbiAgICB9LFxuICAgIGRlY3J5cHRBbmREb3dubG9hZDogZnVuY3Rpb24oYmFzZTY0RmlsZSkge1xuICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGV0IGZpbGVUeXBlID0gJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS10eXBlJykudmFsKCk7XG4gICAgICAgICAgICBsZXQgYmFzZTY0U3RyaW5nID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIGxldCBmaWxlTmFtZSA9ICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLnRleHQoKTtcbiAgICAgICAgICAgIEFQUC5sb2FkS2V5RmlsZShiYXNlNjRTdHJpbmcsIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnRXJyb3I6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gcGFyc2VJbnQoICgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwICk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2cocHJvZ3Jlc3MpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChiYXNlNjRGaWxlLCAndXRmLTgnKTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5pbml0KCk7XG4gICAgICAgIEFQUC5jb25maWcuc2V0dXBBamF4SGVhZGVyKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZExvYWRGaWxlc0V2ZW50cygpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWNyeXB0RmlsZUV2ZW50KCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZERlY3J5cHRGaWxlTmFtZUV2ZW50KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmluZFVJQWN0aW9ucyA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIGRlbGV0ZUZpbGUgOiAnXFxuXFxuQ3p5IG5hIHBld25vIGNoY2VzeiB1c3VuxIXEhyBwbGlrPydcbiAgICAgICAgfVxuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBzZXR1cEFqYXhIZWFkZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICdYLUNTUkYtVE9LRU4nOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgZGVsZXRlRmlsZTogZnVuY3Rpb24oX2ZpbGVJZCwgcGFyZW50Tm9kZSkge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiAnZGVsZXRlJyxcbiAgICAgICAgICAgIGRhdGE6IHsgXG4gICAgICAgICAgICAgICAgJ2ZpbGVJZCcgOiBfZmlsZUlkLFxuICAgICAgICAgICAgICAgICdfdG9rZW4nIDogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQocmVzcG9uc2UudHlwZSwgcmVzcG9uc2UudGl0bGUsIHJlc3BvbnNlLnRleHQpO1xuICAgICAgICAgICAgICAgIGlmKHJlc3BvbnNlLnR5cGUgPT09ICdzdWNjZXNzJykge1xuICAgICAgICAgICAgICAgICAgICBwYXJlbnROb2RlLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgcmVzcG9uc2UucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOicsIHJlc3BvbnNlLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgc2hvd0RlbGV0ZUZpbGVQcm9tcHQ6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZUlkLCBwYXJlbnROb2RlKSB7XG4gICAgICAgIGxldCBhbnN3ZXIgPSBjb25maXJtKCdVc3V3YW5pZTogJysgZmlsZU5hbWUgKyBTRVRUSU5HUy50ZXh0Lmh0bWwuZGVsZXRlRmlsZSk7XG4gICAgICAgIGlmKGFuc3dlcikge1xuICAgICAgICAgICAgQVBQLmRlbGV0ZUZpbGUoZmlsZUlkLCBwYXJlbnROb2RlKTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY29uZmlnOiB7XG4gICAgICAgIGJpbmREZWxldGVGaWxlRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgJGZpZWxkID0gJCgnLmZhLXRyYXNoJyk7XG4gICAgICAgICAgICAkZmllbGQuY2xpY2soZnVuY3Rpb24gKGV2ZW50KSB7XG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICBsZXQgZmlsZU5hbWUgPSAkKHRoaXMpLnBhcmVudHMoJy50b3Atc2VjdGlvbicpLmZpbmQoJy50b3Atc2VjdGlvbl9fbmFtZScpLnRleHQoKTtcbiAgICAgICAgICAgICAgICBsZXQgZmlsZUlkID0gJCh0aGlzKS5wYXJlbnRzKCcuZmlsZS13cmFwcGVyJykuZmluZCgnLmZpbGUtaWQnKS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgQVBQLnNob3dEZWxldGVGaWxlUHJvbXB0KGZpbGVOYW1lLGZpbGVJZCwgJCh0aGlzKS5wYXJlbnRzKCcuZmlsZS13cmFwcGVyJykpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfVxuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBBUFAuc2V0dXBBamF4SGVhZGVyKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZERlbGV0ZUZpbGVFdmVudCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJpbmRVSUFjdGlvbnMgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBwb3B1cCBmcm9tICcuL2FsZXJ0LWJveCc7XG5cblwidXNlIHN0cmljdFwiO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB0ZXh0IDoge1xuICAgICAgICBodG1sIDoge1xuICAgICAgICAgICAgdXBsb2FkQnV0dG9uVGV4dCA6ICdaYXN6eWZydWogaSB3ecWbbGlqIHBsaWsnLFxuICAgICAgICB9LFxuICAgICAgICBwb3B1cCA6IHtcbiAgICAgICAgICAgIHNlY3VyZUtleUdlbmVyYXRlZCA6ICdCZXpwaWVjem55IGtsdWN6IHd5Z2VuZXJvd2FueSEnLFxuICAgICAgICAgICAgZmlsZU5vdExvYWRlZCA6ICdQbGlrIG5pZSB6b3N0YcWCIHdjenl0YW55IScsXG4gICAgICAgICAgICBjcnlwdG9BcGlMb2FkRXJyb3IgOiAnVHdvamEgcHJ6ZWdsxIVkYXJrYSBuaWUgb2JzxYJ1Z3VqZSBpbnRlcmZlanN1IFdlYiBDcnlwdG9ncmFwaHkgQVBJISBUYSBzdHJvbmEgbmllIGLEmWR6aWUgZHppYcWCYcSHIHBvcHJhd25pZS4nXG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IENSWVBUT19FTkdJTkUgPSB7XG4gICAgcGFzc0NyeXB0bzogbnVsbCxcbiAgICBhZXNLZXk6IG51bGwsXG4gICAgZ2VuZXJhdGVkSVY6IG51bGwsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgbG9hZFB1YmxpY0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgdXJsOiAnZ2V0UHViS2V5JyxcbiAgICAgICAgICAgICAgICBkYXRhVHlwZSA6ICdqc29uJyxcbiAgICAgICAgICAgICAgICBkYXRhIDoge1xuICAgICAgICAgICAgICAgICAgICAnZmlsZU5hbWUnIDogJ3JzYV80MDk2X3B1Yi5rZXknXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLnNldFB1YmxpY0tleShyZXNwb25zZSk7IFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKHJlc3BvbnNlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZ2VuZXJhdGVBRVNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmdlbmVyYXRlS2V5KFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgICAgIGxlbmd0aDogMTI4LFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgdHJ1ZSxcbiAgICAgICAgICAgICAgICBbXCJlbmNyeXB0XCIsIFwiZGVjcnlwdFwiXVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnJywgU0VUVElOR1MudGV4dC5wb3B1cC5zZWN1cmVLZXlHZW5lcmF0ZWQpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBleHBvcnRBRVNLZXk6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5leHBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleVxuICAgICAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChrZXlkYXRhKSB7XG4gICAgICAgICAgICAgICAgbGV0IGpzb25TdHJpbmcgPSBKU09OLnN0cmluZ2lmeShrZXlkYXRhKTtcbiAgICAgICAgICAgICAgICBsZXQgZW5jcnlwdGVkS2V5ID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGpzb25TdHJpbmcpO1xuICAgICAgICAgICAgICAgIEFQUC51cGxvYWRGaWxlKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVik7XG4gICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIC5jYXRjaChmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnJvcik7XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBkZXRlY3RCcm93c2VyQ29uZmlnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGlmICh3aW5kb3cuY3J5cHRvICYmICF3aW5kb3cuY3J5cHRvLnN1YnRsZSAmJiB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZSkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUgPSB3aW5kb3cuY3J5cHRvLndlYmtpdFN1YnRsZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoIXdpbmRvdy5jcnlwdG8gfHwgIXdpbmRvdy5jcnlwdG8uc3VidGxlKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywnQsWCxIVkOiAnLCBTRVRUSU5HUy50ZXh0LnBvcHVwLmNyeXB0b0FwaUxvYWRFcnJvcik7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoU0VUVElOR1MudGV4dC5wb3B1cC5jcnlwdG9BcGlMb2FkRXJyb3IpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBlbmNyeXB0UlNBOiBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICByZXR1cm4gQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLmVuY3J5cHQoZGF0YSk7XG4gICAgfSxcbiAgICBlbmNyeXB0QUVTOiBmdW5jdGlvbiAoZmlsZUJ5dGVzQXJyYXksIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgYXJyYXlzQ291bnQgPSAxMjtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IHdpbmRvdy5jcnlwdG8uZ2V0UmFuZG9tVmFsdWVzKG5ldyBVaW50OEFycmF5KGFycmF5c0NvdW50KSk7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmVuY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBmaWxlQnl0ZXNBcnJheVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGVuY3J5cHRlZCkge1xuICAgICAgICAgICAgbGV0IGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcgPSBiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZCkpO1xuICAgICAgICAgICAgbGV0IGVuY3J5cHRlZElWID0gQ1JZUFRPX0VOR0lORS5lbmNyeXB0UlNBKGJhc2U2NGpzLmZyb21CeXRlQXJyYXkoQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVikpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZXhwb3J0QUVTS2V5KGZpbGVOYW1lLCBmaWxlVHlwZSwgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZywgZW5jcnlwdGVkSVYpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdDogZnVuY3Rpb24gKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmRldGVjdEJyb3dzZXJDb25maWcoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuc2V0dXBBamF4SGVhZGVyKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0byA9IG5ldyBKU0VuY3J5cHQoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcubG9hZFB1YmxpY0tleSgpO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgY3JlYXRlRm9ybU9iamVjdHMgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0IGlucHV0ID0gJzxpbnB1dCB0eXBlPVwiZmlsZVwiIGNsYXNzPVwiZW5jcnlwdC1mb3JtX19maWxlXCI+JztcbiAgICAgICAgICAgIGNvbnN0IHVwbG9hZEJ1dHRvbiA9IFxuICAgICAgICAgICAgICAgIGA8cCBjbGFzcz1cInBlcmNlbnRcIj48L3A+PHAgY2xhc3M9XCJsb2FkZXJcIj5Qcm9zesSZIGN6ZWthxIcuLi48L3A+PGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudGV4dC5odG1sLnVwbG9hZEJ1dHRvblRleHR9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gW2lucHV0LCB1cGxvYWRCdXR0b25dO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmRGb3JtIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IEFQUC5jb25maWcuY3JlYXRlRm9ybU9iamVjdHMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSAkKCcuZW5jcnlwdC1mb3JtJyk7XG4gICAgICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRVSUFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQoJy5sb2FkZXInKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgICAgICAgICAgICAkKCcucGVyY2VudCcpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gQVBQLmdldEZvcm1GaWxlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIFNFVFRJTkdTLnRleHQucG9wdXAuZmlsZU5vdExvYWRlZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldEZvcm1GaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVuY3J5cHQtZm9ybV9fZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICByZXR1cm4gZmlsZTtcbiAgICB9LFxuICAgIGVuY3J5cHRBbmRVcGxvYWQ6IGZ1bmN0aW9uIChmaWxlKSB7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBmaWxlQnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGZpbGVCeXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCgoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCk7XG4gICAgICAgICAgICAgICAgJCgnLnBlcmNlbnQnKS50ZXh0KCdTenlmcm93YW5pZSBwbGlrdTogJyArIHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgdXBsb2FkRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZmlsZUluQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6IFwic2F2ZUZpbGVcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGxldCB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICBsZXQgdXBsb2FkUmVzdWx0ID0gMDtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICB1cGxvYWRSZXN1bHQgPSBNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICh1cGxvYWRSZXN1bHQgPCAxMDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5wZXJjZW50JykudGV4dCgnV3lzecWCYW5pZSBwbGlrdTogJyArIHVwbG9hZFJlc3VsdCArICclJyk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcucGVyY2VudCcpLnRleHQoJ1Ryd2EgemFwaXN5d2FuaWUgcGxpa3UgbmEgc2Vyd2VyemUuJyk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIFwiZmlsZU5hbWVcIjogZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgXCJmaWxlVHlwZVwiOiBmaWxlVHlwZSxcbiAgICAgICAgICAgICAgICBcImZpbGVEYXRhXCI6IGZpbGVJbkJhc2U2NFN0cmluZyxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZEtleVwiOiBlbmNyeXB0ZWRLZXksXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRJVlwiOiBlbmNyeXB0ZWRJVlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkKCcubG9hZGVyJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgJCgnLnBlcmNlbnQnKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQocmVzcG9uc2UudHlwZSwgcmVzcG9uc2UudGl0bGUsIHJlc3BvbnNlLnRleHQpO1xuICAgICAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICBsZXQgcmVmcmVzaEJ0biA9ICQoJzxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi0tdXBsb2FkLWFub3RoZXItZmlsZVwiPk9kxZt3aWXFvCBzdHJvbsSZPC9idXR0b24+JykuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGxvY2F0aW9uLnJlbG9hZCgpOyAgICAgICAgICAgICAgICAgICAgIFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlci0tdXBsb2FkJykuYXBwZW5kKHJlZnJlc2hCdG4pO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBhamF4T3B0aW9ucywgdGhyb3duRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJycsIHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5pbml0KCk7XG4gICAgICAgIEFQUC5jb25maWcuYXBwZW5kRm9ybSgpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0RW5naW5lIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgYnJvd3NlckRldGVjdG9yIGZyb20gJy4vbGliL2Jyb3dzZXItZGV0ZWN0JztcbmltcG9ydCBjcnlwdG9FbmdpbmUgZnJvbSAnLi9saWIvdXBsb2FkLXBhZ2UnO1xuaW1wb3J0IHBhbmVsUGFnZSBmcm9tICcuL2xpYi9wYW5lbC1wYWdlJztcbmltcG9ydCBkZWNyeXB0UGFnZSBmcm9tICcuL2xpYi9kZWNyeXB0LXBhZ2UnO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICBicm93c2VyRGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgXG4gICAgaWYgKCQoJy5lbmNyeXB0LWZvcm0nKS5sZW5ndGgpIHtcbiAgICAgICAgY3J5cHRvRW5naW5lLmluaXRFbmdpbmUoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZmlsZS1saXN0LXdyYXBwZXInKS5sZW5ndGgpIHtcbiAgICAgICAgcGFuZWxQYWdlLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZGVjcnlwdC1maWxlcycpLmxlbmd0aCkge1xuICAgICAgICBkZWNyeXB0UGFnZS5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufSk7Il19
