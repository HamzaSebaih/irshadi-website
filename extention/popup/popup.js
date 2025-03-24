document.addEventListener("DOMContentLoaded", function () {
    const submitBtn = document.getElementById("submitBtn9912");
    const userInput = document.getElementById("userInput9912");
    const messageDiv = document.getElementById("message669");
    const backendDomain = "http://127.0.0.1:5000"
    const path = "/extensionUpdate"
    submitBtn.addEventListener("click", function () {
        const inputValue = userInput.value.trim();
        messageDiv.innerHTML = ""; // Clear previous message



        // Get the active tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const tab = tabs[0];
            const tabUrl = tab.url;

            // Check if the URL matches the allowed pattern
            if (!tabUrl.startsWith("https://odusplus-ss.kau.edu.sa/PROD/ywsksinf.P_Display_All_Info")) {
                messageDiv.innerHTML = '<p>This is not the correct page. Please navigate to <a href="https://odusplus-ss.kau.edu.sa/PROD/ywsksinf.P_Display_All_Info">Odus-Plus Student info</a> </p>'
                return;
            }

            // Send message to content.js to get pageBody
            chrome.tabs.sendMessage(tab.id, { request: "getPageBody" }, function (response) {
                if (chrome.runtime.lastError || !response || !response.pageBody) {
                    messageDiv.textContent = "Error: Could not retrieve page content.";
                    console.log("Error or no response from content script:", chrome.runtime.lastError?.message);
                } else {
                    //here I will call the back-end and get the code 
                    //then compare it with input value 
                    //if it is not true then return
                    //if it is true and no other error occurs then the vaule for error is null
                    //so to handle this I need to simply check the vaule of error if null or not
                    const settings = {
                        method: "POST",
                        headers: {
                            "Code": inputValue,
                            "Content-Type": "text/html"
                        },
                        body: response.pageBody
                    };

                    fetch(backendDomain + path, settings)
                        .then(response => response.json())
                        .then(data => {
                            const prossedData = data;
                            if (!prossedData.error) {
                                messageDiv.textContent = "Success!";
                            }
                            else {
                                messageDiv.textContent = "error ! message: " + prossedData.error
                            }

                        })
                        .catch(error => {
                            console.error("Request failed:", error);
                            messageDiv.textContent = "Error: Failed to fetch data.";
                        });






                    // if (inputValue !== "9999") {
                    //     messageDiv.textContent = "Please enter '9999' to proceed.";
                    //     return;
                    //     }
                    // console.log("Page body from content.js:", response.pageBody);
                }
            }
            );
        });
    });
});