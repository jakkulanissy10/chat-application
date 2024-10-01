document.addEventListener('DOMContentLoaded', () => {
    const buttonEl = document.getElementById('clickButton');
    const mainContent = document.getElementById('mainContent');

    // Show main content when the button is clicked
    buttonEl.addEventListener('click', function() {
        const bgContainer = document.getElementById('bg-container');

        bgContainer.style.display = 'none'; // Hide the welcome section
        mainContent.classList.remove('hidden'); // Show the main content

        // Now initialize the media and chat functionalities

        const video = document.querySelector(".video");
        const recordBtnCont = document.querySelector(".record-btn-cont");
        const recordBtn = document.querySelector(".record-btn");
        const captureBtnCont = document.querySelector(".capture-btn-cont");
        const captureBtn = document.querySelector(".capture-btn");
        const filterLayer = document.querySelector(".filter-layer");
        const allFilters = document.querySelectorAll(".filter");
        const timer = document.querySelector(".timer");

        // Chat Elements
        const messagesDiv = document.getElementById('messages');
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const clearButton = document.getElementById('clear-button');

        // Variables
        let recordFlag = false;
        let transparentColor = "transparent";
        let recorder;
        let chunks = [];
        let timerId;
        let counter = 0;
        let stream; // To store the media stream

        // Media Constraints
        const constraints = {
            audio: true, // Enable audio
            video: true,
        };

        // Function to Initialize Media Devices
        function initMedia() {
            navigator.mediaDevices.getUserMedia(constraints)
                .then((mediaStream) => {
                    stream = mediaStream; // Store the stream globally
                    video.srcObject = stream;
                })
                .catch((error) => {
                    console.error("Error accessing media devices.", error);
                    alert("Could not access the camera and microphone. Please check your permissions and try again.");
                });
        }

        // Function to Start Recording
        function startRecording() {
            if (!stream) {
                alert("Media devices not initialized. Please initialize media first.");
                return;
            }

            recorder = new MediaRecorder(stream);
            chunks = [];

            // Event: Data Available
            recorder.addEventListener("dataavailable", (e) => {
                if (e.data.size > 0) {
                    chunks.push(e.data);
                }
            });

            // Event: Recording Stopped
            recorder.addEventListener("stop", () => {
                const blob = new Blob(chunks, {
                    type: recorder.mimeType || "video/webm"
                });
                const videoURL = URL.createObjectURL(blob);

                // Create Video Element
                const videoElement = document.createElement('video');
                videoElement.src = videoURL;
                videoElement.controls = true;
                videoElement.classList.add('message-video');

                // Append to Messages
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                messageElement.appendChild(videoElement);
                messagesDiv.appendChild(messageElement);

                // Save to LocalStorage
                saveMessage(`Video: ${videoURL}`);
                loadMessages();
            });

            recorder.start();
            recordBtn.classList.add("scale-record");
            recordBtn.textContent = "Stop Recording";
            startTimer(); // Start the timer
            recordFlag = true;
        }

        // Function to Stop Recording
        function stopRecording() {
            if (recorder && recordFlag) {
                recorder.stop();
                recordBtn.classList.remove("scale-record");
                recordBtn.textContent = "Record";
                stopTimer(); // Stop the timer

                // Stop all media tracks to release resources
                stream.getTracks().forEach(track => track.stop());
                stream = null; // Clear the stream
                recordFlag = false;
            }
        }

        // Initialize media when main content is shown
        initMedia();

        // Record Button Click Event
        recordBtnCont.addEventListener("click", () => {
            if (!recordFlag) {
                startRecording();
            } else {
                stopRecording();
            }
        });

        // Capture Button Click Event
        captureBtnCont.addEventListener("click", () => {
            if (!stream) {
                alert("Media not initialized. Please initialize media first.");
                return;
            }

            captureBtn.classList.add("scale-capture");
            const canvas = document.createElement("canvas");
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const tool = canvas.getContext("2d");
            tool.drawImage(video, 0, 0, canvas.width, canvas.height);
            tool.fillStyle = transparentColor;
            tool.fillRect(0, 0, canvas.width, canvas.height);
            const imageURL = canvas.toDataURL("image/jpeg");

            // Create Image Element
            const imageElement = document.createElement('img');
            imageElement.src = imageURL;
            imageElement.classList.add('message-image');

            // Append to Messages
            const messageElement = document.createElement('div');
            messageElement.classList.add('message');
            messageElement.appendChild(imageElement);
            messagesDiv.appendChild(messageElement);

            // Save to LocalStorage
            saveMessage(`Image: ${imageURL}`);
            loadMessages();

            // Cleanup
            canvas.remove();

            setTimeout(() => {
                captureBtn.classList.remove("scale-capture");
            }, 500);
        });

        // Filter Selection Event Listeners
        allFilters.forEach((filterElem) => {
            filterElem.addEventListener("click", () => {
                transparentColor = getComputedStyle(filterElem).getPropertyValue("background-color");
                filterLayer.style.backgroundColor = transparentColor;
            });
        });

        // Timer Functions
        function startTimer() {
            timer.style.display = "block";
            counter = 0;
            timer.innerText = "00:00:00";
            timerId = setInterval(displayTimer, 1000);
        }

        function displayTimer() {
            let totalSeconds = counter;
            let hours = Math.floor(totalSeconds / 3600);
            totalSeconds %= 3600;
            let minutes = Math.floor(totalSeconds / 60);
            let seconds = totalSeconds % 60;
            hours = (hours < 10) ? `0${hours}` : hours;
            minutes = (minutes < 10) ? `0${minutes}` : minutes;
            seconds = (seconds < 10) ? `0${seconds}` : seconds;
            timer.innerText = `${hours}:${minutes}:${seconds}`;
            counter++;
        }

        function stopTimer() {
            clearInterval(timerId);
            counter = 0;
            timer.innerText = "00:00:00";
            timer.style.display = "none";
        }

        // Chat Functionality

        // Load Messages from LocalStorage
        function loadMessages() {
            const messages = JSON.parse(localStorage.getItem('messages')) || [];
            messagesDiv.innerHTML = '';
            messages.forEach(message => {
                const messageElement = document.createElement('div');
                messageElement.classList.add('message');
                if (message.startsWith('Video: ')) {
                    const videoURL = message.replace('Video: ', '');
                    const videoElement = document.createElement('video');
                    videoElement.src = videoURL;
                    videoElement.controls = true;
                    messageElement.appendChild(videoElement);
                } else if (message.startsWith('Image: ')) {
                    const imageURL = message.replace('Image: ', '');
                    const imageElement = document.createElement('img');
                    imageElement.src = imageURL;
                    imageElement.classList.add('message-image');
                    messageElement.appendChild(imageElement);
                } else {
                    const textElement = document.createElement('span');
                    textElement.textContent = message;
                    messageElement.appendChild(textElement);
                }
                messagesDiv.appendChild(messageElement);
            });
            // Scroll to the latest message
            messagesDiv.scrollTop = messagesDiv.scrollHeight;
        }

        // Save Message to LocalStorage
        function saveMessage(message) {
            const messages = JSON.parse(localStorage.getItem('messages')) || [];
            messages.push(message);
            localStorage.setItem('messages', JSON.stringify(messages));
        }

        // Send Button Click Event
        sendButton.addEventListener('click', () => {
            const message = messageInput.value.trim();
            if (message) {
                saveMessage(message);
                loadMessages();
                messageInput.value = '';
            }
        });

        // Clear Button Click Event
        clearButton.addEventListener('click', () => {
            localStorage.removeItem('messages');
            loadMessages();
        });

        // Optional: Send message on Enter key
        messageInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendButton.click();
            }
        });

        // Initial Load
        loadMessages();
    });
});