import { useEffect, useState, useMemo } from 'react'
import { supabase } from '../../supabase'
import './CourseSelectionModal.css'

interface Course {
  id: string
  title: string
  faculty: string
  specialization: string | null
  year_of_study: number | null
}

interface Props {
  userId: string
  faculty: string | null
  specialization: string | null
  yearOfStudy: number | null
  onClose: () => void
  onSaved: () => void
}

const YEAR_LABELS: Record<number, string> = {
  1: 'שנה א׳',
  2: 'שנה ב׳',
  3: 'שנה ג׳',
  4: 'שנה ד׳',
}

export default function CourseSelectionModal({
  userId, faculty, specialization, yearOfStudy, onClose, onSaved
}: Props) {
  const [allCourses, setAllCourses] = useState<Course[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [activeYear, setActiveYear] = useState<number | null>(yearOfStudy)
  const [search, setSearch] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // טעינת קורסים מהשרת לפי פקולטה + התמחות
  useEffect(() => {
    async function loadCourses() {
      setIsLoading(true)
      let query = supabase.from('courses').select('*').order('year_of_study').order('title')
      if (faculty) query = query.eq('faculty', faculty)
      if (specialization) query = query.eq('specialization', specialization)

      const { data } = await query
      setAllCourses(data || [])

      // טען קורסים שכבר נבחרו (אם קיימים)
      const { data: existing } = await supabase
        .from('user_courses')
        .select('course_id')
        .eq('user_id', userId)

      if (existing?.length) {
        setSelectedIds(new Set(existing.map((r: any) => r.course_id)))
      }
      setIsLoading(false)
    }
    loadCourses()
  }, [userId, faculty, specialization])

  // סינון לפי שנה + חיפוש
  const filteredCourses = useMemo(() => {
    return allCourses.filter(c => {
      const matchYear = activeYear === null || c.year_of_study === activeYear
      const matchSearch = !search.trim() ||
        c.title.toLowerCase().includes(search.toLowerCase())
      return matchYear && matchSearch
    })
  }, [allCourses, activeYear, search])

  // קיבוץ לפי שנה
  const coursesByYear = useMemo(() => {
    const map: Record<number, Course[]> = {}
    filteredCourses.forEach(c => {
      const y = c.year_of_study ?? 0
      if (!map[y]) map[y] = []
      map[y].push(c)
    })
    return map
  }, [filteredCourses])

  const availableYears = useMemo(() =>
    [...new Set(allCourses.map(c => c.year_of_study ?? 0))].filter(Boolean).sort(),
    [allCourses])

  const toggleCourse = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const selectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      filteredCourses.forEach(c => next.add(c.id))
      return next
    })
  }

  const clearAll = () => setSelectedIds(new Set())

  const handleSave = async () => {
    setIsSaving(true)
    try {
      // מחק בחירות ישנות
      await supabase.from('user_courses').delete().eq('user_id', userId)

      if (selectedIds.size > 0) {
        const rows = [...selectedIds].map(course_id => ({ user_id: userId, course_id }))
        const { error } = await supabase.from('user_courses').insert(rows)
        if (error) throw error
      }
      onSaved()
    } catch (err) {
      console.error('Error saving courses:', err)
    } finally {
      setIsSaving(false)
    }
  }

  const allVisible = filteredCourses.length > 0 &&
    filteredCourses.every(c => selectedIds.has(c.id))

  return (
    <div className="csm-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="csm-modal" role="dialog" aria-modal="true" aria-label="בחירת קורסים">

        {/* Header */}
        <div className="csm-header">
          <div className="csm-header-top">
            <div>
              <h2 className="csm-title">📚 בחר את הקורסים שלך</h2>
              <p className="csm-subtitle">
                סמן את הקורסים שאתה לומד — המערכת תציג לך רק את החומרים הרלוונטיים
              </p>
            </div>
            <button className="csm-close-btn" onClick={onClose} aria-label="סגור">✕</button>
          </div>

          {/* User context badges */}
          <div className="csm-user-badge">
            {faculty && <span className="csm-badge-pill">🏫 {faculty}</span>}
            {specialization && <span className="csm-badge-pill">🎯 {specialization}</span>}
            {yearOfStudy && <span className="csm-badge-pill">📅 שנה {yearOfStudy}</span>}
          </div>
        </div>

        {/* Filter bar */}
        <div className="csm-filter-bar">
          <label>סנן לפי שנה:</label>
          <button
            className={`csm-year-btn ${activeYear === null ? 'active' : ''}`}
            onClick={() => setActiveYear(null)}
          >הכל</button>
          {availableYears.map(y => (
            <button
              key={y}
              className={`csm-year-btn ${activeYear === y ? 'active' : ''}`}
              onClick={() => setActiveYear(y)}
            >
              {YEAR_LABELS[y] ?? `שנה ${y}`}
            </button>
          ))}

          <div className="csm-search-wrap">
            <input
              type="text"
              className="csm-search"
              placeholder="חיפוש קורס..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <span className="csm-search-icon">🔍</span>
          </div>
        </div>

        {/* Body */}
        <div className="csm-body">
          {isLoading ? (
            <div className="csm-empty-state">טוען קורסים...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="csm-empty-state">
              {search ? `לא נמצאו קורסים עבור "${search}"` : 'לא נמצאו קורסים בפקולטה זו'}
            </div>
          ) : (
            Object.entries(coursesByYear)
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([year, courses]) => (
                <div key={year} className="csm-year-group">
                  <div className="csm-year-label">
                    {YEAR_LABELS[Number(year)] ?? `שנה ${year}`}
                    <span style={{ fontWeight: 400, color: '#94a3b8' }}>
                      ({courses.filter(c => selectedIds.has(c.id)).length}/{courses.length} נבחרו)
                    </span>
                  </div>
                  <div className="csm-courses-grid">
                    {courses.map(course => (
                      <div
                        key={course.id}
                        className={`csm-course-item ${selectedIds.has(course.id) ? 'selected' : ''}`}
                        onClick={() => toggleCourse(course.id)}
                      >
                        <input
                          type="checkbox"
                          checked={selectedIds.has(course.id)}
                          onChange={() => toggleCourse(course.id)}
                          onClick={e => e.stopPropagation()}
                        />
                        <span className="csm-course-name">{course.title}</span>
                        {course.year_of_study && (
                          <span className="csm-course-year-tag">
                            שנה {course.year_of_study}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="csm-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <span className="csm-selected-count">
              <strong>{selectedIds.size}</strong> קורסים נבחרו
            </span>
            {filteredCourses.length > 0 && (
              <button className="csm-select-all-btn" onClick={allVisible ? clearAll : selectAllVisible}>
                {allVisible ? 'בטל בחירה' : 'בחר הכל הנראה'}
              </button>
            )}
          </div>

          <button
            className="csm-save-btn"
            onClick={handleSave}
            disabled={isSaving || selectedIds.size === 0}
          >
            {isSaving ? (
              <><div className="csm-spinner" />שומר...</>
            ) : (
              <>✅ שמור קורסים</>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
