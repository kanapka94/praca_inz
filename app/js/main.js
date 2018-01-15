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
                data: {
                    'fileName': 'rsa_4096_pub.key'
                },
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
            var uploadButton = '<p class="loader">Prosz\u0119 czeka\u0107...</p><div class="btn-wrapper btn-wrapper--upload">\n                    <button type="button" class="btn btn--upload-file">' + SETTINGS.text.html.uploadButtonText + '</button>\n                </div>';
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
            success: function success(response) {
                $('.loader').remove();
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtB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dGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwidmFyIFBPUFVQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBtc2dUaW1lIDoge1xuICAgICAgICAgICAgZXJyb3IgOiA0MDAwLFxuICAgICAgICAgICAgd2FybmluZyA6IDMyMDAsXG4gICAgICAgICAgICBzdWNjZXNzIDogMjUwMFxuICAgICAgICB9XG4gICAgfSxcbiAgICBzaG93QWxlcnQ6IGZ1bmN0aW9uIChtc2dDbGFzcywgdGl0bGUsIHRleHQpIHtcbiAgICAgICAgdmFyICR0aXRsZSA9ICQoJy5hbGVydC1ib3hfX3RpdGxlJyksXG4gICAgICAgICAgICAkbWVzc2FnZSA9ICQoJy5hbGVydC1ib3hfX21lc3NhZ2UnKSxcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IDA7XG4gICAgICAgIGlmIChtc2dDbGFzcyA9PT0gJ2Vycm9yJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUuZXJyb3I7XG4gICAgICAgIH0gZWxzZSBpZiAobXNnQ2xhc3MgPT09ICd3YXJuaW5nJykge1xuICAgICAgICAgICAgZGVsYXlUaW1lID0gUE9QVVAuY29uZmlnLm1zZ1RpbWUud2FybmluZztcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLnN1Y2Nlc3M7XG4gICAgICAgIH1cbiAgICAgICAgJHRpdGxlLmh0bWwodGl0bGUpO1xuICAgICAgICAkbWVzc2FnZS5odG1sKHRleHQpO1xuICAgICAgICAkKCcuYWxlcnQtYm94JykuYWRkQ2xhc3MobXNnQ2xhc3MpLmFkZENsYXNzKCdzaG93JykuZGVsYXkoZGVsYXlUaW1lKS5xdWV1ZShmdW5jdGlvbiAobmV4dCkge1xuICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnc2hvdycpLnJlbW92ZUNsYXNzKG1zZ0NsYXNzKTtcbiAgICAgICAgICAgICR0aXRsZS5odG1sKCcnKTtcbiAgICAgICAgICAgICRtZXNzYWdlLmh0bWwoJycpO1xuICAgICAgICAgICAgbmV4dCgpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBzaG93QWxlcnQgOiBQT1BVUC5zaG93QWxlcnRcbn0iLCJjb25zdCBTRVRUSU5HUyA9IHtcbiAgICB3cmFwcGVyU2VsZWN0b3IgOiAnLm1haW4td3JhcHBlcicsXG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIGRldGVjdEVycm9yTXNnIDogJzxkaXY+PGgyIGNsYXNzPVwiZGV0ZWN0LWJyb3dzZXItdGV4dFwiPlN5c3RlbSBzenlmcnVqxIVjeSBvYmVjbmllIGR6aWHFgmEgPHNwYW4gY2xhc3M9XCJpbXBvcnRhbnRcIj50eWxrbzwvc3Bhbj4gbmEgcHJ6ZWdsxIVkYXJrYWNoOjxicj5Hb29nbGUgQ2hyb21lIG9yYXogTW96aWxsYSBGaXJlZm94PC9oMj48L2Rpdj4nXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBkZXRlY3RvciA9IHtcbiAgICBkZXRlY3QgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgbGV0IGlzQ2hyb21pdW0gPSB3aW5kb3cuY2hyb21lLFxuICAgICAgICAgICAgd2luTmF2ID0gd2luZG93Lm5hdmlnYXRvcixcbiAgICAgICAgICAgIHZlbmRvck5hbWUgPSB3aW5OYXYudmVuZG9yLFxuICAgICAgICAgICAgaXNPcGVyYSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignT1BSJykgPiAtMSxcbiAgICAgICAgICAgIGlzSUVlZGdlID0gd2luTmF2LnVzZXJBZ2VudC5pbmRleE9mKCdFZGdlJykgPiAtMSxcbiAgICAgICAgICAgIGlzSU9TQ2hyb21lID0gd2luTmF2LnVzZXJBZ2VudC5tYXRjaCgnQ3JpT1MnKSxcbiAgICAgICAgICAgIGlzRmlyZWZveCA9IG5hdmlnYXRvci51c2VyQWdlbnQudG9Mb3dlckNhc2UoKS5pbmRleE9mKCdmaXJlZm94JykgPiAtMSxcbiAgICAgICAgICAgIGlzTW9iaWxlRGV2aWNlID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuICh0eXBlb2Ygd2luZG93Lm9yaWVudGF0aW9uICE9PSAndW5kZWZpbmVkJykgfHwgKG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignSUVNb2JpbGUnKSAhPT0gLTEpO1xuICAgICAgICAgICAgfTtcblxuICAgICAgICBpZiAoaXNDaHJvbWl1bSAhPT0gbnVsbCAmJiBpc0Nocm9taXVtICE9PSB1bmRlZmluZWQgJiYgdmVuZG9yTmFtZSA9PT0gJ0dvb2dsZSBJbmMuJyAmJiBpc09wZXJhID09IGZhbHNlICYmIGlzSUVlZGdlID09IGZhbHNlKSB7XG4gICAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpIDw9IC0xKSB7XG4gICAgICAgICAgICAgICAgZGV0ZWN0b3IuZGlzcGxheUVycm9yTXNnKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gICAgICAgIFxuICAgIH0sXG4gICAgZGlzcGxheUVycm9yTXNnIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQoU0VUVElOR1Mud3JhcHBlclNlbGVjdG9yKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5kZXRlY3RFcnJvck1zZyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGRldGVjdG9yLmRldGVjdCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGRldGVjdCA6IGRldGVjdG9yLmluaXRcbn0iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB0ZXh0IDoge1xuICAgICAgICBodG1sIDoge1xuICAgICAgICAgICAgZmlsZU5hbWVOb3RDaGFuZ2VkIDogJ05pZSB6bWllbmlvbmEnLFxuICAgICAgICAgICAgZmlsZU5hbWVOb3RBdmFpbGFibGUgOiAnbmllIGRvc3TEmXBuYSdcbiAgICAgICAgfSxcbiAgICAgICAgcG9wdXAgOiB7XG4gICAgICAgICAgICBsb2FkUHJpdmF0ZUtleSA6ICdXY3p5dGFubyBrbHVjeiBwcnl3YXRueSEnLFxuICAgICAgICAgICAgZXJyb3JMb2FkUHJpdmF0ZUtleSA6ICdOaWUgbW/FvG5hIHdjenl0YcSHwqBrbHVjemEgcHJ5d2F0bmVnbyEnLFxuICAgICAgICAgICAgd3JvbmdGaWxlS2V5IDogJ1rFgnkgcGxpayBcImZpbGVfa2V5XCIgIScsXG4gICAgICAgICAgICB3cm9uZ0lWRmlsZSA6ICdaxYJ5IHBsaWsgXCJmaWxlX2l2XCIgIScsXG4gICAgICAgICAgICBmaWxlRW5jcnlwdGVkIDogJ09kc3p5ZnJvd2FubyBwbGlrIScsXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgcHJpdmF0ZUtleUxvYWRlZDogZmFsc2UsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXRQcml2YXRlS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgZmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICAgICAgaWYgKGZpbGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgICAgICAgICByZWFkZXIucmVhZEFzVGV4dChmaWxlLCAnVVRGLTgnKTtcbiAgICAgICAgICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHJpdmF0ZUtleShldnQudGFyZ2V0LnJlc3VsdCk7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucHJpdmF0ZUtleUxvYWRlZCA9IHRydWU7XG4gICAgICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICdTdWtjZXM6JywgU0VUVElOR1MudGV4dC5wb3B1cC5sb2FkUHJpdmF0ZUtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGV2dCkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgU0VUVElOR1MudGV4dC5wb3B1cC5lcnJvckxvYWRQcml2YXRlS2V5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIGltcG9ydEFFU0tleTogZnVuY3Rpb24oZGF0YSwgZW5jcnlwdGVkRmlsZUluQmFzZTY0LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmltcG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAga3R5OiBkYXRhLmt0eSxcbiAgICAgICAgICAgICAgICAgICAgazogZGF0YS5rLFxuICAgICAgICAgICAgICAgICAgICBhbGc6IGRhdGEuYWxnLFxuICAgICAgICAgICAgICAgICAgICBleHQ6IHRydWUsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZmFsc2UsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbihrZXkpe1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRCeXRlcyA9IGJhc2U2NGpzLnRvQnl0ZUFycmF5KGVuY3J5cHRlZEZpbGVJbkJhc2U2NCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVEYXRhID0gbmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkQnl0ZXMpO1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkSVZGaWxlKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24oZXJyKXtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldFByaXZhdGVLZXkoKTtcbiAgICB9LFxuICAgIGRlY3J5cHRSU0E6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5kZWNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZGVjcnlwdEFFUzogZnVuY3Rpb24oZGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmRlY3J5cHQoXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgbmFtZTogXCJBRVMtR0NNXCIsXG4gICAgICAgICAgICAgICAgaXY6IENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYsXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXksXG4gICAgICAgICAgICBkYXRhXG4gICAgICAgICkudGhlbihmdW5jdGlvbihkZWNyeXB0ZWQpe1xuICAgICAgICAgICAgJCgnLmxvYWRlcicpLnJlbW92ZSgpO1xuICAgICAgICAgICAgQVBQLnNhdmVGaWxlKG5ldyBVaW50OEFycmF5KGRlY3J5cHRlZCksIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnU3VrY2VzOicsIFNFVFRJTkdTLnRleHQucG9wdXAuZmlsZUVuY3J5cHRlZCk7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgIH0pO1xuICAgIH1cbn07XG5cbmNvbnN0IEFQUCA9IHtcbiAgICBsb2FkZWRGaWxlczogMCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVFdmVudDogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgY29uc3QgJGZpZWxkID0gJCgnLmRlY3J5cHQtYnRuJyk7XG4gICAgICAgICAgICAkZmllbGQuY2xpY2soZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYoJGZpZWxkLmhhc0NsYXNzKCdibG9ja2VkJykpIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkKCcubG9hZGVyJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGUgPSBBUFAuZ2V0RG93bmxvYWRlZEZpbGUoKTtcbiAgICAgICAgICAgICAgICBBUFAuZGVjcnlwdEFuZERvd25sb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRMb2FkRmlsZXNFdmVudHM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19wcml2YXRlLWtleScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuc2V0UHJpdmF0ZUtleSgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUta2V5JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICQoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUtaXYnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIEFQUC5sb2FkZWRGaWxlcysrO1xuICAgICAgICAgICAgICAgIEFQUC5jaGVja0xvYWRlZEZpbGVzQ291bnQoKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGJpbmREZWNyeXB0RmlsZU5hbWVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgbGV0IHVwbG9hZGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gdXBsb2FkZWRGaWxlLm5hbWU7XG4gICAgICAgICAgICAgICAgICAgIGxldCB0bXBGaWxlTmFtZSA9IGZpbGVOYW1lLnN1YnN0cigwLGZpbGVOYW1lLmxlbmd0aC04KTtcbiAgICAgICAgICAgICAgICAgICAgbGV0IGZpbmFsRmlsZU5hbWUgPSB0bXBGaWxlTmFtZS5zdWJzdHIoMCwgdG1wRmlsZU5hbWUubGVuZ3RoKTtcbiAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHVybDogJ2RlY3J5cHRGaWxlTmFtZScsXG4gICAgICAgICAgICAgICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlbmNyeXB0ZWRGaWxlTmFtZTogZmluYWxGaWxlTmFtZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnX3Rva2VuJyA6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5kb25lKGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbGFiZWwnKS5hZGRDbGFzcygnbGFiZWwtLWJsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChyZXNwb25zZS5vcmlnaW5hbEZpbGVOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbChyZXNwb25zZS5vcmlnaW5hbEZpbGVOYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19faGludCcpLmFkZENsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbChTRVRUSU5HUy50ZXh0Lmh0bWwuZmlsZU5hbWVOb3RDaGFuZ2VkKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdlcnJvcicpO1xuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuYWx3YXlzKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJjb21wbGV0ZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbGFiZWwnKS5yZW1vdmVDbGFzcygnbGFiZWwtLWJsdWUnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX2hpbnQnKS5yZW1vdmVDbGFzcygnYWN0aXZlJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtb3JpZ2luYWwtbmFtZScpLmh0bWwoU0VUVElOR1MudGV4dC5odG1sLmZpbGVOYW1lTm90QXZhaWxhYmxlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgY2hlY2tMb2FkZWRGaWxlc0NvdW50OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIGlmKEFQUC5sb2FkZWRGaWxlcyA+PSA0KSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1idG4nKS5yZW1vdmVDbGFzcygnYmxvY2tlZCcpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXREb3dubG9hZGVkRmlsZTogZnVuY3Rpb24oKSB7XG4gICAgICAgIHJldHVybiBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuZmlsZXNbMF07XG4gICAgfSxcbiAgICBsb2FkSVZGaWxlOiBmdW5jdGlvbiAoZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgZW5jcnlwdGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUtaXYnKS5maWxlc1swXTtcbiAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGVuY3J5cHRlZEZpbGUsICd1dGYtOCcpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkRmlsZSA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBsZXQgYmFzZTY0U3RyaW5nID0gQ1JZUFRPX0VOR0lORS5kZWNyeXB0UlNBKGVuY3J5cHRlZEZpbGUpO1xuICAgICAgICAgICAgbGV0IGl2S2V5ID0gYmFzZTY0anMudG9CeXRlQXJyYXkoYmFzZTY0U3RyaW5nKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSBpdktleTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZGVjcnlwdEFFUyhmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIFNFVFRJTkdTLnRleHQucG9wdXAud3JvbmdJVkZpbGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBsb2FkS2V5RmlsZTogZnVuY3Rpb24gKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGVuY3J5cHRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWtleScpLmZpbGVzWzBdO1xuICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBqc29uRW5jcnlwdGVkID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIGxldCBkZWNyeXB0ZWRGaWxlID0gQ1JZUFRPX0VOR0lORS5kZWNyeXB0UlNBKGpzb25FbmNyeXB0ZWQpO1xuICAgICAgICAgICAgbGV0IGZpbGVLZXkgPSBKU09OLnBhcnNlKGRlY3J5cHRlZEZpbGUpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuaW1wb3J0QUVTS2V5KGZpbGVLZXksIGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC53cm9uZ0ZpbGVLZXkpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfSxcbiAgICBnZXRCbG9iOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIEJsb2I7XG4gICAgfSxcbiAgICBzYXZlRmlsZTogZnVuY3Rpb24oYnl0ZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgQkIgPSBBUFAuZ2V0QmxvYigpO1xuICAgICAgICBzYXZlQXMoXG4gICAgICAgICAgICBuZXcgQkIoW2J5dGVEYXRhXSwgeyB0eXBlIDogZmlsZVR5cGUgfSksXG4gICAgICAgICAgICBmaWxlTmFtZVxuICAgICAgICApO1xuICAgIH0sXG4gICAgZGVjcnlwdEFuZERvd25sb2FkOiBmdW5jdGlvbihiYXNlNjRGaWxlKSB7XG4gICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBsZXQgZmlsZVR5cGUgPSAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLXR5cGUnKS52YWwoKTtcbiAgICAgICAgICAgIGxldCBiYXNlNjRTdHJpbmcgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykudGV4dCgpO1xuICAgICAgICAgICAgQVBQLmxvYWRLZXlGaWxlKGJhc2U2NFN0cmluZywgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdFcnJvcjogJywgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIGlmIChkYXRhLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgICAgICBsZXQgcHJvZ3Jlc3MgPSBwYXJzZUludCggKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTAgKTtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhwcm9ncmVzcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5yZWFkQXNUZXh0KGJhc2U2NEZpbGUsICd1dGYtOCcpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kTG9hZEZpbGVzRXZlbnRzKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZERlY3J5cHRGaWxlRXZlbnQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVjcnlwdEZpbGVOYW1lRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBiaW5kVUlBY3Rpb25zIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5jb25zdCBTRVRUSU5HUyA9IHtcbiAgICB0ZXh0IDoge1xuICAgICAgICBodG1sIDoge1xuICAgICAgICAgICAgZGVsZXRlRmlsZSA6ICdcXG5cXG5DenkgbmEgcGV3bm8gY2hjZXN6IHVzdW7EhcSHIHBsaWs/J1xuICAgICAgICB9XG4gICAgfVxufTtcblxuY29uc3QgQVBQID0ge1xuICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBkZWxldGVGaWxlOiBmdW5jdGlvbihfZmlsZUlkLCBwYXJlbnROb2RlKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB0eXBlOiAnUE9TVCcsXG4gICAgICAgICAgICB1cmw6ICdkZWxldGUnLFxuICAgICAgICAgICAgZGF0YTogeyBcbiAgICAgICAgICAgICAgICAnZmlsZUlkJyA6IF9maWxlSWQsXG4gICAgICAgICAgICAgICAgJ190b2tlbicgOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3M6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgaWYocmVzcG9uc2UudHlwZSA9PT0gJ3N1Y2Nlc3MnKSB7XG4gICAgICAgICAgICAgICAgICAgIHBhcmVudE5vZGUucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCByZXNwb25zZS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6JywgcmVzcG9uc2UucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBzaG93RGVsZXRlRmlsZVByb21wdDogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlSWQsIHBhcmVudE5vZGUpIHtcbiAgICAgICAgbGV0IGFuc3dlciA9IGNvbmZpcm0oJ1VzdXdhbmllOiAnKyBmaWxlTmFtZSArIFNFVFRJTkdTLnRleHQuaHRtbC5kZWxldGVGaWxlKTtcbiAgICAgICAgaWYoYW5zd2VyKSB7XG4gICAgICAgICAgICBBUFAuZGVsZXRlRmlsZShmaWxlSWQsIHBhcmVudE5vZGUpO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjb25maWc6IHtcbiAgICAgICAgYmluZERlbGV0ZUZpbGVFdmVudDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCAkZmllbGQgPSAkKCcuZmEtdHJhc2gnKTtcbiAgICAgICAgICAgICRmaWVsZC5jbGljayhmdW5jdGlvbiAoZXZlbnQpIHtcbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlTmFtZSA9ICQodGhpcykucGFyZW50cygnLnRvcC1zZWN0aW9uJykuZmluZCgnLnRvcC1zZWN0aW9uX19uYW1lJykudGV4dCgpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlSWQgPSAkKHRoaXMpLnBhcmVudHMoJy5maWxlLXdyYXBwZXInKS5maW5kKCcuZmlsZS1pZCcpLnRleHQoKTtcbiAgICAgICAgICAgICAgICBBUFAuc2hvd0RlbGV0ZUZpbGVQcm9tcHQoZmlsZU5hbWUsZmlsZUlkLCAkKHRoaXMpLnBhcmVudHMoJy5maWxlLXdyYXBwZXInKSk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIEFQUC5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVsZXRlRmlsZUV2ZW50KCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgYmluZFVJQWN0aW9ucyA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHRleHQgOiB7XG4gICAgICAgIGh0bWwgOiB7XG4gICAgICAgICAgICB1cGxvYWRCdXR0b25UZXh0IDogJ1phc3p5ZnJ1aiBpIHd5xZtsaWogcGxpaycsXG4gICAgICAgIH0sXG4gICAgICAgIHBvcHVwIDoge1xuICAgICAgICAgICAgc2VjdXJlS2V5R2VuZXJhdGVkIDogJ0JlenBpZWN6bnkga2x1Y3ogd3lnZW5lcm93YW55IScsXG4gICAgICAgICAgICBmaWxlTm90TG9hZGVkIDogJ1BsaWsgbmllIHpvc3RhxYIgd2N6eXRhbnkhJyxcbiAgICAgICAgICAgIGNyeXB0b0FwaUxvYWRFcnJvciA6ICdUd29qYSBwcnplZ2zEhWRhcmthIG5pZSBvYnPFgnVndWplIGludGVyZmVqc3UgV2ViIENyeXB0b2dyYXBoeSBBUEkhIFRhIHN0cm9uYSBuaWUgYsSZZHppZSBkemlhxYJhxIcgcG9wcmF3bmllLidcbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgQ1JZUFRPX0VOR0lORSA9IHtcbiAgICBwYXNzQ3J5cHRvOiBudWxsLFxuICAgIGFlc0tleTogbnVsbCxcbiAgICBnZW5lcmF0ZWRJVjogbnVsbCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAkLmFqYXhTZXR1cCh7XG4gICAgICAgICAgICAgICAgaGVhZGVyczoge1xuICAgICAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBsb2FkUHVibGljS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICB1cmw6ICdnZXRQdWJLZXknLFxuICAgICAgICAgICAgICAgIGRhdGEgOiB7XG4gICAgICAgICAgICAgICAgICAgICdmaWxlTmFtZScgOiAncnNhXzQwOTZfcHViLmtleSdcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGRhdGFUeXBlIDogJ2pzb24nLFxuICAgICAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uc2V0UHVibGljS2V5KHJlc3BvbnNlKTsgXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IocmVzcG9uc2UpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBnZW5lcmF0ZUFFU0tleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZ2VuZXJhdGVLZXkoXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICAgICAgbGVuZ3RoOiAxMjgsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0cnVlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleSkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5ID0ga2V5O1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnc3VjY2VzcycsICcnLCBTRVRUSU5HUy50ZXh0LnBvcHVwLnNlY3VyZUtleUdlbmVyYXRlZCk7XG4gICAgICAgICAgICB9KS5jYXRjaChmdW5jdGlvbiAoZXJyKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGV4cG9ydEFFU0tleTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZGF0YSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlLmV4cG9ydEtleShcbiAgICAgICAgICAgICAgICBcImp3a1wiLFxuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5XG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24gKGtleWRhdGEpIHtcbiAgICAgICAgICAgICAgICBsZXQganNvblN0cmluZyA9IEpTT04uc3RyaW5naWZ5KGtleWRhdGEpO1xuICAgICAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRLZXkgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoanNvblN0cmluZyk7XG4gICAgICAgICAgICAgICAgQVBQLnVwbG9hZEZpbGUoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgLmNhdGNoKGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDogJywgZXJyb3IpO1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycm9yKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICB9LFxuICAgIGRldGVjdEJyb3dzZXJDb25maWcgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgaWYgKHdpbmRvdy5jcnlwdG8gJiYgIXdpbmRvdy5jcnlwdG8uc3VidGxlICYmIHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZSA9IHdpbmRvdy5jcnlwdG8ud2Via2l0U3VidGxlO1xuICAgICAgICB9XG4gICAgICAgIGlmICghd2luZG93LmNyeXB0byB8fCAhd2luZG93LmNyeXB0by5zdWJ0bGUpIHtcbiAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCdCxYLEhWQ6ICcsIFNFVFRJTkdTLnRleHQucG9wdXAuY3J5cHRvQXBpTG9hZEVycm9yKTtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihTRVRUSU5HUy50ZXh0LnBvcHVwLmNyeXB0b0FwaUxvYWRFcnJvcik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGVuY3J5cHRSU0E6IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZW5jcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGVuY3J5cHRBRVM6IGZ1bmN0aW9uIChmaWxlQnl0ZXNBcnJheSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBhcnJheXNDb3VudCA9IDEyO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWID0gd2luZG93LmNyeXB0by5nZXRSYW5kb21WYWx1ZXMobmV3IFVpbnQ4QXJyYXkoYXJyYXlzQ291bnQpKTtcbiAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZW5jcnlwdChcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICBpdjogQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJVixcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSxcbiAgICAgICAgICAgIGZpbGVCeXRlc0FycmF5XG4gICAgICAgICkudGhlbihmdW5jdGlvbiAoZW5jcnlwdGVkKSB7XG4gICAgICAgICAgICBsZXQgYnl0ZXNDb252ZXJ0ZWRUb0Jhc2U2NFN0cmluZyA9IGJhc2U2NGpzLmZyb21CeXRlQXJyYXkobmV3IFVpbnQ4QXJyYXkoZW5jcnlwdGVkKSk7XG4gICAgICAgICAgICBsZXQgZW5jcnlwdGVkSVYgPSBDUllQVE9fRU5HSU5FLmVuY3J5cHRSU0EoYmFzZTY0anMuZnJvbUJ5dGVBcnJheShDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWKSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5leHBvcnRBRVNLZXkoZmlsZU5hbWUsIGZpbGVUeXBlLCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRJVik7XG4gICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyKTtcbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZGV0ZWN0QnJvd3NlckNvbmZpZygpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXR1cEFqYXhIZWFkZXIoKTtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvID0gbmV3IEpTRW5jcnlwdCgpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5sb2FkUHVibGljS2V5KCk7XG4gICAgfVxufTtcblxuY29uc3QgQVBQID0ge1xuICAgIGNvbmZpZzoge1xuICAgICAgICBjcmVhdGVGb3JtT2JqZWN0cyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgaW5wdXQgPSAnPGlucHV0IHR5cGU9XCJmaWxlXCIgY2xhc3M9XCJlbmNyeXB0LWZvcm1fX2ZpbGVcIj4nO1xuICAgICAgICAgICAgY29uc3QgdXBsb2FkQnV0dG9uID0gXG4gICAgICAgICAgICAgICAgYDxwIGNsYXNzPVwibG9hZGVyXCI+UHJvc3rEmSBjemVrYcSHLi4uPC9wPjxkaXYgY2xhc3M9XCJidG4td3JhcHBlciBidG4td3JhcHBlci0tdXBsb2FkXCI+XG4gICAgICAgICAgICAgICAgICAgIDxidXR0b24gdHlwZT1cImJ1dHRvblwiIGNsYXNzPVwiYnRuIGJ0bi0tdXBsb2FkLWZpbGVcIj4ke1NFVFRJTkdTLnRleHQuaHRtbC51cGxvYWRCdXR0b25UZXh0fTwvYnV0dG9uPlxuICAgICAgICAgICAgICAgIDwvZGl2PmA7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IFtpbnB1dCwgdXBsb2FkQnV0dG9uXTtcbiAgICAgICAgICAgIHJldHVybiBlbGVtZW50cztcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZW5kRm9ybSA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgY29uc3QgZWxlbWVudHMgPSBBUFAuY29uZmlnLmNyZWF0ZUZvcm1PYmplY3RzKCk7XG4gICAgICAgICAgICBjb25zdCBmb3JtID0gJCgnLmVuY3J5cHQtZm9ybScpO1xuICAgICAgICAgICAgZWxlbWVudHMuZm9yRWFjaChlbGVtZW50ID0+IHtcbiAgICAgICAgICAgICAgICBmb3JtLmFwcGVuZChlbGVtZW50KTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kVUlBY3Rpb25zOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICAkKCcubG9hZGVyJykuY3NzKCdkaXNwbGF5JywgJ2Jsb2NrJyk7XG4gICAgICAgICAgICAgICAgdmFyIGZpbGUgPSBBUFAuZ2V0Rm9ybUZpbGUoKTtcbiAgICAgICAgICAgICAgICBpZiAoIWZpbGUpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC5maWxlTm90TG9hZGVkKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBBUFAuZW5jcnlwdEFuZFVwbG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAkKCcuZW5jcnlwdC1mb3JtX19maWxlJykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBpZiAoJCh0aGlzKS52YWwoKSAhPT0gJycpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5jb25maWcuZ2VuZXJhdGVBRVNLZXkoKTtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5hZGRDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXInKS5jc3MoJ2Rpc3BsYXknLCAnZmxleCcpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ2ZpbGUtYWRkZWQnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyJykuY3NzKCdkaXNwbGF5JywgJ25vbmUnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZ2V0Rm9ybUZpbGU6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgbGV0IGZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZW5jcnlwdC1mb3JtX19maWxlJykuZmlsZXNbMF07XG4gICAgICAgIHJldHVybiBmaWxlO1xuICAgIH0sXG4gICAgZW5jcnlwdEFuZFVwbG9hZDogZnVuY3Rpb24gKGZpbGUpIHtcblxuICAgICAgICBjb25zdCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIub25sb2FkID0gZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGZpbGVCeXRlc0FycmF5ID0gbmV3IFVpbnQ4QXJyYXkocmVhZGVyLnJlc3VsdCk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmVuY3J5cHRBRVMoZmlsZUJ5dGVzQXJyYXksIGZpbGUubmFtZSwgZmlsZS50eXBlKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9uZXJyb3IgPSBmdW5jdGlvbiAoZXJyb3IpIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKCdCxYLEhWQ6ICcsIGVycm9yKTtcbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLm9ucHJvZ3Jlc3MgPSBmdW5jdGlvbiAoZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCgoZGF0YS5sb2FkZWQgLyBkYXRhLnRvdGFsKSAqIDEwMCksIDEwKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc0FycmF5QnVmZmVyKGZpbGUpO1xuICAgIH0sXG4gICAgdXBsb2FkRmlsZTogZnVuY3Rpb24gKGZpbGVOYW1lLCBmaWxlVHlwZSwgZmlsZUluQmFzZTY0U3RyaW5nLCBlbmNyeXB0ZWRLZXksIGVuY3J5cHRlZElWKSB7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAvLyB4aHJGaWVsZHM6IHtcbiAgICAgICAgICAgIC8vICAgICBvbnByb2dyZXNzOiBmdW5jdGlvbiAoZSkge1xuICAgICAgICAgICAgLy8gICAgICAgICBpZiAoZS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgICAgICBjb25zb2xlLmxvZyhlLmxvYWRlZCAvIGUudG90YWwgKiAxMDAgKyAnJScpO1xuICAgICAgICAgICAgLy8gICAgICAgICB9XG4gICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgLy8gfSxcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogXCJzYXZlRmlsZVwiLFxuICAgICAgICAgICAgeGhyOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIHhociA9ICQuYWpheFNldHRpbmdzLnhocigpO1xuICAgICAgICAgICAgICAgIHhoci51cGxvYWQub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKE1hdGguZmxvb3IoZS5sb2FkZWQgLyBlLnRvdGFsICogMTAwKSArICclJyk7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICByZXR1cm4geGhyO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGRhdGE6IHtcbiAgICAgICAgICAgICAgICBcImZpbGVOYW1lXCI6IGZpbGVOYW1lLFxuICAgICAgICAgICAgICAgIFwiZmlsZVR5cGVcIjogZmlsZVR5cGUsXG4gICAgICAgICAgICAgICAgXCJmaWxlRGF0YVwiOiBmaWxlSW5CYXNlNjRTdHJpbmcsXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRLZXlcIjogZW5jcnlwdGVkS2V5LFxuICAgICAgICAgICAgICAgIFwiZW5jcnlwdGVkSVZcIjogZW5jcnlwdGVkSVZcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgJCgnLmxvYWRlcicpLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydChyZXNwb25zZS50eXBlLCByZXNwb25zZS50aXRsZSwgcmVzcG9uc2UudGV4dCk7XG4gICAgICAgICAgICAgICAgJCgnLmJ0bi0tdXBsb2FkLWZpbGUnKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIGxldCByZWZyZXNoQnRuID0gJCgnPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtYW5vdGhlci1maWxlXCI+T2TFm3dpZcW8IHN0cm9uxJk8L2J1dHRvbj4nKS5jbGljayhmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgbG9jYXRpb24ucmVsb2FkKCk7ICAgICAgICAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgJCgnLmJ0bi13cmFwcGVyLS11cGxvYWQnKS5hcHBlbmQocmVmcmVzaEJ0bik7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uICh4aHIsIGFqYXhPcHRpb25zLCB0aHJvd25FcnJvcikge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnJywgeGhyLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBDUllQVE9fRU5HSU5FLmluaXQoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5hcHBlbmRGb3JtKCk7XG4gICAgICAgIEFQUC5jb25maWcuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGluaXRFbmdpbmUgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBicm93c2VyRGV0ZWN0b3IgZnJvbSAnLi9saWIvYnJvd3Nlci1kZXRlY3QnO1xuaW1wb3J0IGNyeXB0b0VuZ2luZSBmcm9tICcuL2xpYi91cGxvYWQtcGFnZSc7XG5pbXBvcnQgcGFuZWxQYWdlIGZyb20gJy4vbGliL3BhbmVsLXBhZ2UnO1xuaW1wb3J0IGRlY3J5cHRQYWdlIGZyb20gJy4vbGliL2RlY3J5cHQtcGFnZSc7XG5cbmRvY3VtZW50LmFkZEV2ZW50TGlzdGVuZXIoXCJET01Db250ZW50TG9hZGVkXCIsIGZ1bmN0aW9uKCkge1xuICAgIGJyb3dzZXJEZXRlY3Rvci5kZXRlY3QoKTtcbiAgICBcbiAgICBpZiAoJCgnLmVuY3J5cHQtZm9ybScpLmxlbmd0aCkge1xuICAgICAgICBjcnlwdG9FbmdpbmUuaW5pdEVuZ2luZSgpO1xuICAgIH1cblxuICAgIGlmKCQoJy5maWxlLWxpc3Qtd3JhcHBlcicpLmxlbmd0aCkge1xuICAgICAgICBwYW5lbFBhZ2UuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cblxuICAgIGlmKCQoJy5kZWNyeXB0LWZpbGVzJykubGVuZ3RoKSB7XG4gICAgICAgIGRlY3J5cHRQYWdlLmJpbmRVSUFjdGlvbnMoKTtcbiAgICB9XG59KTsiXX0=
