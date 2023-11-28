function getAK()
{
    return "sk-6t9Feb1sVg"
}
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
        let userInputText = document.getElementById('inputText').value;
        let inputText = userInputText;
        let temperature = 0 // by default, lower temperature to get highest probability output
        if (!inputText) {
            // if text input is empty, prompt chatgpt to output an interesting phrase
            var date = new Date();
            var millisecondsSinceEpoch = date.getTime();
            inputText = "..." + millisecondsSinceEpoch.toString(); // give it todays ms time as a "random" number
            temperature = 1; // for a random phrase, maximize the temperature to get more variable output
        }

        // get openAI Key from cookie
        let ak = Cookies.get('openAIKey');
        // let users use it for free for now... limit on API side and able to delete whenever
        // obscure pretty transparently through some coding...
        if (!ak)
        {
            hf2 = "oPt8giqmPT3BlbkFJkYN2oB8dMcy4OrXZS2B6"
            ak = getAK() + "R" + hf2;
        }

        

        // build up the chatgpt prompt from the examples, and user message, and send to OpenAI
        content = examples_txt + "Q::: '" + inputText + "'\n\nR::: (Español coloquial de "+ selectedCountry + ") ";
        console.log(systemMessage)
        console.log(content)

        // try to get prompt from open ai
        let outputMsg = "";
        try {
            let response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + ak
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
            outputMsg = marked.parse(processedMsg);
        } 
        catch (error) {
            // if response indicates an openai key error, prompt user to update
            if (error.message.includes('401'))
            {
                ak = prompt("Please enter your OpenAI API key:", "");
                if (ak) {
                    Cookies.set('openAIKey', ak, { expires: 3650 }); //expires in 10 years
                    translateText();
                    return;
                }
            }
            console.error('Error:', error);
            alert("Failed to fetch translation.");
        }


        // Save this data for history
        if (outputMsg){
            saveTranslationData(userInputText, selectedCountry, outputMsg);
            // and now load this into gui
            currentIndex = 0;
            loadTranslationData(currentIndex);
        }
        
        // reenable button once done with translation
        button.disabled = false; 
        button.innerText = "Translate!"
    }

    ///////////////////////////////////////////
    // set selected country based on saved cookie
    //////////////////////////////////////////////
    let defaultCountry = Cookies.get('selectedCountry');
    if (defaultCountry){
        document.getElementById('languageSelect').value = defaultCountry;
    }

    /////////////////////////////////
    // add left right button callbacks
    /////////////////////////////////
    let currentIndex = -1;

    function saveTranslationData(input, language, output) {
        let translations = JSON.parse(localStorage.getItem("translations")) || [];
        translations.unshift({ input, language, output }); // Add new translation at the start
        localStorage.setItem("translations", JSON.stringify(translations));
    }
    
    // Function to load translation data
    function loadTranslationData(index) {
        let translations = JSON.parse(localStorage.getItem("translations")) || [];
        let maxIndex = translations.length - 1;

        // Update GUI enable/disable status
        document.getElementById('rightButton').disabled = index <= -1;
        document.getElementById('leftButton').disabled = index >= maxIndex;
        
        if (index < 0){
            document.getElementById('inputText').value = "";
            document.getElementById('outputText').innerHTML = "";
        }
        else if(index < translations.length) {
            let data = translations[index];
            document.getElementById('inputText').value = data.input;
            document.getElementById('languageSelect').value = data.language;
            document.getElementById('outputText').innerHTML = data.output;
        }
    }

    document.getElementById('leftButton').addEventListener('click', function() {
        if (currentIndex < JSON.parse(localStorage.getItem("translations")).length - 1) {
            currentIndex++;
            loadTranslationData(currentIndex);
        }
    });

    document.getElementById('rightButton').addEventListener('click', function() {
        if (currentIndex > -1) {
            currentIndex--;
            loadTranslationData(currentIndex);
        }
    });

    ///////////////////////
    /// add translate button callback
    //////////////////////
    document.getElementById('translateButton').addEventListener('click', translateText);

    // Initial call to set up the UI
    loadTranslationData(currentIndex);

    ///////////////////
    // add keyboard functionality
    ////////////////////////
    // add event handler for button press

    // make enter press "translate", and shift+enter add a newling
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            // Prevent default Enter behavior (newline)
            event.preventDefault();
            // Trigger button click
            document.getElementById('translateButton').click();
        }
        else if (event.key === 'ArrowLeft') {
            document.getElementById('leftButton').click();
        } else if (event.key === 'ArrowRight') {
            document.getElementById('rightButton').click();
        }
    });
    

});