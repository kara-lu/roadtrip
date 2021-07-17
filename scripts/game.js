"use strict";


// ------------------------ setup game screen -----------------------------------------------------
let can                 = document.getElementById('canvas1'); 
const main              = document.querySelector('#game');
let ctx                 = can.getContext('2d'); 
can.width               = 1000; 
can.height              = 3000; 
let img                 = new Image(); 
img.src                 = "images/gameboard.jpg"; 

$('.screen').hide();
$('.modal').hide();
$('#preSplash').show();

// ------------------------- golbal variables -----------------------------------------------------
let imgHeight           = 0; 
const scrollSpeed       = 2; 
const playerSpeed       = 4;
const road              = [];
let intervalCounter     = 0;
let difficultyTimer     = 0;
let obsFrequency        = 220;
let isCrash             = false;
let gameId;
let player;
let hitWhat             = "nothing";
let distanceTraveled    = 0;
let gameVolume          = 0.0;


// ------------------------------ reset function --------------------------------------------------
function reset(){
    imgHeight           = 0; 
    hitWhat             = "nothing";
    road.splice(0, road.length);
    intervalCounter     = 0;
    difficultyTimer     = 0;
    obsFrequency        = 220;
    isCrash             = false;
    $("#game").children(".obstical").remove();
    player.left         = 470;
    document.querySelector('.player').style.transform = "rotate(0deg)";
    player.speedX       = 0;
    player.speedY       = 0;
    distanceTraveled    = 0;
    $('.result').show();
}

// -------------------------------------------------------  remove unit from CSS ------------------
const stripUnits = (measurement) => {
    return Number(measurement.substring(0,measurement.length - 2));
    }
    
// ---------------------------------------------------------- game obj ----------------------------
const game = {
    isRunning: false,
    currentScreen: "#splash",
    switchScreen(screenName){
        $(this.currentScreen).hide();
        this.currentScreen = screenName;
        $(screenName).show();
        if(screenName == "#splash"){
            this.isRunning = false;
        }
        if(screenName == "#game"){
            playAudio("gameAudio");
            stopAudio("introAudio");
            this.isRunning = true;
            gameId = window.requestAnimationFrame(loop);
        }
        if(screenName == "#gameOver"){
            stopAudio("gameAudio");
            $('#quitHeader').hide();
            $('#help').hide();
            this.isRunning = false;
        }
    },
    showModal(pageName){
        $(pageName).show();
        $("#screenCover").show();
        this.isRunning = false;
    },
    createPlayer(inputName){
        player = new GameItem("player", inputName, 64, 97, 460, 470);
        player.draw();
        player.isWhat("player");
    }
}

// ---------------------------------- create obstacles & players ----------------------------------
class GameItem {
    constructor(type, inputName, width, height, top, left) {
    this.type       = type;
    this.inputName  = inputName;
    this.width      = width;
    this.height     = height;
    this.top        = top;
    this.left       = left;
    this.speedX     = 0.0;
    this.speedY     = 0.0;
    }
    //  ----------------------------------- create elements on screen -----------------------------
    draw() {
        let div = document.createElement("div");
        div.classList.add(this.type);
        div.style = `
        position: absolute;
        width:${this.width}px;
        height:${this.height}px;
        backgroundImage: url("");
        left:${this.left}px;
        top:${this.top}px;`;
        main.appendChild(div);
        this.element = div;
    }
    // -------------------------- move obstacles --------------------------------------------------
    moving(){
        this.top += scrollSpeed;
        this.element.style.top = `${this.top}px`;
    }
    // --------------------------- assign what kind of obstacle -----------------------------------
    isWhat(animal){
        this.element.style.backgroundImage = `url("images/${animal}.png")`;
        this.type = animal;
    }
    // ------------------------ collision detection -----------------------------------------------
    crash(player){
        let myleft      = stripUnits(this.element.style.left);
        let myright     = stripUnits(this.element.style.left) + stripUnits(this.element.style.width);
        let mytop       = stripUnits(this.element.style.top);
        let mybottom    = stripUnits(this.element.style.top) + stripUnits(this.element.style.height);
        let otherleft   = stripUnits(player.element.style.left);
        let otherright  = stripUnits(player.element.style.left) + stripUnits(player.element.style.width);
        let othertop    = stripUnits(player.element.style.top);
        let otherbottom = stripUnits(player.element.style.top) + stripUnits(player.element.style.height);
        let crash       = true;
        if ((mybottom < othertop) ||
        (mytop > otherbottom) ||
        (myright < otherleft) ||
        (myleft > otherright)) {
            crash = false;
        }
        return crash;
    }
}

function generateObs(){
    const obstacleNumber = Math.floor(Math.random() * 4);
    const obstacleHolder=[]; //array hold temp obstacle
        for(let i=0; i<obstacleNumber; i++){
            let roadNum = Math.floor(Math.random() * 4);
            //check if there is item in the road array
            while(obstacleHolder.includes(roadNum)){
                //generate a new number
                roadNum = Math.floor(Math.random() * 4);
            }
            obstacleHolder.push(roadNum);
            //convert road number to top left pixel.
            let roadPx = 315+roadNum*100;
            // create the obstacle
            let obs1 = new GameItem("obstical", "na", 70, 70, -80, roadPx);
            obs1.draw();
            road.push(obs1);
            //generate random type of obstacle
            const obstacleNumber = Math.floor(Math.random() * 3); 
            switch(obstacleNumber){
                case 0:
                    obs1.isWhat("moose");
                    break;
                case 1:
                    obs1.isWhat("bear");
                    break;
                default:
                    obs1.isWhat("wolf");
                    break;
            }
    }
    //clear out the temp array
    obstacleHolder.splice(0, obstacleHolder.length);
}

// ------------------------------------------------ loop for rolling background -------------------
function loop() { 
    if(game.isRunning == true){
        distanceTraveled++;
        $("#distanceTraveled").html(Math.floor(distanceTraveled/500));
        // ---------------------- adjust frequency of obstacles to appear as player progress ------
        intervalCounter++;
        difficultyTimer++;
        if(difficultyTimer >= 1000 && obsFrequency >= 130){
            obsFrequency -= 20;
            difficultyTimer=0;
        }
        // ---------------------- generate obstacles ----------------------------------------------
        // the 300 here is for a 5sec delay for the beginning of the game to show instructions
        if(intervalCounter>=(obsFrequency+300)){
            generateObs();
            intervalCounter=300;
        }
        // ----------------------- clear obstacles 10 at a time after exit the viewport ------------
        if(road.length >= 22){
            road.splice(0, road.length - 10);
        }
        
        // ---------------------- check for collision ---------------------------------------------
        for (let j=0; j < road.length; j++) {
            road[j].moving();
            if(road[j].crash(player)){
                isCrash = true;
                hitWhat = road[j].type;
            }
        }
        // ------------------------------ move player ---------------------------------------------
        player.left += player.speedX;
        player.element.style.left = `${player.left}px`;
        if(player.left <= 300){
            player.left = 300;
            player.element.style.left = `${player.left}px`;
        }
        if(player.left >= 640){
            player.left = 640;
            player.element.style.left = `${player.left}px`;
        }
        ctx.drawImage(img, 0, imgHeight); 
        ctx.drawImage(img, 0, imgHeight - can.height); 
        imgHeight += scrollSpeed; 
        if (imgHeight == can.height) {
            imgHeight = 0; 
        }
    }

    // ---------------------------- stop the game when player crash --------------------------------------
    if(isCrash == false){
        window.requestAnimationFrame(loop); 
    }
    else{
        playAudio("gameOverAudio");
        window.cancelAnimationFrame(gameId);
        $("#finalScore").html(Math.floor(distanceTraveled/500));
        $("#playerName").html(player.inputName);
        $("#hitWhatAnimal").html(hitWhat.toUpperCase());
        hitWhat = `images/${hitWhat}-dead.png`;
        $("#imgResult").attr("src",hitWhat);
        game.switchScreen("#gameOver");
    }
} 

// ------------------------------------------------ move listener ---------------------------------
window.onkeydown = function(event) {
    if(game.currentScreen == "#game"){
        event.preventDefault();
        if(event.keyCode == 39) { // right 
            player.speedX = playerSpeed;
            document.querySelector('.player').style.transform = "rotate(5deg)";
        } else if(event.keyCode == 37) { // left    
            player.speedX = -playerSpeed;
            document.querySelector('.player').style.transform = "rotate(-5deg)";
        } 
    }
}

window.onkeyup = function(event) {
    if(game.currentScreen == "#game"){
        event.preventDefault();
        document.querySelector('.player').style.transform = "rotate(0deg)";
        player.speedX = 0;
        player.speedY = 0;
    }
} 

// ----------------------------------------- audio/video ------------------------------------------
function playAudio(audioId){
    let audio = document.getElementById(audioId);
    audio.volume = gameVolume;
    audio.play();
} 
function pauseAudio(audioId){
    let audio = document.getElementById(audioId);
    audio.pause();
} 
function stopAudio(audioId){
    let audio = document.getElementById(audioId);
    audio.pause();
    audio.currentTime = 0;
}

// ---------------------------------------- buttons -----------------------------------------------

// ---------------------------------------- pre splash screen -------------------------------------
$( "#soundOff" ).click(function() {
    gameVolume = 0.0;
    $("#preSplash").hide();
    game.switchScreen("#splash");

});
$( "#soundOn" ).click(function() {
    gameVolume = 1.0;
    playAudio("introAudio");
    $("#preSplash").hide();
    game.switchScreen("#splash");
});

// ----------------------------------------splash screen ------------------------------------------
$( "#playIcon" ).click(function() {
    playAudio("affirmClick");
    game.showModal("#inputScreen");
    document.getElementById('playerImputName').value = "";
});
$("#playerImputName").keyup(function() {
    if (document.getElementById('playerImputName').value.length) {
        $("#playGame").removeClass('disabled');
    }
    else {
        $("#playGame").addClass('disabled');
    }
});
$( "#playGame" ).click(function() {
    if(!($("#playGame").hasClass("disabled"))) {
        playAudio("affirmClick");
        game.createPlayer(document.getElementById('playerImputName').value.toUpperCase());
        $('.modal').hide();
        $("#screenCover").hide();
        $("#playerDisplayName").html(player.inputName);
        $("#playGame").addClass('disabled');
        $('#overlay').show();
        setTimeout(function(){ $('#overlay').hide(); }, 5000);
        game.switchScreen("#game");
    }
    else {
        playAudio("failClick");
        $("#playerImputName").css("outline-color","#FFCC00");
        $("#playerImputName").focus();
    }
});
$( "#returnButton" ).click(function() {
    playAudio("click");
    $('.modal').hide();
    $("#screenCover").hide();
});

// -----------------------------------------------game screen -------------------------------------
$( "#pauseButton" ).click(function() {
    playAudio("click");
    pauseAudio("gameAudio");
    pauseAudio("gameSnow");
    game.showModal("#pausePage");
});

// -----------------------------------------------pause page screen -------------------------------
$( ".ok" ).click(function() {
    playAudio("click");
    $('.modal').hide();
    $("#screenCover").hide();
    playAudio("gameAudio");
    playAudio("gameSnow");
    if(game.currentScreen == "#game"){
        game.isRunning = true;
    }
});
$( "#quitButton" ).click(function() {
    playAudio("click");
    stopAudio("gameAudio");
    isCrash = true;
    $('.modal').hide();
    $("#screenCover").hide();
    $('.result').hide();
    game.switchScreen("#gameOver");
    playAudio("gameSnow");
});

// -------------------------------------------game over screen ------------------------------------
$( "#playAgainButton" ).click(function() {
    playAudio("affirmClick");
    reset();
    game.switchScreen("#game");
});
$( "#quitToSplash" ).click(function() {
    playAudio("click");
    reset();
    $("#game").children(".player").remove();
    game.switchScreen("#splash");
    playAudio("introAudio");
});