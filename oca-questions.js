"use strict";
// @ts-check

// taken from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Using_Special_Characters
function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceAll(str, find, replace) {
    return str.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

/**
 * Represents one OCA question in this test.
 */
class OcaQuestion {

    // State:
    // question
    // answer
    // _userAnswer

    /**
     * @param {string} question
     * @param {string} answers
     */
    constructor(question, answers) {
        this.question = question;

        // Extract correct answers from the asciidoc question
        this.correctAnswers = answers.split("\n") // split answers in lines
            .map(line => line.trim()) // remove leading whitespace 
            .filter(line => line.startsWith("* [")) // only checkboxes
            .map(line => line.substring(2)) // remove leading "* " 
            .map(line => line.startsWith("[x]")); // map lines with [*] to true, otherwise to false

        // Predefine user answers with an array of false values
        this._userAnswers = new Array(this.correctAnswers.length).fill(false);

        // Dont reveal the answer, so remove the checkmark
        this.answers = replaceAll(answers, "* [x] ", "* [ ] ");
    }

    /**
     * The answers the user clicked. The list contains boolean arrays like [false, true] indicating what the user clicked.
     */
    get userAnswers() {
        return this._userAnswers;
    }

    set userAnswers(newUserAnswers) {
        this._userAnswers = newUserAnswers;
    }
}

/**
 * Represent all OCA questions in an internal array that are loaded from a ADOC file.
 */
class OcaQuestionLoader {

    /**
     * Load all quenstions and returns a promise after loaded.
     */
    static async load() {
        const response = await fetch("ocaQuestions.adoc");
        const adoc = await response.text();
        return OcaQuestionLoader.parseAdoc(adoc);
    }

    /**
     * Returns a list of OcaQuestion objects created from an ADOC document.
     * @param {string} adoc 
     */
    static parseAdoc(adoc) {
        // https://regex101.com/
        //                               ocaQn                                       ocaAnswer
        const regex = /^\[TIP\]\s^====\s((\s|\S)+?)\s^====\s*^\[IMPORTANT\]\s^====\s((\s|\S)+?)^====/gm;

        let ocaQuestions = [];
        for (let match; match = regex.exec(adoc);) {
            const ocaQn = match[1];
            const ocaAnswer = match[3];
            const ocaQuestion = new OcaQuestion(ocaQn, ocaAnswer);
            ocaQuestions.push(ocaQuestion);
        }
        return ocaQuestions;
    }
}

/**
 * Represents OCA questions for one test. Its is a random subset of all OCA quenstions.
 */
class TestOcaQuestions {

    /**
     * @param {OcaQuestion[]} ocaQuestion 
     * @param {number} totalNumberOfQuestions 
     */
    constructor(ocaQuestion, totalNumberOfQuestions) {

        // Make a copy of all quenstions to not destroy the original array
        let clone = ocaQuestion.slice(0);

        // Randomize questions
        TestOcaQuestions.shuffleArray(clone);

        // Take a subset of all quenstions
        this.testOcaQuestions = clone.slice(0, totalNumberOfQuestions);
    }

    /**
     * Returns an OcaQuestion at a given index.
     * @param {number} index
     */
    questionAt(index) {
        return this.testOcaQuestions[index];
    }

    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }
}

export {
    OcaQuestionLoader,
    OcaQuestion,
    TestOcaQuestions
};
