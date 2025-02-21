import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Book as BookIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationBar } from "@/components/NavigationBar";

// Bible books data
const bibleBooks = [
  "Genesis", "Exodus", "Leviticus", "Numbers", "Deuteronomy",
  "Joshua", "Judges", "Ruth", "1 Samuel", "2 Samuel",
  "1 Kings", "2 Kings", "1 Chronicles", "2 Chronicles", "Ezra",
  "Nehemiah", "Esther", "Job", "Psalms", "Proverbs",
  "Ecclesiastes", "Song of Solomon", "Isaiah", "Jeremiah", "Lamentations",
  "Ezekiel", "Daniel", "Hosea", "Joel", "Amos",
  "Obadiah", "Jonah", "Micah", "Nahum", "Habakkuk",
  "Zephaniah", "Haggai", "Zechariah", "Malachi",
  "Matthew", "Mark", "Luke", "John", "Acts",
  "Romans", "1 Corinthians", "2 Corinthians", "Galatians", "Ephesians",
  "Philippians", "Colossians", "1 Thessalonians", "2 Thessalonians",
  "1 Timothy", "2 Timothy", "Titus", "Philemon", "Hebrews",
  "James", "1 Peter", "2 Peter", "1 John", "2 John",
  "3 John", "Jude", "Revelation"
];

// Approximate max chapters per book (simplified)
const maxChaptersPerBook: Record<string, number> = {
  Genesis: 50, Exodus: 40, Leviticus: 27, Numbers: 36, Deuteronomy: 34,
  Joshua: 24, Judges: 21, Ruth: 4, "1 Samuel": 31, "2 Samuel": 24,
  "1 Kings": 22, "2 Kings": 25, "1 Chronicles": 29, "2 Chronicles": 36, Ezra: 10,
  Nehemiah: 13, Esther: 10, Job: 42, Psalms: 150, Proverbs: 31,
  Ecclesiastes: 12, "Song of Solomon": 8, Isaiah: 66, Jeremiah: 52, Lamentations: 5,
  Ezekiel: 48, Daniel: 12, Hosea: 14, Joel: 3, Amos: 9,
  Obadiah: 1, Jonah: 4, Micah: 7, Nahum: 3, Habakkuk: 3,
  Zephaniah: 3, Haggai: 2, Zechariah: 14, Malachi: 4,
  Matthew: 28, Mark: 16, Luke: 24, John: 21, Acts: 28,
  Romans: 16, "1 Corinthians": 16, "2 Corinthians": 13, Galatians: 6, Ephesians: 6,
  Philippians: 4, Colossians: 4, "1 Thessalonians": 5, "2 Thessalonians": 3,
  "1 Timothy": 6, "2 Timothy": 4, Titus: 3, Philemon: 1, Hebrews: 13,
  James: 5, "1 Peter": 5, "2 Peter": 3, "1 John": 5, "2 John": 1,
  "3 John": 1, Jude: 1, Revelation: 22
};

interface BibleVerse {
  bookname: string;
  chapter: string;
  verse: string;
  text: string;
}

export default function BiblePage() {
  const [selectedBook, setSelectedBook] = useState(bibleBooks[0]);
  const [chapter, setChapter] = useState(1);
  const [verses, setVerses] = useState<BibleVerse[]>([]);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();

  // Get max chapters for selected book
  const maxChapters = maxChaptersPerBook[selectedBook] || 50;

  // Fetch verses for the selected book and chapter
  useEffect(() => {
    const fetchVerses = async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `https://labs.bible.org/api/?passage=${selectedBook}+${chapter}&type=json`
        );
        const data = await response.json();
        setVerses(data);
      } catch (error) {
        console.error("Error fetching verses:", error);
      }
      setLoading(false);
    };

    fetchVerses();
  }, [selectedBook, chapter]);

  const handlePreviousChapter = () => {
    if (chapter > 1) {
      setChapter(chapter - 1);
      // Scroll to top when changing chapters
      window.scrollTo(0, 0);
    }
  };

  const handleNextChapter = () => {
    if (chapter < maxChapters) {
      setChapter(chapter + 1);
      // Scroll to top when changing chapters
      window.scrollTo(0, 0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-6 pb-24">
        <Button 
          variant="ghost" 
          className="mb-4 -ml-2 text-muted-foreground"
          onClick={() => navigate("/resources")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Resources
        </Button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <BookIcon className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Holy Bible</h1>
          </div>

          {/* Book and Chapter Selection */}
          <Card className="p-4 mb-6">
            <div className="flex gap-4">
              <div className="flex-1">
                <Select
                  value={selectedBook}
                  onValueChange={(value) => {
                    setSelectedBook(value);
                    setChapter(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a book" />
                  </SelectTrigger>
                  <SelectContent>
                    <ScrollArea className="h-[300px]">
                      {bibleBooks.map((book) => (
                        <SelectItem key={book} value={book}>
                          {book}
                        </SelectItem>
                      ))}
                    </ScrollArea>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handlePreviousChapter}
                  disabled={chapter === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="w-16 text-center">
                  <span className="text-sm font-medium">Ch. {chapter}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleNextChapter}
                  disabled={chapter >= maxChapters}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>

          {/* Verses Display */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              verses.map((verse) => (
                <motion.div
                  key={verse.verse}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="leading-relaxed">
                    <span className="text-primary font-medium mr-2">{verse.verse}</span>
                    {verse.text}
                  </p>
                </motion.div>
              ))
            )}

            {/* Bottom Navigation */}
            {verses.length > 0 && (
              <div className="flex justify-between items-center mt-8 pt-4 border-t">
                {chapter > 1 ? (
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={handlePreviousChapter}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous Chapter
                  </Button>
                ) : (
                  <div></div>
                )}
                {chapter < maxChapters && (
                  <Button
                    variant="ghost"
                    className="flex items-center gap-2"
                    onClick={handleNextChapter}
                  >
                    Next Chapter
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </div>
      <NavigationBar onCreatePost={() => {}} />
    </div>
  );
}