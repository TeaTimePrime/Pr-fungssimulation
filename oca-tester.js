"use strict";
// @ts-check

////////////////////////// Configure the test ///////////////////////////

// Total number of questions in this quiz
const totalNumberOfQuestions = 15;

const duration = 45 /* Minutes */;

/////////////////////////////////////////////////////////////////////////

import {
    OcaQuestionLoader, OcaQuestion, TestOcaQuestions
} from './oca-questions.js';

// @ts-ignore
const asciidoctor = Asciidoctor();

// Will be initialized with OCA quenstions.
let testOcaQuestions;

class UI {
    /**
     * @param {string} html
     */
    static setQuestion(html) {
        document.getElementById("question").innerHTML = html;
    }

    /**
     * @param {string} html
     */
    static setAnswer(html) {
        document.getElementById("answer").innerHTML = html;
    }

    /**
     * @param {number} value
     */
    static setCurrentPage(value) {
        document.getElementById("current-page").innerHTML = value.toString();
    }

    /**
     * @param {number} html
     */
    static setTotalPages(html) {
        document.getElementById("total-pages").innerHTML = html.toString();
    }

    static setRemainingTime(html) {
        document.getElementById("remaining-time").innerHTML = html;
    }

    static onPlayPauseClick(action) {
        //        document.getElementById("play-pause-btn").onclick = () => action();
    }

    static onFinishExamClick(action) {
        document.getElementById("finish-exam-btn").onclick = () => action();
    }

    static onPrevQuestionClick(action) {
        document.getElementById("prev-qn-btn").onclick = () => action();
    }

    static onNextQuestionClick(action) {
        document.getElementById("next-qn-btn").onclick = () => action();
    }

    static enablePrevQuestionBtn() {
        document.getElementById("prev-qn-btn").removeAttribute('disabled');
    }

    static disablePrevQuestionBtn() {
        document.getElementById("prev-qn-btn").setAttribute('disabled', 'true');
    }

    static enableNextQuestionBtn() {
        document.getElementById("next-qn-btn").removeAttribute('disabled');
    }

    static disableNextQuestionBtn() {
        document.getElementById("next-qn-btn").setAttribute('disabled', 'true');
    }

    static addNavigationLinks(totalNumberOfQuestions) {
        for (let i = 1; i <= totalNumberOfQuestions; i++)
            UI.addNavigationLink(i);
    }

    static onNavigationClick(action) {
        document.getElementById("navigation").onclick = e => {
            const target = event.target || event.srcElement;
            if (target instanceof HTMLAnchorElement)
                action(+target.innerHTML); // convert into Number
        }
    }

    static addNavigationLink(page) {
        const aHref = document.createElement("a");
        aHref.text = page;
        const ulElement = document.getElementById("oca-qn-navigation");
        ulElement.appendChild(aHref);
    }

    /**
     * Returns a list of booleans indicating if an answer was selected or not.
     */
    static getSelectedAnswers() {
        const inputs = document.querySelectorAll("#answer input");
        const answers = [];
        for (let i = 0; i < inputs.length; i++) {
            // @ts-ignore
            const selected = inputs.item(i).checked;
            answers.push(selected);
        }
        return answers;
    }

    static setSelectedAnswers(answers) {
        const inputs = document.querySelectorAll("#answer input");
        for (let i = 0; i < inputs.length; i++) {
            inputs.item(i).checked = answers[i];
        }
    }
}

// An index for the current quenstion in TestOcaQuestions
let currentIndex = 0;

/**
* Returns the current question.
*/
function currentQuestion() {
    return testOcaQuestions.questionAt(currentIndex);
}

/**
 * Returns a question at a given index. Used for absolute navigation.
 * @param {number} index
 */
function questionAt(index) {
    return testOcaQuestions.questionAt(index);
}

/**
 * Sets the position to the next question in the quiz. No range checks are done.
 */
function nextQuestion() {
    currentIndex++;
}

/**
 * Sets the position to the previous question in the quiz. No range checks are done.
 */
function prevQuestion() {
    currentIndex--;
}

/**
 * Set the current index to a now position.
 * @param {number} index 
 */
function setAbsoluteQuestionPostion(index) {
    currentIndex = index;
}

/**
 * Returns true if the first question of the quiz is shown.
 */
function isFirstQuestionShown() {
    return currentIndex == 0;
}

/**
 * Returns true if the last question of the quiz is shown.
 */
function isLastQuestionShown() {
    return currentIndex == totalNumberOfQuestions - 1;
}

/**
 * Collects the answers from the currently shown question and saves in the current OcaQuestion.
 */
function saveCurrentAnswer() {
    const selections = UI.getSelectedAnswers();
    currentQuestion().userAnswers = selections;
}

/**
 * Updates a view for a new question.
 * @param {OcaQuestion} question
 */
function updateView(question) {

    const questionHtml = asciidoctor.convert(question.question);
    UI.setQuestion(questionHtml);

    const answerHtml = asciidoctor.convert(question.answers);
    UI.setAnswer(answerHtml);

    UI.setSelectedAnswers(question.userAnswers);

    UI.setCurrentPage(currentIndex + 1);

    isFirstQuestionShown() ? UI.disablePrevQuestionBtn() : UI.enablePrevQuestionBtn();
    isLastQuestionShown() ? UI.disableNextQuestionBtn() : UI.enableNextQuestionBtn();
}

/**
 * Returns the number of differences in two arrays
 * @param {boolean[]} array1 
 * @param {boolean[]} array2 
 */
function differencesInArrays(array1, array2) {

    let numberOfErrors = 0;
    if (array1.length !== array2.length) {
        console.error("Arrays sind nicht gleich lang");
        return -1;
    }

    for (let index = 0; index < array1.length; index++)
        if (array1[index] != array2[index] )
            numberOfErrors++;

    return numberOfErrors;
}

/**
 * Compare the correct answers with the user answers.
 * @returns Number of total errors.
 */
function reviewAnswers() {
    let numberOfErrors = 0;

    for (let index = 0; index < totalNumberOfQuestions; index++) {
        const qn = questionAt(index);
        // console.log("Korrekt :" + qn.correctAnswers);
        // console.log("Vom User:" + qn.userAnswers);
        numberOfErrors += differencesInArrays(qn.correctAnswers, qn.userAnswers);
    }

    return numberOfErrors;
}

/**
 * Registers listeners for the buttons and links.
 */
function registerListener() {
    UI.onPlayPauseClick(() => {
        console.log("play pause click");
    });
    UI.onFinishExamClick(() => {
        const wantsToFinish = window.confirm("Test beenden?");
        if (!wantsToFinish)
            return;
        saveCurrentAnswer();
        const numberOfErrors = reviewAnswers();
        if (numberOfErrors === 0) {
            window.alert("Großartig, Test ohne Fehler bestanden!");
        }
        else
            window.alert("Test mit " + numberOfErrors + " falschen Antworten abgeschlossen!");
    });
    UI.onPrevQuestionClick(() => {
        if (!isFirstQuestionShown()) {
            saveCurrentAnswer();
            prevQuestion();
            updateView(currentQuestion());
        }
    });
    UI.onNextQuestionClick(() => {
        if (!isLastQuestionShown()) {
            saveCurrentAnswer();
            nextQuestion();
            updateView(currentQuestion());
        }
    });
    UI.onNavigationClick(visibleIndex => {
        saveCurrentAnswer();
        visibleIndex--; // first question is at 1, remap to 0-based
        setAbsoluteQuestionPostion(visibleIndex);
        updateView(currentQuestion());
    });
}

/**
 * Activate timer.
 */
function startTimer() {
    let remainingSeconds = duration * 60;
    const intervallId = setInterval(function () {
        const minutes = Math.floor(remainingSeconds / 60);
        const seconds = Math.floor(remainingSeconds % 60);

        const minutesAsString = minutes < 10 ? "0" + minutes : minutes;
        const secondsAsString = seconds < 10 ? "0" + seconds : seconds;
        UI.setRemainingTime(minutesAsString + ":" + secondsAsString);

        remainingSeconds--;

        if (remainingSeconds < 0)
            clearInterval(intervallId);
    }, 1000);
}

$(document).ready(() => {
    OcaQuestionLoader.load().then(ocaQuestions => {
        testOcaQuestions = new TestOcaQuestions(ocaQuestions, totalNumberOfQuestions);
        UI.addNavigationLinks(totalNumberOfQuestions);
        registerListener();
        UI.setTotalPages(totalNumberOfQuestions);
        updateView(currentQuestion());
        startTimer();
    });
});
