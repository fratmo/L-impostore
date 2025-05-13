function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const el = document.getElementById(screenId);
    if (el) el.classList.add('active');
}
window.showScreen = showScreen;

// public/client.js
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const wsHost = window.location.hostname;
const wsPort = window.location.port || (wsProtocol === 'wss:' ? 443 : 80);
const socket = new WebSocket(`${wsProtocol}//${wsHost}:${wsPort}`);

let myClientId = null;
let myPlayerName = null;
let currentRoomPassword = null; // Memorizza la password della stanza a cui si è connessi
let iAmHost = false;
let myCurrentRole = null; // Variabile per memorizzare il ruolo del giocatore

// --- Elementi DOM (aggiungi quelli per la Room Password) ---
const roomPasswordScreen = document.getElementById('roomPasswordScreen');
const roomPasswordInput = document.getElementById('roomPasswordInput');
const playerNameInput = document.getElementById('playerNameInput'); // Nuovo per il nome giocatore
const joinRoomButton = document.getElementById('joinRoomButton');
const roomPasswordError = document.getElementById('roomPasswordError');

const setupScreen = document.getElementById('setupScreen');
const numPlayersInput = document.getElementById('numPlayers');
const secretWordInput = document.getElementById('secretWord');
const hostRoomPasswordInput = document.getElementById('hostRoomPasswordInput'); // Password da impostare per l'host
const startGameButton = document.getElementById('startGameButton');
const setupError = document.getElementById('setupError');

const lobbyScreen = document.getElementById('lobbyScreen'); // Nuova schermata Lobby
const lobbyMessage = document.getElementById('lobbyMessage');
const lobbyPlayerList = document.getElementById('lobbyPlayerList');
const hostStartGameLobbyButton = document.getElementById('hostStartGameLobbyButton');


const roleRevealScreen = document.getElementById('roleRevealScreen');
const roleTextEl = document.getElementById('roleText');
const secretWordTextRoleEl = document.getElementById('secretWordTextRole');
const seenRoleButton = document.getElementById('seenRoleButton');

const clueScreen = document.getElementById('clueScreen');
const clueTurnTitleEl = document.getElementById('clueTurnTitle');
const clueInputEl = document.getElementById('clueInput');
const submitClueButton = document.getElementById('submitClueButton');

const discussionScreen = document.getElementById('discussionScreen');
const cluesListEl = document.getElementById('cluesList');
const startVotingButton = document.getElementById('startVotingButton'); // Ora solo per l'host

const votingScreen = document.getElementById('votingScreen');
const votingTitleEl = document.getElementById('votingTitle');
const voteButtonsContainerEl = document.getElementById('voteButtonsContainer');

const impostorGuessScreen = document.getElementById('impostorGuessScreen');
const caughtImpostorNameEl = document.getElementById('caughtImpostorName');
const impostorGuessInputEl = document.getElementById('impostorGuessInput');
const checkImpostorGuessButton = document.getElementById('checkImpostorGuessButton');

const resultScreen = document.getElementById('resultScreen');
const resultScreenMessageEl = document.getElementById('resultScreenMessage');
const finalSecretWordEl = document.getElementById('finalSecretWord');
const finalImpostorNameEl = document.getElementById('finalImpostorName');
const resetGameButton = document.getElementById('resetGameButton'); // Ora solo per l'host

const gameLogEl = document.getElementById('gameLog'); // Esistente
const playerListDiv = document.getElementById('playerList'); // Esistente
const playerNameDisplay = document.getElementById('playerNameDisplay'); // Esistente
const waitingMessageScreen = document.getElementById('waitingMessageScreen'); // Esistente
const waitingMessage = document.getElementById('waitingMessage'); // Esistente

const backgroundMusic = document.getElementById('backgroundMusic');
const muteToggleButton = document.getElementById('muteToggleButton'); // Nuovo pulsante per muto

// Elementi DOM per la Game Board Screen
const gameBoardScreen = document.getElementById('gameBoardScreen');
const gameBoardTitle = document.getElementById('gameBoardTitle');
const gameBoard = document.getElementById('game-board'); // Contenitore principale del tavolo
const myEnlargedCard = document.getElementById('my-enlarged-card');
const myRoleTextGameBoard = document.getElementById('myRoleTextGameBoard');
const mySecretWordGameBoard = document.getElementById('mySecretWordGameBoard');
const playerSpotsTopRow = document.getElementById('player-spots-top-row');
const playerSpotsBottomRow = document.getElementById('player-spots-bottom-row');
const playerSpotsLeftCol = document.getElementById('player-spots-left-col');
const playerSpotsRightCol = document.getElementById('player-spots-right-col');
const confirmRoleAndProceedButton = document.getElementById('confirmRoleAndProceedButton');

// Elementi per l'input dell'indizio sulla Game Board
const clueInputAreaGameBoard = document.getElementById('clue-input-area-gameboard');
const clueTurnTitleGameBoard = document.getElementById('clueTurnTitleGameBoard');
const clueInputGameBoard = document.getElementById('clueInputGameBoard');
const submitClueGameBoardButton = document.getElementById('submitClueGameBoardButton');
const clueErrorGameBoard = document.getElementById('clueErrorGameBoard');
const cluesListGameBoard = document.getElementById('cluesListGameBoard');


let currentGlobalGameState = {}; // Per mantenere una copia accessibile dello stato di gioco
let currentSecretWord = ''; // Per memorizzare la parola segreta del client

function addToGameLog(message) {
    console.log(message);
}

socket.onopen = () => {
    console.log('Connesso al server WebSocket.');
    showScreen('welcomeScreen');
};

socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    console.log('Server:', message);

    if (message.type === 'error') {
        console.error(`ERRORE: ${message.payload}`);
        if (document.getElementById(message.type + 'Error')) {
            document.getElementById(message.type + 'Error').textContent = message.payload;
            document.getElementById(message.type + 'Error').style.display = 'block';
        } else {
            alert(`Errore dal server: ${message.payload}`);
        }
    } else if (message.type === 'requestRoomPassword') {
        console.log('Pronto per unirsi a una partita. Usa il pulsante "Unisciti a una Partita" dalla schermata principale.');
    } else if (message.type === 'joinSuccess') {
        myClientId = message.payload.clientId;
        myPlayerName = message.payload.playerName;
        currentRoomPassword = message.payload.roomPassword;
        playerNameDisplay.textContent = `Tu: ${myPlayerName} (Stanza: ${currentRoomPassword})`;
        addToGameLog(`Unito alla stanza ${currentRoomPassword} come ${myPlayerName}`);
        playBackgroundMusic();
    } else if (message.type === 'setupSuccessHost') {
        // L'host ha creato la stanza, ora deve "unirsi" ad essa con la password che ha impostato.
        addToGameLog(`Setup riuscito! Stanza creata con PW: ${message.payload.roomPassword}. Ora unisciti.`);
        currentRoomPassword = message.payload.roomPassword; // Salva per auto-inserimento o riferimento
        // Potresti pre-compilare roomPasswordInput e playerNameInput
        // e poi inviare automaticamente joinRoom o chiedere conferma all'host.
        // Per semplicità, l'host dovrà comunque passare per la schermata 'roomPasswordScreen'
        // ma potrebbe essere automatizzato.
        roomPasswordInput.value = currentRoomPassword; // Pre-compila per l'host
        showScreen('roomPasswordScreen'); // Riporta l'host alla schermata di join per la sua stessa stanza
        playerNameInput.focus(); // L'host deve inserire il suo nome ora
    } else if (message.type === 'gameStateUpdate') {
        updateUI(message.payload);
    } else if (message.type === 'yourRole') {
        myCurrentRole = message.payload.role; // Memorizza il ruolo
        currentSecretWord = message.payload.secretWord; // Memorizza la parola segreta del client

        // Non mostriamo più roleRevealScreen, ma direttamente gameBoardScreen
        // roleTextEl.textContent = message.payload.role === 'impostore' ? '🤫 Sei L\'IMPOSTORE! 🤫' : '✅ Sei un Cittadino Onesto. ✅';
        // secretWordTextRoleEl.textContent = `Parola: ${message.payload.secretWord}`;
        
        if (currentGlobalGameState.players) {
            renderGameBoard(currentGlobalGameState.players, myCurrentRole, currentSecretWord, currentGlobalGameState.currentPhase);
        } else {
            // Se gameState non è ancora pronto, renderGameBoard sarà chiamato dal prossimo gameStateUpdate
            // Potremmo mostrare un messaggio temporaneo o fare affidamento sul fatto che yourRole arriva dopo un gameState iniziale
            myRoleTextGameBoard.textContent = myCurrentRole === 'impostore' ? '🤫 Sei L\'IMPOSTORE! 🤫' : '✅ Sei un Cittadino Onesto. ✅';
            mySecretWordGameBoard.textContent = myCurrentRole === 'onesto' ? `Parola Segreta: «${currentSecretWord}»` : (myCurrentRole === 'impostore' ? 'Non conosci la parola.' : '');
        }
        showScreen('gameBoardScreen');
        clueInputAreaGameBoard.style.display = 'none'; // Assicurati che sia nascosta inizialmente
        confirmRoleAndProceedButton.style.display = 'inline-block'; // Mostra il pulsante
        gameBoardTitle.textContent = "Controlla il tuo Ruolo!";

    } else if (message.type === 'voteResult') {
        // Questo messaggio gestisce la transizione da voto a guess dell'impostore o a risultato finale
        resultScreenMessageEl.textContent = message.payload.message;
        finalSecretWordEl.textContent = "Nascosta"; // Ancora nascosta se c'è guess
        finalImpostorNameEl.textContent = message.payload.impostorName;

        if (message.payload.nextPhase === 'impostorGuess' && message.payload.accusedIsImpostor) {
            if (myClientId === message.payload.impostorClientId) { // Sono io l'impostore!
                caughtImpostorNameEl.textContent = myPlayerName;
                impostorGuessInputEl.value = '';
                // Salva la fase corrente comunicata dal server per inviarla con il guess
                impostorGuessInputEl.dataset.currentPhaseFromServer = 'impostorGuess';
                showScreen('impostorGuessScreen');
            } else {
                showScreen('resultScreen'); // Gli altri vedono il messaggio "impostore scoperto, attende guess"
            }
        } else { // Direttamente ai risultati finali
            finalSecretWordEl.textContent = message.payload.secretWord; // Ora rivela la parola
            showScreen('resultScreen');
        }
    } else if (message.type === 'finalResult') {
        resultScreenMessageEl.textContent = message.payload.message;
        finalSecretWordEl.textContent = message.payload.secretWord;
        finalImpostorNameEl.textContent = message.payload.impostorName;
        showScreen('resultScreen');
    } else if (message.type === 'gameResetByServer') {
        addToGameLog("Il gioco è stato resettato dall'host o dal server.");
        alert("La partita è terminata o è stata resettata. Sarai reindirizzato alla schermata di join.");
        myClientId = null;
        myPlayerName = null;
        currentRoomPassword = null;
        iAmHost = false;
        playerNameDisplay.textContent = "";
        // Pulisci input se necessario
        roomPasswordInput.value = '';
        playerNameInput.value = '';
        showScreen('roomPasswordScreen'); // Torna alla schermata di inserimento password stanza
    }
};

socket.onclose = () => {
    addToGameLog('Disconnesso dal server WebSocket. Ricarica per riconnetterti.');
    alert('Connessione persa. Ricarica la pagina.');
    showScreen('roomPasswordScreen'); // O una schermata di errore di connessione
};
socket.onerror = (error) => {
    addToGameLog(`Errore WebSocket: ${error.message}. Prova a ricaricare.`);
};

// --- Funzioni per aggiornare la UI ---
function updateUI(gs) { // gs = gameState dal server
    currentGlobalGameState = gs; // Aggiorna lo stato globale
    currentRoomPassword = gs.roomPassword; // Assicurati che sia aggiornato
    if (myClientId) { // Solo se sono un giocatore valido
        iAmHost = gs.players.some(p => p.clientId === myClientId && p.isHost);
        playerNameDisplay.textContent = `Tu: ${myPlayerName} (${iAmHost ? "Host" : "Giocatore"}) - Stanza: ${gs.roomPassword || "N/D"}`;
    }

    // Aggiorna la lista dei giocatori (globale e in lobby)
    if (playerListDiv) {
        playerListDiv.innerHTML = '<h3>Giocatori Attuali:</h3>' + gs.players.map(p =>
            `<div class="${p.clientId === myClientId ? 'me' : ''} ${p.isHost ? 'host' : ''}">
                ${p.name} ${p.isHost ? "(Host)" : ""}
                ${myClientId === p.clientId ? " (Tu)" : ""}
                ${gs.currentPhase === 'clues' ? (p.hasSubmittedClue ? "✓ Indizio" : "… Indizio") : ""}
                ${gs.currentPhase === 'voting' ? (p.hasVoted ? "✓ Votato" : "… Voto") : ""}
            </div>`
        ).join('');
    }
    if (lobbyPlayerList) {
         lobbyPlayerList.innerHTML = '<h3>Giocatori nella Lobby:</h3>' + gs.players.map(p =>
            `<div class="${p.clientId === myClientId ? 'me' : ''} ${p.isHost ? 'host' : ''}">
                ${p.name} ${p.isHost ? "(Host)" : ""}
                ${myClientId === p.clientId ? " (Tu)" : ""}
            </div>`
        ).join('');
    }

    switch (gs.currentPhase) {
        case 'waitingForHost':
            // Se sono già connesso con una password, ma la fase è questa, qualcosa è andato storto (es. reset)
            // Altrimenti, il client non dovrebbe vedere questa fase, sarà in 'roomPasswordScreen'
            if (currentRoomPassword) { 
                showScreen('waitingMessageScreen');
                waitingMessage.innerHTML = "<p>L'host deve creare una nuova partita. Attendi o prova a unirti a un'altra stanza.</p>";
            } else {
                showScreen('roomPasswordScreen'); 
            }
            break;
        case 'lobby':
            showScreen('lobbyScreen');
            lobbyMessage.textContent = `In attesa di giocatori... (${gs.players.length}/${gs.expectedPlayers}) per la stanza "${gs.roomPassword}". Host: ${gs.hostName || 'N/D'}`;
            hostStartGameLobbyButton.style.display = iAmHost ? 'inline-block' : 'none';
            hostStartGameLobbyButton.disabled = !(gs.players.length >= 3 && gs.players.length === gs.expectedPlayers);
            break;
        case 'roleReveal':
            // Questa fase è ora gestita principalmente dal messaggio 'yourRole' che mostra 'gameBoardScreen'.
            // Qui, ci assicuriamo che se per qualche motivo siamo ancora in questa fase logica,
            // la gameBoardScreen sia quella attiva e renderizzata.
            // Questo potrebbe accadere se 'yourRole' arriva prima del 'gameStateUpdate' che cambia fase.
            if (gameBoardScreen.classList.contains('active')) {
                 renderGameBoard(gs.players, myCurrentRole, currentSecretWord, gs.currentPhase);
            } else {
                // Fallback se 'yourRole' non ha ancora mostrato la game board
                // Ma idealmente, 'yourRole' dovrebbe aver già gestito la visualizzazione.
                showScreen('gameBoardScreen');
                renderGameBoard(gs.players, myCurrentRole, currentSecretWord, gs.currentPhase);
            }

            const myPlayerForRoleCheck = gs.players.find(p => p.clientId === myClientId);
            if (myPlayerForRoleCheck && myPlayerForRoleCheck.hasSeenRole) {
                // Se ho già visto il ruolo (e.g. cliccato "Ho Capito"),
                // e sto aspettando gli altri.
                gameBoardTitle.textContent = "In attesa degli altri giocatori...";
                confirmRoleAndProceedButton.style.display = 'none';
                clueInputAreaGameBoard.style.display = 'none';
            } else {
                 gameBoardTitle.textContent = "Controlla il tuo Ruolo!";
                 confirmRoleAndProceedButton.style.display = 'inline-block';
            }
            break;
        case 'clues':
            showScreen('gameBoardScreen'); // Assicurati che sia la schermata attiva
            renderGameBoard(gs.players, myCurrentRole, currentSecretWord, gs.currentPhase);
            confirmRoleAndProceedButton.style.display = 'none'; // Nascondi se ancora visibile

            const myPlayerForClue = gs.players.find(p => p.clientId === myClientId);
            if (myPlayerForClue && !myPlayerForClue.hasSubmittedClue) {
                clueInputAreaGameBoard.style.display = 'flex';
                let titleText = "È il tuo turno di dare un indizio.";
                if (myCurrentRole === 'impostore') {
                    titleText = "🤫 Sei L'IMPOSTORE! Inventa un indizio credibile.";
                } else if (myCurrentRole === 'onesto') {
                    titleText = "✅ Sei un Cittadino Onesto. Dai il tuo indizio:";
                }
                clueTurnTitleGameBoard.textContent = titleText;
                submitClueGameBoardButton.disabled = false;
                clueInputGameBoard.disabled = false;
                clueInputGameBoard.focus();
                gameBoardTitle.textContent = "Fase degli Indizi";
            } else {
                clueInputAreaGameBoard.style.display = 'none';
                gameBoardTitle.textContent = "Fase degli Indizi (Attendi...)";
            }
            // Aggiorna la lista degli indizi dati finora sulla gameboard
            cluesListGameBoard.innerHTML = ''; // Pulisci
            if (gs.cluesSubmitted && gs.cluesSubmitted.length > 0) {
                gs.cluesSubmitted.forEach(c => {
                    const li = document.createElement('li');
                    li.textContent = `${c.playerName}: ${c.clue}`;
                    cluesListGameBoard.appendChild(li);
                });
            } else {
                cluesListGameBoard.innerHTML = '<li>Nessun indizio ancora.</li>';
            }
            break;
        case 'discussion':
            showScreen('gameBoardScreen'); // La game board rimane visibile
            renderGameBoard(gs.players, myCurrentRole, currentSecretWord, gs.currentPhase);
            clueInputAreaGameBoard.style.display = 'none'; // Nascondi input indizio
            gameBoardTitle.textContent = "Discussione!";
            
            // Potremmo mostrare gli indizi in modo più prominente sulla gameboard
            // Per ora, la logica di discussionScreen (se usata) o una nuova area su gameBoardScreen
            // dovrebbe mostrare tutti gli indizi. La cluesListGameBoard già li mostra.
            // L'host vede il pulsante per avviare il voto (da discussionScreen o integrato qui)
            if(startVotingButton) startVotingButton.style.display = iAmHost ? 'inline-block' : 'none';
            // TODO: Integrare meglio la visualizzazione degli indizi per la discussione
            // e il pulsante startVotingButton se discussionScreen viene rimossa.
            // Per ora, la vecchia discussionScreen potrebbe ancora essere usata come modale.
            // O, potremmo aggiungere un pulsante "Vai alla discussione" che mostra una modale con gli indizi.
            // Per semplicità, se si vuole ancora usare discussionScreen:
            // showScreen('discussionScreen'); // Questo sovrascriverebbe gameBoardScreen
            // Quindi, per ora, la gameBoardScreen mostra solo il tavolo e i giocatori.
            // La logica di startVotingButton è ancora legata alla discussionScreen.
            // Per ora, assumiamo che la `discussionScreen` venga ancora usata separatamente
            // se l'utente vuole cliccare "Procedi alla votazione (Host)".
            // Se vogliamo integrarla, dobbiamo spostare startVotingButton e la lista indizi qui.
            // Per il momento, commento la riga che forza la discussionScreen se presente
            // e lascio la gameBoardScreen come sfondo.
            // cluesListEl.innerHTML = '<h3>Indizi Finali (Discutete!):</h3>';
            // let displayClues = [...gs.cluesSubmitted];
            // displayClues.forEach(clueData => {
            // const li = document.createElement('li');
            // li.classList.add('clue-item');
            // li.textContent = `${clueData.playerName}: ${clueData.clue}`;
            // if(cluesListEl) cluesListEl.appendChild(li);
            // });
            break;
        case 'voting':
            // Anche qui, idealmente il voto avverrebbe sulla gameBoardScreen
            // Ma per ora, potremmo ancora usare la votingScreen esistente.
            showScreen('votingScreen'); // Manteniamo la vecchia per ora
            // ... (la logica di votingScreen rimane invariata)
            break;
        case 'impostorGuess': // Questa fase è gestita da 'voteResult' per il client specifico
            // Se non sono l'impostore, dovrei essere in 'resultScreen' con un messaggio di attesa
            if (myClientId !== finalImpostorNameEl.dataset.impostorClientId) { // Usa un dataset per l'ID
                showScreen('resultScreen');
                resultScreenMessageEl.textContent = "L'impostore è stato scoperto! In attesa della sua ipotesi sulla parola...";
            }
            break;
        case 'results': // Questa fase è gestita da 'finalResult' o da 'voteResult' se non c'era guess
            // Se la UI non è già su resultScreen, qualcosa è strano, ma per sicurezza:
            if (resultScreen.style.display !== 'block') {
                 showScreen('resultScreen');
                 // Il contenuto di resultScreenMessageEl dovrebbe essere già stato impostato
                 // dai messaggi 'voteResult' o 'finalResult'.
            }
            resetGameButton.style.display = iAmHost ? 'inline-block' : 'none'; // Solo host resetta
            break;
        default:
            console.warn("Fase sconosciuta dal server:", gs.currentPhase);
            if (!currentRoomPassword) showScreen('roomPasswordScreen');
            else showScreen('waitingMessageScreen'); // Fallback generico se in una stanza
    }
}

// --- Handler per le azioni dell'utente ---
if (joinRoomButton) {
    joinRoomButton.onclick = () => {
        const rp = roomPasswordInput.value.trim();
        const pn = playerNameInput.value.trim() || `Giocatore Anonimo`; // Nome di default
        roomPasswordError.style.display = 'none';
        if (rp && pn) {
            socket.send(JSON.stringify({ type: 'joinRoom', payload: { roomPassword: rp, playerName: pn } }));
        } else {
            roomPasswordError.textContent = "Inserisci Room Password e il tuo Nome.";
            roomPasswordError.style.display = 'block';
        }
    };
}

if (startGameButton) {
    console.log('startGameButton trovato nel DOM, sto collegando il listener onclick.');
    startGameButton.onclick = () => {
        console.log('Pulsante "Crea Stanza e Procedi" cliccato!');

        // Verifica che tutti gli elementi necessari esistano
        if (!numPlayersInput || !secretWordInput || !hostRoomPasswordInput || !setupError || !waitingMessage || !socket) {
            console.error('Errore critico: Uno o più elementi DOM o il socket non sono inizializzati correttamente per startGameButton.', {
                numPlayersInputExists: !!numPlayersInput,
                secretWordInputExists: !!secretWordInput,
                hostRoomPasswordInputExists: !!hostRoomPasswordInput,
                setupErrorExists: !!setupError,
                waitingMessageExists: !!waitingMessage,
                socketExists: !!socket
            });
            if (setupError) {
                setupError.textContent = 'Errore interno di configurazione. Ricarica la pagina.';
                setupError.style.display = 'block';
            }
            return;
        }

        const numP = numPlayersInput.value;
        const secretW = secretWordInput.value.trim();
        const roomPW = hostRoomPasswordInput.value.trim();
        setupError.style.display = 'none'; // Nascondi errori precedenti

        console.log('Valori dal form di setup:', { numP, secretW, roomPW });

        if (numP && secretW && roomPW) {
            if (parseInt(numP) < 3) {
                 console.warn('Numero di giocatori troppo basso:', numP);
                 setupError.textContent = "Il numero minimo di giocatori è 3.";
                 setupError.style.display = 'block';
                 return;
            }

            if (socket.readyState !== WebSocket.OPEN) {
                console.error('WebSocket non è aperto. Stato attuale:', socket.readyState);
                setupError.textContent = "Connessione al server non ancora attiva. Attendi e riprova.";
                setupError.style.display = 'block';
                return;
            }
            
            console.log('Invio del messaggio "setupGame" al server:', { numPlayers: numP, secretWord: secretW, roomPassword: roomPW });
            socket.send(JSON.stringify({
                type: 'setupGame',
                payload: { numPlayers: numP, secretWord: secretW, roomPassword: roomPW }
            }));
            
            console.log('Passaggio alla schermata "waitingMessageScreen".');
            showScreen('waitingMessageScreen'); // Utilizza la funzione showScreen globale
            waitingMessage.innerHTML = "<p>Creazione stanza in corso... Sarai reindirizzato per unirti.</p>";
        } else {
            console.warn('Validazione fallita: mancano uno o più campi per il setup.');
            setupError.textContent = "Compila tutti i campi: Numero Giocatori, Parola Segreta e Password Stanza.";
            setupError.style.display = 'block';
        }
    };
} else {
    console.error('ERRORE CRITICO: Il pulsante startGameButton (id="startGameButton") non è stato trovato nel DOM!');
}

if (hostStartGameLobbyButton) {
    hostStartGameLobbyButton.onclick = () => {
        if (iAmHost) {
            socket.send(JSON.stringify({ type: 'startGameFromLobby' }));
        }
    };
}

if (seenRoleButton) {
    seenRoleButton.onclick = () => {
        socket.send(JSON.stringify({ type: 'seenRole' }));
    };
}

if (submitClueButton) {
    submitClueButton.onclick = () => {
        const clue = clueInputEl.value.trim();
        if (clue && myClientId) {
            socket.send(JSON.stringify({ type: 'submitClue', payload: { clue: clue } })); // playerId non serve più, il server lo sa
            clueInputEl.value = '';
        } else if (!clue) {
            alert("L'indizio non può essere vuoto.");
        }
    };
}

if (startVotingButton) { // Ora solo per l'host
    startVotingButton.onclick = () => {
        if (iAmHost) {
            socket.send(JSON.stringify({ type: 'startVoting' }));
        }
    };
}

function castVote(votedPlayerClientId) {
    if (myClientId) {
        socket.send(JSON.stringify({ type: 'castVote', payload: { votedPlayerId: votedPlayerClientId } }));
    }
}

if (checkImpostorGuessButton) {
    checkImpostorGuessButton.onclick = () => {
        const guess = impostorGuessInputEl.value.trim();
        const phaseFromServer = impostorGuessInputEl.dataset.currentPhaseFromServer; // Recupera la fase
        if (guess && myClientId) {
            socket.send(JSON.stringify({ type: 'impostorSubmitGuess', payload: { guess: guess, currentPhaseFromServer: phaseFromServer } }));
            impostorGuessInputEl.value = '';
        }
    };
}

if (resetGameButton) { // Ora solo per l'host
    resetGameButton.onclick = () => {
        if (iAmHost && confirm("Sei sicuro di voler resettare la partita per tutti?")) {
            socket.send(JSON.stringify({ type: 'resetGameByHost' }));
            // Reset variabili locali del client
            myCurrentRole = null;
            currentSecretWord = '';
            currentGlobalGameState = {};
        }
    };
}

if (confirmRoleAndProceedButton) {
    confirmRoleAndProceedButton.onclick = () => {
        socket.send(JSON.stringify({ type: 'seenRole' }));
        confirmRoleAndProceedButton.style.display = 'none'; // Nascondi il pulsante
        gameBoardTitle.textContent = "In attesa degli altri giocatori...";
        // L'area per l'indizio verrà mostrata quando la fase diventa 'clues'
    };
}

if (submitClueGameBoardButton) {
    submitClueGameBoardButton.onclick = () => {
        const clue = clueInputGameBoard.value.trim();
        clueErrorGameBoard.style.display = 'none';
        if (clue && myClientId) {
            // Verifica aggiuntiva se è una parola singola (opzionale)
            if (clue.includes(' ')) {
                clueErrorGameBoard.textContent = "L'indizio deve essere una sola parola.";
                clueErrorGameBoard.style.display = 'block';
                return;
            }
            socket.send(JSON.stringify({ type: 'submitClue', payload: { clue: clue } }));
            clueInputGameBoard.value = '';
            // clueInputAreaGameBoard.style.display = 'none'; // Nascondi dopo l'invio
        } else if (!clue) {
            clueErrorGameBoard.textContent = "L'indizio non può essere vuoto.";
            clueErrorGameBoard.style.display = 'block';
        }
    };
}

// Inizializzazione UI
console.log("In attesa di istruzioni dal server...");
showScreen('welcomeScreen');

function playBackgroundMusic() {
    if (backgroundMusic && backgroundMusic.paused) {
        const savedVolume = localStorage.getItem('musicVolume');
        const currentVolume = savedVolume !== null ? parseFloat(savedVolume) : 0.2; // Default 20%
        backgroundMusic.volume = currentVolume;

        if (currentVolume > 0) { // Tenta di suonare solo se il volume non è muto
            backgroundMusic.play().then(() => {
                console.log("Musica avviata.");
                backgroundMusic.muted = false; // Assicurati che non sia muto
                updateMuteButtonIcon(false); // Musica non muta
            }).catch(error => {
                console.warn("Errore riproduzione musica (o autoplay bloccato):", error);
                updateMuteButtonIcon(true); // Considera muta se non parte
            });
        } else {
            backgroundMusic.muted = true; // Muta se il volume è 0
            updateMuteButtonIcon(true); // Muta se il volume è 0
        }
    } else if (backgroundMusic && !backgroundMusic.paused) {
        // Se già in play, aggiorna l'icona del muto
        updateMuteButtonIcon(backgroundMusic.muted || backgroundMusic.volume === 0);
    }
}

// Funzione per aggiornare l'icona del pulsante Muto/Suono
function updateMuteButtonIcon(isMuted) {
    if (muteToggleButton) {
        muteToggleButton.textContent = isMuted ? '🔇' : '🔊';
    }
}

// Gestione del pulsante Muto/Suono
if (muteToggleButton) {
    muteToggleButton.onclick = () => {
        if (backgroundMusic) {
            if (backgroundMusic.muted || backgroundMusic.volume === 0) {
                // Unmute: ripristina un volume precedente o default
                let previousVolumeNonMute = parseFloat(localStorage.getItem('musicVolumeNonMute')) || 0.2;
                if (previousVolumeNonMute === 0) previousVolumeNonMute = 0.2; // Fallback se il volume non-muto salvato era 0
                
                backgroundMusic.volume = previousVolumeNonMute;
                backgroundMusic.muted = false;
                localStorage.setItem('musicVolume', previousVolumeNonMute.toString());
                localStorage.setItem('isMutedByUser', 'false'); // STATO MUTE UTENTE
                updateMuteButtonIcon(false);
                if (backgroundMusic.paused) {
                    backgroundMusic.play().catch(e => console.warn("Play dopo unmute fallito", e));
                }
            } else {
                // Mute: salva il volume corrente (se > 0) prima di mutare
                if (backgroundMusic.volume > 0) {
                    localStorage.setItem('musicVolumeNonMute', backgroundMusic.volume.toString());
                }
                backgroundMusic.muted = true;
                localStorage.setItem('isMutedByUser', 'true'); // STATO MUTE UTENTE
                updateMuteButtonIcon(true);
            }
        }
    };
}

// All'apertura della modale impostazioni, aggiorna lo slider e l'icona del muto
/*
if (settingsButton) {
    settingsButton.onclick = () => {
        if (backgroundMusic && volumeSlider) {
            volumeSlider.value = backgroundMusic.muted ? 0 : backgroundMusic.volume;
            updateMuteButtonIcon(backgroundMusic.muted || backgroundMusic.volume === 0);
        }
        showScreen('settingsModal');
    };
}
*/

// Assicurati che playBackgroundMusic() sia ancora chiamata in socket.onmessage -> joinSuccess
// (Questo è già gestito dalla chiamata playBackgroundMusic in socket.onopen -> joinSuccess)
// Ma possiamo inizializzare l'icona del pulsante muto subito:
if (backgroundMusic && muteToggleButton) { // Aggiunto controllo per muteToggleButton
    const initialVolume = parseFloat(localStorage.getItem('musicVolume')) || 0.2;
    const isMuted = initialVolume === 0 || localStorage.getItem('isMutedByUser') === 'true';
    
    backgroundMusic.volume = initialVolume;
    backgroundMusic.muted = isMuted;
    updateMuteButtonIcon(isMuted);

    // Tenta di avviare la musica all'avvio della pagina
    playBackgroundMusic(); 
}

// Funzione per renderizzare il tavolo da gioco
function renderGameBoard(players, localPlayerRole, localSecretWord, currentPhase) {
    if (!gameBoardScreen.classList.contains('active')) {
        // Non fare il rendering se la schermata non è attiva,
        // a meno che non sia la prima volta (gestito da yourRole)
    }

    // 1. Pulisci le aree dei giocatori
    playerSpotsTopRow.innerHTML = '';
    playerSpotsBottomRow.innerHTML = '';
    playerSpotsLeftCol.innerHTML = '';
    playerSpotsRightCol.innerHTML = '';

    // 2. Mostra la carta del giocatore corrente
    if (localPlayerRole) {
        myRoleTextGameBoard.textContent = localPlayerRole === 'impostore' ? '🤫 Sei L\'IMPOSTORE! 🤫' : '✅ Sei un Cittadino Onesto. ✅';
        mySecretWordGameBoard.textContent = localPlayerRole === 'onesto' ? `Parola: «${localSecretWord}»` : (localPlayerRole === 'impostore' ? 'Non conosci la parola.' : '');
    }


    // 3. Distribuisci gli altri giocatori
    const otherPlayers = players.filter(p => p.clientId !== myClientId);
    const numOtherPlayers = otherPlayers.length;

    // Logica di distribuzione semplice (da migliorare per un vero cerchio)
    // Esempio: fino a 3 in alto, 1 a sx, 1 a dx, restanti in basso.
    // Questo è un esempio, può essere molto più sofisticato. Max 7 altri giocatori per questo layout.
    const spots = {
        top: [],
        left: [],
        right: [],
        bottom: []
    };

    otherPlayers.forEach((player, index) => {
        if (index < 3 && spots.top.length < 3) spots.top.push(player);
        else if (index < 4 && spots.left.length < 1) spots.left.push(player);
        else if (index < 5 && spots.right.length < 1) spots.right.push(player);
        else if (spots.bottom.length < 3) spots.bottom.push(player); // Max 3 in basso
        // Per più giocatori, questo layout andrebbe rivisto.
    });
    
    const createPlayerSpotElement = (player) => {
        const spot = document.createElement('div');
        spot.classList.add('player-spot');
        spot.dataset.playerId = player.clientId;
        
        const nameEl = document.createElement('div');
        nameEl.classList.add('player-name');
        nameEl.textContent = player.name;
        spot.appendChild(nameEl);

        if (currentPhase === 'clues' || currentPhase === 'discussion' || currentPhase === 'voting') {
            const statusEl = document.createElement('div');
            statusEl.classList.add('player-status');
            if (currentPhase === 'clues') {
                 statusEl.textContent = player.hasSubmittedClue ? '✓ Indizio' : '… Attesa indizio';
            } else if (currentPhase === 'voting') {
                statusEl.textContent = player.hasVoted ? '✓ Votato' : '… Attesa voto';
            }
            spot.appendChild(statusEl);
        }
        return spot;
    };

    spots.top.forEach(p => playerSpotsTopRow.appendChild(createPlayerSpotElement(p)));
    spots.left.forEach(p => playerSpotsLeftCol.appendChild(createPlayerSpotElement(p)));
    spots.right.forEach(p => playerSpotsRightCol.appendChild(createPlayerSpotElement(p)));
    spots.bottom.forEach(p => playerSpotsBottomRow.appendChild(createPlayerSpotElement(p)));
}
