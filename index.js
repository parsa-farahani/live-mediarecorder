// Elements
const videoContainer = document.querySelector(".media-cont");
const video = document.querySelector("#video");
const audio = document.querySelector("#audio");
const controlsSidebar = document.querySelector(".media-cont-sidebar");
const controlsSidebarList = document.querySelector(".media-cont-sidebar-list");
const controlsSidebarOpenBtn = document.querySelector("#media-cont-sidebar-openning-btn");
const networkSpeed = document.querySelector("#network-speed");
const qualityOptionsCont = document.querySelector("#hq-options-cont");
const qualityOptions = document.querySelectorAll(".hq-options-item");

const startendBtn = document.getElementById("startend-btn");
const playpauseBtn = document.getElementById("playpause-btn");
const micBtn = document.getElementById("mic-btn");
const recBtn = document.getElementById("rec-btn");
const downloadBtn = document.getElementById("download-btn");
const fsBtn = document.getElementById("fs-btn");
const hqBtn = document.getElementById("hq-btn");
const muteBtn = document.getElementById("mute-btn");
const volRange = document.getElementById("video-volume-range");
const videoTime = document.getElementById("video-time");
const liveIcon = document.getElementById("live-icon");

// init setup
let STREAM = null;

let VIDEOENABLED = false;
let AUDIOENABLED = false;

let streaming = false;
let isRecording = false;
let micOn = false;

video.controls = false;

volRange.setAttribute("max", 1);
startendBtn.disabled = false;
if ( JSON.parse(localStorage.getItem('mic')) ) {
    micBtn.classList.add('active');
} else {
    micBtn.classList.remove('active');
}

// functionality
const getUserMediaReady = !!(window.navigator.mediaDevices && window.navigator.mediaDevices.getUserMedia);

if (getUserMediaReady) {
    async function askUserPremissions() {
        document.documentElement.style.overflow = 'hidden';
        return new Promise((resolve, reject) => {
            const premissionModalCont = document.getElementById("premission-modal-cont");
            const camCheck = document.getElementById("webcam-premission-check");
            const micCheck = document.getElementById("mic-premission-check");
            const checkLabels = document.querySelectorAll(".premission-label");
            const submitBtn = document.getElementById("premission-submit-btn");
    
            premissionModalCont.style.display = "flex";
    
            const premissions = {
                cam: false,
                mic: false,
            }

            document.addEventListener('click', function(e) {
                const label = e.target.closest('.premission-label');
                if ( !label ) return;
                label.classList.toggle('active');
                if (label.classList.contains('animated-btn')) {
                    label.classList.remove('animated-btn');
                }
                setTimeout(function() {
                    label.classList.add('animated-btn');
                }, 1)
            })
    
            submitBtn.addEventListener("click", function(e) {
                if (!camCheck.checked && !micCheck.checked) {
                    showPremError();
                } else {
                    premissions.cam = camCheck.checked;
                    premissions.mic = micCheck.checked;
                    resolve(premissions);
                    premissionModalCont.style.display = "none";
                }
            })  
            function showPremError() {
                alert("give at least 1 premission");
                askUserPremissions();
            }
        })
    }

    const premissions = {
        cam: JSON.parse(window.localStorage.getItem("cam")) || false,
        mic: JSON.parse(window.localStorage.getItem("mic")) || false,
    }

    if (!premissions.cam && !premissions.mic) {
        askUserPremissions()
        .then((userPremissions) => {
            if (userPremissions.mic) {
                micOn = true;
                micBtn.classList.add("active");
            }
    
            premissions.cam = userPremissions.cam;
            premissions.mic = userPremissions.mic;

            localStorage.setItem("cam", premissions.cam);
            localStorage.setItem("mic", premissions.mic);
        })
        .catch(error => console.log(error));
    }

    function startStream(videoState = premissions.cam, audioState = premissions.mic) {
        console.log("startStream");
        VIDEOENABLED = videoState;
        AUDIOENABLED = audioState;
        window.navigator.mediaDevices.getUserMedia({video:videoState, audio:audioState})
        .then(stream => {
            STREAM = stream;
            video.srcObject = STREAM;
            streaming = true;
            if (VIDEOENABLED) setVideoQUality(854, 480, 16/9);
            enableRecord();
            updateVideoTime();
            updateStyle();
        })
        .catch(error => alert(error.message));
    }

    function endStream() {
        console.log("endStream");
        STREAM.getTracks().forEach(track => track.stop());
        video.srcObject = null;
        streaming = false;
        updateStyle();
    }

    function initializeQuality() {

    }

    function updateStyle() {
        if (!!streaming) {
            playpauseBtn.disabled = false;
            playpauseBtn.setAttribute("data-disabled", false);
            recBtn.disabled = false;
            recBtn.setAttribute("data-disabled", false);
            micBtn.disabled = false;
            micBtn.setAttribute("data-disabled", false);
            liveIcon.classList.add("live-icon-active");
        } else {
            playpauseBtn.disabled = true;
            playpauseBtn.setAttribute("data-disabled", true);
            recBtn.disabled = true;
            recBtn.setAttribute("data-disabled", true);
            micBtn.disabled = true;
            micBtn.setAttribute("data-disabled", true);
            liveIcon.classList.remove("live-icon-active");
        }
    }

    startendBtn.addEventListener("click", function(e) {
        console.log('a')
        if (!streaming && video.srcObject === null) {
            startStream();
        } else {
            endStream();
        }
    })

    micBtn.addEventListener("click", function(e) {
        if (!streaming) return;
        if (!!premissions.cam && !!premissions.mic) {
            console.log("micOff");
            STREAM.getAudioTracks()[0].stop();
            window.localStorage.setItem("mic", false);
            premissions.mic = false;
            startStream();
        } else if (!!premissions.cam && !premissions.mic) {
            console.log("micOn");
            window.localStorage.setItem("mic", true);
            premissions.mic = true;
            startStream();
        } else {
            const ans = window.confirm("End Live contact?");
            if (!!ans) {
                endStream();
                streaming = false;
            }
        }
        // if (!micOn && streaming) {
        //     // userAudio("on");
        //     micOn = true;
        //     startStream(premissions.cam, true);
        //     window.localStorage.setItem("mic", true);
        //     micBtn.classList.add("mic-btn-active");
        //     console.log("mic on");
        // } else if (!!micOn && premissions.cam) {
        //     // userAudio("off");
        //     micOn = false;
        //     startStream(premissions.cam, false);
        //     window.localStorage.setItem("mic", false);
        //     micBtn.classList.remove("mic-btn-active");
        //     console.log("mic off");
        // }
    })

    playpauseBtn.addEventListener("click", function(e) {
        if (!streaming) return;
        (!!video.paused) ? video.play() : video.pause();
    })

    muteBtn.addEventListener("click", function(e) {
        if (!streaming) return;
        video.muted = !video.muted;
    })

    function updateVideoTime() {
        setVideoTime(video.currentTime);
        requestAnimationFrame(updateVideoTime);
    }
    
} else {
    console.log("'getUserMedia' is not supported in this browser.");
}


function enableRecord() {
    console.log(STREAM);
    const options = (VIDEOENABLED)? { mimeType: "video/webm" } : { mimeType: "audio/webm" }
    const recorder = new MediaRecorder(STREAM, options);

    const recordedChunks = [];

    recorder.addEventListener("dataavailable", function(e) {
        if (e.data.size > 0) {
            recordedChunks.push(e.data);
            download();
        }
    })

    recorder.addEventListener("error", function(e) {
        throw e.error || new Error(e.name);
    })

    recorder.addEventListener("stop", function(e) {
        downloadBtn.disabled = false;
        downloadBtn.setAttribute("data-disabled", false);
    })

    playpauseBtn.addEventListener("click", function(e) {
        if (!isRecording) return;
        if (isRecording) {
            recorder.pause();
            isRecording = false;
        } else {
            recorder.resume();
            isRecording = true;
        }
    })

    recBtn.addEventListener("click", function(e) {
        if (!streaming) return;
        if (!isRecording) {
            recorder.start();
            isRecording = true;
            recBtn.classList.add("rec-btn-isrecording");
            console.log("Recording...");
        } else {
            recorder.stop();
            isRecording = false;
            recBtn.classList.remove("rec-btn-isrecording");
            console.log("Recording is stopped.");
        }
    })

    function download() {
        const url = window.URL.createObjectURL(new Blob(recordedChunks));
        downloadBtn.href = url;
        downloadBtn.download = "live-rec.webm";
    }
}


function setVideoTime(time) {

    let hrs = Math.floor(time / 3600);
    let mins = Math.floor(time / 60);
    let secs = Math.floor(time);

    videoTime.innerText = formatTime(hrs) + ":" + formatTime(mins) + ":" + formatTime(secs);
    function formatTime(time) {
        return (time < 10)? 0 + String(time) : String(time);
    }
}

fsBtn.addEventListener("click", function(e) {
    if (!!document.fullscreenElement) {
        document.exitFullscreen();
    } else {
        videoContainer.requestFullscreen();
    }
})

document.addEventListener("fullscreenchange", function(e) {
    if (document.fullscreenElement) {
        video.classList.add("fs-video");
        controlsSidebar.classList.add("fs-media-cont-sidebar");
        controlsSidebarList.classList.add("fs-media-cont-sidebar-list");
        controlsSidebar.style.width = "0px";
        controlsSidebarOpenBtn.style.display = "block";
        controlsSidebarOpenBtn.style.animation = "appear .3s forwards";
    } else {
        controlsSidebar.style.animation = "";
        controlsSidebarList.style.animation = "";
        video.classList.remove("fs-video");
        controlsSidebar.classList.remove("fs-media-cont-sidebar");
        controlsSidebar.style.width = "var(--media-cont-left)";
        controlsSidebarList.style.width = "100%";
        controlsSidebarList.classList.remove("fs-media-cont-sidebar-list");
        controlsSidebarOpenBtn.style.animation = "disappear .3s forwards";
    }
})

volRange.addEventListener("input", function(e) {
    if (volRange.value <= 0) {
        video.muted = true;
        video.volume = 0;
    } else {
        video.muted = false;
        video.volume = volRange.value;
    }
    muteIconChange();
})

function muteIconChange() {
    const muteIcon = document.getElementById("mute-icon");
    if (!!video.muted) {
        muteIcon.innerHTML = `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-miterlimit="10" stroke-width="32" d="M416 432L64 80"/><path fill="currentColor" d="M243.33 98.86a23.89 23.89 0 0 0-25.55 1.82l-.66.51l-28.52 23.35a8 8 0 0 0-.59 11.85l54.33 54.33a8 8 0 0 0 13.66-5.66v-64.49a24.51 24.51 0 0 0-12.67-21.71m8 236.43L96.69 180.69A16 16 0 0 0 85.38 176H56a24 24 0 0 0-24 24v112a24 24 0 0 0 24 24h69.76l92 75.31a23.9 23.9 0 0 0 25.87 1.69A24.51 24.51 0 0 0 256 391.45v-44.86a16 16 0 0 0-4.67-11.3M352 256c0-24.56-5.81-47.87-17.75-71.27a16 16 0 1 0-28.5 14.55C315.34 218.06 320 236.62 320 256q0 4-.31 8.13a8 8 0 0 0 2.32 6.25l14.36 14.36a8 8 0 0 0 13.55-4.31A146 146 0 0 0 352 256m64 0c0-51.18-13.08-83.89-34.18-120.06a16 16 0 0 0-27.64 16.12C373.07 184.44 384 211.83 384 256c0 23.83-3.29 42.88-9.37 60.65a8 8 0 0 0 1.9 8.26L389 337.4a8 8 0 0 0 13.13-2.79C411 311.76 416 287.26 416 256"/><path fill="currentColor" d="M480 256c0-74.25-20.19-121.11-50.51-168.61a16 16 0 1 0-27 17.22C429.82 147.38 448 189.5 448 256c0 46.19-8.43 80.27-22.43 110.53a8 8 0 0 0 1.59 9l11.92 11.92a8 8 0 0 0 12.92-2.16C471.6 344.9 480 305 480 256"/>`;
    } else {
        muteIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><g fill="none"><path d="M24 0v24H0V0zM12.593 23.258l-.011.002l-.071.035l-.02.004l-.014-.004l-.071-.035c-.01-.004-.019-.001-.024.005l-.004.01l-.017.428l.005.02l.01.013l.104.074l.015.004l.012-.004l.104-.074l.012-.016l.004-.017l-.017-.427c-.002-.01-.009-.017-.017-.018m.265-.113l-.013.002l-.185.093l-.01.01l-.003.011l.018.43l.005.012l.008.007l.201.093c.012.004.023 0 .029-.008l.004-.014l-.034-.614c-.003-.012-.01-.02-.02-.022m-.715.002a.023.023 0 0 0-.027.006l-.006.014l-.034.614c0 .012.007.02.017.024l.015-.002l.201-.093l.01-.008l.004-.011l.017-.43l-.003-.012l-.01-.01z"/><path fill="currentColor" d="M13.26 3.3a1.1 1.1 0 0 1 1.734.78l.006.114v15.612a1.1 1.1 0 0 1-1.643.957l-.096-.062L6.68 16H4a2 2 0 0 1-1.995-1.85L2 14v-4a2 2 0 0 1 1.85-1.995L4 8h2.68zm6.407 3.483A6.985 6.985 0 0 1 22 12a6.985 6.985 0 0 1-2.333 5.217a1 1 0 1 1-1.334-1.49A4.985 4.985 0 0 0 20 12c0-1.48-.642-2.81-1.667-3.727a1 1 0 1 1 1.334-1.49m-2 2.236A3.992 3.992 0 0 1 19 11.999a3.991 3.991 0 0 1-1.333 2.982a1 1 0 0 1-1.422-1.4l.088-.09c.41-.368.667-.899.667-1.491a1.99 1.99 0 0 0-.548-1.376l-.119-.115a1 1 0 1 1 1.334-1.49"/></g></svg>`;
    }
}

controlsSidebarOpenBtn.addEventListener('click',  e => {
    if (!document.fullscreenElement) return;
    if ( controlsSidebar.dataset.state === 'showing' ) {
        controlsSidebar.setAttribute('data-state', 'hidden');
    } else {
        controlsSidebar.setAttribute('data-state', 'showing');
    }
})


/* change activable icons (mute/unmute, ...) */
document.addEventListener('click', e => {
    const { target } = e;
    if ( !target.closest('[data-activable]') ) return;
    const elem = target.closest('[data-activable]');
    elem.classList.toggle('active');
})

/* Quality Change */
hqBtn.addEventListener("click", function(e) {
    if (!streaming) return;
    qualityOptionsCont.style.display = "block";
})

qualityOptions.forEach(qOption => {
    qOption.addEventListener("click", function(e) {
        if (!streaming || !window.localStorage.getItem("cam")) return;
        const qOptionCheck = this.querySelector("input");
        let width;
        let height;
        switch (qOptionCheck.id) {
            case "hq-720-check":
                width = 1280;
                height = 720;
                break;
            case "hq-480-check":
                width = 854;
                height = 480;
                break;
            case "hq-144-check":
                width = 256;
                height = 144;
                break;
        }
        setVideoQUality(width, height);
        qOptionCheck.checked = true;
        qualityOptionsCont.style.display = "none";
        e.stopPropagation();
    })
})

function setVideoQUality(width, height, aspectRatio=16/9) {
    const track = STREAM.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    const settings = track.getSettings();
    console.log('Capabilities:', capabilities);
    console.log('Current settings:', settings);
    const newSettings = { 
        width: { ideal: width }, 
        height: { ideal: height },
        aspectRatio: aspectRatio,
    };
    track.applyConstraints(newSettings)
        .then(() => {
        console.log('New settings:', track.getSettings());
        })
        .catch((error) => {
        console.error('Error applying constraints:', error);
        });
}
/*-------------------------------------*/



/* network speed calc */
function updateNetworkSpeed() {
    networkSpeed.innerText = window.navigator.connection.downlink + "Mbps";
    requestAnimationFrame(updateNetworkSpeed);
}
updateNetworkSpeed();
/*-------------------------------------*/


// function userAudio(state) {
//     window.navigator.mediaDevices.getUserMedia({ audio:state })
//     .then(audioStream => audio.srcObject = (state === "on")? audioStream : null)
//     .catch(() => console.log("audio is not supported in this browser or disabled."));
// }