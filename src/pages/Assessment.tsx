
import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { QuestionRenderer } from '@/components/QuestionRenderer';
import { WelcomePage } from '@/components/WelcomePage';
import { useToast } from "@/hooks/use-toast";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { customVoiceService } from '@/services/customVoiceService';
import { nativeSpeech } from '@/services/nativeSpeech';
import { RootState } from '@/store';
import { fetchAssessmentBySlug } from '@/store/assessmentsSlice';
import { useSettings } from '../SettingsContext';

interface AssessmentResult {
  overallScore: number;
  categories: { [key: string]: number };
  interpretation: string;
}

const Assessment = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const assessment = useSelector(
    (state: RootState) => state.assessments.selected
  );

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWelcomePage, setShowWelcomePage] = useState(true);
  const { toast } = useToast();

  const { settings } = useSettings();
  const backgroundStyle = { 
    backgroundImage: `url(${settings?.welcomePage?.background})`,
    backgroundSize: 'cover', 
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  };

  useEffect(() => {
    if (slug) {
      let favicon = document.querySelector("link[rel~='icon']") as HTMLLinkElement | null;

      if (!favicon) {
        favicon = document.createElement("link");
        favicon.rel = "icon";
        document.head.appendChild(favicon);
      }

      favicon.href = settings?.platform.favicon;

      setLoading(true); // still keep local loading spinner if needed
      dispatch(fetchAssessmentBySlug(slug))
        .unwrap()
        .then((res) => {
          console.log('Loaded assessment:', res.title, 'with', res.questions.length, 'questions');
          setLoading(false);
        })
        .catch(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [slug, dispatch]);

  useEffect(() => {
    if (assessment && !showWelcomePage) {
      setAnswers(new Array(assessment.questions.length).fill(null));
    }
  }, [assessment, showWelcomePage]);

  useEffect(() => {
    if (assessment) {
      customVoiceService.setAssessment(assessment)
    }
  }, [assessment]);

  const handleSubmit = () => {
    setShowWelcomePage(false);
    toast({
      title: "Welcome!",
      description: "Let's begin your personalized assessment.",
    });
  };

  const currentQuestion = assessment?.questions[currentQuestionIndex];
  const isAnswered = answers[currentQuestionIndex] !== undefined && answers[currentQuestionIndex] !== null;

  const handleAnswer = (answer: any) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = answer;
    setAnswers(newAnswers);
    
    // Auto-advance to next question after 1.5 seconds
    setTimeout(() => {
      // Stop any playing audio before advancing
      // customVoiceService.stopVoice();
      nativeSpeech.stop();
      
      if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        calculateResults();
      }
    }, 1500);
  };

  const handleNextQuestion = () => {
    // Stop any playing audio before advancing
    // customVoiceService.stopVoice();
    nativeSpeech.stop();
    
    if (currentQuestionIndex < (assessment?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      calculateResults();
    }
  };

  const calculateResults = () => {
    if (!assessment) return;

    let overallScore = 0;

    assessment.questions.forEach((question, index) => {
      const answer = answers[index];

      let questionScore = 0;
      switch (question.type) {
        case 'yes-no':
          questionScore = answer === 'yes' ? 100 : 0;
          break;
        case 'this-that':
          questionScore = question.options?.indexOf(answer) === 0 ? 100 : 0;
          break;
        case 'multiple-choice':
          questionScore = question.options?.indexOf(answer) === 0 ? 100 : 0;
          break;
        case 'rating':
          questionScore = (Number(answer) / 10) * 100;
          break;
        case 'desires':
        case 'pain-avoidance':
          const selectedOptions = answer || [];
          questionScore = (selectedOptions.length / (question.options?.length || 1)) * 100;
          break;
        default:
          questionScore = 0;
      }
      overallScore += questionScore;
    });

    overallScore = Math.round(overallScore / assessment.questions.length);

    const interpretation = `Congratulations! Based on your responses to the ${assessment.title}, you've completed this assessment with valuable insights about yourself. Your results show your current readiness and understanding in this area.`;

    const categories: any = {};

    categories[settings?.resultPage?.category1] = Math.round(overallScore * 0.8);
    categories[settings?.resultPage?.category2] = Math.round(overallScore * 0.9);
    categories[settings?.resultPage?.category3] = Math.round(overallScore * 1.1);

    const results: AssessmentResult = {
      overallScore: overallScore,
      categories,
      interpretation: interpretation,
    };

    // Store results and assessment data for the contact form to access
    localStorage.setItem('assessment-results', JSON.stringify(results));
    localStorage.setItem('assessment-title', assessment.title);
    localStorage.setItem('assessment-audience', assessment.audience);
    localStorage.setItem('assessment-answers', JSON.stringify(answers));
    localStorage.setItem('assessment-booking-link', settings?.resultPage?.bookingLink);

    navigate('/contact-form');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100" style={ backgroundStyle }>
      <div className="container mx-auto px-4 py-4 sm:py-8">
        {loading ? (
          <div className="flex justify-center items-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-700 font-medium">Loading your assessment...</p>
            </div>
          </div>
        ) : !assessment ? (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">Assessment Not Found</h1>
            <p className="text-gray-700 mb-8 font-medium">The assessment you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md">
              Return to Home
            </Button>
          </div>
        ) : showWelcomePage ? (
          <WelcomePage
            assessmentTitle={assessment.title}
            audience={assessment.audience}
            onSubmit={handleSubmit}
          />
        ) : currentQuestionIndex < assessment.questions.length ? (
          <div className="space-y-4 sm:space-y-6">
            {/* Progress Bar - Compact Mobile Design */}
            <div className="max-w-5xl mx-auto">
              <div className="bg-gray-300 rounded-full h-3 mb-2 sm:mb-4 shadow-inner border border-gray-400">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${((currentQuestionIndex + 1) / assessment.questions.length) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between items-center text-sm text-gray-700 px-1">
                <span className="font-semibold">Question {currentQuestionIndex + 1} of {assessment.questions.length}</span>
                <span className="font-semibold">{Math.round(((currentQuestionIndex + 1) / assessment.questions.length) * 100)}%</span>
              </div>
            </div>

            {/* Question Content - Mobile Optimized */}
            <div className="px-2 sm:px-0">
              <QuestionRenderer
                question={currentQuestion!}
                questionIndex={currentQuestionIndex}
                totalQuestions={assessment.questions.length}
                answer={answers[currentQuestionIndex]}
                onAnswer={handleAnswer}
              />
            </div>

            {/* Navigation Buttons - Mobile Optimized */}
            <div className="flex flex-row justify-between items-center max-w-5xl mx-auto pt-4 sm:pt-6 gap-3 px-2 sm:px-0">
              <Button
                variant="outline"
                onClick={() => {
                  // Stop any playing audio before going back
                  customVoiceService.stopVoice();
                  nativeSpeech.stop();
                  setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                }}
                disabled={currentQuestionIndex === 0}
                className="flex items-center justify-center px-4 py-3 rounded-xl shadow-md hover:shadow-lg transition-all duration-300 border-2 border-gray-400 hover:border-blue-500 bg-white hover:bg-gray-50 text-gray-700 font-semibold w-full sm:w-auto"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              <Button
                onClick={handleNextQuestion}
                disabled={!isAnswered}
                className="flex items-center justify-center px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold w-full sm:w-auto"
              >
                {currentQuestionIndex === assessment.questions.length - 1 ? 'Complete' : 'Next'}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Assessment Complete!</h1>
            <p className="text-gray-700 mb-8 font-medium">Calculating your results...</p>
            <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Assessment;
