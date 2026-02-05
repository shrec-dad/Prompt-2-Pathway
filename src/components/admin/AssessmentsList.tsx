import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Copy, Trash2, Link, Upload, FileSpreadsheet } from 'lucide-react';
import { RootState, AppDispatch } from '@/store';
import { getImageSrc } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  fetchAssessments,
  duplicateAssessment,
  removeAssessment,
} from '@/store/assessmentsSlice';
import { importQuestionsAPI } from '@/api';

export const AssessmentsList = () => {
	const navigate = useNavigate();
	const dispatch: AppDispatch = useDispatch();

	const { list, status, error } = useSelector((state: RootState) => state.assessments);

  const { toast } = useToast();
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);

	// Fetch assessments on mount
  useEffect(() => {
    dispatch(fetchAssessments());
  }, [dispatch]);

	const handleCreate = () => {
    navigate('/assessment/add')
    toast({
      title: "New Template",
      description: "Creating new assessment template",
    });
  };

	const handleEdit = (assessment) => {
    navigate(`/assessment/update/${assessment.slug}`);
  };

	const handleDuplicate = async (assessment) => {
    try {
      await dispatch(duplicateAssessment(assessment._id)).unwrap();
      toast({ title: 'Duplicated', description: 'Assessment duplicated successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to duplicate assessment' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assessment?')) return;
    try {
      await dispatch(removeAssessment(id)).unwrap();
      toast({ title: 'Deleted', description: 'Assessment deleted successfully' });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to delete assessment' });
    }
  };

  const copyAssessmentLink = (assessment) => {
    navigator.clipboard.writeText(`${window.location.origin}/assessment/${assessment.slug}`);
    toast({ title: 'Copied', description: 'Assessment URL copied to clipboard' });
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.type !== 'text/csv' && !file.name.endsWith('.csv')) {
        toast({
          title: 'Invalid File',
          description: 'Please select a CSV file',
          variant: 'destructive',
        });
        return;
      }
      setSelectedFile(file);
    }
  };

  const parseCSV = (csvText: string): any[] => {
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return [];

    // Parse header - handle quoted headers
    const parseCSVLine = (line: string): string[] => {
      const values: string[] = [];
      let currentValue = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            currentValue += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          values.push(currentValue.trim());
          currentValue = '';
        } else {
          currentValue += char;
        }
      }
      values.push(currentValue.trim());
      return values;
    };

    const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());
    
    // Parse data rows
    const rows = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]);
      
      if (values.length >= headers.length) {
        const row: any = {};
        headers.forEach((header, index) => {
          row[header] = (values[index] || '').trim().replace(/^"|"$/g, '');
        });
        rows.push(row);
      }
    }
    
    return rows;
  };

  const transformCSVToQuestions = (csvRows: any[]): any[] => {
    const questionsMap = new Map<string, any>();
    
    csvRows.forEach((row) => {
      // Handle case-insensitive column names
      const slug = (row.assessment_slug || row['assessment slug'])?.trim();
      if (!slug) {
        console.warn('Skipping row with missing assessment_slug:', row);
        return;
      }

      const questionOrder = parseInt(row.question_order || row['question order'] || '0');
      if (!questionOrder || isNaN(questionOrder)) {
        console.warn('Skipping row with invalid question_order:', row);
        return;
      }

      const questionText = (row.question_text || row['question text'])?.trim() || '';
      if (!questionText) {
        console.warn('Skipping row with missing question_text:', row);
        return;
      }

      const questionType = (row.question_type || row['question type'])?.trim() || '';
      if (!questionType) {
        console.warn('Skipping row with missing question_type:', row);
        return;
      }

      const voiceScript = (row.voice_script || row['voice script'])?.trim() || '';

      // Collect options (option1, option2, ..., optionN)
      // Check all possible variations of option column names (case-insensitive, with/without spaces)
      const options: string[] = [];
      let optionIndex = 1;
      let foundOption = true;
      
      while (foundOption) {
        // Try multiple variations: option1, Option1, option 1, Option 1, etc.
        const optionKeys = [
          `option${optionIndex}`,
          `option ${optionIndex}`,
          `Option${optionIndex}`,
          `Option ${optionIndex}`,
          `OPTION${optionIndex}`,
          `OPTION ${optionIndex}`
        ];
        
        let optionValue = null;
        for (const key of optionKeys) {
          if (row.hasOwnProperty(key) && row[key] !== undefined && row[key] !== null) {
            optionValue = String(row[key]).trim();
            break;
          }
        }
        
        // Also check all row keys for case-insensitive match
        if (!optionValue) {
          const lowerOptionKey = `option${optionIndex}`;
          for (const key in row) {
            if (key.toLowerCase() === lowerOptionKey || key.toLowerCase() === `option ${optionIndex}`) {
              optionValue = String(row[key]).trim();
              break;
            }
          }
        }
        
        if (optionValue && optionValue !== '') {
          options.push(optionValue);
          optionIndex++;
        } else {
          foundOption = false;
        }
      }
      
      // Debug log to help troubleshoot
      if (options.length === 0 && Object.keys(row).some(k => k.toLowerCase().startsWith('option'))) {
        console.log('Found option columns but no values:', Object.keys(row).filter(k => k.toLowerCase().startsWith('option')));
      }

      const key = `${slug}_${questionOrder}`;
      if (!questionsMap.has(key)) {
        questionsMap.set(key, {
          assessmentSlug: slug,
          question: {
            id: questionOrder,
            type: questionType,
            question: questionText,
            voiceScript: voiceScript,
            options: options.length > 0 ? options : [],
          }
        });
      }
    });

    // Group by assessment slug
    const groupedBySlug = new Map<string, any[]>();
    questionsMap.forEach((value) => {
      const slug = value.assessmentSlug;
      if (!groupedBySlug.has(slug)) {
        groupedBySlug.set(slug, []);
      }
      groupedBySlug.get(slug)!.push(value.question);
    });

    return Array.from(groupedBySlug.entries()).map(([slug, questions]) => ({
      slug,
      questions: questions.sort((a, b) => a.id - b.id)
    }));
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast({
        title: 'No File Selected',
        description: 'Please select a CSV file to import',
        variant: 'destructive',
      });
      return;
    }

    setImporting(true);
    try {
      const fileText = await selectedFile.text();
      const csvRows = parseCSV(fileText);
      
      if (csvRows.length === 0) {
        throw new Error('CSV file is empty or invalid');
      }

      const questionsData = transformCSVToQuestions(csvRows);
      
      if (questionsData.length === 0) {
        throw new Error('No valid questions found in CSV');
      }

      // Import questions for each assessment
      let successCount = 0;
      let errorCount = 0;
      
      for (const data of questionsData) {
        try {
          await importQuestionsAPI(data.slug, data.questions);
          successCount++;
        } catch (err: any) {
          console.error(`Failed to import questions for ${data.slug}:`, err);
          errorCount++;
        }
      }

      if (successCount > 0) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported questions for ${successCount} assessment(s)${errorCount > 0 ? `. ${errorCount} failed.` : ''}`,
        });
        dispatch(fetchAssessments()); // Refresh the list
        setImportDialogOpen(false);
        setSelectedFile(null);
      } else {
        throw new Error('Failed to import questions for all assessments');
      }
    } catch (err: any) {
      toast({
        title: 'Import Failed',
        description: err.message || 'Failed to import questions from CSV file',
        variant: 'destructive',
      });
    } finally {
      setImporting(false);
    }
  };

	// Loading/Error UI
  if (status === 'loading') return <p>Loading assessments...</p>;
  if (status === 'failed') return <p className="text-red-600">Error: {error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
				<h3 className="text-2xl font-bold text-gray-900">Available Assessments</h3>
				<div className="flex gap-2">
					<Button 
						onClick={() => setImportDialogOpen(true)} 
						className="flex items-center bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-md"
					>
						<Upload className="h-4 w-4 mr-2" />
						Import Questions
					</Button>
					<Button onClick={handleCreate} className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md">
						<Plus className="h-4 w-4 mr-2" />
						Create New
					</Button>
				</div>
			</div>

			<Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle className="flex items-center gap-2">
							<FileSpreadsheet className="h-5 w-5" />
							Import Questions from CSV
						</DialogTitle>
						<DialogDescription>
							Upload a CSV file to import questions. The CSV should have columns: assessment_slug, question_order, question_text, question_type, required, voice_script, option1, option2, etc.
						</DialogDescription>
					</DialogHeader>
					<div className="space-y-4 py-4">
						<div>
							<label className="block text-sm font-medium text-gray-700 mb-2">
								Select CSV File
							</label>
							<input
								type="file"
								accept=".csv"
								onChange={handleFileSelect}
								className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
							/>
							{selectedFile && (
								<p className="mt-2 text-sm text-gray-600">
									Selected: <span className="font-semibold">{selectedFile.name}</span>
								</p>
							)}
						</div>
						<div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-3">
							<p className="text-xs text-blue-900 font-semibold mb-1">CSV Format:</p>
							<ul className="text-xs text-blue-800 space-y-1 list-disc list-inside">
								<li>assessment_slug: The slug of the assessment</li>
								<li>question_order: Order number (1, 2, 3...)</li>
								<li>question_text: The question text</li>
								<li>question_type: yes-no, this-that, multiple-choice, rating, desires, pain-avoidance.</li>
								<li>required: TRUE or FALSE</li>
								<li>voice_script: Voice script for the question</li>
								<li>option1, option2, ...: Options (as many as needed)</li>
							</ul>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => {
								setImportDialogOpen(false);
								setSelectedFile(null);
							}}
							disabled={importing}
						>
							Cancel
						</Button>
						<Button
							onClick={handleImport}
							disabled={!selectedFile || importing}
							className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
						>
							{importing ? 'Importing...' : 'Import Questions'}
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
			
			<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
				{list.map((assessment) => (
					<Card key={assessment._id} className="overflow-hidden border-2 border-gray-300 shadow-lg hover:shadow-xl transition-shadow bg-white">
						{assessment.image && (
							<div className="h-48 overflow-hidden">
								<img 
									src={getImageSrc(assessment.image)} 
									alt={assessment.title}
									className="w-full h-full object-cover"
								/>
							</div>
						)}
						<div className="p-6">
							<div className="flex items-start justify-between mb-4">
								<div className="flex-1">
									<h4 className="font-bold text-lg mb-2 text-gray-900">{assessment.title}</h4>
									<p className="text-sm text-gray-700 mb-3">{assessment.description}</p>
									
									<div className="flex flex-wrap gap-1 mb-3">
										<Badge variant={assessment.audience === 'business' ? 'default' : 'secondary'} className="font-semibold">
											{assessment.audience}
										</Badge>
										{assessment.tags.map((tag, index) => (
											<Badge key={index} variant="outline" className="text-xs border-gray-400 text-gray-700">
												{tag}
											</Badge>
										))}
									</div>
									
									<p className="text-xs text-gray-600 mb-4 font-medium">
										{assessment.questions.length} questions • Est. {Math.ceil(assessment.questions.length * 0.75)} min
									</p>
									
									<div className="bg-gradient-to-r from-blue-100 to-indigo-100 border-2 border-blue-300 p-3 rounded-lg mb-4">
										<p className="text-sm font-bold text-blue-900 mb-1">Public Link:</p>
										<code className="text-xs bg-white px-2 py-1 rounded border-2 border-blue-200 block w-full text-gray-800 break-all font-mono">
											{window.location.origin}/assessment/{assessment.slug}
										</code>
									</div>
								</div>
							</div>
							
							<div className="flex flex-wrap gap-2">
								<Button 
									size="sm"
									onClick={() => copyAssessmentLink(assessment)}
									className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1 shadow-md font-semibold"
								>
									<Link className="h-3 w-3" />
									Copy URL
								</Button>
								<Button 
									variant="outline" 
									size="sm"
									onClick={() => handleEdit(assessment)}
									className="border-2 border-gray-400 hover:border-blue-500 hover:bg-blue-50 font-semibold"
								>
									<Edit className="h-3 w-3 mr-1" />
									Edit
								</Button>
								<Button 
									variant="outline" 
									size="sm"
									onClick={() => handleDuplicate(assessment)}
									className="border-2 border-gray-400 hover:border-purple-500 hover:bg-purple-50 font-semibold"
								>
									<Copy className="h-3 w-3 mr-1" />
									Duplicate
								</Button>
								<Button 
									variant="outline" 
									size="sm"
									onClick={() => handleDelete(assessment._id)}
									className="text-red-700 hover:text-white hover:bg-red-600 border-2 border-red-400 hover:border-red-600 font-semibold"
								>
									<Trash2 className="h-3 w-3" />
								</Button>
							</div>
						</div>
					</Card>
				))}
			</div>
    </div>
  );
};
