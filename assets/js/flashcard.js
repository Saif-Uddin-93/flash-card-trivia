$(document).ready(function() {
  // set the localStorage to default
  const setLocalStorage = {
    "theme": "light",    
    "categoryDone": [],                    
    "notification": true,
    "maxScore": 0,
  }

  // Function to get data from the localStorage
  const getLocalStorage = () => {   
    const storage = JSON.parse(localStorage.getItem('flashcard'));
    if(!storage){
      localStorage.setItem('flashcard', JSON.stringify(setLocalStorage));
    }
    return storage === null ? setLocalStorage : storage;
  }  
  
  // Initialize game variables
  const categories = words; // categories stored in 'assets/js/words.js' file
  let wordsList = []; // array of words from choosen category
  let currentWordIndex = 0; // word index in specified category
  let currentWord = ""; // current word
  let currentHint = ""; // current image hint
  let guessedLetters = []; // guessed letters 
  let score = 0; // Current game score
  let gameStarted = false; // Flag to check if the game has started  
  let showMessages = true; // Flag to show messages
  let incorrectGuessCounter = 0; // Counter for incorrect guesses
  
  // Initialize localStorage 
  const flashcardSettings = getLocalStorage();

  // Function to show word input at the top or bottom, depend of the screen size
  const checkScreenSize = () => {
    const screenSize = window.innerWidth;
  
    // If the screen size is smaller than 768px
    if (screenSize <= 768) {
      // Show mobile version word input at the top of the image      
      $('#screen-keyboard').show();
      // Hide the desktop version word input below image
      $('#desktop').hide();
    } else {
      // Show desktop version
      $('#desktop').show();
      // Hide mobile version
      $('#screen-keyboard').hide();
    }
  }

  // Initial check for screen size on page load
  checkScreenSize();
  
  // Function to update data in localStorage
  const updateLocalStorage = (prop, change) => {     
    
    // If prop is category is updated
    if(prop === 'categoryDone'){
      flashcardSettings[prop].push(change); // add done category to the list     
    }

    // Ensure flashcardSettings is an object
    if(flashcardSettings && prop !== 'categoryDone'){      
      flashcardSettings[prop] = change;           
    }

    return localStorage.setItem('flashcard', JSON.stringify(flashcardSettings));
  }

  // Function to update game settings
  const updateSettings = () => {
    const notification = flashcardSettings['notification'];
    showMessages = notification; // reset messages flag
        
    const theme = flashcardSettings['theme'];        
    document.documentElement.setAttribute('data-theme', theme);
  }
  
  // Update the game settings
  updateSettings();

  // Helper function to deactive completed categories
  const deactivateCategory = (category) => {
    // target an element by its data-cat 
    $(`.category[data-cat='${category}']`)
    .prop('disabled', true)
    .addClass('cat-disabled')
    .css({      
      'filter': 'blur(1.5px)',      
    });
  };

  // Helper function to activate the next aviable category 
  const activateNextCategory = () => {  
    // Find the next available category
    /**
     * - find the first elements with a class of 'category' 
     * - first element that not include "disabled" attribute   
     */    
    const nextCategory = $('.category[data-cat]:not([disabled]):first');
 
    // Object has properties, it's not empty
    if (Object.keys(nextCategory).length > 0) {
      // Remove the 'cat-active' class from the current active category
      $('.cat-active').removeClass('cat-active');

      // Add the 'cat-active' class to the next available category
      nextCategory.addClass('cat-active');
    }    
  };

  // Check the localStorage if user alredy played any of the games
  const categoryDone = () => {          
    const completedCategories = flashcardSettings.categoryDone;    

    // Check if there are completed categories
    if(completedCategories && completedCategories.length > 0) {

      // Deactivate the current category if it's completed
      completedCategories.forEach((category) => {
        deactivateCategory(category);
      });
      
      // Activate the next category
      activateNextCategory();
      
      // Check if all categories are completed           
      if(categories.length === completedCategories.length){
        $('#flashcard-start')
        .prop('disabled', true)
        .addClass('start-disabled')
        .css({      
          'filter': 'blur(1.5px)',  
        });
      }
    }
  }

  // Check all catetegories and disable completed
  categoryDone();
 
  // Function to initialize or reset the game
  const initializeGame = () => {
    // Show the spinner when fetching the image
    $('#loading-container').show(); // display 'block'

    // Get the current word
    currentWord = wordsList[currentWordIndex].word.toUpperCase();
    
    // Get the current hint
    currentHint = wordsList[currentWordIndex].hint
    
    // Get new image based on the current word
    fetchImage(currentWord)
    .then(data => {    
           
      // Shufle the fetched response images to give new image with the same word
      const {src, alt} = shuffleArray(data.photos)[0];   
     
      // Append image to the flashcard container     
      $('#find-image').attr('src', src.large).attr('alt', alt);  
      
      // Append hint to the image
      $('#flashcard-back-hint').text(currentHint);  
    })
    .catch(error => console.error('Error fetching image:', error))
    .finally(() => {      
      // Hide the spinner once the fetch is complete, whether successful or not
      $('#loading-container').hide();

      // Display image
      $('.find-image').css('display', 'block');
    
      // Show progress for the current category
      progressBar(wordsList.length);

      // Reset the flashcard variables for the new image
      guessedLetters = []; // Reset container for the guessed word        
      updateWordDisplay(); // Update the display
      updateScoreDisplay(); // Update the score
    });
  }

  // Function to get random image from Giphy API
  const getGiphyImage = () => {

    const apiKey = 'KxSLe48BfrpadglcvAuDFWOgO04g6hkD';
    const url = `https://api.giphy.com/v1/gifs/search?q=wizard&api_key=${apiKey}
    `;

    fetch(url)
    .then(response => response.json())
    .then(data => {   
               
      shuffleArray(data.data); // randomize fetched data
      
      // Crate the url with first random image 
      $('#giphy').attr('src', data.data[0].images.fixed_height.url).attr('alt', data.data[0].title);     
    })
    .catch(error => console.error('Error fetching image:', error))
  }
   
  // Function to track progress of completed words
  const progressBar = (numOfImages) => {    
    let progress = 0;

    if(numOfImages > 0) {
      // Caluculate progress bar values for each image
      progress = ((currentWordIndex + 1) / numOfImages) * 100;
    }

    // Display progress bar
    $('#progress').css('width', `${progress}%`); 

    // Display divider for the progress bar
    if(currentWordIndex + 1 >= numOfImages){
      $('#progress').css('border-right', 'none');
    }else {
      $('#progress').css('border-right', '1px solid rgba(0, 59, 98,0.45)');
    }  

  }
 
  // Function to update both versions top and bottom the word display on the screen
  const updateWordDisplay = () => {    
    const wordContainerTop = $('#guess-word-top');
    const wordContainerBottom = $('#guess-word-bottom');

    // Clear the word container before updating display on the screen
    wordContainerTop.empty();
    wordContainerBottom.empty(); 

    // Generate word for both top & bottom containers    
    for (const letter of currentWord) {
      const letterContainerTop = $('<div>');
      const letterContainerBottom = $('<div>');

      // If the user guessed a letter show on the screen
      if (guessedLetters.includes(letter)) {
        letterContainerTop.text(letter);
        letterContainerBottom.text(letter);
      } else {
        // Otherwise show underscore on the screen
        letterContainerTop.text('_');
        letterContainerBottom.text('_');
      }
      wordContainerTop.append(letterContainerTop);
      wordContainerBottom.append(letterContainerBottom);
    }
    
    // show the generated word on the screen
    $('.guess-word').css('visibility', 'visible');    
  }

  // Function to update the score display on the screen
  const updateScoreDisplay = () => {
    $('#flashcard-points').text(`Score: ${score}`);
  }

  // Function to show the message in the center of the screen
  const messageDisplay = (str, id, time) => {
    const msg = $(`#${id}`);

    msg.text(str);
    msg.show();

    // Hide the message after x sec
    setTimeout(() => {      
      msg.hide();
      msg.text('').removeAttr('style');
    }, time);
  }

  // Show the message in the main screen
  if(showMessages) {
    messageDisplay('🏆 Your Highest Score', 'flashcard-msg-bottom', 3000);
  }
  
  // Function to 'blink' background in red on wrong answers
  const blinkScreen= (classType) => {
    const blink = $('#flashcard-blink');
    blink.addClass(classType);

    // Hide the message after 1sec
    setTimeout(() => {            
      blink.removeClass(classType);
    }, 1000);
  }

  // Function to display hearts 
  const heartDisplay = (num, opacity) => {
    const heart = $(`#flashcard-heart${num}`);
    heart.css('opacity', opacity); 
  }

  // Function to restoring the hearts display
  const updateHeartDisplay = () => {
    const totalHearts = $('.flashcard-hears').length;
    $('.flashcard-hears').each(function(index, _) {
      let reversedIndex = totalHearts - index;          
      heartDisplay(reversedIndex, 1);
    });
  }

  // Function to restore image display
  const imageDisplay = (opacity) => {
    $('#find-image').css('opacity', opacity);
  }

  // Update the Max Score
  const maxScoreDisplay = () => {
    if(flashcardSettings.maxScore > 0) {
      $('#flashcard-trophy-num').text(flashcardSettings.maxScore);
    }
  }

  // Update max score to the user
  maxScoreDisplay();
 
  // Function to handle key presses
  const handleKeyPress = (e) => {
    const pressedKey = e;
    
    // Check if the pressed key is a letter and hasn't been guessed before
    // If it finds a match, it returns true, otherwise it returns false.
    if (/^[A-Z]$/.test(pressedKey) && !guessedLetters.includes(pressedKey)) {
      guessedLetters.push(pressedKey);

      // Check if the guessed letter is in the word
      if (currentWord.includes(pressedKey)) {        
        updateWordDisplay();

        // Check if all letters were guessed
        if (!currentWord.split('').some(letter => !guessedLetters.includes(letter))) {         
          score += 1; // Update the score
         
          // Update the localStorage score property        
          if(score >= flashcardSettings.maxScore){
            updateLocalStorage('maxScore', score);
          }

          // Get current image index 
          const totalWords = Number($('#flashcard-number').text().split('/')[0]);
        
          // Display current image number / Total number of words for that category
          if(totalWords < wordsList.length){            
            $('#flashcard-number').text(`${totalWords + 1}/${wordsList.length}`);
          }

          updateScoreDisplay(); // Update the score display       
          handleNextWordClick(); // Move to the next word
        } 
        
      } else {        
        // If letter is not in the currentWord  
        blinkScreen('blink-error');       
                
        // Increment the incorrect guess counter
        incorrectGuessCounter++;

        // Remove heart with each incorrect guess
        heartDisplay(incorrectGuessCounter, 0);

        // Show the message to the user when one life/heart left
        if(showMessages && incorrectGuessCounter === 2) {
          messageDisplay('❤️ One live left!', 'flashcard-msg-bottom', 5000);
        }
        
        // Check if user has made three incorrect guesses
        if (incorrectGuessCounter >= 3) {

          // Set the last guessed image to 35% opacity before showing the message
          imageDisplay(0.35);

          // Disable key press   
          gameStarted = false;

          // User lost meaasge
          messageDisplay('Sorry, you lost. Better luck next time.', 'flashcard-msg', 3000);
          
          setTimeout(() => {            
            showEndGameScreen(score, false); // End the game with a loss
          }, 3000)
        }
      }
    }
  }

  // Function to handle the next 'WORD' button click
  const handleNextWordClick = () => {
    currentWordIndex += 1; // Increment the current word index
    
    maxScoreDisplay(); // Update the max scofre with each new image

    // If the current word index is less than the current word length
    // then fetch the next image
    if (currentWordIndex < wordsList.length) {
      initializeGame();
    } else {

      // Set the last guessed image to 35% opacity before showing the message    
      imageDisplay(0.35);

      // Disable key press   
      gameStarted = false;
      
      // Get the user's choosen category
      const activeCategory = ($('.cat-active').data('cat')).toUpperCase();

      // User won message with current completed category
      messageDisplay(`Congratulations! You\'ve unlocked the ${activeCategory} category`, 'flashcard-msg', 3000);

      maxScoreDisplay();  // Update the score max user score      
     
      // User has finished the game
      setTimeout(()=>{
        showEndGameScreen(score, true);
      },3000)
    }
  }

  // Function to show the end game screen
  function showEndGameScreen(totalScore, win) {    
   
    $('.guess-word').empty(); // Empty the 'WORD' container

    if(win){
      // Find active category
      const activeCategory =  $('.cat-active').data('cat');

      // Update localStore with completed categories
      updateLocalStorage('categoryDone', activeCategory);
      
      // If youer completed all categories 
      if(categories.length === flashcardSettings.categoryDone.length){
        // Clear any elements in the container
        $('#end-game-buttons').empty();

        // Create new button
        const finalBtn = $('<button>');        

        // Create final message button
        finalBtn.attr('type', 'button')
        .addClass('btn btn-modal')        
        .attr('data-bs-toggle', 'modal')
        .attr('data-bs-target', '#finalMessage')       
        .text('Finish Game');

        // Get random image from Giphy API
        getGiphyImage();

        // Append button to DOM
        $('#end-game-buttons').append(finalBtn);   

      }else{         
        // Hide buton is continuing game   
        $('#reset-game').hide();

        // Get all buttons in the 'end-game-buttons' container
        const isOneButton = $('#end-game-buttons').find('button');
        
        // Check if the 'Continue' buton alredy exist 
        if(isOneButton.length === 1){
          const continueBtn = $('<button>');
          continueBtn.addClass('btn btn-modal').attr("id", "continue-game").text('Continue');
  
          $('#end-game-buttons').append(continueBtn);   
        }

        // Event listener to continue the flashcard game on user win      
        $('#continue-game').on('click', function continueGame() {
          
          // Update hearts opacity
          updateHeartDisplay();      
          
          // Update image opacity
          imageDisplay(1);
  
          // Disable completed categories
          categoryDone();
  
          // Reset the elements state        
          $('#flashcard-outer').show(); // Show flashcard category menu        
          $('#end-game-container').hide(); // Show the end game screen                
          $('#guess-word-top').empty(); // Remove any existing word from the top
          $('#guess-word-bottom').empty(); // Remove any existing word from the bottom
          $('#continue-game').remove(); // Remove
          $('#end-game-message').text('');
          incorrectGuessCounter = 0; // Reset the incorrect guess for the next category
          score = 0;  // Rest the score
          
          // Show user message how to reset the settings
          if(showMessages) {
            messageDisplay('Reset category in ⚙️ settings', 'flashcard-msg-bottom', 4000);
          }

        });
      }      
    }

    // Display score after win or loss game
    $('#end-game-message').text(`Total Score: ${totalScore} points`);

    // Hide container of guessed words  
    $('#guess-word-top').css('visibility', 'hidden'); // Top
    $('#guess-word-bottom').css('visibility', 'hidden'); // Bottom

    // Hide keyboard icon for smaller screens
    $('.keyboard').removeClass('keyboard-visible');

    // Show user message how to exit the game
    if(showMessages) {
      messageDisplay('✖ to Exit the Game', 'flashcard-msg-bottom', 4000);
    }

    // Show the end game screen
    $('#end-game-container').show();
  }

  // Function to Sorting words array in random order
  const shuffleArray = (array) => {        
    /**
     * Subtracting 0.5 shifts the range of random numbers from -0.5 to 0.5
     * If the result is negative, the first element is sorted before the second; 
     * if positive, the second element is sorted before the first.      
     */
    return array.sort(() => Math.random() - 0.5);
  }

  // Get category picked by user and resuffle the chooses category
  const getCategory = (category) => {   
    // Get the array of words from the 'assets/js/words.js' file
    const filteredCat = categories.filter(word => word[category])[0][category];  
    const reShuffleCat = shuffleArray(filteredCat); // Reorder the chosen words   
    return reShuffleCat;
  }

  // Fuction to fetch image from Pexels API
  const fetchImage = (word) => {
    const apiKey = 'ncbwYPbVrmfLFi8cYdVirrVO4Jp1yTT0X4oGZ6VmOFOM7dcz8gbpBBZb';
    const url = `https://api.pexels.com/v1/search?query=${word}&per_page=40`;
    
    return fetch(url, {
      headers: {
        'Authorization': apiKey, 
      },
    })
    .then(response => response.json())
    .then(data => {             
      return data;
    })
    .catch(error => console.error('Error fetching image:', error))
  }

    // Event listener to flip the card on 'HINT' click
    $('#flashcard-hint').on('click', function(){

      $('.flashcard-inner').addClass('flashcard-flip');
      
      // Remove the 'flashcard-flip' and reverse flashcard back to front
      setTimeout(function(){
        $('.flashcard-inner').removeClass('flashcard-flip');
      }, 2000);
  });

  // Event listener to apply/remove highlighting for icons on the start screen
  $('#categories').on('click', '.category', function() {
    $('.category').removeClass('cat-active'); // Removes any prev active icon
    const category = $(this);
    
    // Apply new active icon
    if(!category.hasClass('cat-active')) category.addClass('cat-active');

  });

  // Event listener to hide the start screen and fetch the image
  $('#flashcard-start').on('click', function() {
    
    // Show user how to play the game
    if(showMessages) {      
      messageDisplay('⌨️ Use the keyboard to input your answers', 'flashcard-msg-bottom', 5000);
    }
    
    // Reset the image
    $('.find-image').css('display', 'none'); 

    // Reset image opacity to 100%
    imageDisplay(1);

    // Show the keyboard icon on tablets and smaller screens
    $('.keyboard').addClass('keyboard-visible');

    // Reset the for each game
    incorrectGuessCounter = 0;

    // Reset image index
    currentWordIndex = 0;
    
    // Current category
    const activeCategory =  $('.cat-active').data('cat');

    // Hide the start screen
    $('#flashcard-outer').hide();

    // Show the spinner when fetching the image
    $('#loading-container').show(); 

    // Assign the list of words to global words list
    wordsList = getCategory(activeCategory);  
   
    //Total number of words
    $('#flashcard-number').text(`1/${wordsList.length}`);
    
    initializeGame();
   
    gameStarted = true; // Start the game

    $('#flashcard-outer').hide();
    
  });

  // Event listener for key presses
  $(document).on('keypress', function(e) {

    // Listen for keyboard press only when game started
    if(gameStarted){
      handleKeyPress(e.key.toUpperCase());
    }
  });
 
  // Restart the flashcard game 
  $('#reset-game').on('click', function() {
    // Reload the page 
    window.location.reload();
  }); 

  // Event listeners for exit the game
  $('#flashcard-exit').on('click', function() {           
    $('#flashcard-outer').show();
    $('#end-game-container').hide();    
    $('#guess-word-top').css('visibility', 'hidden');
    $('#guess-word-bottom').css('visibility', 'hidden');

    progressBar(0); // Reset the progress bar

    $('.guess-word').empty(); // Empty the 'WORD' container

    updateHeartDisplay(); // Reset the hearts display
    score = 0; // Reset the score        
    $('.keyboard').removeClass('keyboard-visible'); // Hide keyboard icon for smaller screens
  });

  // Event listener for user settings
  $('#settings-save').on('click', function(){
    // Check the state of Apperance    
    const appearanceDark = $('#setting-appearance-dark').prop('checked');
    
    // Check the state of the switches   
    const noteOn = $('#setting-note').prop('checked');
    
    // Get all current settings
    const changes = {
      "theme": appearanceDark ? "dark" : "light",     
      "notification": noteOn     
    };

    // Save to local storage
    for(let prop in changes) {      
      updateLocalStorage(prop, changes[prop]);
    }    

    // Refresh the flashcard settings
    updateSettings();   

    // Close the modal settings on save press
    $('#settingsModal').modal('hide');
        
  });

  // Event listener to listen to settings changes
  $('#f-settings').on('click', function(){
    const appearanceLight = $('#setting-appearance-light');
    const appearanceDark = $('#setting-appearance-dark');
    const storage = getLocalStorage();

    if(storage['theme'] === 'light'){
      appearanceLight.prop('checked', true);
      appearanceDark.prop('checked', false);
    }else if (storage['theme'] === 'dark') {
      appearanceLight.prop('checked', false);
      appearanceDark.prop('checked', true);
    } else {
      // Handle other possible theme values
      appearanceLight.prop('checked', true); 
      appearanceDark.prop('checked', false);
    }
            
    const noteOn = $('#setting-note');
    storage['notification'] ? noteOn.prop('checked', true) : noteOn.prop('checked', false);
  });

  // Event listener to restore local storage to defaule values
  $('#clear-storage').on('click', function() {   
    localStorage.setItem('flashcard', JSON.stringify(setLocalStorage));  
    document.documentElement.setAttribute('data-theme', 'light');

    $('#setting-appearance-light').prop('checked', true);        
   
    $('#setting-note').prop('checked', true);

    window.location.reload();  
  });

  // Event listener to listen to user closing the final massage (completed all categories) window
  $('#restart-game').on('click', function() {
    window.location.reload();
  });

  // Event listener to trigger off screen keyboard on small screens
  $('#keyboard').on('click', function() {
    const hiddenInput = $('#hiddenInput');
    
    // Show the input field and focus on it     
    hiddenInput.focus().show();       
  });

  // Event listener to detect when the user types in the mobile input field
  $('#hiddenInput').on('input', function() {
      const typedText = $(this).val();
            
     // Check if a single letter is entered 
    if (typedText.length === 1) {
      // Listen for keyboard press only when the game has started
      if (gameStarted) {
          handleKeyPress(typedText.toUpperCase());
      }

      // Clear the input field after processing the entered letter
      $(this).val('');
    }
  });

  // Function to handle the image swapping
  const updateImage = (mode) => {
    const mainImage = $('#main-img');
    const gameplayImage = $('#gameplay-img');

    const imageSuffix = mode === 'light' ? 'light' : 'dark';
    
    mainImage.attr('src', `./assets/images/main-${imageSuffix}.png`).attr('alt', `${imageSuffix} theme image`);
    gameplayImage.attr('src', `./assets/images/gameplay-${imageSuffix}.png`).attr('alt', `${imageSuffix} theme image`);
  }

  // Event listener to show game instructions
  $('#f-instructions').on('click', function() {
    const mode = getLocalStorage().theme;
    
    // Append images deppend of the game mode
    updateImage(mode);
  });

  // jQuery img object
  const $toggleImg = $('.instructions-img'); 

  // Event listener to image click
  $toggleImg.on('click', function(e) {
    // Prevents the click event from reaching the document
    e.stopPropagation(); 
   
    // Toggle zoom in/out image 
    $(this).toggleClass('instructions-img-zoom');   

    // Zoom out other images
    $toggleImg.not($(this)).removeClass('instructions-img-zoom');
  });

  // Event listener to zoom out when clicked ouside image
  $(document).on('click', function() {    
    /**
     * checks if clicked target is not an image && 
     * checks if clicked target is not a descendant of the image
     */    
    if (!$toggleImg.is($(this)) && !$toggleImg.has($(this)).length) {     
      $toggleImg.removeClass('instructions-img-zoom');
    }
  });

  // Check screen size on window resize
  $(window).on('resize', function () {
    checkScreenSize();
  });

});