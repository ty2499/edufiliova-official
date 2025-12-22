import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, FileText, Clock, Target, BookOpen } from 'lucide-react';
// Educational system removed

interface TestPapersProps {
  countryId: number;
  subject: string;
  gradeLevel: number;
  onBack: () => void;
}

const TestPapers = ({ countryId, subject, gradeLevel, onBack }: TestPapersProps) => {
  // Educational system hook removed
  const [selectedPaper, setSelectedPaper] = useState<any>(null);

  const country = getCountryById(countryId);
  const gradeDisplay = getGradeDisplayName(countryId, gradeLevel);
  
  const subjectPapers = testPapers.filter(paper => 
    paper.country_id === countryId && 
    paper.subject === subject &&
    paper.grade_level === gradeLevel
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-primary-foreground text-xl">Loading test papers...</div>
      </div>
    );
  }

  const renderQuestion = (question: any, index: number) => {
    return (
      <div key={index} className="mb-6 p-4 bg-slate-50 rounded-lg">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-foreground">
            Question {question.number || index + 1}
          </h4>
          <Badge variant="secondary">{question.marks} marks</Badge>
        </div>
        <p className="text-slate-700 mb-2">{question.question}</p>
        {question.type && (
          <Badge variant="outline" className="text-xs">
            {question.type.replace('_', ' ')}
          </Badge>
        )}
      </div>
    );
  };

  if (selectedPaper) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <Button 
              onClick={() => setSelectedPaper(null)}
              variant="outline" 
              className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Test Papers
            </Button>

            <Card className="bg-white/95 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl text-foreground">{selectedPaper.title}</CardTitle>
                    <CardDescription className="text-lg mt-2">
                      {subject} • {gradeDisplay} • {country?.name}
                    </CardDescription>
                  </div>
                  <div className="text-right">
                    <Badge variant="default" className="mb-2">
                      {selectedPaper.paper_type.replace('_', ' ').toUpperCase()}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      {selectedPaper.duration_minutes} minutes
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">Instructions</h3>
                  <p className="text-blue-800">{selectedPaper.questions.instructions}</p>
                </div>

                <ScrollArea className="h-[600px] pr-4">
                  {/* Section A Questions */}
                  {selectedPaper.questions.section_a && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-foreground mb-4">Section A</h3>
                      {selectedPaper.questions.section_a.map((question: any, index: number) => 
                        renderQuestion(question, index)
                      )}
                    </div>
                  )}

                  {/* Section B Questions */}
                  {selectedPaper.questions.section_b && (
                    <div className="mb-8">
                      <h3 className="text-xl font-bold text-foreground mb-4">Section B</h3>
                      <p className="text-sm text-muted-foreground mb-4">Choose TWO questions from this section</p>
                      {selectedPaper.questions.section_b.map((question: any, index: number) => 
                        renderQuestion(question, index)
                      )}
                    </div>
                  )}

                  {/* Regular Questions */}
                  {selectedPaper.questions.questions && (
                    <div>
                      {selectedPaper.questions.questions.map((question: any, index: number) => 
                        renderQuestion(question, index)
                      )}
                    </div>
                  )}

                  {/* Marking Scheme */}
                  {selectedPaper.marking_scheme && (
                    <div className="mt-8 p-4 bg-green-50 rounded-lg">
                      <h3 className="font-semibold text-green-900 mb-3">Marking Scheme</h3>
                      <div className="text-green-800 text-sm space-y-2">
                        <p><strong>Total Marks:</strong> {selectedPaper.marking_scheme.total_marks}</p>
                        <p><strong>Marking Criteria:</strong> {selectedPaper.marking_scheme.marking_criteria}</p>
                        {selectedPaper.marking_scheme.grade_boundaries && (
                          <div>
                            <p><strong>Grade Boundaries:</strong></p>
                            <ul className="ml-4 list-disc">
                              {Object.entries(selectedPaper.marking_scheme.grade_boundaries).map(([grade, marks]) => (
                                <li key={grade}>Grade {grade}: {marks as number}+ marks</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <Button 
            onClick={onBack}
            variant="outline" 
            className="mb-6 bg-white/10 text-white border-white/20 hover:bg-white/20"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Test Papers
            </h1>
            <p className="text-xl text-white/80">
              {subject} • {gradeDisplay} • {country?.name}
            </p>
          </div>

          {subjectPapers.length === 0 ? (
            <Card className="bg-white/95 backdrop-blur-sm">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Test Papers Available</h3>
                <p className="text-muted-foreground">
                  Test papers for {subject} in {gradeDisplay} are not available yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subjectPapers.map((paper) => (
                <Card 
                  key={paper.id} 
                  className="bg-white/95 backdrop-blur-sm hover:bg-white transition-all duration-200 cursor-pointer group"
                  onClick={() => setSelectedPaper(paper)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <FileText className="h-8 w-8 text-foreground group-hover:text-foreground/80" />
                      <div className="text-right">
                        <Badge variant={paper.paper_type === 'paper_1' ? 'default' : 'secondary'}>
                          {paper.paper_type.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{paper.title}</CardTitle>
                    <CardDescription>
                      {paper.format_type === 'short' ? 'Short Format' : 'Long Format'} • {paper.duration_minutes} min
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-muted-foreground">
                          <Clock className="h-4 w-4 mr-1" />
                          {paper.duration_minutes} minutes
                        </div>
                        <div className="flex items-center text-muted-foreground">
                          <Target className="h-4 w-4 mr-1" />
                          {paper.marking_scheme?.total_marks || 'TBD'} marks
                        </div>
                      </div>
                      <Separator />
                      <Button 
                        className="w-full" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedPaper(paper);
                        }}
                      >
                        <BookOpen className="mr-2 h-4 w-4" />
                        View Paper
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TestPapers;
