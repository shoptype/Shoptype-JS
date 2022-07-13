function loadScript(url, callback) {
    var head = document.head;
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = url;
    script.onreadystatechange = callback;
    script.onload = callback;
    head.appendChild(script);
}

const fingerprintExcludeOptions = {
    hardwareConcurrency: true,
    availableScreenResolution: true,
    sessionStorage: true,
    localStorage: true,
    indexedDb: true,
    addBehavior: true,
    openDatabase: true,
    plugins: true,
    canvas: true,
    webgl: true,
    adBlock: true,
    fontsFlash: true,
    enumerateDevices: true,
    doNotTrack: true,
    hasLiedLanguages: true,
    hasLiedResolution: true,
    hasLiedOs: true,
    hasLiedBrowser: true,
    touchSupport: true,
    fonts: true,
    audio: true,
    pixelRatio: true,
    timezone: true,
    extendedJsFonts: true
};

function setDeviceId() {
    try {
        Fingerprint2.getPromise({
            excludes: fingerprintExcludeOptions
        }).then(components => {
            murmurFingerprint = Fingerprint2.x64hash128(components.map(c => c.value).join(''), 31);
            localStorage.setItem('deviceId', murmurFingerprint);
        });
    } catch (e) {
        console.info('There was a problem setting fingerprint data', e);
    }
}

function getDeviceId() {
    return new Promise((resolve, reject) => {
        let murmurFingerprint = localStorage.getItem('deviceId');
        if (murmurFingerprint) {
            resolve(murmurFingerprint);
        } else {
            try {
                var inProgress = false;
                var getDeviceIdSetupInterval = setInterval(() => {
                    if (Fingerprint2 && !inProgress) {
                        inProgress = true;
                        Fingerprint2.getPromise({
                            excludes: fingerprintExcludeOptions
                        }).then(components => {
                            murmurFingerprint = Fingerprint2.x64hash128(components.map(c => c.value).join(''), 31);
                            localStorage.setItem('deviceId', murmurFingerprint);
                            resolve(murmurFingerprint);
                            clearInterval(getDeviceIdSetupInterval);
                        });
                    }
                }, 500);
            } catch (e) {
                console.info('There was a problem setting fingerprint data', e);
            }
        }
    });
}

loadScript("https://cdnjs.cloudflare.com/ajax/libs/fingerprintjs2/2.1.0/fingerprint2.js", setDeviceId);

function triggerUserEvent(
    productId,
    userId,
    vendorId,
    networkId,
    cosellerId,
    platformId,
    referrer,
    action = 'product_view',
    callbackFunc = null
) {
    getDeviceId().then(deviceId => {
        const body = {
            "deviceId": deviceId,
            "action": action,
            "productId": productId,
            "userId": userId,
            "networkId": networkId,
            "vendorId": vendorId,
            "cosellerId": cosellerId,
            "platformId": platformId,
            "url": window.location.href,
            "referrer": (referrer.length>0)?referrer:window.location.href
        };

        fetch('https://backend.shoptype.com/user-event?userType=coseller', {
            method: 'post',
	    headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        }).then(s => {
            if (callbackFunc) {
                callbackFunc();
            }
        }, e => console.info('There was a problem saving a userevent', e));
    });
}
