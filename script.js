// Variable global para almacenar el historial de conversación (inicialmente vacía)
let chatHistory = []; 

// Constantes para los elementos del DOM
const chatBody = document.querySelector(".chat-body");
const messageInput = document.querySelector(".message-input");
const sendMessageButton = document.querySelector("#send-menssage");
const fileInput = document.querySelector("#file-input");
const fileUploadWrapper= document.querySelector(".file-upload-wrapper");
const fileCancelButton= document.querySelector("#file-cancel");
const chatbotToggler= document.querySelector("#chatbot-toggler");
const closeChatbot= document.querySelector("#close-chatbot");

// Reemplaza con tu propia API Key
const API_KEY = "";
const API_URL = `${API_KEY}`;

// Objeto para almacenar temporalmente el mensaje y el archivo del usuario
const userData ={
    message: null,
    file: {
        data: null,
        mime_type: null
    }
}

// Define el primer mensaje visible del bot para que el texto coincida con el HTML
const botGreeting = "¡Bienvenidos a la UTLVTE! Soy el Chatbot oficial y estoy aquí para asistirte con toda la información sobre nuestra alma máter. ¿En qué puedo ayudarte hoy?";


// Function to create and append message elements to the chat body - 
const createMessageElement = (content, ...classes) => {
    const div = document.createElement('div');
    div.classList.add('message', ...classes);
    div.innerHTML = content;
    return div
}

// Función para generar la respuesta del bot usando la API de Gemini
// Recibe el historial de chat como argumento para asegurar la consistencia.
const generateBotResponse = async (incomingMessageDiv, currentChatHistory) => {
    const messageElement = incomingMessageDiv.querySelector(".message-text");

    // Agrega el mensaje del usuario (y el archivo, si existe) al historial de conversación
    currentChatHistory.push({
        role: "user",
        parts: [{ text: userData.message }, ...(userData.file.data ? [{ inline_data: userData.file}] : [])] 
    });

    // Prepara el payload de la solicitud. Se envía todo el 'currentChatHistory' para mantener la memoria.
    const requestOptions = {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
        contents: currentChatHistory
        })
    }

    try {
        // Llama a la API
        const response = await fetch(API_URL, requestOptions);
        const data = await response.json();
        if (!response.ok) throw new Error(data.error.message);

        // Extrae la respuesta del bot y la limpia de formatos markdown (doble asterisco)
        const apiResponseText = data.candidates[0].content.parts[0].text.replace(/\*\*(.*?)\*\*/g, "$1").trim
        ();
        messageElement.innerHTML = apiResponseText;

        // ✅ CORRECCIÓN CLAVE: Agrega la respuesta real del modelo al historial (role: "model").
        currentChatHistory.push({
            role: "model",
            parts: [{ text: apiResponseText}] 
        });

    }   catch (error) {
        // Manejo de errores
        console.log(error);
        messageElement.innerHTML = "Error: No se pudo conectar con el servicio de IA. Verifica tu API Key o el formato de la solicitud.";
        messageElement.style.color = "#6f1717ff";
        
        // Si hay un error, elimina el último mensaje del usuario del historial para evitar problemas de rol.
        currentChatHistory.pop(); 
        
    }   finally {
        // Reset user data y actualiza la UI
        userData.file = {}; 
        incomingMessageDiv.classList.remove("thinking");
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
    }
}

// Function to handle outgoing user messages
const handleOutgoingMessage = (e) => {
    e.preventDefault();
    userData.message = messageInput.value.trim(); 
    
    // Evita enviar si el historial aún no se ha cargado (chatHistory debe tener elementos)
    if (chatHistory.length === 0) {
        alert("El contexto del chatbot aún se está cargando. Por favor, espera un momento y vuelve a intentarlo.");
        return; 
    }

    if (!userData.message && !userData.file.data) return;

    messageInput.value = "";
    fileUploadWrapper.classList.remove("file-uploaded");
    messageInput.dispatchEvent(new Event("input"));

    // Contenido del mensaje saliente (texto + imagen adjunta si existe)
    const messageContent = `<div class="message-text"></div>
                            ${userData.file.data ? `<img src="data:${userData.file.mime_type};base64,${userData.file.data}" class= "attachment" />` : ""}`;

    const outgoingMessageDiv = createMessageElement(messageContent, "user-message");
    outgoingMessageDiv.querySelector(".message-text").textContent = userData.message;
    chatBody.appendChild(outgoingMessageDiv);
    chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });

    // Simula la respuesta del bot (el indicador de "pensando")
    setTimeout(() => {
        // SVG del bot
        const messageContent = `<svg class="bot-avatar" xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 1024 1024">
                    <path d="M738.3 287.6H285.7c-59 0-106.8 47.8-106.8 106.8v303.1c0 59 47.8 106.8 106.8 106.8h81.5v111.1c0 .7.8 1.1 1.4.7l166.9-110.6 41.8-.8h117.4l43.6-.4c59 0 106.8-47.8 106.8-106.8V394.5c0-59-47.8-106.9-106.8-106.9zM351.7 448.2c0-29.5 23.9-53.5 53.5-53.5s53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5-53.5-23.9-53.5-53.5zm157.9 267.1c-67.8 0-123.8-47.5-132.3-109h264.6c-8.6 61.5-64.5 109-132.3 109zm110-213.7c-29.5 0-53.5-23.9-53.5-53.5s23.9-53.5 53.5-53.5 53.5 23.9 53.5 53.5-23.9 53.5-53.5 53.5zM867.2 644.5V453.1h26.5c19.4 0 35.1 15.7 35.1 35.1v121.1c0 19.4-15.7 35.1-35.1 35.1h-26.5zM95.2 609.4V488.2c0-19.4 15.7-35.1 35.1-35.1h26.5v191.3h-26.5c-19.4 0-35.1-15.7-35.1-35.1zM561.5 149.6c0 23.4-15.6 43.3-36.9 49.7v44.9h-30v-44.9c-21.4-6.5-36.9-26.3-36.9-49.7 0-28.6 23.3-51.9 51.9-51.9s51.9 23.3 51.9 51.9z"></path>
                </svg>
                <div class="message-text">
                    <div class="thinking-indicator">
                        <div class="dot"></div>
                        <div class="dot"></div>
                        <div class="dot"></div>
                    </div>
                </div>`; 

        const incomingMessageDiv = createMessageElement(messageContent, "bot-message", "thinking");
        chatBody.appendChild(incomingMessageDiv);
        chatBody.scrollTo({ top: chatBody.scrollHeight, behavior: "smooth" });
        // Llama a la función de respuesta, pasando el historial global (chatHistory)
        generateBotResponse(incomingMessageDiv, chatHistory);
    }, 600);
}

// Captura "Enter" para enviar mensaje
messageInput.addEventListener("keydown", (e) => {
    const userMessage = e.target.value.trim();
    if(e.key === "Enter" && userMessage && !e.shiftKey && window.innerWidth > 768) {
        handleOutgoingMessage(e);
    }
});

// Ajustar la altura del input
messageInput.addEventListener("input", () => {
    messageInput.style.height = `${initialInputHeight}px`;
    messageInput.style.height = `${messageInput.scrollHeight}px`;
    document.querySelector(".chat-form").style.borderRadius = messageInput.scrollHeight > initialInputHeight ? "15px" : "32px";
});


// Maneja la carga de archivos (imágenes)
fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    if(!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        fileUploadWrapper.querySelector("img").src = e.target.result;
        fileUploadWrapper.classList.add("file-uploaded");
        const base64String = e.target.result.split(",")[1];

        // Almacena los datos del archivo en formato base64
        userData.file = {
            data: base64String,
            mime_type: file.type
        }
        fileInput.value = "";
    }

    reader.readAsDataURL(file);
});

// Cancela la carga del archivo
fileCancelButton.addEventListener("click", () => {
    userData.file = {};
    fileUploadWrapper.classList.remove("file-uploaded");
});

// Inicialización de Emoji Mart Picker (se mantiene como estaba)
const picker = new EmojiMart.Picker({
    theme: "light",
    skinTonePosition: "none",
    previewPosition: "none",
    onEmojiSelect: (emoji) => {
        const {selectionStart: start, selectionEnd: end} = messageInput;
        messageInput.setRangeText(emoji.native, start, end, "end");
        messageInput.focus();
    },
    onClickOutside: (e) => {
        if(e.target.id === "emoji-picker") {
            document.body.classList.toggle("show-emoji-picker");
        } else {
            document.body.classList.remove("show-emoji-picker");
        }
    }
});

document.querySelector(".chat-form").appendChild(picker);


// ⚠️ INICIO: LÓGICA DE INICIALIZACIÓN CON CARGA DE TXT ⚠️

// Función para cargar el archivo TXT y establecer el historial
const loadContext = async () => {
    try {
        // 🚨 COMENTARIO CLAVE: Reemplaza './contexto_utlvte.txt' si el archivo está en otra ubicación.
        // './' significa que está en la misma carpeta que index.html.
        const response = await fetch('./contexto_utlvte.txt'); 
        if (!response.ok) throw new Error('No se pudo cargar el archivo de contexto. Código de error: ' + response.status);

        const contextText = await response.text();
        
        // Inicializa el historial de chat con la instrucción (role: user) y el saludo (role: model)
        chatHistory = [
            {
                role: "user",
                parts: [{ text: contextText }]
            },
            {
                role: "model",
                parts: [{ text: botGreeting }]
            }
        ];
        console.log("Contexto de la UTLVTE cargado exitosamente.");
        
    } catch (error) {
        console.error("Error al inicializar el contexto:", error);
        // Si falla la carga del TXT, inicializa el chat con un mensaje de error o contexto general.
        chatHistory = [
            { role: "model", parts: [{ text: "¡Hola! He tenido un problema al cargar mi información institucional. Por favor, revisa el archivo de contexto. Mientras tanto, puedo intentar responder a preguntas generales." }] }
        ];
    }
}

// Llama a la función de carga al iniciar el script.
loadContext();

// ⚠️ FIN: LÓGICA DE INICIALIZACIÓN CON CARGA DE TXT ⚠️


// Asignación de eventos a los botones
sendMessageButton.addEventListener("click", (e) => handleOutgoingMessage(e));
document.querySelector("#file-upload").addEventListener("click", () => fileInput.click());
chatbotToggler.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
