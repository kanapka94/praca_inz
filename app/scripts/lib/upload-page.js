import popup from './alert-box';

"use strict";

const SETTINGS = {
    text : {
        html : {
            uploadButtonText : 'Zaszyfruj i wyślij plik',
        },
        popup : {
            secureKeyGenerated : 'Bezpieczny klucz wygenerowany!',
            fileNotLoaded : 'Plik nie został wczytany!',
            cryptoApiLoadError : 'Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.'
        }
    }
}

const CRYPTO_ENGINE = {
    passCrypto: null,
    aesKey: null,
    generatedIV: null,
    config: {
        setupAjaxHeader : function() {
            $.ajaxSetup({
                headers: {
                    'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
                }
            });
        },
        loadPublicKey: function () {
            $.ajax({
                type: 'POST',
                url: 'getPubKey',
                dataType : 'json',
                data : {
                    'fileName' : 'rsa_4096_pub.key'
                },
                success : function(response) {
                    CRYPTO_ENGINE.passCrypto.setPublicKey(response); 
                },
                error : function(response) {
                    console.error(response);
                }
            });
        },
        generateAESKey: function () {
            window.crypto.subtle.generateKey(
                {
                    name: "AES-GCM",
                    length: 128,
                },
                true,
                ["encrypt", "decrypt"]
            ).then(function (key) {
                CRYPTO_ENGINE.aesKey = key;
                popup.showAlert('success', '', SETTINGS.text.popup.secureKeyGenerated);
            }).catch(function (err) {
                console.error(err);
            });
        },
        exportAESKey: function (fileName, fileType, data, encryptedIV) {
            window.crypto.subtle.exportKey(
                "jwk",
                CRYPTO_ENGINE.aesKey
            ).then(function (keydata) {
                let jsonString = JSON.stringify(keydata);
                let encryptedKey = CRYPTO_ENGINE.encryptRSA(jsonString);
                APP.uploadFile(fileName, fileType, data, encryptedKey, encryptedIV);
            })
                .catch(function (error) {
                    popup.showAlert('error', 'Błąd: ', error);
                    console.error(error);
                });
        },
    },
    detectBrowserConfig : function() {
        if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        }
        if (!window.crypto || !window.crypto.subtle) {
            popup.showAlert('error','Błąd: ', SETTINGS.text.popup.cryptoApiLoadError);
            throw new Error(SETTINGS.text.popup.cryptoApiLoadError);
            return;
        }
    },
    encryptRSA: function (data) {
        return CRYPTO_ENGINE.passCrypto.encrypt(data);
    },
    encryptAES: function (fileBytesArray, fileName, fileType) {
        let arraysCount = 12;
        CRYPTO_ENGINE.generatedIV = window.crypto.getRandomValues(new Uint8Array(arraysCount));
        window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: CRYPTO_ENGINE.generatedIV,
            },
            CRYPTO_ENGINE.aesKey,
            fileBytesArray
        ).then(function (encrypted) {
            let bytesConvertedToBase64String = base64js.fromByteArray(new Uint8Array(encrypted));
            let encryptedIV = CRYPTO_ENGINE.encryptRSA(base64js.fromByteArray(CRYPTO_ENGINE.generatedIV));
            CRYPTO_ENGINE.config.exportAESKey(fileName, fileType, bytesConvertedToBase64String, encryptedIV);
        }).catch(function (err) {
            console.error(err);
        });
    },
    init: function () {
        CRYPTO_ENGINE.detectBrowserConfig();
        CRYPTO_ENGINE.config.setupAjaxHeader();
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.loadPublicKey();
    }
};

const APP = {
    config: {
        createFormObjects : function() {
            const input = '<input type="file" class="encrypt-form__file">';
            const uploadButton = 
                `<p class="percent"></p><p class="loader">Proszę czekać...</p><div class="btn-wrapper btn-wrapper--upload">
                    <button type="button" class="btn btn--upload-file">${SETTINGS.text.html.uploadButtonText}</button>
                </div>`;
            const elements = [input, uploadButton];
            return elements;
        },
        appendForm : function() {
            const elements = APP.config.createFormObjects();
            const form = $('.encrypt-form');
            elements.forEach(element => {
                form.append(element);
            });
        },
        bindUIActions: function () {
            $('.btn--upload-file').click(function () {
                $('.loader').css('display', 'block');
                $('.percent').css('display', 'block');
                var file = APP.getFormFile();
                if (!file) {
                    popup.showAlert('error', 'Błąd:', SETTINGS.text.popup.fileNotLoaded);
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
    getFormFile: function () {
        let file = document.querySelector('.encrypt-form__file').files[0];
        return file;
    },
    encryptAndUpload: function (file) {

        const reader = new FileReader();
        reader.onload = function () {
            let fileBytesArray = new Uint8Array(reader.result);
            CRYPTO_ENGINE.encryptAES(fileBytesArray, file.name, file.type);
        };
        reader.onerror = function (error) {
            console.log('Błąd: ', error);
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                let progress = parseInt(((data.loaded / data.total) * 100), 10);
                $('.percent').text('Szyfrowanie pliku: ' + progress);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    uploadFile: function (fileName, fileType, fileInBase64String, encryptedKey, encryptedIV) {
        $.ajax({
            type: 'POST',
            url: "saveFile",
            xhr: function () {
                let xhr = $.ajaxSettings.xhr();
                let uploadResult = 0;
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
            success: function (response) {
                $('.loader').remove();
                $('.percent').remove();
                popup.showAlert(response.type, response.title, response.text);
                $('.btn--upload-file').css('display', 'none');
                let refreshBtn = $('<button type="button" class="btn btn--upload-another-file">Odśwież stronę</button>').click(function() {
                    location.reload();                     
                });
                $('.btn-wrapper--upload').append(refreshBtn);
            },
            error: function (xhr, ajaxOptions, thrownError) {
                popup.showAlert('error', '', xhr.responseText);
            }
        });
    },
    init : function() {
        CRYPTO_ENGINE.init();
        APP.config.appendForm();
        APP.config.bindUIActions();
    }
};

module.exports = {
    initEngine : APP.init
};
