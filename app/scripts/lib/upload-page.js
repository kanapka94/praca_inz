"use strict";

var CRYPTO_ENGINE = {
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
                APP.showAlert('success', '', 'Sicherer Schlüssel generiert!');
            }).catch(function (err) {
                console.error(err);
            });
        },
        exportAESKey: function (fileName, fileType, data, encryptedIV) {
            window.crypto.subtle.exportKey(
                "jwk",
                CRYPTO_ENGINE.aesKey
            ).then(function (keydata) {
                var jsonString = JSON.stringify(keydata);
                var encryptedKey = CRYPTO_ENGINE.encryptRSA(jsonString);
                APP.uploadFile(fileName, fileType, data, encryptedKey, encryptedIV);
            })
                .catch(function (err) {
                    console.error(err);
                });
        },
    },
    init: function () {
        CRYPTO_ENGINE.detectBrowserConfig();
        CRYPTO_ENGINE.passCrypto = new JSEncrypt();
        CRYPTO_ENGINE.config.loadPublicKey();
    },
    detectBrowserConfig : function() {
        if (window.crypto && !window.crypto.subtle && window.crypto.webkitSubtle) {
            window.crypto.subtle = window.crypto.webkitSubtle;
        }
        if (!window.crypto || !window.crypto.subtle) {
            alert("Your browser does not support the Web Cryptography API! This page will not work.");
            throw new Error("Your browser does not support the Web Cryptography API! This page will not work.");
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
        bindClickEvents: function () {

            $('.file-password-wrapper__show-password').click(function () {
                var passField = $('.file-password-wrapper__password');
                (passField.attr('type') === 'password') ? passField.attr('type', 'text') : passField.attr('type', 'password');
            });

            $('.btn_upload-file').click(function () {
                var file = APP.getUploadedFile();
                if (!file) {
                    APP.showAlert('error', 'Error:', 'File not loaded!');
                }
                APP.encryptAndUpload(file);
            });
        },
        bindLoadFileEvent: function () {
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
        bindHideCredentialPasswordEvent: function (password, dottedPassword) {
            var passField = $('.data-wrapper__password-wrapper__password');
            $('#data-wrapper__password-wrapper__show-password').click(function () {
                (passField.text() === password) ? passField.text(dottedPassword) : passField.text(password);
            });
        },
        bindRememberCredentialsAlert: function () {
            $('.userCredentials__upload-another-file').click(function (event) {
                event.preventDefault();
                var answer = confirm('Haben Sie Ihre Login-Daten gespeichert?');
                if (answer) {
                    window.location.reload();
                }
            });
        }
    },
    init : function() {
        CRYPTO_ENGINE.init();
        APP.config.bindClickEvents();
        APP.config.bindLoadFileEvent();
    },
    showAlert: function (msgClass, title, text) {
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
    getUploadedFile: function () {
        var uploadedFile = document.querySelector('.input_file-to-upload').files[0];
        return uploadedFile;
    },
    encryptAndUpload: function (file) {

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
                var progress = parseInt(((data.loaded / data.total) * 100), 10);
            }
        };
        reader.readAsArrayBuffer(file);
    },
    showCredentialsWrapper: function (login, password) {
        $('.userCredentials').css('display', 'block');
        $('.data-wrapper__login-wrapper__login').text(login);
        var dottedpassword = '';
        for (var i = 0; i < password.length; i++) {
            dottedpassword += '*';
        }
        $('.data-wrapper__password-wrapper__password').text(dottedpassword);
        APP.config.bindHideCredentialPasswordEvent(password, dottedpassword);
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
            error: function (xhr, ajaxOptions, thrownError) {
                APP.showAlert('error', '', xhr.responseText);
            }
        });
    },
};

module.exports = {
    initEngine : APP.init
};
