const Question = require("../models/questionModel");

const calculateMarks = async (examId, answers, exam) => {
    const questions = await Question.find({ exam: examId });

    let score = 0;
    let questionMarksSum = 0;

    for (const question of questions) {
        questionMarksSum += question.marks;
        const submitted = answers.find(
            (a) => a.question.toString() === question._id.toString()
        );
        if (
            submitted &&
            submitted.selectedOption !== null &&
            submitted.selectedOption === question.correctOption
        ) {
            score += question.marks;
        }
    }

    const percentage =
        questionMarksSum > 0 ? Math.round((score / questionMarksSum) * 100) : 0;

    return { score, totalMarks: questionMarksSum, percentage };
};

module.exports = calculateMarks;