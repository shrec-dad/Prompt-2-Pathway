
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '@/store';
import {
  addAssessment,
  updateAssessment,
  fetchAssessmentBySlug
} from '@/store/assessmentsSlice';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X, Trash2, GripVertical, ArrowUp, ArrowDown, Upload, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssessmentTemplate, Question } from '@/types';
import { getImageSrc } from '@/lib/utils';

interface AssessmentEditorProps {
  mode: 'add' | 'update';
}

export const AssessmentEditor = ({ mode }: AssessmentEditorProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const dispatch: AppDispatch = useDispatch();
  const { slug } = useParams<{ slug: string }>();

  const initialAssessment: AssessmentTemplate = {
    _id: '',
    title: '',
    slug: '',
    audience: 'individual',
    description: '',
    image: '',
    tags: [],
    questions: [],
    welcomeMessageAudio: '',
    keepGoingMessageAudio: '',
    congratulationMessageAudio: '',
    contactMessageAudio: ''
  };

  const [assessment, setAssessment] = useState<AssessmentTemplate>(initialAssessment);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const { status } = useSelector((state: RootState) => state.assessments);

  useEffect(() => {
    if (mode === 'update' && slug) {
      setImageFile(null);
      dispatch(fetchAssessmentBySlug(slug))
        .unwrap()
        .then((res) => setAssessment(res))
        .catch(() => {
          toast({ title: "Error", description: "Failed to fetch assessment", variant: "destructive" });
        });
    }
  }, [slug, mode, dispatch, toast]);


  const [newTag, setNewTag] = useState('');

  const handleSave = async () => {
    if (!assessment.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Assessment title is required.",
        variant: "destructive",
      });
      return;
    }
  
    try {
      const formData = new FormData();
      formData.append('title', assessment.title);
      formData.append('audience', assessment.audience);
      formData.append('description', assessment.description);
      formData.append('tags', JSON.stringify(assessment.tags));
      formData.append('questions', JSON.stringify(assessment.questions));

      if (imageFile) {
        formData.append('image', imageFile);
      }

      if (assessment.welcomeMessageAudio) formData.append('welcomeMessageAudio', assessment.welcomeMessageAudio);
      if (assessment.keepGoingMessageAudio) formData.append('keepGoingMessageAudio', assessment.keepGoingMessageAudio);
      if (assessment.congratulationMessageAudio) formData.append('congratulationMessageAudio', assessment.congratulationMessageAudio);
      if (assessment.contactMessageAudio) formData.append('contactMessageAudio', assessment.contactMessageAudio);

      const questionAudioFiles: File[] = [];
      const questionAudioIndexes: number[] = [];

      assessment.questions.forEach((q, idx) => {
        if (q.audio instanceof File) {
          questionAudioFiles.push(q.audio);
          questionAudioIndexes.push(idx);
        }
      });

      questionAudioFiles.forEach((file) => formData.append('questionAudios', file));
      formData.append('questionAudioIndexes', JSON.stringify(questionAudioIndexes));

      if (mode === 'add') {
        await dispatch(addAssessment(formData)).unwrap();
        toast({ title: "Assessment Created", description: "Successfully added." });
      } else if (mode === 'update' && slug) {
        await dispatch(updateAssessment({ id: assessment._id, data: formData })).unwrap();
        toast({ title: "Assessment Updated", description: "Successfully saved." });
      }
      setImageFile(null);
      navigate('/');
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
      setAssessment({
        ...assessment,
        image: URL.createObjectURL(file),
      });
      event.target.value = '';
    }
  };

  const clearAssessmentImage = () => {
    setImageFile(null);
    setAssessment({ ...assessment, image: '' });
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      type: 'yes-no',
      question: 'New question',
      voiceScript: 'Voice script for new question'
    };
    setAssessment({
      ...assessment,
      questions: [...assessment.questions, newQuestion]
    });
    toast({
      title: "Question Added",
      description: "New question has been added to the assessment.",
    });
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const updatedQuestions = [...assessment.questions];
    updatedQuestions[index] = updatedQuestion;
    setAssessment({
      ...assessment,
      questions: updatedQuestions
    });
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = assessment.questions[index];
    setAssessment({
      ...assessment,
      questions: assessment.questions.filter((_, i) => i !== index)
    });
    toast({
      title: "Question Removed",
      description: "Question has been removed from the assessment.",
    });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= assessment.questions.length) return;

    const updatedQuestions = [...assessment.questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    
    setAssessment({
      ...assessment,
      questions: updatedQuestions
    });
  };

  const addTag = () => {
    if (newTag.trim() && !assessment.tags.includes(newTag.trim())) {
      setAssessment({
        ...assessment,
        tags: [...assessment.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setAssessment({
      ...assessment,
      tags: assessment.tags.filter(tag => tag !== tagToRemove)
    });
  };

  const onCancel = () => {
    navigate('/')
  }

  return (
    <div className="space-y-6 p-6">
      {status == 'loading' && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white bg-opacity-90">
          <div className="text-xl font-bold">
            Saving...
          </div>
        </div>
      )}
      <div className={`${status == 'loading' ? 'opacity-50 pointer-events-none' : ''}`}>
        <div className="flex justify-between items-center my-2">
          <h2 className="text-2xl font-bold">{mode === 'add' ? 'Add Assessment' : 'Edit Assessment'}</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave}>
              <Save className="h-4 w-4 mr-2" />
              Save Assessment
            </Button>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Assessment Title</Label>
                <Input 
                  id="title"
                  value={assessment.title}
                  onChange={(e) => setAssessment({...assessment, title: e.target.value})}
                  placeholder="Enter assessment title"
                />
              </div>
              <div>
                <Label htmlFor="audience">Target Audience</Label>
                <Select 
                  value={assessment.audience} 
                  onValueChange={(value: 'individual' | 'business') => 
                    setAssessment({...assessment, audience: value})
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="business">Business Owner</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description"
                value={assessment.description}
                onChange={(e) => setAssessment({...assessment, description: e.target.value})}
                rows={3}
                placeholder="Enter assessment description"
              />
            </div>

            <div>
              <Label htmlFor="image-upload">Assessment Image</Label>
              <div className="space-y-4">
                {assessment.image && (
                  <div className="relative max-w-md">
                    <img 
                      src={getImageSrc(assessment.image)} 
                      alt="Assessment preview"
                      className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAssessmentImage}
                      className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                <div className="flex items-center space-x-4">
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="flex items-center"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {assessment.image ? 'Change Image' : 'Upload Image'}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <Label>Welcome Message Audio</Label>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.welcomeMessageAudio instanceof File ? assessment.welcomeMessageAudio.name : assessment.welcomeMessageAudio}
              </p>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAssessment({
                  ...assessment,
                  welcomeMessageAudio: e.target.files?.[0] ?? null
                })}
              />
            </div>

            <div className="space-y-4">
              <Label>Keep Going Message Audio</Label>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.keepGoingMessageAudio instanceof File ? assessment.keepGoingMessageAudio.name : assessment.keepGoingMessageAudio}
              </p>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAssessment({
                  ...assessment,
                  keepGoingMessageAudio: e.target.files?.[0] ?? null
                })}
              />
            </div>

            <div className="space-y-4">
              <Label>Contact Message Audio</Label>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.contactMessageAudio instanceof File ? assessment.contactMessageAudio.name : assessment.contactMessageAudio || 'None'}
              </p>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAssessment({
                  ...assessment,
                  contactMessageAudio: e.target.files?.[0] ?? ''
                })}
              />
            </div>

            <div className="space-y-4">
              <Label>Congratulation Message Audio</Label>
              <p className="text-sm text-gray-500 mt-1">
                {assessment.congratulationMessageAudio instanceof File ? assessment.congratulationMessageAudio.name : assessment.congratulationMessageAudio}
              </p>
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => setAssessment({
                  ...assessment,
                  congratulationMessageAudio: e.target.files?.[0] ?? null
                })}
              />
            </div>
            
            <div>
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(assessment.tags || []).map((tag, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {tag}
                    <X 
                      className="h-3 w-3 cursor-pointer" 
                      onClick={() => removeTag(tag)}
                    />
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <Button variant="outline" onClick={addTag}>Add</Button>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 my-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold">Questions ({assessment.questions.length})</h3>
            <Button onClick={addQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Add Question
            </Button>
          </div>

          <div className="space-y-4">
            {(assessment.questions || []).map((question, index) => (
              <QuestionEditor
                key={question.id}
                question={question}
                index={index}
                onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
                onRemove={() => removeQuestion(index)}
                onMoveUp={() => moveQuestion(index, 'up')}
                onMoveDown={() => moveQuestion(index, 'down')}
                canMoveUp={index > 0}
                canMoveDown={index < assessment.questions.length - 1}
              />
            ))}
            
            {assessment.questions.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500 mb-4">No questions yet</p>
                <Button onClick={addQuestion} variant="outline">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Question
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};

interface QuestionEditorProps {
  question: Question;
  index: number;
  onUpdate: (question: Question) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}

const QuestionEditor = ({
  question,
  index,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  canMoveUp,
  canMoveDown
}: QuestionEditorProps) => {
  const [expanded, setExpanded] = useState(false);

  const questionTypes = [
    { value: 'yes-no', label: 'Yes/No Question' },
    { value: 'this-that', label: 'This or That' },
    { value: 'multiple-choice', label: 'Multiple Choice' },
    { value: 'rating', label: 'Rating Scale' },
    { value: 'desires', label: 'Desires Assessment' },
    { value: 'pain-avoidance', label: 'Pain Avoidance' }
  ];

  const needsOptions = ['this-that', 'multiple-choice', 'desires', 'pain-avoidance'].includes(question.type);

  const addOption = () => {
    const currentOptions = question.options || [];
    onUpdate({
      ...question,
      options: [...currentOptions, 'New option']
    });
  };

  const updateOption = (optionIndex: number, value: string) => {
    const updatedOptions = [...(question.options || [])];
    updatedOptions[optionIndex] = value;
    onUpdate({
      ...question,
      options: updatedOptions
    });
  };

  const removeOption = (optionIndex: number) => {
    const updatedOptions = (question.options || []).filter((_, i) => i !== optionIndex);
    onUpdate({
      ...question,
      options: updatedOptions
    });
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <GripVertical className="h-4 w-4 text-gray-400" />
          <span className="font-medium">Question {index + 1}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMoveUp}
            disabled={!canMoveUp}
          >
            <ArrowUp className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onMoveDown}
            disabled={!canMoveDown}
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </Button>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <Input
            value={question.question}
            onChange={(e) => onUpdate({...question, question: e.target.value})}
            placeholder="Enter your question"
          />
        </div>

        {expanded && (
          <>
            <div>
              <Label>Question Type</Label>
              <Select 
                value={question.type} 
                onValueChange={(value: Question['type']) => 
                  onUpdate({...question, type: value, options: needsOptions ? ['Option 1', 'Option 2'] : undefined})
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {questionTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Voice Script</Label>
              <Textarea
                value={question.voiceScript || ''}
                onChange={(e) => onUpdate({...question, voiceScript: e.target.value})}
                placeholder="Enter voice script for this question"
                rows={2}
              />
            </div>

            {needsOptions && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <Label>Answer Options</Label>
                  <Button variant="outline" size="sm" onClick={addOption}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Option
                  </Button>
                </div>
                <div className="space-y-2">
                  {(question.options || []).map((option, optionIndex) => (
                    <div key={optionIndex} className="flex gap-2">
                      <Input
                        value={option}
                        onChange={(e) => updateOption(optionIndex, e.target.value)}
                        placeholder={`Option ${optionIndex + 1}`}
                      />
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => removeOption(optionIndex)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div>
              <Label>Question Message Audio</Label>
              {question.audio && (
                  <p className="text-sm text-gray-500 my-1">
                    {question.audio instanceof File ? question.audio.name : question.audio}
                  </p>
                )}
              <Input
                type="file"
                accept="audio/*"
                onChange={(e) => onUpdate({
                  ...question,
                  audio: e.target.files?.[0] ?? undefined
                })}
              />
            </div>
          </>
        )}
      </div>
    </Card>
  );
};
