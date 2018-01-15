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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJhcHAvc2NyaXB0cy9saWIvYWxlcnQtYm94LmpzIiwiYXBwL3NjcmlwdHMvbGliL2Jyb3dzZXItZGV0ZWN0LmpzIiwiYXBwL3NjcmlwdHMvbGliL2RlY3J5cHQtcGFnZS5qcyIsImFwcC9zY3JpcHRzL2xpYi9wYW5lbC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbGliL3VwbG9hZC1wYWdlLmpzIiwiYXBwL3NjcmlwdHMvbWFpbi5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTs7O0FDQUEsSUFBSSxRQUFRO0FBQ1IsWUFBUTtBQUNKLGlCQUFVO0FBQ04sbUJBQVEsSUFERjtBQUVOLHFCQUFVLElBRko7QUFHTixxQkFBVTtBQUhKO0FBRE4sS0FEQTtBQVFSLGVBQVcsbUJBQVUsUUFBVixFQUFvQixLQUFwQixFQUEyQixJQUEzQixFQUFpQztBQUN4QyxZQUFJLFNBQVMsRUFBRSxtQkFBRixDQUFiO0FBQUEsWUFDSSxXQUFXLEVBQUUscUJBQUYsQ0FEZjtBQUFBLFlBRUksWUFBWSxDQUZoQjtBQUdBLFlBQUksYUFBYSxPQUFqQixFQUEwQjtBQUN0Qix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLEtBQWpDO0FBQ0gsU0FGRCxNQUVPLElBQUksYUFBYSxTQUFqQixFQUE0QjtBQUMvQix3QkFBWSxNQUFNLE1BQU4sQ0FBYSxPQUFiLENBQXFCLE9BQWpDO0FBQ0gsU0FGTSxNQUVBO0FBQ0gsd0JBQVksTUFBTSxNQUFOLENBQWEsT0FBYixDQUFxQixPQUFqQztBQUNIO0FBQ0QsZUFBTyxJQUFQLENBQVksS0FBWjtBQUNBLGlCQUFTLElBQVQsQ0FBYyxJQUFkO0FBQ0EsVUFBRSxZQUFGLEVBQWdCLFFBQWhCLENBQXlCLFFBQXpCLEVBQW1DLFFBQW5DLENBQTRDLE1BQTVDLEVBQW9ELEtBQXBELENBQTBELFNBQTFELEVBQXFFLEtBQXJFLENBQTJFLFVBQVUsSUFBVixFQUFnQjtB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LCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsInZhciBQT1BVUCA9IHtcbiAgICBjb25maWc6IHtcbiAgICAgICAgbXNnVGltZSA6IHtcbiAgICAgICAgICAgIGVycm9yIDogNDAwMCxcbiAgICAgICAgICAgIHdhcm5pbmcgOiAzMjAwLFxuICAgICAgICAgICAgc3VjY2VzcyA6IDI1MDBcbiAgICAgICAgfVxuICAgIH0sXG4gICAgc2hvd0FsZXJ0OiBmdW5jdGlvbiAobXNnQ2xhc3MsIHRpdGxlLCB0ZXh0KSB7XG4gICAgICAgIHZhciAkdGl0bGUgPSAkKCcuYWxlcnQtYm94X190aXRsZScpLFxuICAgICAgICAgICAgJG1lc3NhZ2UgPSAkKCcuYWxlcnQtYm94X19tZXNzYWdlJyksXG4gICAgICAgICAgICBkZWxheVRpbWUgPSAwO1xuICAgICAgICBpZiAobXNnQ2xhc3MgPT09ICdlcnJvcicpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLmVycm9yO1xuICAgICAgICB9IGVsc2UgaWYgKG1zZ0NsYXNzID09PSAnd2FybmluZycpIHtcbiAgICAgICAgICAgIGRlbGF5VGltZSA9IFBPUFVQLmNvbmZpZy5tc2dUaW1lLndhcm5pbmc7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBkZWxheVRpbWUgPSBQT1BVUC5jb25maWcubXNnVGltZS5zdWNjZXNzO1xuICAgICAgICB9XG4gICAgICAgICR0aXRsZS5odG1sKHRpdGxlKTtcbiAgICAgICAgJG1lc3NhZ2UuaHRtbCh0ZXh0KTtcbiAgICAgICAgJCgnLmFsZXJ0LWJveCcpLmFkZENsYXNzKG1zZ0NsYXNzKS5hZGRDbGFzcygnc2hvdycpLmRlbGF5KGRlbGF5VGltZSkucXVldWUoZnVuY3Rpb24gKG5leHQpIHtcbiAgICAgICAgICAgICQodGhpcykucmVtb3ZlQ2xhc3MoJ3Nob3cnKS5yZW1vdmVDbGFzcyhtc2dDbGFzcyk7XG4gICAgICAgICAgICAkdGl0bGUuaHRtbCgnJyk7XG4gICAgICAgICAgICAkbWVzc2FnZS5odG1sKCcnKTtcbiAgICAgICAgICAgIG5leHQoKTtcbiAgICAgICAgfSk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgc2hvd0FsZXJ0IDogUE9QVVAuc2hvd0FsZXJ0XG59IiwiY29uc3QgU0VUVElOR1MgPSB7XG4gICAgd3JhcHBlclNlbGVjdG9yIDogJy5tYWluLXdyYXBwZXInLFxuICAgIHRleHQgOiB7XG4gICAgICAgIGh0bWwgOiB7XG4gICAgICAgICAgICBkZXRlY3RFcnJvck1zZyA6ICc8ZGl2PjxoMiBjbGFzcz1cImRldGVjdC1icm93c2VyLXRleHRcIj5TeXN0ZW0gc3p5ZnJ1asSFY3kgb2JlY25pZSBkemlhxYJhIDxzcGFuIGNsYXNzPVwiaW1wb3J0YW50XCI+dHlsa288L3NwYW4+IG5hIHByemVnbMSFZGFya2FjaDo8YnI+R29vZ2xlIENocm9tZSBvcmF6IE1vemlsbGEgRmlyZWZveDwvaDI+PC9kaXY+J1xuICAgICAgICB9XG4gICAgfVxufTtcblxuY29uc3QgZGV0ZWN0b3IgPSB7XG4gICAgZGV0ZWN0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIGxldCBpc0Nocm9taXVtID0gd2luZG93LmNocm9tZSxcbiAgICAgICAgICAgIHdpbk5hdiA9IHdpbmRvdy5uYXZpZ2F0b3IsXG4gICAgICAgICAgICB2ZW5kb3JOYW1lID0gd2luTmF2LnZlbmRvcixcbiAgICAgICAgICAgIGlzT3BlcmEgPSB3aW5OYXYudXNlckFnZW50LmluZGV4T2YoJ09QUicpID4gLTEsXG4gICAgICAgICAgICBpc0lFZWRnZSA9IHdpbk5hdi51c2VyQWdlbnQuaW5kZXhPZignRWRnZScpID4gLTEsXG4gICAgICAgICAgICBpc0lPU0Nocm9tZSA9IHdpbk5hdi51c2VyQWdlbnQubWF0Y2goJ0NyaU9TJyksXG4gICAgICAgICAgICBpc0ZpcmVmb3ggPSBuYXZpZ2F0b3IudXNlckFnZW50LnRvTG93ZXJDYXNlKCkuaW5kZXhPZignZmlyZWZveCcpID4gLTEsXG4gICAgICAgICAgICBpc01vYmlsZURldmljZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHJldHVybiAodHlwZW9mIHdpbmRvdy5vcmllbnRhdGlvbiAhPT0gJ3VuZGVmaW5lZCcpIHx8IChuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ0lFTW9iaWxlJykgIT09IC0xKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgaWYgKGlzQ2hyb21pdW0gIT09IG51bGwgJiYgaXNDaHJvbWl1bSAhPT0gdW5kZWZpbmVkICYmIHZlbmRvck5hbWUgPT09ICdHb29nbGUgSW5jLicgJiYgaXNPcGVyYSA9PSBmYWxzZSAmJiBpc0lFZWRnZSA9PSBmYWxzZSkge1xuICAgICAgICAgICAgXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAobmF2aWdhdG9yLnVzZXJBZ2VudC50b0xvd2VyQ2FzZSgpLmluZGV4T2YoJ2ZpcmVmb3gnKSA8PSAtMSkge1xuICAgICAgICAgICAgICAgIGRldGVjdG9yLmRpc3BsYXlFcnJvck1zZygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9ICAgICAgICBcbiAgICB9LFxuICAgIGRpc3BsYXlFcnJvck1zZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAkKFNFVFRJTkdTLndyYXBwZXJTZWxlY3RvcikuaHRtbChTRVRUSU5HUy50ZXh0Lmh0bWwuZGV0ZWN0RXJyb3JNc2cpO1xuICAgIH0sXG4gICAgaW5pdCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBkZXRlY3Rvci5kZXRlY3QoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBkZXRlY3QgOiBkZXRlY3Rvci5pbml0XG59IiwiaW1wb3J0IHBvcHVwIGZyb20gJy4vYWxlcnQtYm94JztcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIGZpbGVOYW1lTm90Q2hhbmdlZCA6ICdOaWUgem1pZW5pb25hJyxcbiAgICAgICAgICAgIGZpbGVOYW1lTm90QXZhaWxhYmxlIDogJ25pZSBkb3N0xJlwbmEnXG4gICAgICAgIH0sXG4gICAgICAgIHBvcHVwIDoge1xuICAgICAgICAgICAgbG9hZFByaXZhdGVLZXkgOiAnV2N6eXRhbm8ga2x1Y3ogcHJ5d2F0bnkhJyxcbiAgICAgICAgICAgIGVycm9yTG9hZFByaXZhdGVLZXkgOiAnTmllIG1vxbxuYSB3Y3p5dGHEh8Kga2x1Y3phIHByeXdhdG5lZ28hJyxcbiAgICAgICAgICAgIHdyb25nRmlsZUtleSA6ICdaxYJ5IHBsaWsgXCJmaWxlX2tleVwiICEnLFxuICAgICAgICAgICAgd3JvbmdJVkZpbGUgOiAnWsWCeSBwbGlrIFwiZmlsZV9pdlwiICEnLFxuICAgICAgICAgICAgZmlsZUVuY3J5cHRlZCA6ICdPZHN6eWZyb3dhbm8gcGxpayEnLFxuICAgICAgICB9XG4gICAgfVxufTtcblxuY29uc3QgQ1JZUFRPX0VOR0lORSA9IHtcbiAgICBwYXNzQ3J5cHRvOiBudWxsLFxuICAgIHByaXZhdGVLZXlMb2FkZWQ6IGZhbHNlLFxuICAgIGFlc0tleTogbnVsbCxcbiAgICBnZW5lcmF0ZWRJVjogbnVsbCxcbiAgICBjb25maWc6IHtcbiAgICAgICAgc2V0UHJpdmF0ZUtleTogZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgbGV0IGZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGVjcnlwdC1maWxlc19fcHJpdmF0ZS1rZXknKS5maWxlc1swXTtcbiAgICAgICAgICAgIGlmIChmaWxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZmlsZSwgJ1VURi04Jyk7XG4gICAgICAgICAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvLnNldFByaXZhdGVLZXkoZXZ0LnRhcmdldC5yZXN1bHQpO1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLnByaXZhdGVLZXlMb2FkZWQgPSB0cnVlO1xuICAgICAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ3N1Y2Nlc3MnLCAnU3VrY2VzOicsIFNFVFRJTkdTLnRleHQucG9wdXAubG9hZFByaXZhdGVLZXkpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChldnQpIHtcbiAgICAgICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6ICcsIFNFVFRJTkdTLnRleHQucG9wdXAuZXJyb3JMb2FkUHJpdmF0ZUtleSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbXBvcnRBRVNLZXk6IGZ1bmN0aW9uKGRhdGEsIGVuY3J5cHRlZEZpbGVJbkJhc2U2NCwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5pbXBvcnRLZXkoXG4gICAgICAgICAgICAgICAgXCJqd2tcIixcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGt0eTogZGF0YS5rdHksXG4gICAgICAgICAgICAgICAgICAgIGs6IGRhdGEuayxcbiAgICAgICAgICAgICAgICAgICAgYWxnOiBkYXRhLmFsZyxcbiAgICAgICAgICAgICAgICAgICAgZXh0OiB0cnVlLFxuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBuYW1lOiBcIkFFUy1HQ01cIixcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGZhbHNlLFxuICAgICAgICAgICAgICAgIFtcImVuY3J5cHRcIiwgXCJkZWNyeXB0XCJdXG4gICAgICAgICAgICApLnRoZW4oZnVuY3Rpb24oa2V5KXtcbiAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmFlc0tleSA9IGtleTtcbiAgICAgICAgICAgICAgICBsZXQgZW5jcnlwdGVkQnl0ZXMgPSBiYXNlNjRqcy50b0J5dGVBcnJheShlbmNyeXB0ZWRGaWxlSW5CYXNlNjQpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlRGF0YSA9IG5ldyBVaW50OEFycmF5KGVuY3J5cHRlZEJ5dGVzKTtcbiAgICAgICAgICAgICAgICBBUFAubG9hZElWRmlsZShmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uKGVycil7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC53cm9uZ0ZpbGVLZXkpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgfSxcbiAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5wYXNzQ3J5cHRvID0gbmV3IEpTRW5jcnlwdCgpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5zZXRQcml2YXRlS2V5KCk7XG4gICAgfSxcbiAgICBkZWNyeXB0UlNBOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHJldHVybiBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8uZGVjcnlwdChkYXRhKTtcbiAgICB9LFxuICAgIGRlY3J5cHRBRVM6IGZ1bmN0aW9uKGRhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5kZWNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZGF0YVxuICAgICAgICApLnRoZW4oZnVuY3Rpb24oZGVjcnlwdGVkKXtcbiAgICAgICAgICAgICQoJy5sb2FkZXInKS5yZW1vdmUoKTtcbiAgICAgICAgICAgIEFQUC5zYXZlRmlsZShuZXcgVWludDhBcnJheShkZWNyeXB0ZWQpLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJ1N1a2NlczonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLmZpbGVFbmNyeXB0ZWQpO1xuICAgICAgICB9KS5jYXRjaChmdW5jdGlvbihlcnIpe1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC53cm9uZ0ZpbGVLZXkpO1xuICAgICAgICB9KTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgbG9hZGVkRmlsZXM6IDAsXG4gICAgY29uZmlnOiB7XG4gICAgICAgIHNldHVwQWpheEhlYWRlciA6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJC5hamF4U2V0dXAoe1xuICAgICAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAgICAgJ1gtQ1NSRi1UT0tFTic6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgYmluZERlY3J5cHRGaWxlRXZlbnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgIGNvbnN0ICRmaWVsZCA9ICQoJy5kZWNyeXB0LWJ0bicpO1xuICAgICAgICAgICAgJGZpZWxkLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmKCRmaWVsZC5oYXNDbGFzcygnYmxvY2tlZCcpKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJCgnLmxvYWRlcicpLmNzcygnZGlzcGxheScsICdibG9jaycpO1xuICAgICAgICAgICAgICAgIGxldCBmaWxlID0gQVBQLmdldERvd25sb2FkZWRGaWxlKCk7XG4gICAgICAgICAgICAgICAgQVBQLmRlY3J5cHRBbmREb3dubG9hZChmaWxlKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgICAgICBiaW5kTG9hZEZpbGVzRXZlbnRzOiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fcHJpdmF0ZS1rZXknKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldFByaXZhdGVLZXkoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWtleScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgQVBQLmxvYWRlZEZpbGVzKys7XG4gICAgICAgICAgICAgICAgQVBQLmNoZWNrTG9hZGVkRmlsZXNDb3VudCgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAkKCcuYWRkaXRpb25hbC1maWxlcy13cmFwcGVyX19maWxlLWl2JykuY2hhbmdlKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICBBUFAubG9hZGVkRmlsZXMrKztcbiAgICAgICAgICAgICAgICBBUFAuY2hlY2tMb2FkZWRGaWxlc0NvdW50KCk7XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICB9LFxuICAgICAgICBiaW5kRGVjcnlwdEZpbGVOYW1lRXZlbnQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZScpLmNoYW5nZShmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQodGhpcykudmFsKCkgIT09ICcnKSB7XG4gICAgICAgICAgICAgICAgICAgIGxldCB1cGxvYWRlZEZpbGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlJykuZmlsZXNbMF07XG4gICAgICAgICAgICAgICAgICAgIGxldCBmaWxlTmFtZSA9IHVwbG9hZGVkRmlsZS5uYW1lO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmNvZGVkUGFydE5hbWVMZW5ndGggPSA4O1xuICAgICAgICAgICAgICAgICAgICBsZXQgdG1wRmlsZU5hbWUgPSBmaWxlTmFtZS5zdWJzdHIoMCxmaWxlTmFtZS5sZW5ndGggLSBlbmNvZGVkUGFydE5hbWVMZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICBsZXQgZmluYWxGaWxlTmFtZSA9IHRtcEZpbGVOYW1lLnN1YnN0cigwLCB0bXBGaWxlTmFtZS5sZW5ndGgpO1xuICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiAnZGVjcnlwdEZpbGVOYW1lJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhOiB7IFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVuY3J5cHRlZEZpbGVOYW1lOiBmaW5hbEZpbGVOYW1lLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdfdG9rZW4nIDogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgLmRvbmUoZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19sYWJlbCcpLmFkZENsYXNzKCdsYWJlbC0tYmx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHJlc3BvbnNlLm9yaWdpbmFsRmlsZU5hbWUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS5odG1sKHJlc3BvbnNlLm9yaWdpbmFsRmlsZU5hbWUpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19oaW50JykuYWRkQ2xhc3MoJ2FjdGl2ZScpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS5odG1sKFNFVFRJTkdTLnRleHQuaHRtbC5maWxlTmFtZU5vdENoYW5nZWQpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChmdW5jdGlvbihyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ2Vycm9yJyk7XG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIC5hbHdheXMoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcImNvbXBsZXRlXCIpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICQoJy5kZWNyeXB0LWZpbGVzX19sYWJlbCcpLnJlbW92ZUNsYXNzKCdsYWJlbC0tYmx1ZScpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuZGVjcnlwdC1maWxlc19faGludCcpLnJlbW92ZUNsYXNzKCdhY3RpdmUnKTtcbiAgICAgICAgICAgICAgICAgICAgJCgnLmRlY3J5cHQtZmlsZXNfX21haW4tZmlsZS1vcmlnaW5hbC1uYW1lJykuaHRtbChTRVRUSU5HUy50ZXh0Lmh0bWwuZmlsZU5hbWVOb3RBdmFpbGFibGUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBjaGVja0xvYWRlZEZpbGVzQ291bnQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgaWYoQVBQLmxvYWRlZEZpbGVzID49IDQpIHtcbiAgICAgICAgICAgICQoJy5kZWNyeXB0LWJ0bicpLnJlbW92ZUNsYXNzKCdibG9ja2VkJyk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGdldERvd25sb2FkZWRGaWxlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgcmV0dXJuIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUnKS5maWxlc1swXTtcbiAgICB9LFxuICAgIGxvYWRJVkZpbGU6IGZ1bmN0aW9uIChmaWxlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBlbmNyeXB0ZWRGaWxlID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignLmFkZGl0aW9uYWwtZmlsZXMtd3JhcHBlcl9fZmlsZS1pdicpLmZpbGVzWzBdO1xuICAgICAgICBsZXQgcmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoZW5jcnlwdGVkRmlsZSwgJ3V0Zi04Jyk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRGaWxlID0gcmVhZGVyLnJlc3VsdDtcbiAgICAgICAgICAgIGxldCBiYXNlNjRTdHJpbmcgPSBDUllQVE9fRU5HSU5FLmRlY3J5cHRSU0EoZW5jcnlwdGVkRmlsZSk7XG4gICAgICAgICAgICBsZXQgaXZLZXkgPSBiYXNlNjRqcy50b0J5dGVBcnJheShiYXNlNjRTdHJpbmcpO1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5nZW5lcmF0ZWRJViA9IGl2S2V5O1xuICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5kZWNyeXB0QUVTKGZpbGVEYXRhLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICdCxYLEhWQ6JywgU0VUVElOR1MudGV4dC5wb3B1cC53cm9uZ0lWRmlsZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGxvYWRLZXlGaWxlOiBmdW5jdGlvbiAoZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSkge1xuICAgICAgICBsZXQgZW5jcnlwdGVkRmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5hZGRpdGlvbmFsLWZpbGVzLXdyYXBwZXJfX2ZpbGUta2V5JykuZmlsZXNbMF07XG4gICAgICAgIGxldCByZWFkZXIgPSBuZXcgRmlsZVJlYWRlcigpO1xuICAgICAgICByZWFkZXIucmVhZEFzVGV4dChlbmNyeXB0ZWRGaWxlLCAndXRmLTgnKTtcbiAgICAgICAgcmVhZGVyLm9ubG9hZCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgbGV0IGpzb25FbmNyeXB0ZWQgPSByZWFkZXIucmVzdWx0O1xuICAgICAgICAgICAgbGV0IGRlY3J5cHRlZEZpbGUgPSBDUllQVE9fRU5HSU5FLmRlY3J5cHRSU0EoanNvbkVuY3J5cHRlZCk7XG4gICAgICAgICAgICBsZXQgZmlsZUtleSA9IEpTT04ucGFyc2UoZGVjcnlwdGVkRmlsZSk7XG4gICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5pbXBvcnRBRVNLZXkoZmlsZUtleSwgZmlsZURhdGEsIGZpbGVOYW1lLCBmaWxlVHlwZSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbmVycm9yID0gZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLndyb25nRmlsZUtleSk7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9LFxuICAgIGdldEJsb2I6IGZ1bmN0aW9uKCkge1xuICAgICAgICByZXR1cm4gQmxvYjtcbiAgICB9LFxuICAgIHNhdmVGaWxlOiBmdW5jdGlvbihieXRlRGF0YSwgZmlsZU5hbWUsIGZpbGVUeXBlKSB7XG4gICAgICAgIGxldCBCQiA9IEFQUC5nZXRCbG9iKCk7XG4gICAgICAgIHNhdmVBcyhcbiAgICAgICAgICAgIG5ldyBCQihbYnl0ZURhdGFdLCB7IHR5cGUgOiBmaWxlVHlwZSB9KSxcbiAgICAgICAgICAgIGZpbGVOYW1lXG4gICAgICAgICk7XG4gICAgfSxcbiAgICBkZWNyeXB0QW5kRG93bmxvYWQ6IGZ1bmN0aW9uKGJhc2U2NEZpbGUpIHtcbiAgICAgICAgbGV0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGxldCBmaWxlVHlwZSA9ICQoJy5kZWNyeXB0LWZpbGVzX19tYWluLWZpbGUtdHlwZScpLnZhbCgpO1xuICAgICAgICAgICAgbGV0IGJhc2U2NFN0cmluZyA9IHJlYWRlci5yZXN1bHQ7XG4gICAgICAgICAgICBsZXQgZmlsZU5hbWUgPSAkKCcuZGVjcnlwdC1maWxlc19fbWFpbi1maWxlLW9yaWdpbmFsLW5hbWUnKS50ZXh0KCk7XG4gICAgICAgICAgICBBUFAubG9hZEtleUZpbGUoYmFzZTY0U3RyaW5nLCBmaWxlTmFtZSwgZmlsZVR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0Vycm9yOiAnLCBlcnJvcik7XG4gICAgICAgIH07XG4gICAgICAgIHJlYWRlci5vbnByb2dyZXNzID0gZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgaWYgKGRhdGEubGVuZ3RoQ29tcHV0YWJsZSkge1xuICAgICAgICAgICAgICAgIGxldCBwcm9ncmVzcyA9IHBhcnNlSW50KCAoKGRhdGEubG9hZGVkIC8gZGF0YS50b3RhbCkgKiAxMDApLCAxMCApO1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHByb2dyZXNzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICAgICAgcmVhZGVyLnJlYWRBc1RleHQoYmFzZTY0RmlsZSwgJ3V0Zi04Jyk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmRMb2FkRmlsZXNFdmVudHMoKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kRGVjcnlwdEZpbGVFdmVudCgpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWNyeXB0RmlsZU5hbWVFdmVudCgpO1xuICAgIH1cbn07XG5cbm1vZHVsZS5leHBvcnRzID0ge1xuICAgIGJpbmRVSUFjdGlvbnMgOiBBUFAuaW5pdFxufTtcbiIsImltcG9ydCBwb3B1cCBmcm9tICcuL2FsZXJ0LWJveCc7XG5cbmNvbnN0IFNFVFRJTkdTID0ge1xuICAgIHRleHQgOiB7XG4gICAgICAgIGh0bWwgOiB7XG4gICAgICAgICAgICBkZWxldGVGaWxlIDogJ1xcblxcbkN6eSBuYSBwZXdubyBjaGNlc3ogdXN1bsSFxIcgcGxpaz8nXG4gICAgICAgIH1cbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgc2V0dXBBamF4SGVhZGVyIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgIGhlYWRlcnM6IHtcbiAgICAgICAgICAgICAgICAnWC1DU1JGLVRPS0VOJzogJCgnbWV0YVtuYW1lPVwiY3NyZi10b2tlblwiXScpLmF0dHIoJ2NvbnRlbnQnKVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGRlbGV0ZUZpbGU6IGZ1bmN0aW9uKF9maWxlSWQsIHBhcmVudE5vZGUpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHR5cGU6ICdQT1NUJyxcbiAgICAgICAgICAgIHVybDogJ2RlbGV0ZScsXG4gICAgICAgICAgICBkYXRhOiB7IFxuICAgICAgICAgICAgICAgICdmaWxlSWQnIDogX2ZpbGVJZCxcbiAgICAgICAgICAgICAgICAnX3Rva2VuJyA6ICQoJ21ldGFbbmFtZT1cImNzcmYtdG9rZW5cIl0nKS5hdHRyKCdjb250ZW50JylcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzczogZnVuY3Rpb24gKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICBpZihyZXNwb25zZS50eXBlID09PSAnc3VjY2VzcycpIHtcbiAgICAgICAgICAgICAgICAgICAgcGFyZW50Tm9kZS5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOicsIHJlc3BvbnNlLnJlc3BvbnNlVGV4dCk7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coJ0LFgsSFZDonLCByZXNwb25zZS5yZXNwb25zZVRleHQpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuICAgIHNob3dEZWxldGVGaWxlUHJvbXB0OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVJZCwgcGFyZW50Tm9kZSkge1xuICAgICAgICBsZXQgYW5zd2VyID0gY29uZmlybSgnVXN1d2FuaWU6ICcrIGZpbGVOYW1lICsgU0VUVElOR1MudGV4dC5odG1sLmRlbGV0ZUZpbGUpO1xuICAgICAgICBpZihhbnN3ZXIpIHtcbiAgICAgICAgICAgIEFQUC5kZWxldGVGaWxlKGZpbGVJZCwgcGFyZW50Tm9kZSk7XG4gICAgICAgIH1cbiAgICB9LFxuICAgIGNvbmZpZzoge1xuICAgICAgICBiaW5kRGVsZXRlRmlsZUV2ZW50OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGNvbnN0ICRmaWVsZCA9ICQoJy5mYS10cmFzaCcpO1xuICAgICAgICAgICAgJGZpZWxkLmNsaWNrKGZ1bmN0aW9uIChldmVudCkge1xuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVOYW1lID0gJCh0aGlzKS5wYXJlbnRzKCcudG9wLXNlY3Rpb24nKS5maW5kKCcudG9wLXNlY3Rpb25fX25hbWUnKS50ZXh0KCk7XG4gICAgICAgICAgICAgICAgbGV0IGZpbGVJZCA9ICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpLmZpbmQoJy5maWxlLWlkJykudGV4dCgpO1xuICAgICAgICAgICAgICAgIEFQUC5zaG93RGVsZXRlRmlsZVByb21wdChmaWxlTmFtZSxmaWxlSWQsICQodGhpcykucGFyZW50cygnLmZpbGUtd3JhcHBlcicpKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH1cbiAgICB9LFxuICAgIGluaXQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgQVBQLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBBUFAuY29uZmlnLmJpbmREZWxldGVGaWxlRXZlbnQoKTtcbiAgICB9XG59O1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgICBiaW5kVUlBY3Rpb25zIDogQVBQLmluaXRcbn07XG4iLCJpbXBvcnQgcG9wdXAgZnJvbSAnLi9hbGVydC1ib3gnO1xuXG5cInVzZSBzdHJpY3RcIjtcblxuY29uc3QgU0VUVElOR1MgPSB7XG4gICAgdGV4dCA6IHtcbiAgICAgICAgaHRtbCA6IHtcbiAgICAgICAgICAgIHVwbG9hZEJ1dHRvblRleHQgOiAnWmFzenlmcnVqIGkgd3nFm2xpaiBwbGlrJyxcbiAgICAgICAgfSxcbiAgICAgICAgcG9wdXAgOiB7XG4gICAgICAgICAgICBzZWN1cmVLZXlHZW5lcmF0ZWQgOiAnQmV6cGllY3pueSBrbHVjeiB3eWdlbmVyb3dhbnkhJyxcbiAgICAgICAgICAgIGZpbGVOb3RMb2FkZWQgOiAnUGxpayBuaWUgem9zdGHFgiB3Y3p5dGFueSEnLFxuICAgICAgICAgICAgY3J5cHRvQXBpTG9hZEVycm9yIDogJ1R3b2phIHByemVnbMSFZGFya2EgbmllIG9ic8WCdWd1amUgaW50ZXJmZWpzdSBXZWIgQ3J5cHRvZ3JhcGh5IEFQSSEgVGEgc3Ryb25hIG5pZSBixJlkemllIGR6aWHFgmHEhyBwb3ByYXduaWUuJ1xuICAgICAgICB9XG4gICAgfVxufVxuXG5jb25zdCBDUllQVE9fRU5HSU5FID0ge1xuICAgIHBhc3NDcnlwdG86IG51bGwsXG4gICAgYWVzS2V5OiBudWxsLFxuICAgIGdlbmVyYXRlZElWOiBudWxsLFxuICAgIGNvbmZpZzoge1xuICAgICAgICBzZXR1cEFqYXhIZWFkZXIgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICQuYWpheFNldHVwKHtcbiAgICAgICAgICAgICAgICBoZWFkZXJzOiB7XG4gICAgICAgICAgICAgICAgICAgICdYLUNTUkYtVE9LRU4nOiAkKCdtZXRhW25hbWU9XCJjc3JmLXRva2VuXCJdJykuYXR0cignY29udGVudCcpXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGxvYWRQdWJsaWNLZXk6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgICAgIHVybDogJ2dldFB1YktleScsXG4gICAgICAgICAgICAgICAgZGF0YSA6IHtcbiAgICAgICAgICAgICAgICAgICAgJ2ZpbGVOYW1lJyA6ICdyc2FfNDA5Nl9wdWIua2V5J1xuICAgICAgICAgICAgICAgIH0sXG4gICAgICAgICAgICAgICAgZGF0YVR5cGUgOiAnanNvbicsXG4gICAgICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKHJlc3BvbnNlKSB7XG4gICAgICAgICAgICAgICAgICAgIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5zZXRQdWJsaWNLZXkocmVzcG9uc2UpOyBcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5lcnJvcihyZXNwb25zZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdlbmVyYXRlQUVTS2V5OiBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5nZW5lcmF0ZUtleShcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgICAgICBsZW5ndGg6IDEyOCxcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHRydWUsXG4gICAgICAgICAgICAgICAgW1wiZW5jcnlwdFwiLCBcImRlY3J5cHRcIl1cbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXkgPSBrZXk7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdzdWNjZXNzJywgJycsIFNFVFRJTkdTLnRleHQucG9wdXAuc2VjdXJlS2V5R2VuZXJhdGVkKTtcbiAgICAgICAgICAgIH0pLmNhdGNoKGZ1bmN0aW9uIChlcnIpIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmVycm9yKGVycik7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSxcbiAgICAgICAgZXhwb3J0QUVTS2V5OiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBkYXRhLCBlbmNyeXB0ZWRJVikge1xuICAgICAgICAgICAgd2luZG93LmNyeXB0by5zdWJ0bGUuZXhwb3J0S2V5KFxuICAgICAgICAgICAgICAgIFwiandrXCIsXG4gICAgICAgICAgICAgICAgQ1JZUFRPX0VOR0lORS5hZXNLZXlcbiAgICAgICAgICAgICkudGhlbihmdW5jdGlvbiAoa2V5ZGF0YSkge1xuICAgICAgICAgICAgICAgIGxldCBqc29uU3RyaW5nID0gSlNPTi5zdHJpbmdpZnkoa2V5ZGF0YSk7XG4gICAgICAgICAgICAgICAgbGV0IGVuY3J5cHRlZEtleSA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShqc29uU3RyaW5nKTtcbiAgICAgICAgICAgICAgICBBUFAudXBsb2FkRmlsZShmaWxlTmFtZSwgZmlsZVR5cGUsIGRhdGEsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAuY2F0Y2goZnVuY3Rpb24gKGVycm9yKSB7XG4gICAgICAgICAgICAgICAgICAgIHBvcHVwLnNob3dBbGVydCgnZXJyb3InLCAnQsWCxIVkOiAnLCBlcnJvcik7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUuZXJyb3IoZXJyb3IpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICB9LFxuICAgIH0sXG4gICAgZGV0ZWN0QnJvd3NlckNvbmZpZyA6IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAod2luZG93LmNyeXB0byAmJiAhd2luZG93LmNyeXB0by5zdWJ0bGUgJiYgd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGUpIHtcbiAgICAgICAgICAgIHdpbmRvdy5jcnlwdG8uc3VidGxlID0gd2luZG93LmNyeXB0by53ZWJraXRTdWJ0bGU7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCF3aW5kb3cuY3J5cHRvIHx8ICF3aW5kb3cuY3J5cHRvLnN1YnRsZSkge1xuICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsJ0LFgsSFZDogJywgU0VUVElOR1MudGV4dC5wb3B1cC5jcnlwdG9BcGlMb2FkRXJyb3IpO1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFNFVFRJTkdTLnRleHQucG9wdXAuY3J5cHRvQXBpTG9hZEVycm9yKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgIH0sXG4gICAgZW5jcnlwdFJTQTogZnVuY3Rpb24gKGRhdGEpIHtcbiAgICAgICAgcmV0dXJuIENSWVBUT19FTkdJTkUucGFzc0NyeXB0by5lbmNyeXB0KGRhdGEpO1xuICAgIH0sXG4gICAgZW5jcnlwdEFFUzogZnVuY3Rpb24gKGZpbGVCeXRlc0FycmF5LCBmaWxlTmFtZSwgZmlsZVR5cGUpIHtcbiAgICAgICAgbGV0IGFycmF5c0NvdW50ID0gMTI7XG4gICAgICAgIENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYgPSB3aW5kb3cuY3J5cHRvLmdldFJhbmRvbVZhbHVlcyhuZXcgVWludDhBcnJheShhcnJheXNDb3VudCkpO1xuICAgICAgICB3aW5kb3cuY3J5cHRvLnN1YnRsZS5lbmNyeXB0KFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIG5hbWU6IFwiQUVTLUdDTVwiLFxuICAgICAgICAgICAgICAgIGl2OiBDUllQVE9fRU5HSU5FLmdlbmVyYXRlZElWLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuYWVzS2V5LFxuICAgICAgICAgICAgZmlsZUJ5dGVzQXJyYXlcbiAgICAgICAgKS50aGVuKGZ1bmN0aW9uIChlbmNyeXB0ZWQpIHtcbiAgICAgICAgICAgIGxldCBieXRlc0NvbnZlcnRlZFRvQmFzZTY0U3RyaW5nID0gYmFzZTY0anMuZnJvbUJ5dGVBcnJheShuZXcgVWludDhBcnJheShlbmNyeXB0ZWQpKTtcbiAgICAgICAgICAgIGxldCBlbmNyeXB0ZWRJViA9IENSWVBUT19FTkdJTkUuZW5jcnlwdFJTQShiYXNlNjRqcy5mcm9tQnl0ZUFycmF5KENSWVBUT19FTkdJTkUuZ2VuZXJhdGVkSVYpKTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmV4cG9ydEFFU0tleShmaWxlTmFtZSwgZmlsZVR5cGUsIGJ5dGVzQ29udmVydGVkVG9CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZElWKTtcbiAgICAgICAgfSkuY2F0Y2goZnVuY3Rpb24gKGVycikge1xuICAgICAgICAgICAgY29uc29sZS5lcnJvcihlcnIpO1xuICAgICAgICB9KTtcbiAgICB9LFxuICAgIGluaXQ6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgQ1JZUFRPX0VOR0lORS5kZXRlY3RCcm93c2VyQ29uZmlnKCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLnNldHVwQWpheEhlYWRlcigpO1xuICAgICAgICBDUllQVE9fRU5HSU5FLnBhc3NDcnlwdG8gPSBuZXcgSlNFbmNyeXB0KCk7XG4gICAgICAgIENSWVBUT19FTkdJTkUuY29uZmlnLmxvYWRQdWJsaWNLZXkoKTtcbiAgICB9XG59O1xuXG5jb25zdCBBUFAgPSB7XG4gICAgY29uZmlnOiB7XG4gICAgICAgIGNyZWF0ZUZvcm1PYmplY3RzIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBpbnB1dCA9ICc8aW5wdXQgdHlwZT1cImZpbGVcIiBjbGFzcz1cImVuY3J5cHQtZm9ybV9fZmlsZVwiPic7XG4gICAgICAgICAgICBjb25zdCB1cGxvYWRCdXR0b24gPSBcbiAgICAgICAgICAgICAgICBgPHAgY2xhc3M9XCJsb2FkZXJcIj5Qcm9zesSZIGN6ZWthxIcuLi48L3A+PGRpdiBjbGFzcz1cImJ0bi13cmFwcGVyIGJ0bi13cmFwcGVyLS11cGxvYWRcIj5cbiAgICAgICAgICAgICAgICAgICAgPGJ1dHRvbiB0eXBlPVwiYnV0dG9uXCIgY2xhc3M9XCJidG4gYnRuLS11cGxvYWQtZmlsZVwiPiR7U0VUVElOR1MudGV4dC5odG1sLnVwbG9hZEJ1dHRvblRleHR9PC9idXR0b24+XG4gICAgICAgICAgICAgICAgPC9kaXY+YDtcbiAgICAgICAgICAgIGNvbnN0IGVsZW1lbnRzID0gW2lucHV0LCB1cGxvYWRCdXR0b25dO1xuICAgICAgICAgICAgcmV0dXJuIGVsZW1lbnRzO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlbmRGb3JtIDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBjb25zdCBlbGVtZW50cyA9IEFQUC5jb25maWcuY3JlYXRlRm9ybU9iamVjdHMoKTtcbiAgICAgICAgICAgIGNvbnN0IGZvcm0gPSAkKCcuZW5jcnlwdC1mb3JtJyk7XG4gICAgICAgICAgICBlbGVtZW50cy5mb3JFYWNoKGVsZW1lbnQgPT4ge1xuICAgICAgICAgICAgICAgIGZvcm0uYXBwZW5kKGVsZW1lbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGJpbmRVSUFjdGlvbnM6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICQoJy5idG4tLXVwbG9hZC1maWxlJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgICQoJy5sb2FkZXInKS5jc3MoJ2Rpc3BsYXknLCAnYmxvY2snKTtcbiAgICAgICAgICAgICAgICB2YXIgZmlsZSA9IEFQUC5nZXRGb3JtRmlsZSgpO1xuICAgICAgICAgICAgICAgIGlmICghZmlsZSkge1xuICAgICAgICAgICAgICAgICAgICBwb3B1cC5zaG93QWxlcnQoJ2Vycm9yJywgJ0LFgsSFZDonLCBTRVRUSU5HUy50ZXh0LnBvcHVwLmZpbGVOb3RMb2FkZWQpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIEFQUC5lbmNyeXB0QW5kVXBsb2FkKGZpbGUpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgICQoJy5lbmNyeXB0LWZvcm1fX2ZpbGUnKS5jaGFuZ2UoZnVuY3Rpb24gKCkge1xuICAgICAgICAgICAgICAgIGlmICgkKHRoaXMpLnZhbCgpICE9PSAnJykge1xuICAgICAgICAgICAgICAgICAgICBDUllQVE9fRU5HSU5FLmNvbmZpZy5nZW5lcmF0ZUFFU0tleSgpO1xuICAgICAgICAgICAgICAgICAgICAkKHRoaXMpLmFkZENsYXNzKCdmaWxlLWFkZGVkJyk7XG4gICAgICAgICAgICAgICAgICAgICQoJy5idG4td3JhcHBlcicpLmNzcygnZGlzcGxheScsICdmbGV4Jyk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgJCh0aGlzKS5yZW1vdmVDbGFzcygnZmlsZS1hZGRlZCcpO1xuICAgICAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXInKS5jc3MoJ2Rpc3BsYXknLCAnbm9uZScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfSxcbiAgICBnZXRGb3JtRmlsZTogZnVuY3Rpb24gKCkge1xuICAgICAgICBsZXQgZmlsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJy5lbmNyeXB0LWZvcm1fX2ZpbGUnKS5maWxlc1swXTtcbiAgICAgICAgcmV0dXJuIGZpbGU7XG4gICAgfSxcbiAgICBlbmNyeXB0QW5kVXBsb2FkOiBmdW5jdGlvbiAoZmlsZSkge1xuXG4gICAgICAgIGNvbnN0IHJlYWRlciA9IG5ldyBGaWxlUmVhZGVyKCk7XG4gICAgICAgIHJlYWRlci5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICBsZXQgZmlsZUJ5dGVzQXJyYXkgPSBuZXcgVWludDhBcnJheShyZWFkZXIucmVzdWx0KTtcbiAgICAgICAgICAgIENSWVBUT19FTkdJTkUuZW5jcnlwdEFFUyhmaWxlQnl0ZXNBcnJheSwgZmlsZS5uYW1lLCBmaWxlLnR5cGUpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25lcnJvciA9IGZ1bmN0aW9uIChlcnJvcikge1xuICAgICAgICAgICAgY29uc29sZS5sb2coJ0LFgsSFZDogJywgZXJyb3IpO1xuICAgICAgICB9O1xuICAgICAgICByZWFkZXIub25wcm9ncmVzcyA9IGZ1bmN0aW9uIChkYXRhKSB7XG4gICAgICAgICAgICBpZiAoZGF0YS5sZW5ndGhDb21wdXRhYmxlKSB7XG4gICAgICAgICAgICAgICAgbGV0IHByb2dyZXNzID0gcGFyc2VJbnQoKChkYXRhLmxvYWRlZCAvIGRhdGEudG90YWwpICogMTAwKSwgMTApO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgICAgICByZWFkZXIucmVhZEFzQXJyYXlCdWZmZXIoZmlsZSk7XG4gICAgfSxcbiAgICB1cGxvYWRGaWxlOiBmdW5jdGlvbiAoZmlsZU5hbWUsIGZpbGVUeXBlLCBmaWxlSW5CYXNlNjRTdHJpbmcsIGVuY3J5cHRlZEtleSwgZW5jcnlwdGVkSVYpIHtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIC8vIHhockZpZWxkczoge1xuICAgICAgICAgICAgLy8gICAgIG9ucHJvZ3Jlc3M6IGZ1bmN0aW9uIChlKSB7XG4gICAgICAgICAgICAvLyAgICAgICAgIGlmIChlLmxlbmd0aENvbXB1dGFibGUpIHtcbiAgICAgICAgICAgIC8vICAgICAgICAgICAgIGNvbnNvbGUubG9nKGUubG9hZGVkIC8gZS50b3RhbCAqIDEwMCArICclJyk7XG4gICAgICAgICAgICAvLyAgICAgICAgIH1cbiAgICAgICAgICAgIC8vICAgICB9XG4gICAgICAgICAgICAvLyB9LFxuICAgICAgICAgICAgdHlwZTogJ1BPU1QnLFxuICAgICAgICAgICAgdXJsOiBcInNhdmVGaWxlXCIsXG4gICAgICAgICAgICB4aHI6IGZ1bmN0aW9uICgpIHtcbiAgICAgICAgICAgICAgICB2YXIgeGhyID0gJC5hamF4U2V0dGluZ3MueGhyKCk7XG4gICAgICAgICAgICAgICAgeGhyLnVwbG9hZC5vbnByb2dyZXNzID0gZnVuY3Rpb24gKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coTWF0aC5mbG9vcihlLmxvYWRlZCAvIGUudG90YWwgKiAxMDApICsgJyUnKTtcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIHJldHVybiB4aHI7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZGF0YToge1xuICAgICAgICAgICAgICAgIFwiZmlsZU5hbWVcIjogZmlsZU5hbWUsXG4gICAgICAgICAgICAgICAgXCJmaWxlVHlwZVwiOiBmaWxlVHlwZSxcbiAgICAgICAgICAgICAgICBcImZpbGVEYXRhXCI6IGZpbGVJbkJhc2U2NFN0cmluZyxcbiAgICAgICAgICAgICAgICBcImVuY3J5cHRlZEtleVwiOiBlbmNyeXB0ZWRLZXksXG4gICAgICAgICAgICAgICAgXCJlbmNyeXB0ZWRJVlwiOiBlbmNyeXB0ZWRJVlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzOiBmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICAgICAgICAgICAkKCcubG9hZGVyJykucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KHJlc3BvbnNlLnR5cGUsIHJlc3BvbnNlLnRpdGxlLCByZXNwb25zZS50ZXh0KTtcbiAgICAgICAgICAgICAgICAkKCcuYnRuLS11cGxvYWQtZmlsZScpLmNzcygnZGlzcGxheScsICdub25lJyk7XG4gICAgICAgICAgICAgICAgbGV0IHJlZnJlc2hCdG4gPSAkKCc8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBjbGFzcz1cImJ0biBidG4tLXVwbG9hZC1hbm90aGVyLWZpbGVcIj5PZMWbd2llxbwgc3Ryb27EmTwvYnV0dG9uPicpLmNsaWNrKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBsb2NhdGlvbi5yZWxvYWQoKTsgICAgICAgICAgICAgICAgICAgICBcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAkKCcuYnRuLXdyYXBwZXItLXVwbG9hZCcpLmFwcGVuZChyZWZyZXNoQnRuKTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24gKHhociwgYWpheE9wdGlvbnMsIHRocm93bkVycm9yKSB7XG4gICAgICAgICAgICAgICAgcG9wdXAuc2hvd0FsZXJ0KCdlcnJvcicsICcnLCB4aHIucmVzcG9uc2VUZXh0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcbiAgICBpbml0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIENSWVBUT19FTkdJTkUuaW5pdCgpO1xuICAgICAgICBBUFAuY29uZmlnLmFwcGVuZEZvcm0oKTtcbiAgICAgICAgQVBQLmNvbmZpZy5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxufTtcblxubW9kdWxlLmV4cG9ydHMgPSB7XG4gICAgaW5pdEVuZ2luZSA6IEFQUC5pbml0XG59O1xuIiwiaW1wb3J0IGJyb3dzZXJEZXRlY3RvciBmcm9tICcuL2xpYi9icm93c2VyLWRldGVjdCc7XG5pbXBvcnQgY3J5cHRvRW5naW5lIGZyb20gJy4vbGliL3VwbG9hZC1wYWdlJztcbmltcG9ydCBwYW5lbFBhZ2UgZnJvbSAnLi9saWIvcGFuZWwtcGFnZSc7XG5pbXBvcnQgZGVjcnlwdFBhZ2UgZnJvbSAnLi9saWIvZGVjcnlwdC1wYWdlJztcblxuZG9jdW1lbnQuYWRkRXZlbnRMaXN0ZW5lcihcIkRPTUNvbnRlbnRMb2FkZWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgYnJvd3NlckRldGVjdG9yLmRldGVjdCgpO1xuICAgIFxuICAgIGlmICgkKCcuZW5jcnlwdC1mb3JtJykubGVuZ3RoKSB7XG4gICAgICAgIGNyeXB0b0VuZ2luZS5pbml0RW5naW5lKCk7XG4gICAgfVxuXG4gICAgaWYoJCgnLmZpbGUtbGlzdC13cmFwcGVyJykubGVuZ3RoKSB7XG4gICAgICAgIHBhbmVsUGFnZS5iaW5kVUlBY3Rpb25zKCk7XG4gICAgfVxuXG4gICAgaWYoJCgnLmRlY3J5cHQtZmlsZXMnKS5sZW5ndGgpIHtcbiAgICAgICAgZGVjcnlwdFBhZ2UuYmluZFVJQWN0aW9ucygpO1xuICAgIH1cbn0pOyJdfQ==
