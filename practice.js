(function () {
  const defaultConfig = {
    promptLabel: 'Write the past simple for:',
    inputPlaceholder: 'Type the past simple',
    checkButtonLabel: 'Check',
    skipButtonLabel: 'Skip',
    completedMessage: 'All selected verbs are learned.',
    restartButtonLabel: 'Start again',
    emptyAnswerMessage: 'Please enter an answer.',
    correctAndRemovedMessage: 'Correct. "{item}" is learned and removed from the list.',
    correctKeepMessage: 'Correct. One more correct answer in a row removes this verb from the list.',
    wrongAnswerMessage: 'Wrong. Correct answer: {answer}',
    streakFormat: '{streak} / 2'
  };

  const pageConfig =
    typeof practiceConfig !== 'undefined' && practiceConfig !== null
      ? practiceConfig
      : {};

  const config = {
    ...defaultConfig,
    ...pageConfig
  };

  function getInitialItems() {
    if (typeof initialItems === 'undefined' || !Array.isArray(initialItems)) {
      return [];
    }
    return initialItems;
  }

  function buildRuntimeItems() {
    return getInitialItems().map((item, index) => ({
      id: index + 1,
      prompt: String(item.prompt),
      answer: String(item.answer),
      streak: 0
    }));
  }

  function formatMessage(template, values) {
    return template.replace(/\{(\w+)}/g, (match, key) => {
      if (Object.prototype.hasOwnProperty.call(values, key)) {
        return String(values[key]);
      }
      return match;
    });
  }

  let items = buildRuntimeItems();

  let currentItem = null;
  let lastPickedItemId = null;
  let totalCorrect = 0;
  let totalWrong = 0;
  let wrongAnswerTimeoutId = null;
  let waitingAfterWrong = false;
  let suppressNextWaitingEnter = false;

  const remainingCountEl = document.getElementById('remainingCount');
  const currentStreakEl = document.getElementById('currentStreak');
  const totalCorrectEl = document.getElementById('totalCorrect');
  const totalCorrectBottomEl = document.getElementById('totalCorrectBottom');
  const totalWrongEl = document.getElementById('totalWrong');
  const quizAreaEl = document.getElementById('quizArea');
  const verbsListEl = document.getElementById('verbsList');

  function normalizeText(value) {
    return value
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ');
  }

  function acceptedAnswer(answer) {
    return normalizeText(answer);
  }

  function clearWrongAnswerWait() {
    waitingAfterWrong = false;
    suppressNextWaitingEnter = false;
    if (wrongAnswerTimeoutId !== null) {
      clearTimeout(wrongAnswerTimeoutId);
      wrongAnswerTimeoutId = null;
    }
  }

  function pickRandomItem() {
    clearWrongAnswerWait();

    if (items.length === 0) {
      currentItem = null;
      render();
      return;
    }

    if (items.length === 1) {
      currentItem = items[0];
    } else {
      const selectableItems = items.filter(item => item.id !== lastPickedItemId);
      const pool = selectableItems.length > 0 ? selectableItems : items;
      const randomIndex = Math.floor(Math.random() * pool.length);
      currentItem = pool[randomIndex];
    }
    lastPickedItemId = currentItem.id;
    render();

    const input = document.getElementById('answerInput');
    if (input) {
      input.focus();
    }
  }

  function checkAnswer(triggeredByEnter = false) {
    const input = document.getElementById('answerInput');
    const userAnswer = normalizeText(input.value);

    if (!userAnswer) {
      showMessage(config.emptyAnswerMessage, 'error');
      return;
    }

    const validAnswer = acceptedAnswer(currentItem.answer);
    const isCorrect = userAnswer === validAnswer;

    if (isCorrect) {
      currentItem.streak += 1;
      totalCorrect += 1;

      if (currentItem.streak >= 2) {
        const removedItem = currentItem.prompt;
        items = items.filter(item => item.id !== currentItem.id);
        showMessage(
          formatMessage(config.correctAndRemovedMessage, { item: removedItem }),
          'success'
        );
        updateStats(0);
        renderVerbsList();
        setTimeout(pickRandomItem, 700);
        return;
      }

      showMessage(config.correctKeepMessage, 'success');
      updateStats(currentItem.streak);
      setTimeout(pickRandomItem, 700);
    } else {
      currentItem.streak = 0;
      totalWrong += 1;
      showMessage(
        formatMessage(config.wrongAnswerMessage, { answer: currentItem.answer }),
        'error'
      );
      updateStats(currentItem.streak);
      input.disabled = true;

      const checkButton = document.getElementById('checkButton');
      const skipButton = document.getElementById('skipButton');
      if (checkButton) checkButton.disabled = true;
      if (skipButton) skipButton.disabled = true;

      waitingAfterWrong = true;
      suppressNextWaitingEnter = triggeredByEnter;
      wrongAnswerTimeoutId = setTimeout(() => {
        wrongAnswerTimeoutId = null;
        waitingAfterWrong = false;
        suppressNextWaitingEnter = false;
        pickRandomItem();
      }, 4000);
    }

    renderVerbsList();
  }

  function showMessage(text, type) {
    const message = document.getElementById('message');
    if (!message) return;
    message.textContent = text;
    message.className = 'message show ' + type;
  }

  function updateStats(streak) {
    if (remainingCountEl) {
      remainingCountEl.textContent = items.length;
    }
    if (currentStreakEl) {
      currentStreakEl.textContent = formatMessage(config.streakFormat, { streak });
    }
    if (totalCorrectEl) {
      totalCorrectEl.textContent = totalCorrect;
    }
    if (totalCorrectBottomEl) {
      totalCorrectBottomEl.textContent = totalCorrect;
    }
    if (totalWrongEl) {
      totalWrongEl.textContent = totalWrong;
    }
  }

  function resetApp() {
    clearWrongAnswerWait();

    items = buildRuntimeItems();
    lastPickedItemId = null;
    totalCorrect = 0;
    totalWrong = 0;
    currentItem = null;
    pickRandomItem();
  }

  function renderVerbsList() {
    verbsListEl.innerHTML = '';
    items.forEach(item => {
      const pill = document.createElement('div');
      pill.className = 'pill';
      pill.textContent = item.prompt;
      verbsListEl.appendChild(pill);
    });
  }

  function render() {
    updateStats(currentItem ? currentItem.streak : 0);
    renderVerbsList();

    if (!currentItem && items.length === 0) {
      quizAreaEl.innerHTML = `
          <div class="completed">${config.completedMessage}</div>
          <div style="margin-top: 16px; text-align: center;">
            <button onclick="resetApp()">${config.restartButtonLabel}</button>
          </div>
        `;
      return;
    }

    quizAreaEl.innerHTML = `
        <div class="card">
          <div class="prompt-label">${config.promptLabel}</div>
          <div class="verb">${currentItem.prompt}</div>

          <div class="answer-row">
            <input id="answerInput" type="text" placeholder="${config.inputPlaceholder}" autocomplete="off" />
            <button id="checkButton">${config.checkButtonLabel}</button>
            <button class="secondary" id="skipButton" type="button">${config.skipButtonLabel}</button>
          </div>

          <div id="message" class="message"></div>
        </div>
      `;

    const input = document.getElementById('answerInput');
    const checkButton = document.getElementById('checkButton');
    const skipButton = document.getElementById('skipButton');

    checkButton.addEventListener('click', () => checkAnswer(false));
    skipButton.addEventListener('click', pickRandomItem);
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') {
        event.preventDefault();
        checkAnswer(true);
      }
    });
  }

  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Enter' || !waitingAfterWrong) {
      return;
    }
    if (suppressNextWaitingEnter) {
      suppressNextWaitingEnter = false;
      return;
    }
    event.preventDefault();
    pickRandomItem();
  });

  window.resetApp = resetApp;

  pickRandomItem();
})();
