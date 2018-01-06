import popup from './alert-box';

"use strict";

const SETTINGS = {
    uploadButtonText : 'Zaszyfruj i wyślij plik'
}

const CRYPTO_ENGINE = {
    passCrypto: null,
    aesKey: null,
    generatedIV: null,
    config: {
        loadPublicKey: function () {
            $.get('rsa_2048_pub.key', function (data) {
                CRYPTO_ENGINE.passCrypto.setPublicKey(data);
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
                popup.showAlert('success', '', 'Bezpieczny klucz wygenerowany!');
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
                .catch(function (err) {
                    console.error(err);
                });
        },
    },
    detectBrowserConfig : function() {
        if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        }
        if (!window.crypto || !window.crypto.subtle) {
            popup.showAlert('error','Błąd: ',"Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.");
            throw new Error("Twoja przeglądarka nie obsługuje interfejsu Web Cryptography API! Ta strona nie będzie działać poprawnie.");
            return;
        }
    },
    encryptRSA: function (data) {
        return CRYPTO_ENGINE.passCrypto.encrypt(data);
    },
    encryptAES: function (data, fileName, fileType) {
        CRYPTO_ENGINE.generatedIV = window.crypto.getRandomValues(new Uint8Array(12));
        window.crypto.subtle.encrypt(
            {
                name: "AES-GCM",
                iv: CRYPTO_ENGINE.generatedIV,
            },
            CRYPTO_ENGINE.aesKey,
            data
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
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.loadPublicKey();
    }
};

const APP = {
    config: {
        createFormObjects : function() {
            const input = '<input type="file" class="encrypt-form__file">';
            const uploadButton = 
                `<div class="btn-wrapper btn-wrapper--upload">
                    <button type="button" class="btn btn--upload-file">${SETTINGS.uploadButtonText}</button>
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
                console.log('klik!');
                var file = APP.getUploadedFile();
                if (!file) {
                    popup.showAlert('error', 'Błąd:', 'Plik nie został wczytany!');
                    return;
                }
                APP.encryptAndUpload(file);
            });
        },
        bindLoadFileEvent: function () {
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
        bindHideCredentialPasswordEvent: function (password, dottedPassword) {
            const passField = $('.data-wrapper__password-wrapper__password');
            $('#data-wrapper__password-wrapper__show-password').click(function () {
                (passField.text() === password) ? passField.text(dottedPassword) : passField.text(password);
            });
        }
    },
    getUploadedFile: function () {
        var uploadedFile = document.querySelector('.encrypt-form__file').files[0];
        return uploadedFile;
    },
    encryptAndUpload: function (file) {

        const reader = new FileReader();
        reader.onload = function () {
            var bytesArray = new Uint8Array(reader.result);
            CRYPTO_ENGINE.encryptAES(bytesArray, file.name, file.type);
        };
        reader.onerror = function (error) {
            console.log('Error: ', error);
        };
        reader.onprogress = function (data) {
            if (data.lengthComputable) {
                var progress = parseInt(((data.loaded / data.total) * 100), 10);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    uploadFile: function (fileName, fileType, fileInBase64String, encryptedKey, encryptedIV) {
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
            xhr: function () {
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
            success: function (response) {
                popup.showAlert(response.type, response.title, response.text);
                if (response.type === 'success credentials') {
                    $('.file-uploader').css('display', 'none');
                    setTimeout(function () {
                        $('.mainNav__login').addClass('decorated');
                    }, 3000);
                }
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
        APP.config.bindLoadFileEvent();
    }
};

module.exports = {
    initEngine : APP.init
};
