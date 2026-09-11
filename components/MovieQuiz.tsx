'use client';

import { useState } from 'react';
import { CheckCircle2, RotateCcw, Trophy, XCircle } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  answer: string;
}

const questions: QuizQuestion[] = [
  {
    question: 'Welcher Film folgt der Familie Corleone?',
    options: ['The Godfather', 'Whiplash', 'Amélie', 'Parasite'],
    answer: 'The Godfather',
  },
  {
    question: 'In welchem Film geht es um eine Traum-in-Traum-Erzählung?',
    options: ['Jaws', 'Inception', 'Casablanca', 'Gladiator'],
    answer: 'Inception',
  },
  {
    question: 'Welcher Film ist ein Studio-Ghibli-Klassiker?',
    options: ['The Matrix', 'Fight Club', 'Spirited Away', 'The Departed'],
    answer: 'Spirited Away',
  },
];

export default function MovieQuiz() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);

  const currentQuestion = questions[questionIndex];
  const finished = questionIndex >= questions.length;

  const answerQuestion = (option: string) => {
    if (selectedAnswer) return;
    setSelectedAnswer(option);
    if (option === currentQuestion.answer) setScore((current) => current + 1);
  };

  const nextQuestion = () => {
    setSelectedAnswer(null);
    setQuestionIndex((current) => current + 1);
  };

  const restartQuiz = () => {
    setQuestionIndex(0);
    setScore(0);
    setSelectedAnswer(null);
  };

  return (
    <section aria-labelledby="movie-quiz" className="rounded-xl border border-cinema-border bg-cinema-surface p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <Trophy size={17} className="text-cinema-gold" />
        <div>
          <h2 id="movie-quiz" className="text-sm font-semibold text-white">Must-Watch-Quiz</h2>
          <p className="text-[11px] text-cinema-muted">Teste dein Filmwissen</p>
        </div>
      </div>

      {finished ? (
        <div className="mt-5 rounded-lg border border-cinema-gold/30 bg-cinema-gold/10 p-5 text-center">
          <p className="text-lg font-semibold text-cinema-gold">{score} von {questions.length} richtig</p>
          <p className="mt-1 text-xs text-cinema-muted">{score === questions.length ? 'Starkes Filmwissen.' : 'Noch ein Durchlauf geht bestimmt besser.'}</p>
          <button type="button" onClick={restartQuiz} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-cinema-accent px-3 py-2 text-xs font-semibold text-white hover:bg-cinema-accent/80">
            <RotateCcw size={13} /> Nochmal spielen
          </button>
        </div>
      ) : (
        <div className="mt-4">
          <div className="flex items-center justify-between text-[11px] text-cinema-muted">
            <span>Frage {questionIndex + 1} von {questions.length}</span>
            <span>{score} Punkt{score === 1 ? '' : 'e'}</span>
          </div>
          <h3 className="mt-3 text-sm font-semibold text-white">{currentQuestion.question}</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {currentQuestion.options.map((option) => {
              const isCorrect = option === currentQuestion.answer;
              const isSelected = option === selectedAnswer;
              const resultStyle = selectedAnswer
                ? isCorrect
                  ? 'border-emerald-400 bg-emerald-500/15 text-emerald-300'
                  : isSelected
                    ? 'border-red-400 bg-red-500/15 text-red-300'
                    : 'border-cinema-border text-cinema-muted'
                : 'border-cinema-border text-cinema-muted hover:border-cinema-accent hover:text-white';
              return (
                <button key={option} type="button" onClick={() => answerQuestion(option)} disabled={Boolean(selectedAnswer)} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-left text-xs transition-colors ${resultStyle}`}>
                  <span>{option}</span>
                  {selectedAnswer && isCorrect ? <CheckCircle2 size={14} /> : null}
                  {selectedAnswer && isSelected && !isCorrect ? <XCircle size={14} /> : null}
                </button>
              );
            })}
          </div>
          {selectedAnswer && (
            <button type="button" onClick={nextQuestion} className="mt-4 rounded-lg bg-cinema-accent px-3 py-2 text-xs font-semibold text-white hover:bg-cinema-accent/80">
              {questionIndex === questions.length - 1 ? 'Ergebnis anzeigen' : 'Nächste Frage'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
