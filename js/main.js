app = {};

app.init = function() {
  app.shuffle();

  // get the button for the starting deal
  document.querySelector('.deal').addEventListener('click', app.startGame);
  document.querySelector('.hit').addEventListener('click', app.hitCards);
  document.querySelector('.stand').addEventListener('click', app.stand);

  // get the modal buttons
  document.querySelector('.header-instructions').addEventListener('click', app.instructions);
  document.querySelector('.header-modal-button').addEventListener('click', app.closeInstructions);

  // get the play button for smooth scroll
  document.querySelector('.header-play').addEventListener('click', app.smoothScroll);

  // dealer and player count
  app.dealerCountUI = document.querySelector('.dealer-count');
  app.playerCountUI = document.querySelector('.player-count');
  app.playerHitUI = document.querySelector('.player-cards-hit');
  app.dealerHitUI = document.querySelector('.dealer-cards-hit');

  // game message UI
  app.gameMessage = document.querySelector('.game-status');

  // disable the hit and stand buttons
  document.querySelector('.hit').setAttribute('disabled', true)
  document.querySelector('.stand').setAttribute('disabled', true)
};

// open instructions
app.instructions = function() {
  document.querySelector('.header-modal').classList.add('visible');
};

// close instructions
app.closeInstructions = function() {
  document.querySelector('.header-modal').classList.remove('visible');
};

// smooth scroll to playing area
app.smoothScroll = function() {
  document.querySelector('.card-table').scrollIntoView({
    behavior: 'smooth'
  });
};

// get the deck id
app.shuffle = async function() {
  const deckResponse = await fetch(`https://deckofcardsapi.com/api/deck/new/shuffle/?deck_count=1`);
  const deckData = await deckResponse.json();

  app.deckID = deckData.deck_id;
};

// deal four cards
app.deal = async function(deckID) {
  const dealResponse = await fetch(`https://deckofcardsapi.com/api/deck/${deckID}/draw/?count=4`);
  const dealData = await dealResponse.json();

  return dealData;
};

// hit one card
app.hit = async function(deckID) {
  const hitResponse = await fetch(`https://deckofcardsapi.com/api/deck/${deckID}/draw/?count=1`);
  const hitData = await hitResponse.json();

  return hitData;
};

// deal the cards and begin the hand
app.startGame = function() {
  // disable the deal button so the user can't re-deal
  document.querySelector('.deal').setAttribute('disabled', true);

  app.deal(app.deckID).then(response => {
    const startingDeal = response.cards;

    // get the starting hands of the player and dealer
    app.playerHand = [startingDeal[0].value, startingDeal[1].value];
    app.dealerHand = [startingDeal[2].value, startingDeal[3].value];

    // get the card images fo the starting hands
    app.playerHandImages = [startingDeal[0].image, startingDeal[1].image];
    app.dealerHandImages = [startingDeal[2].image, startingDeal[3].image];

    // check if the starting hands hold the ace of diamonds and correct the pathway to local assets
    app.aceDiamonds(app.playerHandImages);
    app.aceDiamonds(app.dealerHandImages);

    //update the UI with the images of the cards
    document.querySelector('.dealer-card-one-hidden').innerHTML = `<img src=${
      app.dealerHandImages[0]
    } class="card-image">`;
    document.querySelector('.dealer-card-two-hidden').innerHTML = `<img src=${
      app.dealerHandImages[1]
    } class="card-image">`;

    document.querySelector('.player-card-one-hidden').innerHTML = `<img src=${
      app.playerHandImages[0]
    } class="card-image">`;
    document.querySelector('.player-card-two-hidden').innerHTML = `<img src=${
      app.playerHandImages[1]
    } class="card-image">`;

    document.querySelector('.dealer-one').classList.add('rotate');
    document.querySelector('.player-one').classList.add('rotate');
    document.querySelector('.player-two').classList.add('rotate');

    // convert the face cards and aces into their string values
    app.playerHand = app.convertCards(app.playerHand);
    app.dealerHand = app.convertCards(app.dealerHand);

    // get the count of each player and dealer hands
    app.playerCount = app.evaluateCards(app.playerHand);
    app.dealerCount = app.evaluateCards(app.dealerHand);

    // update the UI to show the counts
    app.playerCountUI.innerHTML = app.playerCount;

    // if the dealer has an ACE only show 1, 11 as the count
    if (Array.isArray(app.dealerHand[0])) {
      app.dealerCountUI.innerHTML = [1, 11];
    } else {
      app.dealerCountUI.innerHTML = app.dealerHand[0];
    }

    // check if the player has a natural app from the starting deal
    app.blackjackBust(app.playerCount);

    // enable the hit and stand buttons
    document.querySelector('.hit').removeAttribute('disabled')
    document.querySelector('.stand').removeAttribute('disabled')
  });
};

// converts face cards and aces to arrays of card numbers
app.convertCards = function(cards) {
  // checks the players cards for aces and coverts to the necessary arrays
  if (cards.indexOf('ACE') !== -1) {
    cards.forEach((card, index) => {
      if (card === 'ACE') {
        cards[index] = ['1', '11'];
      }
    });
  }

  // loop through the cards and convert face values to 10
  cards.forEach((card, index) => {
    if (card === 'JACK' || card === 'QUEEN' || card === 'KING') {
      cards[index] = '10';
    }
  });

  return cards;
};

// evaluates the card hands and returns a value or an array if the player/dealer holds an ace
app.evaluateCards = function(cards) {
  // if user holds two aces returns [2, 12] as the count
  if (Array.isArray(cards[0]) && Array.isArray(cards[1])) {
    cards = [2, 12];
  }
  // if the user holds one ace returns count with [x, y]
  else if (Array.isArray(cards[0]) || Array.isArray(cards[1])) {
    // loops over the hand converting the strings to numbers
    for (i = 0; i < cards.length; i++) {
      if (Array.isArray(cards[i])) {
        for (j = 0; j < cards[i].length; j++) {
          cards[i][j] = parseInt(cards[i][j]);
        }
        // converts the non-ace card value to a number
      } else if (typeof cards[i] === 'string') {
        cards[i] = parseInt(cards[i]);
      }
    }

    // seperate the two card values
    const cardOne = cards[0];
    const cardTwo = cards[1];

    // add one card value to the other splitting into two arrays
    if (Array.isArray(cardOne)) {
      // loop over ace card adding other card to its values
      cardOne.forEach((card, index) => {
        cardOne[index] = parseInt(cardOne[index]) + parseInt(cardTwo);
      });

      cards = cardOne;
    } else if (Array.isArray(cardTwo)) {
      // loop over ace card adding other card to its values
      cardTwo.forEach((card, index) => {
        cardTwo[index] = parseInt(cardTwo[index]) + parseInt(cardOne);
      });

      cards = cardTwo;
    }
  }
  // if the user does not hold an ace returns count with [x]
  else {
    // loops through player hand and coverts strings to numbers
    cards.forEach((card, index) => {
      cards[index] = parseInt(cards[index]);
    });

    // calculates the count from the players hand
    cards = [
      cards.reduce((accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue))
    ];
  }

  return cards;
};

// draws a card from the deck
app.hitCards = function() {
  // disable the game play buttons
  document.querySelector('.hit').setAttribute('disabled', true);
  document.querySelector('.stand').setAttribute('disabled', true);

  // call the API for the hit card
  app.hit(app.deckID).then(response => {
    // get the value and image of the hit card
    let drawCard = response.cards[0].value;
    let drawCardImage = response.cards[0].image;

    // convert draw card face cards and ace cards to a value and converts single cards to integer
    if (drawCard === 'JACK' || drawCard === 'QUEEN' || drawCard === 'KING') {
      drawCard = [10];
    } else if (drawCard === 'ACE') {
      drawCard = [1, 11];
    } else {
      drawCard = [parseInt(drawCard)];
    }

    // replace the ACE of diamonds
    if (drawCardImage === 'https://deckofcardsapi.com/static/img/AD.png') {
      drawCardImage = 'assets/AD.png';
    }

    // add the hit card to the player hand
    app.playerCount = app.addCards(app.playerCount, drawCard);

    // update the UI with the hit card
    app.playerHitUI.innerHTML += `<img src=${drawCardImage} class="card-image">`;

    // update the UI with the players new count
    app.playerCountUI.innerHTML = app.playerCount;
   
    // check if player busts or has a app
    app.blackjackBust(app.playerCount, drawCard);

    setTimeout(() => {
      // disable game play buttons
      document.querySelector('.hit').removeAttribute('disabled');
      document.querySelector('.stand').removeAttribute('disabled');
    }, 500)
  });
};

// adds the value of a drawn card to a hand
app.addCards = function(cards, hitCard) {
  const acesArray = [];

  // user holds an ace and draws an ace
  if (cards.length === 2 && hitCard.length === 2) {
    acesArray[0] = cards[0] + 1;
    acesArray[1] = cards[0] + 11;
    acesArray[2] = cards[1] + 1;
    acesArray[3] = cards[1] + 11;

    cards = acesArray;
  }
  // user holds an ace and draws a single value card
  else if (cards.length === 2 && hitCard.length === 1) {
    cards[0] = cards[0] + hitCard[0];
    cards[1] = cards[1] + hitCard[0];
  }
  // user draws an ace against single value count
  else if (cards.length === 1 && hitCard.length === 2) {
    hitCard[0] = hitCard[0] + cards[0];
    hitCard[1] = hitCard[1] + cards[0];

    cards = hitCard;
  }
  // user draws single value card against single value count
  else if (cards.length === 1 && hitCard.length === 1) {
    cards.push(hitCard);
    cards = [
      cards.reduce((accumulator, currentValue) => parseInt(accumulator) + parseInt(currentValue))
    ];
  }

  if (cards.length >= 2) {
    cards = app.reduceCards(cards);
  }

  return cards;
};

// user stands on current hand and compares to dealers cards
app.stand = function() {
  // disable the game play buttons
  document.querySelector('.hit').setAttribute('disabled', true);
  document.querySelector('.stand').setAttribute('disabled', true);

  // update the dealers UI to show their face down card and update count
  document.querySelector('.dealer-two').classList.add('rotate');
  app.dealerCountUI.innerHTML = app.dealerCount;

  // arrays to get highest values in hands and preserve original count arrays
  let playerHigh = [],
    dealerHigh = [];

  // if the user holds multiple values, spreads the inner array into one array
  app.playerCount.forEach((count, index) => {
    if (Array.isArray(count)) {
      playerHigh.push(...app.playerCount[index]);
    } else {
      playerHigh.push(app.playerCount[index]);
    }
  });

  // gets the highest values from the players hand
  playerHigh = [Math.max(...playerHigh)];

  // if the dealer holds multiple values, spreads the inner array into one array
  app.dealerCount.forEach((count, index) => {
    if (Array.isArray(count)) {
      dealerHigh.push(...app.dealerCount[index]);
    } else {
      dealerHigh.push(app.dealerCount[index]);
    }

    // removes duplicate values and bust values
    dealerHigh = app.reduceCards(dealerHigh);
  });

  // get the highest value from the dealers hand
  dealerHigh = [Math.max(...dealerHigh)];

  // time out before game continues so user can see dealer's count
  setTimeout(() => {
    // goes through the permutations of wins/losses before dealer draws
    if (dealerHigh[0] > playerHigh[0] && dealerHigh <= 21) {
      app.endGameMessage('DEALER WINS');
    } else if (dealerHigh[0] === playerHigh[0]) {
      app.endGameMessage('DRAW');
    } else if (playerHigh[0] > dealerHigh[0] && dealerHigh[0] < 17) {
      app.dealerHit(app.dealerCount);
    } else if (playerHigh[0] > dealerHigh[0]) {
      app.endGameMessage('WIN');
    }
  }, 1300);
};

// dealer draws cards until has 17 or higher
app.dealerHit = async function() {
  app.hit(app.deckID).then(response => {
    dealerDrawCard = response.cards[0].value;
    dealerDrawCardImage = response.cards[0].image;

    // convert draw card face cards and ace cards to a value and converts single cards to integer
    if (dealerDrawCard === 'JACK' || dealerDrawCard === 'QUEEN' || dealerDrawCard === 'KING') {
      dealerDrawCard = [10];
    } else if (dealerDrawCard === 'ACE') {
      dealerDrawCard = [1, 11];
    } else {
      dealerDrawCard = [parseInt(dealerDrawCard)];
    }

    // update dealer count
    app.dealerCount = app.addCards(app.dealerCount, dealerDrawCard);

    // update the UI with dealers card and count
    app.dealerCountUI.innerHTML = app.dealerCount;
    app.dealerHitUI.innerHTML += `<img src=${dealerDrawCardImage} class="card-image">`;

    // if dealer hits to above 21, dealer busts
    if (app.dealerCount > 21) {
      app.endGameMessage('DEALER BUSTS');
    } else {
      app.stand();
    }
  });
};

// for arrays of evaluated cares remove duplicates and values over 21
app.reduceCards = function(cards) {
  // loop over the values and remove duplicates
  cards = [...new Set(cards)];

  //loop over the values and remove any higher than 21
  for (i in cards) {
    if (cards[i] > 21) {
      cards.splice(i, 1);
    }
  }

  return cards;
};

// checks to see if the users cards have a app or bust value
app.blackjackBust = function(cards) {
  if (cards.length >= 2) {
    //loop over the hand and check for a natural blackjack
    cards.forEach(value => {
      if (value === 21) {
        app.endGameMessage('BLACKJACK');
      }
    });

    // check to see if the user holds a blackjack from their cards
  } else if (cards.length === 1) {
    if (cards[0] === 21) {
      app.endGameMessage('BLACKJACK');
    } else if (cards[0] > 21) {
      app.endGameMessage('BUST');
    }
  }
};

app.endGameMessage = function(message) {
  app.gameMessage.innerHTML = message;
  app.gameMessage.classList.add('show');

  // // disable game play buttons
  // document.querySelector('.hit').removeAttribute('disabled');
  // document.querySelector('.stand').removeAttribute('disabled');

  // shuffle the deck
  app.shuffle();

  setTimeout(() => {
    // reset the UI
    app.dealerHitUI.innerHTML = '';
    app.playerHitUI.innerHTML = '';

    app.playerCountUI.innerHTML = '0';
    app.dealerCountUI.innerHTML = '0';

    document.querySelector('.dealer-one').classList.remove('rotate');
    document.querySelector('.dealer-two').classList.remove('rotate');
    document.querySelector('.player-one').classList.remove('rotate');
    document.querySelector('.player-two').classList.remove('rotate');

    app.gameMessage.classList.remove('show');

    // let the user deal another round
    document.querySelector('.deal').removeAttribute('disabled');
  }, 1800);
};

// function to reference the ace of diamonds image to local assets
app.aceDiamonds = function(cards) {
  for (let i in cards) {
    if (cards[i] === 'https://deckofcardsapi.com/static/img/AD.png') {
      cards[i] = './assets/AD.png';
    }
  }
};

app.init();
