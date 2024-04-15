chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    // Check if the message requests a Salesforce session
    if (request.message === "getSession") {
        // Attempt to retrieve the Salesforce session ID cookie
        chrome.cookies.get({ url: request.sfHost, name: "sid", storeId: sender?.tab?.cookieStoreId }, (sessionCookie) => {
            if (!sessionCookie) {
                console.error("No session cookie found");
                sendResponse(null); // No session cookie available
                return;
            }
        
            // Prepare the session info response
            const sessionInfo = {
                key: sessionCookie.value,
                hostname: sessionCookie.domain
            };

            // Respond with the session information
            sendResponse(sessionInfo);
        });

        // Must return true when sendResponse might be called asynchronously
        return true;
    }

    // Log unhandled request types
    console.warn("Unhandled request type:", request.message);
    return false; // No need to keep the sendResponse callback open
});