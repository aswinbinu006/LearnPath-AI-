import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { courseService } from '../services/courseService.js';
import { Course } from '../types/index.js';
import { Card } from '../components/common/Card.js';
import { Badge } from '../components/common/Badge.js';
import { Button } from '../components/common/Button.js';
import { Search, Clock, BookOpen, Sparkles, Check } from 'lucide-react';

import { useToast } from '../contexts/ToastContext.js';
import { CourseGridSkeleton } from '../components/common/Skeleton.js';

export const ExplorePage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get('search') || '';
  const toast = useToast();

  const [courses, setCourses] = useState<Course[]>([]);
  const [search, setSearch] = useState(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  const categories = ['ALL', 'Completed', 'Frontend', 'Backend', 'Full Stack', 'Data Structures'];

  const fetchCourses = async () => {
    try {
      const courseList = await courseService.getCourses({
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        search: search.trim() || undefined,
      });
      if (courseList) {
        setCourses(courseList);
      }
    } catch (err) {
      console.error('Failed to load courses:', err);
      toast.error('Failed to retrieve course catalog.', 'Catalog Notice');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [selectedCategory]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCourses();
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Courses & Tracks
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Industry-aligned curricula to accelerate your technical skills.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center">
        {/* Category Pills — Touch Swipeable */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 pt-1 -mx-1 px-1 touch-pan-x shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 min-h-[38px] rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 active:scale-95 flex items-center justify-center ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {cat === 'ALL' ? 'All Tracks' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search catalog..."
            className="w-full pl-10 pr-4 py-2.5 min-h-[44px] bg-white border border-slate-200 rounded-xl text-base sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
          />
        </form>
      </div>

      {/* Courses Grid */}
      {isLoading ? (
        <CourseGridSkeleton count={6} />
      ) : courses.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 p-8 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-slate-900">
              No courses match your filter
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search criteria or resetting the category filter.
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedCategory('ALL');
              setSearch('');
            }}
            className="min-h-[40px] px-4 font-semibold"
          >
            Reset Filters
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {courses.map((course) => (
            <Card
              key={course.id}
              hoverable
              className="p-5 sm:p-6 flex flex-col justify-between border-slate-200 bg-white shadow-sm"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Badge variant={course.isRecommended ? 'blue' : 'slate'} size="sm">
                      {course.category}
                    </Badge>
                    {(course as any).isCompleted && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <Check className="w-3 h-3 text-emerald-600" /> Completed
                      </span>
                    )}
                  </div>
                  {course.isRecommended && (
                    <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Recommended</span>
                    </div>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-900 line-clamp-1">
                  {course.title}
                </h3>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                  {course.description}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{Math.round(course.durationMinutes / 60)} hrs total</span>
                </div>

                <Button
                  variant={(course as any).isCompleted ? 'outline' : 'primary'}
                  size="sm"
                  onClick={() => navigate(`/courses/${course.slug}`)}
                  className="font-bold text-xs cursor-pointer min-h-[38px] px-3.5 active:scale-95 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {(course as any).isCompleted ? 'Review Course' : 'View Course'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
