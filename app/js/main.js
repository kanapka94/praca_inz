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
            var uploadButton = '<div class="btn-wrapper btn-wrapper--upload">\n                    <button type="button" class="btn btn--upload-file">' + SETTINGS.text.html.uploadButtonText + '</button>\n                </div>';
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
                    console.log(Math.floor(e.loaded / e.total * 100) + '%');
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
                // usuń loader
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtB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QUFhLEVBQUUsb0ZBQUYsRUFBd0YsS0FBeEYsQ0FBOEYsWUFBVztBQUN0SCxpQ0FBUyxNQUFUO0FBQ0gscUJBRmdCLENBQWpCO0FBR0Esc0JBQUUsc0JBQUYsRUFBMEIsTUFBMUIsQ0FBaUMsVUFBakM7QUFDSCxpQkFORCxNQU1PO0FBQ0gsNEJBQVEsR0FBUixDQUFZLFFBQVo7QUFDSDtBQUNKLGFBdkNFO0FBd0NILG1CQUFPLGVBQVUsR0FBVixFQUFlLFdBQWYsRUFBNEIsV0FBNUIsRUFBeUM7QUFDNUMsbUNBQU0sU0FBTixDQUFnQixPQUFoQixFQUF5QixFQUF6QixFQUE2QixJQUFJLFlBQWpDO0FBQ0g7QUExQ0UsU0FBUDtBQTRDSCxLQTFHTztBQTJHUixVQUFPLGdCQUFXO0FBQ2Qsc0JBQWMsSUFBZDtBQUNBLFlBQUksTUFBSixDQUFXLFVBQVg7QUFDQSxZQUFJLE1BQUosQ0FBVyxhQUFYO0FBQ0g7QUEvR08sQ0FBWjs7QUFrSEEsT0FBTyxPQUFQLEdBQWlCO0FBQ2IsZ0JBQWEsSUFBSTtBQURKLENBQWpCOzs7OztBQ2pPQTs7OztBQUNBOzs7O0FBQ0E7Ozs7QUFDQTs7Ozs7O0FBRUEsU0FBUyxnQkFBVCxDQUEwQixrQkFBMUIsRUFBOEMsWUFBVztBQUNyRCw0QkFBZ0IsTUFBaEI7O0FBRUEsUUFBSSxFQUFFLGVBQUYsRUFBbUIsTUFBdkIsRUFBK0I7QUFDM0IsNkJBQWEsVUFBYjtBQUNIOztBQUVELFFBQUcsRUFBRSxvQkFBRixFQUF3QixNQUEzQixFQUFtQztBQUMvQiw0QkFBVSxhQUFWO0FBQ0g7O0FBRUQsUUFBRyxFQUFFLGdCQUFGLEVBQW9CLE1BQXZCLEVBQStCO0FBQzNCLDhCQUFZLGFBQVo7QUFDSDtBQUNKLENBZEQiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBPUFVQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBtc2dUaW1lIDoge1xuICAgICAgICAgICAgZXJyb3IgOiA0MDAwLFxuICAgICAgICAgICAgd2FybmluZyA6IDMyMDAsXG4gICAgICAgICAgICBzdWNjZXNzIDogMjUwMFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaG93QWxlcnQ6IGZ1bmN0aW9uIChtc2dDbGFzcywgdGl0bGUsIHRleHQpIHtcbiAgICAgICAgdmFyICR0aXRsZSA9ICQoJy5hbGVydC1ib3hfX3RpdGxlJyksXG4gICAgICAgICAgICAkbWVzc2FnZSA9ICQoJy5hbGVydC1ib3hfX21lc3NhZ2UnKSxcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDA7XG4gICAgICAgIGlmIChtc2dDbGFzcyA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUud2FybmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLnN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93QWxlcnQgOiBQT1BVUC5zaG93QWxlcnRcbn0iLCJjb25zdCBTRVRUSU5HUyA9IHtcbiAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIGRldGVjdEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBkZXRlY3RvciA9IHtcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoU0VUVElOR1Mud3JhcHBlclNlbGVjdG9yKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5kZXRlY3RFcnJvck1zZyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRldGVjdG9yLmRldGVjdCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmluaXRcbn0iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB0ZXh0IDoge1xuICAgICAgICBodG1sIDoge1xuICAgICAgICAgICAgZmlsZU5hbWVOb3RDaGFuZ2VkIDogJ05pZSB6bWllbmlvbmEnLFxuICAgICAgICAgICAgZmlsZU5hbWVOb3RBdmFpbGFibGUgOiAnbmllIGRvc3TEmXBuYSdcbiAgICAgICAgfSxcbiAgICAgICAgcG9wdXAgOiB7XG4gICAgICAgICAgICBsb2FkUHJpdmF0ZUtleSA6ICdXY3p5dGFubyBrbHVjeiBwcnl3YXRueSEnLFxuICAgICAgICAgICAgZXJyb3JMb2FkUHJpdmF0ZUtleSA6ICdOaWUgbW/FvG5hIHdjenl0YcSHwqBrbHVjemEgcHJ5d2F0bmVnbyEnLFxuICAgICAgICAgICAgd3JvbmdGaWxlS2V5IDogJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScsXG4gICAgICAgICAgICB3cm9uZ0lWRmlsZSA6ICdaxYJ5IHBsaWsgXCJmaWxlX2l2XCIgIScsXG4gICAgICAgICAgICBmaWxlRW5jcnlwdGVkIDogJ09kc3p5ZnJvd2FubyBwbGlrIScsXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgcHJpdmF0ZUtleUxvYWRlZDogZmFsc2UsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXRQcml2YXRlS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgZmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlLCAnVVRGLTgnKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHJpdmF0ZUtleShldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucHJpdmF0ZUtleUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICdTdWtjZXM6JywgU0VUVElOR1MudGV4dC5wb3B1cC5sb2FkUHJpdmF0ZUtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgU0VUVElOR1MudGV4dC5wb3B1cC5lcnJvckxvYWRQcml2YXRlS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGltcG9ydEFFU0tleTogZnVuY3Rpb24oZGF0YSwgZW5jcnlwdGVkRmlsZUluQmFzZTY0LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmltcG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga3R5OiBkYXRhLmt0eSxcbiAgICAgICAgICAgICAgICAgICAgazogZGF0YS5rLFxuICAgICAgICAgICAgICAgICAgICBhbGc6IGRhdGEuYWxnLFxuICAgICAgICAgICAgICAgICAgICBleHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRCeXRlcyA9IGJhc2U2NGpzLnRvQnl0ZUFycmF5KGVuY3J5cHRlZEZpbGVJbkJhc2U2NCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVEYXRhID0gbmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkQnl0ZXMpO1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkSVZGaWxlKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldFByaXZhdGVLZXkoKTtcbiAgICB9LFxuICAgIGRlY3J5cHRSU0E6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5kZWNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZGVjcnlwdEFFUzogZnVuY3Rpb24oZGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmRlY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICkudGhlbihmdW5jdGlvbihkZWNyeXB0ZWQpe1xuICAgICAgICAgICAgQVBQLnNhdmVGaWxlKG5ldyBVaW50OEFycmF5KGRlY3J5cHRlZCksIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnU3VrY2VzOicsIFNFVFRJTkdTLnRleHQucG9wdXAuZmlsZUVuY3J5cHRlZCk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBsb2FkZWRGaWxlczogMCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJGZpZWxkID0gJCgnLmRlY3J5cHQtYnRuJyk7XG4gICAgICAgICAgICAkZmllbGQuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYoJGZpZWxkLmhhc0NsYXNzKCdibG9ja2VkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBsZXQgZmlsZSA9IEFQUC5nZXREb3dubG9hZGVkRmlsZSgpO1xuICAgICAgICAgICAgICAgIEFQUC5kZWNyeXB0QW5kRG93bmxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZExvYWRGaWxlc0V2ZW50czogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX3ByaXZhdGUta2V5JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXRQcml2YXRlS2V5KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCgnLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1rZXknKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCgnLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1pdicpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgfSxcbiAgICAgICAgYmluZERlY3J5cHRGaWxlTmFtZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBsZXQgdXBsb2FkZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZmlsZU5hbWUgPSB1cGxvYWRlZEZpbGUubmFtZTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHRtcEZpbGVOYW1lID0gZmlsZU5hbWUuc3Vic3RyKDAsZmlsZU5hbWUubGVuZ3RoLTgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZmluYWxGaWxlTmFtZSA9IHRtcEZpbGVOYW1lLnN1YnN0cigwLCB0bXBGaWxlTmFtZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAnZGVjcnlwdEZpbGVOYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY3J5cHRlZEZpbGVOYW1lOiBmaW5hbEZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdfdG9rZW4nIDogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19sYWJlbCcpLmFkZENsYXNzKCdsYWJlbC0tYmx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9yaWdpbmFsRmlsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS5odG1sKHJlc3BvbnNlLm9yaWdpbmFsRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19oaW50JykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5maWxlTmFtZU5vdENoYW5nZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19sYWJlbCcpLnJlbW92ZUNsYXNzKCdsYWJlbC0tYmx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19faGludCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbChTRVRUSU5HUy50ZXh0Lmh0bWwuZmlsZU5hbWVOb3RBdmFpbGFibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjaGVja0xvYWRlZEZpbGVzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoQVBQLmxvYWRlZEZpbGVzID49IDQpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWJ0bicpLnJlbW92ZUNsYXNzKCdibG9ja2VkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldERvd25sb2FkZWRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICB9LFxuICAgIGxvYWRJVkZpbGU6IGZ1bmN0aW9uIChmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBlbmNyeXB0ZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1pdicpLmZpbGVzWzBdO1xuICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRGaWxlID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIGxldCBiYXNlNjRTdHJpbmcgPSBDUllQVE9fRU5HSU5FLmRlY3J5cHRSU0EoZW5jcnlwdGVkRmlsZSk7XG4gICAgICAgICAgICBsZXQgaXZLZXkgPSBiYXNlNjRqcy50b0J5dGVBcnJheShiYXNlNjRTdHJpbmcpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IGl2S2V5O1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5kZWNyeXB0QUVTKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC53cm9uZ0lWRmlsZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGxvYWRLZXlGaWxlOiBmdW5jdGlvbiAoZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgZW5jcnlwdGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUta2V5JykuZmlsZXNbMF07XG4gICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChlbmNyeXB0ZWRGaWxlLCAndXRmLTgnKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGV0IGpzb25FbmNyeXB0ZWQgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGRlY3J5cHRlZEZpbGUgPSBDUllQVE9fRU5HSU5FLmRlY3J5cHRSU0EoanNvbkVuY3J5cHRlZCk7XG4gICAgICAgICAgICBsZXQgZmlsZUtleSA9IEpTT04ucGFyc2UoZGVjcnlwdGVkRmlsZSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5pbXBvcnRBRVNLZXkoZmlsZUtleSwgZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGdldEJsb2I6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQmxvYjtcbiAgICB9LFxuICAgIHNhdmVGaWxlOiBmdW5jdGlvbihieXRlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBCQiA9IEFQUC5nZXRCbG9iKCk7XG4gICAgICAgIHNhdmVBcyhcbiAgICAgICAgICAgIG5ldyBCQihbYnl0ZURhdGFdLCB7IHR5cGUgOiBmaWxlVHlwZSB9KSxcbiAgICAgICAgICAgIGZpbGVOYW1lXG4gICAgICAgICk7XG4gICAgfSxcbiAgICBkZWNyeXB0QW5kRG93bmxvYWQ6IGZ1bmN0aW9uKGJhc2U2NEZpbGUpIHtcbiAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBmaWxlVHlwZSA9ICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtdHlwZScpLnZhbCgpO1xuICAgICAgICAgICAgbGV0IGJhc2U2NFN0cmluZyA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBsZXQgZmlsZU5hbWUgPSAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS50ZXh0KCk7XG4gICAgICAgICAgICBBUFAubG9hZEtleUZpbGUoYmFzZTY0U3RyaW5nLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYmFzZTY0RmlsZSwgJ3V0Zi04Jyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmRMb2FkRmlsZXNFdmVudHMoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVjcnlwdEZpbGVFdmVudCgpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWNyeXB0RmlsZU5hbWVFdmVudCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJpbmRVSUFjdGlvbnMgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBwb3B1cCBmcm9tICcuL2FsZXJ0LWJveCc7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHRleHQgOiB7XG4gICAgICAgIGh0bWwgOiB7XG4gICAgICAgICAgICBkZWxldGVGaWxlIDogJ1xcblxcbkN6eSBuYSBwZXdubyBjaGNlc3ogdXN1bsSFxIcgcGxpaz8nXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUZpbGU6IGZ1bmN0aW9uKF9maWxlSWQsIHBhcmVudE5vZGUpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogJ2RlbGV0ZScsXG4gICAgICAgICAgICBkYXRhOiB7IFxuICAgICAgICAgICAgICAgICdmaWxlSWQnIDogX2ZpbGVJZCxcbiAgICAgICAgICAgICAgICAnX3Rva2VuJyA6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIHJlc3BvbnNlLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0LFgsSFZDonLCByZXNwb25zZS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNob3dEZWxldGVGaWxlUHJvbXB0OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVJZCwgcGFyZW50Tm9kZSkge1xuICAgICAgICBsZXQgYW5zd2VyID0gY29uZmlybSgnVXN1d2FuaWU6ICcrIGZpbGVOYW1lICsgU0VUVElOR1MudGV4dC5odG1sLmRlbGV0ZUZpbGUpO1xuICAgICAgICBpZihhbnN3ZXIpIHtcbiAgICAgICAgICAgIEFQUC5kZWxldGVGaWxlKGZpbGVJZCwgcGFyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbmZpZzoge1xuICAgICAgICBiaW5kRGVsZXRlRmlsZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0ICRmaWVsZCA9ICQoJy5mYS10cmFzaCcpO1xuICAgICAgICAgICAgJGZpZWxkLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gJCh0aGlzKS5wYXJlbnRzKCcudG9wLXNlY3Rpb24nKS5maW5kKCcudG9wLXNlY3Rpb25fX25hbWUnKS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVJZCA9ICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpLmZpbmQoJy5maWxlLWlkJykudGV4dCgpO1xuICAgICAgICAgICAgICAgIEFQUC5zaG93RGVsZXRlRmlsZVByb21wdChmaWxlTmFtZSxmaWxlSWQsICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQVBQLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWxldGVGaWxlRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBiaW5kVUlBY3Rpb25zIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIHVwbG9hZEJ1dHRvblRleHQgOiAnWmFzenlmcnVqIGkgd3nFm2xpaiBwbGlrJyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9wdXAgOiB7XG4gICAgICAgICAgICBzZWN1cmVLZXlHZW5lcmF0ZWQgOiAnQmV6cGllY3pueSBrbHVjeiB3eWdlbmVyb3dhbnkhJyxcbiAgICAgICAgICAgIGZpbGVOb3RMb2FkZWQgOiAnUGxpayBuaWUgem9zdGHFgiB3Y3p5dGFueSEnLFxuICAgICAgICAgICAgY3J5cHRvQXBpTG9hZEVycm9yIDogJ1R3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuJ1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXR1cEFqYXhIZWFkZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdYLUNTUkYtVE9LRU4nOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxvYWRQdWJsaWNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogJ2dldFB1YktleScsXG4gICAgICAgICAgICAgICAgZGF0YVR5cGUgOiAnanNvbicsXG4gICAgICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQdWJsaWNLZXkocmVzcG9uc2UpOyBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRlQUVTS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5nZW5lcmF0ZUtleShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDEyOCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJycsIFNFVFRJTkdTLnRleHQucG9wdXAuc2VjdXJlS2V5R2VuZXJhdGVkKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXhwb3J0QUVTS2V5OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXlcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5ZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoa2V5ZGF0YSk7XG4gICAgICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEtleSA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBBUFAudXBsb2FkRmlsZShmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGV0ZWN0QnJvd3NlckNvbmZpZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiAhd2luZG93LmNyeXB0by5zdWJ0bGUgJiYgd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlID0gd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aW5kb3cuY3J5cHRvIHx8ICF3aW5kb3cuY3J5cHRvLnN1YnRsZSkge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsJ0LFgsSFZDogJywgU0VUVElOR1MudGV4dC5wb3B1cC5jcnlwdG9BcGlMb2FkRXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFNFVFRJTkdTLnRleHQucG9wdXAuY3J5cHRvQXBpTG9hZEVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGZpbGVCeXRlc0FycmF5LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGFycmF5c0NvdW50ID0gMTI7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShhcnJheXNDb3VudCkpO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZmlsZUJ5dGVzQXJyYXlcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGxldCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudGV4dC5odG1sLnVwbG9hZEJ1dHRvblRleHR9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gW2lucHV0LCB1cGxvYWRCdXR0b25dO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmRGb3JtIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IEFQUC5jb25maWcuY3JlYXRlRm9ybU9iamVjdHMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSAkKCcuZW5jcnlwdC1mb3JtJyk7XG4gICAgICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRVSUFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciBmaWxlID0gQVBQLmdldEZvcm1GaWxlKCk7XG4gICAgICAgICAgICAgICAgaWYgKCFmaWxlKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIFNFVFRJTkdTLnRleHQucG9wdXAuZmlsZU5vdExvYWRlZCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgQVBQLmVuY3J5cHRBbmRVcGxvYWQoZmlsZSk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgJCgnLmVuY3J5cHQtZm9ybV9fZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmdlbmVyYXRlQUVTS2V5KCk7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykuYWRkQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ2ZsZXgnKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLnJlbW92ZUNsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldEZvcm1GaWxlOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGxldCBmaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmVuY3J5cHQtZm9ybV9fZmlsZScpLmZpbGVzWzBdO1xuICAgICAgICByZXR1cm4gZmlsZTtcbiAgICB9LFxuICAgIGVuY3J5cHRBbmRVcGxvYWQ6IGZ1bmN0aW9uIChmaWxlKSB7XG5cbiAgICAgICAgY29uc3QgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGxldCBmaWxlQnl0ZXNBcnJheSA9IG5ldyBVaW50OEFycmF5KHJlYWRlci5yZXN1bHQpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5lbmNyeXB0QUVTKGZpbGVCeXRlc0FycmF5LCBmaWxlLm5hbWUsIGZpbGUudHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZygnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCgoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNBcnJheUJ1ZmZlcihmaWxlKTtcbiAgICB9LFxuICAgIHVwbG9hZEZpbGU6IGZ1bmN0aW9uIChmaWxlTmFtZSwgZmlsZVR5cGUsIGZpbGVJbkJhc2U2NFN0cmluZywgZW5jcnlwdGVkS2V5LCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgLy8geGhyRmllbGRzOiB7XG4gICAgICAgICAgICAvLyAgICAgb25wcm9ncmVzczogZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgaWYgKGUubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICAgICAgY29uc29sZS5sb2coZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwICsgJyUnKTtcbiAgICAgICAgICAgIC8vICAgICAgICAgfVxuICAgICAgICAgICAgLy8gICAgIH1cbiAgICAgICAgICAgIC8vIH0sXG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6IFwic2F2ZUZpbGVcIixcbiAgICAgICAgICAgIHhocjogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIHZhciB4aHIgPSAkLmFqYXhTZXR0aW5ncy54aHIoKTtcbiAgICAgICAgICAgICAgICB4aHIudXBsb2FkLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhNYXRoLmZsb29yKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCkgKyAnJScpO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgcmV0dXJuIHhocjtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhOiB7XG4gICAgICAgICAgICAgICAgXCJmaWxlTmFtZVwiOiBmaWxlTmFtZSxcbiAgICAgICAgICAgICAgICBcImZpbGVUeXBlXCI6IGZpbGVUeXBlLFxuICAgICAgICAgICAgICAgIFwiZmlsZURhdGFcIjogZmlsZUluQmFzZTY0U3RyaW5nLFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkS2V5XCI6IGVuY3J5cHRlZEtleSxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZElWXCI6IGVuY3J5cHRlZElWXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIC8vVE9ETzogZG9kYcSHIGxvYWRlciAoZ2lmKVxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgLy8gdXN1xYQgbG9hZGVyXG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZiAocmVzcG9uc2UudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hCdG4gPSAkKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tLXVwbG9hZC1hbm90aGVyLWZpbGVcIj5PZMWbd2llxbwgc3Ryb27EmTwvYnV0dG9uPicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXItLXVwbG9hZCcpLmFwcGVuZChyZWZyZXNoQnRuKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAoeGhyLCBhamF4T3B0aW9ucywgdGhyb3duRXJyb3IpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJycsIHhoci5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5pbml0KCk7XG4gICAgICAgIEFQUC5jb25maWcuYXBwZW5kRm9ybSgpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBpbml0RW5naW5lIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgYnJvd3NlckRldGVjdG9yIGZyb20gJy4vbGliL2Jyb3dzZXItZGV0ZWN0JztcbmltcG9ydCBjcnlwdG9FbmdpbmUgZnJvbSAnLi9saWIvdXBsb2FkLXBhZ2UnO1xuaW1wb3J0IHBhbmVsUGFnZSBmcm9tICcuL2xpYi9wYW5lbC1wYWdlJztcbmltcG9ydCBkZWNyeXB0UGFnZSBmcm9tICcuL2xpYi9kZWNyeXB0LXBhZ2UnO1xuXG5kb2N1bWVudC5hZGRFdmVudExpc3RlbmVyKFwiRE9NQ29udGVudExvYWRlZFwiLCBmdW5jdGlvbigpIHtcbiAgICBicm93c2VyRGV0ZWN0b3IuZGV0ZWN0KCk7XG4gICAgXG4gICAgaWYgKCQoJy5lbmNyeXB0LWZvcm0nKS5sZW5ndGgpIHtcbiAgICAgICAgY3J5cHRvRW5naW5lLmluaXRFbmdpbmUoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZmlsZS1saXN0LXdyYXBwZXInKS5sZW5ndGgpIHtcbiAgICAgICAgcGFuZWxQYWdlLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG5cbiAgICBpZigkKCcuZGVjcnlwdC1maWxlcycpLmxlbmd0aCkge1xuICAgICAgICBkZWNyeXB0UGFnZS5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufSk7Il19
