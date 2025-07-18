
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Save, X, Trash2, GripVertical, ArrowUp, ArrowDown, Upload, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AssessmentTemplate, Question } from '@/types/assessment';

interface AssessmentEditorProps {
  template: AssessmentTemplate;
  onSave: (template: AssessmentTemplate) => void;
  onCancel: () => void;
}

export const AssessmentEditor = ({ template, onSave, onCancel }: AssessmentEditorProps) => {
  const [editedTemplate, setEditedTemplate] = useState<AssessmentTemplate>(template);
  const [newTag, setNewTag] = useState('');
  const { toast } = useToast();

  const handleSave = () => {
    if (!editedTemplate.title.trim()) {
      toast({
        title: "Validation Error",
        description: "Assessment title is required.",
        variant: "destructive",
      });
      return;
    }
    onSave(editedTemplate);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setEditedTemplate({
          ...editedTemplate,
          image: imageUrl
        });
        toast({
          title: "Image Uploaded",
          description: "Assessment image has been updated.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const addQuestion = () => {
    const newQuestion: Question = {
      id: Date.now(),
      type: 'yes-no',
      question: 'New question',
      voiceScript: 'Voice script for new question'
    };
    setEditedTemplate({
      ...editedTemplate,
      questions: [...editedTemplate.questions, newQuestion]
    });
    toast({
      title: "Question Added",
      description: "New question has been added to the assessment.",
    });
  };

  const updateQuestion = (index: number, updatedQuestion: Question) => {
    const updatedQuestions = [...editedTemplate.questions];
    updatedQuestions[index] = updatedQuestion;
    setEditedTemplate({
      ...editedTemplate,
      questions: updatedQuestions
    });
  };

  const removeQuestion = (index: number) => {
    const questionToRemove = editedTemplate.questions[index];
    setEditedTemplate({
      ...editedTemplate,
      questions: editedTemplate.questions.filter((_, i) => i !== index)
    });
    toast({
      title: "Question Removed",
      description: "Question has been removed from the assessment.",
    });
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= editedTemplate.questions.length) return;

    const updatedQuestions = [...editedTemplate.questions];
    [updatedQuestions[index], updatedQuestions[newIndex]] = [updatedQuestions[newIndex], updatedQuestions[index]];
    
    setEditedTemplate({
      ...editedTemplate,
      questions: updatedQuestions
    });
  };

  const addTag = () => {
    if (newTag.trim() && !editedTemplate.tags.includes(newTag.trim())) {
      setEditedTemplate({
        ...editedTemplate,
        tags: [...editedTemplate.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setEditedTemplate({
      ...editedTemplate,
      tags: editedTemplate.tags.filter(tag => tag !== tagToRemove)
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Edit Assessment</h2>
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
                value={editedTemplate.title}
                onChange={(e) => setEditedTemplate({...editedTemplate, title: e.target.value})}
                placeholder="Enter assessment title"
              />
            </div>
            <div>
              <Label htmlFor="audience">Target Audience</Label>
              <Select 
                value={editedTemplate.audience} 
                onValueChange={(value: 'individual' | 'business') => 
                  setEditedTemplate({...editedTemplate, audience: value})
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
              value={editedTemplate.description}
              onChange={(e) => setEditedTemplate({...editedTemplate, description: e.target.value})}
              rows={3}
              placeholder="Enter assessment description"
            />
          </div>

          <div>
            <Label htmlFor="image-upload">Assessment Image (Displays Vertically)</Label>
            <div className="space-y-4">
              {editedTemplate.image && (
                <div className="relative max-w-md">
                  <img 
                    src={editedTemplate.image} 
                    alt="Assessment preview"
                    className="w-full h-64 object-cover rounded-lg border-2 border-gray-200"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditedTemplate({...editedTemplate, image: ''})}
                    className="absolute top-2 right-2 bg-white/80 hover:bg-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <div className="mt-2 text-sm text-gray-600">
                    This image will display vertically at the top of your assessment
                  </div>
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
                  {editedTemplate.image ? 'Change Image' : 'Upload Image'}
                </Button>
                <span className="text-sm text-gray-500">
                  {editedTemplate.image ? 'Image uploaded - will display vertically' : 'Recommended: 400x600px or similar vertical format'}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {editedTemplate.tags.map((tag, index) => (
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

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Questions ({editedTemplate.questions.length})</h3>
          <Button onClick={addQuestion}>
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        <div className="space-y-4">
          {editedTemplate.questions.map((question, index) => (
            <QuestionEditor
              key={question.id}
              question={question}
              index={index}
              onUpdate={(updatedQuestion) => updateQuestion(index, updatedQuestion)}
              onRemove={() => removeQuestion(index)}
              onMoveUp={() => moveQuestion(index, 'up')}
              onMoveDown={() => moveQuestion(index, 'down')}
              canMoveUp={index > 0}
              canMoveDown={index < editedTemplate.questions.length - 1}
            />
          ))}
          
          {editedTemplate.questions.length === 0 && (
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
          </>
        )}
      </div>
    </Card>
  );
};
