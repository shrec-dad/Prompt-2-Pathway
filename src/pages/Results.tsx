import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Calendar, ExternalLink } from 'lucide-react';
import { VoicePlayer } from '@/components/VoicePlayer';
import { useToast } from "@/hooks/use-toast";
import { CelebrationEffects } from '@/components/CelebrationEffects';
import { useSettings } from '../SettingsContext';

interface AssessmentResult {
  overallScore: number;
  categories: { [key: string]: number };
  interpretation: string;
}

interface AssessmentTemplate {
  id: number;
  title: string;
  audience: 'individual' | 'business';
}

const Results = () => {
  const { settings } = useSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [results, setResults] = useState<AssessmentResult | null>(null);
  const [ bookingLink, setBookingLink] = useState<string>('');
  const [assessment, setAssessment] = useState<AssessmentTemplate | null>(null);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [showVoicePlayer, setShowVoicePlayer] = useState(false);
  const [showCelebration, setShowCelebration] = useState(true);

  useEffect(() => {
    setBookingLink(localStorage.getItem('assessment-booking-link'));
    const storedResults = localStorage.getItem('assessment-results');
    const storedUserInfo = localStorage.getItem('user-info');
    const assessmentData = location.state?.assessment;

    if (storedResults) {
      setResults(JSON.parse(storedResults));
    }
    
    if (storedUserInfo) {
      setUserInfo(JSON.parse(storedUserInfo));
    }
    
    if (assessmentData) {
      setAssessment(assessmentData);
    } else {
      const assessmentTitle = localStorage.getItem('assessment-title');
      const assessmentAudience = localStorage.getItem('assessment-audience');
      if (assessmentTitle) {
        setAssessment({
          id: 0,
          title: assessmentTitle,
          audience: (assessmentAudience as 'individual' | 'business') || 'individual',
        });
      }
    }
  }, [location.state?.assessment]);

  const handleCelebrationComplete = () => {
    console.log('Celebration completed, showing voice player');
    setShowCelebration(false);
    // Longer delay to ensure celebration audio stops completely
    setTimeout(() => {
      console.log('Setting showVoicePlayer to true for auto-play');
      setShowVoicePlayer(true);
    }, 100); // Ensure no overlap
  };

  const handleScheduleCall = () => {
    // Direct link to TidyCal - opens in new tab
    window.open(bookingLink, '_blank');
  };

  if (!results || !assessment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-semibold">Loading your results...</p>
        </div>
      </div>
    );
  }

  const voiceScript = `Hello ${userInfo?.firstName || 'there'}, and congratulations on completing your Prompt 2 Pathway assessment! This is truly an accomplishment worth celebrating. Taking the time for this kind of self-reflection shows real commitment to your growth. Your overall clarity score of ${results.overallScore} out of 100 is a meaningful indicator of your current understanding and readiness in this area.`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-blue-100 to-purple-100">
      {showCelebration && <CelebrationEffects onComplete={handleCelebrationComplete} />}
      
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="max-w-5xl mx-auto">
          {/* Enhanced Header with Name */}
          <div className="text-center mb-8 sm:mb-10">
            <div className="flex justify-center mb-4 sm:mb-6">
              <div className="bg-gradient-to-r from-yellow-400 to-orange-500 p-3 sm:p-4 rounded-full shadow-2xl border-4 border-yellow-300">
                <Trophy className="h-8 w-8 sm:h-12 sm:w-12 text-white" />
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 drop-shadow-md">
              🎉 CONGRATULATIONS {userInfo?.firstName?.toUpperCase() || 'THERE'}, YOU DID IT! 🎉
            </h1>
            <p className="text-lg sm:text-xl text-gray-700 mb-2 font-semibold">Assessment Complete - Your Personalized Results Are Here!</p>
            <p className="text-base sm:text-lg text-gray-700 px-4 font-medium">
              You've successfully completed your <span className="font-bold text-blue-700">{assessment.title}</span> assessment. 
              Your detailed insights and actionable next steps are outlined below.
            </p>
          </div>

          {/* Voice Player */}
          {showVoicePlayer && (
            <VoicePlayer
              text={voiceScript}
              autoPlay={true}
              isResultsPage={true}
              className="mb-8 sm:mb-10"
            />
          )}

          {/* Results in Light Green Box */}
          <Card className="p-6 sm:p-10 mb-8 sm:mb-10 bg-gradient-to-br from-green-50 via-white to-green-50 border-4 border-green-300 shadow-2xl rounded-2xl">
            <div className="text-center mb-6 sm:mb-8">
              <div className="relative inline-block mb-4 sm:mb-6">
                <div className="text-6xl sm:text-8xl font-bold bg-gradient-to-r from-blue-700 to-purple-700 bg-clip-text text-transparent drop-shadow-lg">
                  {results.overallScore}
                </div>
                <div className="text-lg sm:text-2xl font-bold text-gray-700 mt-2">
                  out of 100
                </div>
                <div className="absolute -top-2 -right-2">
                  <Star className="h-6 w-6 sm:h-8 sm:w-8 text-yellow-500 fill-current drop-shadow-md" />
                </div>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
                Your Overall Score: {results.overallScore}%
              </h2>
              <div className="max-w-3xl mx-auto">
                <p className="text-lg sm:text-xl text-gray-800 leading-relaxed font-semibold">
                  {results.interpretation}
                </p>
              </div>
            </div>

            {/* Score breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-10">
              {Object.entries(results.categories).map(([category, score]) => (
                <div key={category} className="bg-gradient-to-br from-gray-100 to-blue-100 p-4 sm:p-6 rounded-xl border-2 border-blue-300 shadow-lg">
                  <div className="flex justify-between items-center mb-3 sm:mb-4">
                    <span className="font-bold text-gray-900 capitalize text-base sm:text-lg">
                      {category.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <span className="text-xl sm:text-2xl font-bold text-blue-700">{score}%</span>
                  </div>
                  <div className="bg-gray-300 rounded-full h-3 sm:h-4 shadow-inner border border-gray-400">
                    <div
                      className="bg-gradient-to-r from-blue-600 to-purple-600 h-3 sm:h-4 rounded-full transition-all duration-1000 shadow-lg"
                      style={{ width: `${score}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Booking Section - Direct link to TidyCal */}
          <Card className="p-6 sm:p-10 mb-8 sm:mb-10 bg-gradient-to-br from-purple-100 via-blue-100 to-indigo-100 border-4 border-purple-300 shadow-2xl rounded-2xl">
            <div className="text-center">
              <h3 className="text-2xl sm:text-4xl font-bold text-gray-900 mb-4 sm:mb-6">
                Ready to Explore More?
              </h3>
              <p className="text-lg sm:text-xl text-gray-700 mb-6 sm:mb-8 max-w-3xl mx-auto font-semibold">
                Your journey doesn't end here. We're here to support your continued growth, 
                but only if you're open to exploring what's possible.
              </p>
              
              <div className="space-y-4 sm:space-y-6">
                <Button
                  onClick={handleScheduleCall}
                  className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white border-4 border-orange-300 px-8 sm:px-16 py-6 sm:py-8 text-lg sm:text-2xl font-bold rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 w-full sm:w-auto"
                >
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 mr-3 sm:mr-4" />
                  Schedule a Clarity Call
                  <ExternalLink className="h-4 w-4 sm:h-5 sm:w-5 ml-2 sm:ml-3" />
                </Button>
                
                <p className="text-gray-600 mt-4 sm:mt-6 text-base sm:text-lg font-medium">
                  No pressure - we'll only follow up if you indicate you'd like us to.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Results;
