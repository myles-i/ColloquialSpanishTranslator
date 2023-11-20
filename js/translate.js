document.addEventListener('DOMContentLoaded', function() {

    // Function to handle translation
    async function translateText() {
        // disable button while translating..
        button = document.getElementById("translateButton");
        button.disabled = true;
        button.innerText = "Processing..."

        // get system prompt based on selected country
        var selectedCountry = document.getElementById('languageSelect').value;
        Cookies.set('selectedCountry', selectedCountry, { expires: 3650 }); //save selected country for future sessions
        let systemMessage = getSystemMessage(selectedCountry);

        // get user prompt from textbox.
        let examples_txt = getExamplesText();
        let inputText = document.getElementById('inputText').value;
        let temperature = 0.3 // by default, lower temperature to get highest probability output
        if (!inputText) {
            // if text input is empty, prompt chatgpt to output an interesting phrase
            var date = new Date();
            var millisecondsSinceEpoch = date.getTime();
            inputText = "..." + millisecondsSinceEpoch.toString(); // give it todays ms time as a "random" number
            temperature = 1; // for a random phrase, maximize the temperature to get more variable output
        }

        // get openAI Key from cookie
        let apiKey = Cookies.get('openAIKey');

        // build up the chatgpt prompt from the examples, and user message, and send to OpenAI
        content = examples_txt + "Q::: '" + inputText + "'\n\nR::: (Español coloquial de "+ selectedCountry + ") ";
        console.log(systemMessage)
        console.log(content)

        // try to get prompt from open ai
        try {
            let response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + apiKey
                },
                body: JSON.stringify({
                    model: "gpt-4-1106-preview",
                    // model: "gpt-4",
                    // model: "gpt-3.5-turbo-1106",
                    temperature: temperature,
                    messages: [
                        {
                            role: "system",
                            content: systemMessage
                        },
                        {
                            role: "user",
                            content: content
                        }
                    ]
                })
            });
            
            // throw an error if response is not ok
            if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

            // otherwise, update the result text box
            let data = await response.json()
            console.log(data)
            let rawMsg = data.choices[0].message.content;
            // console.log(rawMsg)

            // get rid of first line
            let lines = rawMsg.split('\n').slice(1);
            let processedMsg = lines.join('\n');

            // conver markdown to html and put into pages
            let markedMsg = marked.parse(processedMsg)
            // console.log(markedMsg)
            document.getElementById('outputText').innerHTML = markedMsg;
        } 
        catch (error) {
            // if response indicates an openai key error, prompt user to update
            if (error.message.includes('401'))
            {
                apiKey = prompt("Please enter your OpenAI API key:", "");
                if (apiKey) {
                    Cookies.set('openAIKey', apiKey, { expires: 3650 }); //expires in 10 years
                    translateText();
                    return;
                }
            }
            console.error('Error:', error);
            alert("Failed to fetch translation.");
        }

        // reenable button once done with translation
        button.disabled = false; 
        button.innerText = "Translate!"
    }

    // set selected country based on saved cookie
    let defaultCountry = Cookies.get('selectedCountry');
    if (defaultCountry){
        document.getElementById('languageSelect').value = Cookies.get('selectedCountry');
    }

    // add event handler for button press
    document.getElementById('translateButton').addEventListener('click', translateText);

    // make enter press "translate", and shift+enter add a newling
    document.getElementById('inputText').addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            // Prevent default Enter behavior (newline)
            event.preventDefault();
            // Trigger button click
            document.getElementById('translateButton').click();
        }
    });

});