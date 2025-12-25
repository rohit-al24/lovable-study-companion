import { useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "@/components/ui/use-toast";
import Navigation from "@/components/Navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Upload,
  Calendar,
  X,
  FileText,
} from "lucide-react";
import { FloatingAssistant } from "@/components/FloatingAssistant";
import AssistantBubble from "@/components/AssistantBubble";
import { useVoice } from "@/hooks/useVoice";

interface Exam {
  subject: string;
  date: string;
}

interface Course {
  name: string;
  units: number;
  completed: number;
  progress: number;
  nextTopic: string;
  color: string;
  totalHours: number;
  hoursCompleted: number;
  exams: Exam[];
  notes: string[];
}

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  // Fetch real course data from backend on mount

  const [isAddCourseOpen, setIsAddCourseOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [newCourse, setNewCourse] = useState({ name: "", units: 6 });
  const [newExam, setNewExam] = useState<Exam>({ subject: "", date: "" });
  const [selectedCourseForUpload, setSelectedCourseForUpload] = useState<number | null>(null);
  const [isAskQuestionOpen, setIsAskQuestionOpen] = useState(false);
  const [selectedCourseForQuestion, setSelectedCourseForQuestion] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [openNoteDialog, setOpenNoteDialog] = useState<{courseIdx: number, noteIdx: number} | null>(null);
  const [noteText, setNoteText] = useState<string>("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewText, setPreviewText] = useState<string>("");
  const [previewFilename, setPreviewFilename] = useState<string>("");
  const [previewCourseIdx, setPreviewCourseIdx] = useState<number | null>(null);

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = (userData as any)?.user?.id || null;
        if (!uid) {
          toast({ title: 'Not signed in', description: 'Please login or register.', variant: 'destructive' });
          return;
        }
        setUserId(uid);

        const { data, error } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', uid);
        if (error) {
          toast({
            title: "Failed to fetch courses",
            description: error.message,
            variant: "destructive",
          });
        } else {
          setCourses(data || []);
        }
      } catch (err) {
        toast({ title: 'Error', description: 'Could not initialize user.', variant: 'destructive' });
      }
    };
    init();
  }, []);

  // Assistant UI + voice
  const [assistantMessage, setAssistantMessage] = useState<string>("");
  const { speak } = useVoice(localStorage.getItem('griffin_voice') || '');

  // Handler for assistant queries on Courses page (calls backend LLM)
  const handleAssistantQuery = async (query: string) => {
    setAssistantMessage('Thinking...');
    try {
      const resp = await fetch('/api/llm/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: query, context: { courses } }),
      });
      const data = await resp.json();
      const answerText = data?.answer || data?.text || 'Sorry, no answer.';
      setAssistantMessage(answerText);
      speak && speak(answerText, 1);
      setTimeout(() => setAssistantMessage(''), 10000);
    } catch (err) {
      console.error(err);
      setAssistantMessage('Error contacting assistant.');
      setTimeout(() => setAssistantMessage(''), 6000);
    }
  };
  // Fetch note text from Supabase notes table
  const handleNoteClick = async (courseIdx: number, noteIdx: number) => {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please login to view notes.', variant: 'destructive' });
      return;
    }
    const course = courses[courseIdx];
    const note = course.notes[noteIdx];
    try {
      const { data, error } = await supabase
        .from('notes')
        .select('id,note_text,text,created_at')
        .match({ user_id: userId, course_name: course.name, filename: note });
      console.log('note fetch response', { data, error });
      if (error) {
        console.error('Error fetching note from Supabase:', error);
        setNoteText(`Could not fetch note text: ${error.message}`);
      } else if (!data || (Array.isArray(data) && data.length === 0)) {
        console.warn('No note row found for', { userId, course: course.name, filename: note });
        setNoteText('No text extracted from this PDF.');
      } else {
        // data may be an array of rows; pick the most recent row that has content
        const rows = Array.isArray(data) ? data : [data];
        // prefer rows with note_text, then legacy text
        let chosen = rows.find(r => r.note_text && String(r.note_text).trim().length > 0)
          || rows.find(r => r.text && String(r.text).trim().length > 0)
          || rows[rows.length - 1];
        const textVal = (chosen?.note_text && String(chosen.note_text).trim().length > 0)
          ? chosen.note_text
          : (chosen?.text || '');
        // Backfill this specific row's note_text from legacy text if needed
        if (chosen && (!chosen.note_text || String(chosen.note_text).trim().length === 0) && chosen.text) {
          try {
            const { error: backfillError } = await supabase
              .from('notes')
              .update({ note_text: chosen.text })
              .eq('id', chosen.id);
            if (backfillError) console.warn('Failed to backfill note_text for id', chosen.id, backfillError);
            else console.log('Backfilled note_text from legacy text column for id', chosen.id);
          } catch (e) {
            console.warn('Backfill attempt threw', e);
          }
        }
        console.log('note row text length', textVal ? String(textVal).length : 0, 'chosen id', chosen?.id);
        setNoteText(textVal || 'No text extracted from this PDF.');
      }
      setOpenNoteDialog({ courseIdx, noteIdx });
    } catch {
      setNoteText("Error connecting to Supabase.");
      setOpenNoteDialog({ courseIdx, noteIdx });
    }
  };

  const addCourse = async () => {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please login to add courses.', variant: 'destructive' });
      return;
    }
    if (newCourse.name) {
      const courseToInsert = {
        ...newCourse,
        user_id: userId,
        completed: 0,
        progress: 0,
        nextTopic: "Getting Started",
        color: ["info", "warm", "success", "primary"][courses.length % 4],
        totalHours: newCourse.units * 4,
        hoursCompleted: 0,
        exams: [],
        notes: [],
      };
      const { error } = await supabase.from('courses').insert([courseToInsert]);
      if (error) {
        toast({
          title: "Failed to add course",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNewCourse({ name: "", units: 6 });
        setIsAddCourseOpen(false);
        // Refresh courses from Supabase
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', userId);
        setCourses(data || []);
      }
    }
  };

  const addExamToCourse = async (courseIndex: number) => {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please login to add exams.', variant: 'destructive' });
      return;
    }
    if (newExam.subject && newExam.date) {
      const updated = [...courses];
      updated[courseIndex].exams.push({ ...newExam });
      // Save updated exams to Supabase
      const { error } = await supabase
        .from('courses')
        .update({ exams: updated[courseIndex].exams })
        .eq('user_id', userId)
        .eq('name', updated[courseIndex].name);
      if (error) {
        toast({
          title: "Failed to add exam",
          description: error.message,
          variant: "destructive",
        });
      } else {
        setNewExam({ subject: "", date: "" });
        // Refresh courses from Supabase
        const { data } = await supabase
          .from('courses')
          .select('*')
          .eq('user_id', userId);
        setCourses(data || []);
      }
    }
  };

  const removeExam = async (courseIndex: number, examIndex: number) => {
    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please login to modify exams.', variant: 'destructive' });
      return;
    }
    const updated = [...courses];
    updated[courseIndex].exams.splice(examIndex, 1);
    // Save updated exams to Supabase
    const { error } = await supabase
      .from('courses')
      .update({ exams: updated[courseIndex].exams })
      .eq('user_id', userId)
      .eq('name', updated[courseIndex].name);
    if (error) {
      toast({
        title: "Failed to remove exam",
        description: error.message,
        variant: "destructive",
      });
    } else {
      // Refresh courses from Supabase
      const { data } = await supabase
        .from('courses')
        .select('*')
        .eq('user_id', userId);
      setCourses(data || []);
    }
  };

  const handleFileUpload = (courseIndex: number) => {
    setSelectedCourseForUpload(courseIndex);
    fileInputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || selectedCourseForUpload === null) return;

    if (!userId) {
      toast({ title: 'Not signed in', description: 'Please login to upload PDFs.', variant: 'destructive' });
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`http://localhost:8000/upload-pdf/${userId}/${courses[selectedCourseForUpload].name}`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        // Show preview dialog with extracted text/summary before saving to DB
        const previewContent = result.text && result.text.trim().length > 0 ? result.text : (result.summary || '');
        setPreviewText(previewContent);
        setPreviewFilename(result.filename);
        setPreviewCourseIdx(selectedCourseForUpload);
        setPreviewOpen(true);
      } else {
        toast({
          title: 'Upload failed',
          description: 'The server could not process your PDF.',
          variant: 'destructive',
        });
        console.error('Upload failed');
      }
    } catch (error) {
      toast({
        title: 'Upload error',
        description: 'Could not connect to the server.',
        variant: 'destructive',
      });
      console.error('Error uploading file:', error);
    }

    // Reset the input
    event.target.value = '';
    setSelectedCourseForUpload(null);
  };

  const savePreviewToDB = async () => {
    if (!userId || previewCourseIdx === null) return;
    const course = courses[previewCourseIdx];
    try {
      const { data: noteInsertData, error: noteError } = await supabase
        .from('notes')
        .insert([
          {
            user_id: userId,
            course_name: course.name,
            filename: previewFilename,
            note_text: previewText || '',
          },
        ])
        .select('id,user_id,course_name,filename,note_text');
      console.log('note insert response (from preview save)', { noteInsertData, noteError });
      if (noteError) {
        toast({ title: 'Failed to save note', description: noteError.message, variant: 'destructive' });
        return;
      }
      // Update course notes list
      const updatedNotes = [...course.notes, previewFilename];
      const { error } = await supabase
        .from('courses')
        .update({ notes: updatedNotes })
        .eq('user_id', userId)
        .eq('name', course.name);
      if (error) {
        toast({ title: 'Failed to update notes', description: error.message, variant: 'destructive' });
        return;
      }
      // Refresh courses
      const { data } = await supabase.from('courses').select('*').eq('user_id', userId);
      setCourses(data || []);
      toast({ title: `Note saved for ${course.name}`, description: 'Extracted text saved to your notes.' });
      setPreviewOpen(false);
      setPreviewText('');
      setPreviewFilename('');
      setPreviewCourseIdx(null);
    } catch (err: any) {
      toast({ title: 'Error', description: 'Could not save note.', variant: 'destructive' });
      console.error('Error saving preview to DB:', err);
    }
  };

  const askQuestion = async () => {
    if (!selectedCourseForQuestion || !question.trim()) return;

    try {
      const response = await fetch(`http://localhost:8000/ask-question/${courses[selectedCourseForQuestion].name}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnswer(result.answer);
      } else {
        setAnswer("Sorry, I couldn't process your question.");
      }
    } catch (error) {
      console.error('Error asking question:', error);
      setAnswer("Error connecting to the server.");
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-warm/10 to-secondary/10 pb-20 md:pb-8 md:pt-20">
      <Navigation />

      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="animate-fade-in space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-foreground">My Courses</h1>
              <p className="text-muted-foreground">
                Track your progress across all subjects
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Dialog open={isAddCourseOpen} onOpenChange={setIsAddCourseOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full gap-2">
                    <Plus className="w-4 h-4" />
                    Add Course
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Course</DialogTitle>
                    <DialogDescription>Provide a name and unit count to create a course.</DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 pt-4">
                    <div className="space-y-2">
                      <Label>Course Name</Label>
                      <Input
                        placeholder="e.g., Biology"
                        value={newCourse.name}
                        onChange={(e) =>
                          setNewCourse({ ...newCourse, name: e.target.value })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Number of Units</Label>
                      <Input
                        type="number"
                        min={1}
                        max={12}
                        value={newCourse.units}
                        onChange={(e) =>
                          setNewCourse({
                            ...newCourse,
                            units: parseInt(e.target.value) || 1,
                          })
                        }
                        className="rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={addCourse}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                    >
                      Add Course
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" className="rounded-full">
                All
              </Button>
              <Button variant="ghost" className="rounded-full">
                Pending
              </Button>
              <Button variant="ghost" className="rounded-full">
                Completed
              </Button>
            </div>
          </div>

          {/* Overall Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Courses</p>
                  <p className="text-2xl font-bold">{courses.length}</p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-success/10 rounded-lg">
                  <Target className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Units Done</p>
                  <p className="text-2xl font-bold">
                    {courses.reduce((acc, c) => acc + c.completed, 0)}/
                    {courses.reduce((acc, c) => acc + c.units, 0)}
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-info/10 rounded-lg">
                  <Clock className="w-5 h-5 text-info" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Hours Studied</p>
                  <p className="text-2xl font-bold">
                    {courses.reduce((acc, c) => acc + c.hoursCompleted, 0)}h
                  </p>
                </div>
              </div>
            </Card>

            <Card className="p-4 shadow-card">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-warm/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-warm" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Avg Progress</p>
                  <p className="text-2xl font-bold">
                    {Math.round(
                      courses.reduce((acc, c) => acc + c.progress, 0) /
                        courses.length
                    )}
                    %
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Course Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {courses.map((course, index) => (
              <Card
                key={index}
                className="p-6 shadow-card hover:shadow-hover transition-all duration-300 cursor-pointer"
              >
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold text-foreground">
                        {course.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {course.completed} of {course.units} units completed
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`bg-${course.color}/20 text-${course.color}-foreground border-none`}
                    >
                      {course.progress}%
                    </Badge>
                  </div>

                  {/* Progress Bar */}
                  <Progress value={course.progress} className="h-2" />

                  {/* Next Topic */}
                  <div className="p-3 bg-muted/30 rounded-xl">
                    <p className="text-xs text-muted-foreground mb-1">
                      Next Topic
                    </p>
                    <p className="font-medium text-sm">{course.nextTopic}</p>
                  </div>

                  {/* Exams Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm">
                        <Calendar className="w-4 h-4" />
                        Exams
                      </Label>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => setSelectedCourse(index)}
                          >
                            <Plus className="w-3 h-3 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="rounded-2xl">
                          <DialogHeader>
                            <DialogTitle>Add Exam for {course.name}</DialogTitle>
                            <DialogDescription>Enter the exam name and date to add it to this course.</DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 pt-4">
                            <div className="space-y-2">
                              <Label>Exam Name</Label>
                              <Input
                                placeholder="e.g., Mid-term"
                                value={newExam.subject}
                                onChange={(e) =>
                                  setNewExam({
                                    ...newExam,
                                    subject: e.target.value,
                                  })
                                }
                                className="rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Date</Label>
                              <Input
                                type="date"
                                value={newExam.date}
                                onChange={(e) =>
                                  setNewExam({ ...newExam, date: e.target.value })
                                }
                                className="rounded-xl"
                              />
                            </div>
                            <Button
                              onClick={() => addExamToCourse(index)}
                              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                            >
                              Add Exam
                            </Button>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                    {course.exams.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {course.exams.map((exam, eIdx) => (
                          <Badge
                            key={eIdx}
                            variant="outline"
                            className="gap-1 pr-1"
                          >
                            {exam.subject} - {new Date(exam.date).toLocaleDateString()}
                            <button
                              onClick={() => removeExam(index, eIdx)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No exams scheduled
                      </p>
                    )}
                  </div>

                  {/* Notes Section */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4" />
                        Notes
                      </Label>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs"
                          onClick={() => handleFileUpload(index)}
                        >
                          <Upload className="w-3 h-3 mr-1" />
                          Upload
                        </Button>
                        <Dialog open={isAskQuestionOpen && selectedCourseForQuestion === index} onOpenChange={(open) => {
                          setIsAskQuestionOpen(open);
                          if (open) setSelectedCourseForQuestion(index);
                          else {
                            setSelectedCourseForQuestion(null);
                            setQuestion("");
                            setAnswer("");
                          }
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs"
                            >
                              Ask AI
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="rounded-2xl">
                            <DialogHeader>
                              <DialogTitle>Ask about {course.name}</DialogTitle>
                              <DialogDescription>Ask an AI-powered question about your uploaded notes for this course.</DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 pt-4">
                              <div className="space-y-2">
                                <Label>Your Question</Label>
                                <Input
                                  placeholder="e.g., What is integration?"
                                  value={question}
                                  onChange={(e) => setQuestion(e.target.value)}
                                  className="rounded-xl"
                                />
                              </div>
                              {answer && (
                                <div className="space-y-2">
                                  <Label>Answer</Label>
                                  <div className="p-3 bg-muted rounded-xl text-sm">
                                    {answer}
                                  </div>
                                </div>
                              )}
                              <Button
                                onClick={askQuestion}
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                                disabled={!question.trim()}
                              >
                                Ask Question
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    {course.notes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {course.notes.map((note, nIdx) => (
                          <Badge
                            key={nIdx}
                            variant="secondary"
                            className="text-xs cursor-pointer hover:underline"
                            onClick={() => handleNoteClick(index, nIdx)}
                          >
                            {note}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        No notes uploaded
                      </p>
                    )}

                    {/* Note Text Dialog */}
                    <Dialog open={!!openNoteDialog} onOpenChange={(open) => { if (!open) setOpenNoteDialog(null); }}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>
                            {openNoteDialog ? courses[openNoteDialog.courseIdx].notes[openNoteDialog.noteIdx] : "Note"}
                          </DialogTitle>
                          <DialogDescription>Preview of the extracted text from the uploaded PDF.</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line text-xs bg-muted p-4 rounded">
                          {noteText || "Loading..."}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {/* Preview & Save Dialog (shown immediately after upload) */}
                    <Dialog open={previewOpen} onOpenChange={(open) => { if (!open) { setPreviewOpen(false); setPreviewText(''); setPreviewFilename(''); setPreviewCourseIdx(null); } }}>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Preview Extracted Text</DialogTitle>
                          <DialogDescription>Review the extracted text below and click Save to persist it to your notes.</DialogDescription>
                        </DialogHeader>
                        <div className="max-h-[60vh] overflow-y-auto whitespace-pre-line text-xs bg-muted p-4 rounded mb-4">
                          {previewText || 'No text extracted from this PDF.'}
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" onClick={() => { setPreviewOpen(false); setPreviewText(''); setPreviewFilename(''); setPreviewCourseIdx(null); }}>Cancel</Button>
                          <Button onClick={savePreviewToDB} className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full">Save</Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {course.hoursCompleted}h / {course.totalHours}h
                      </span>
                    </div>
                    <Button
                      size="sm"
                      className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full"
                    >
                      Continue
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </div>
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileChange}
        accept=".pdf"
        style={{ display: 'none' }}
      />
    </div>
      <FloatingAssistant onQuery={handleAssistantQuery} />
      {assistantMessage && (
        <AssistantBubble message={assistantMessage} onClose={() => setAssistantMessage('')} />
      )}
    </>
  );
};

export default Courses;
